import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail, paginate } from '../utils/response'

// 订单状态流转规则
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

/**
 * 创建订单
 * POST /api/member/orders
 * Body: { addressId, remark?, cartItemIds?, buyNowProductId?, buyNowQuantity? }
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const { addressId, remark, cartItemIds, buyNowProductId, buyNowQuantity } = req.body

    // 1. 获取收货地址
    const address = await prisma.address.findFirst({
      where: { id: addressId, memberId },
    })

    if (!address) {
      return fail(res, '收货地址不存在')
    }

    // 2. 确定订单商品来源（购物车结算 或 立即购买）
    let orderProducts: Array<{ productId: number; quantity: number; price: number; name: string; image: string | null }>

    if (buyNowProductId) {
      // 立即购买流程
      const product = await prisma.product.findFirst({
        where: { id: buyNowProductId, status: 1 },
      })

      if (!product) {
        return fail(res, '商品不存在或已下架')
      }

      const qty = buyNowQuantity || 1
      if (product.stock < qty) {
        return fail(res, `商品「${product.name}」库存不足`)
      }

      orderProducts = [
        {
          productId: product.id,
          quantity: qty,
          price: Number(product.price),
          name: product.name,
          image: product.images,
        },
      ]
    } else {
      // 购物车结算流程
      const cartWhere: any = { memberId, selected: 1 }

      if (cartItemIds && cartItemIds.length > 0) {
        cartWhere.id = { in: cartItemIds }
      }

      const cartItems = await prisma.cart.findMany({
        where: cartWhere,
        include: {
          product: true,
        },
      })

      if (cartItems.length === 0) {
        return fail(res, '请选择要结算的商品')
      }

      // 验证库存并构建订单商品列表
      orderProducts = []
      for (const item of cartItems) {
        if (item.product.status !== 1) {
          return fail(res, `商品「${item.product.name}」已下架`)
        }
        if (item.product.stock < item.quantity) {
          return fail(res, `商品「${item.product.name}」库存不足`)
        }
        orderProducts.push({
          productId: item.product.id,
          quantity: item.quantity,
          price: Number(item.product.price),
          name: item.product.name,
          image: item.product.images,
        })
      }
    }

    // 3. 计算总金额
    const totalAmount = orderProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    )

    // 4. 生成订单号
    const orderNo = generateOrderNo()

    // 5. 事务：创建订单 + 扣减库存 + 清空购物车选中项
    const order = await prisma.$transaction(async (tx) => {
      // 创建订单
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          userId: 0,
          memberId,
          totalAmount,
          status: 'pending',
          consignee: address.consignee,
          phone: address.phone,
          address: `${address.province}${address.city}${address.district} ${address.detail}`,
          remark: remark || null,
          items: {
            create: orderProducts.map((p) => ({
              productId: p.productId,
              productName: p.name,
              productImage: p.image ? extractFirstImage(p.image) : null,
              price: p.price,
              quantity: p.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // 扣减库存
      for (const p of orderProducts) {
        await tx.product.update({
          where: { id: p.productId },
          data: { stock: { decrement: p.quantity } },
        })
      }

      // 清空购物车选中项（非立即购买时）
      if (!buyNowProductId) {
        const cartWhere: any = { memberId, selected: 1 }
        if (cartItemIds && cartItemIds.length > 0) {
          cartWhere.id = { in: cartItemIds }
        }
        await tx.cart.deleteMany({ where: cartWhere })
      }

      return newOrder
    })

    return success(res, order, '下单成功')
  } catch (error) {
    console.error('createOrder error:', error)
    return fail(res, '下单失败，请重试')
  }
}

/**
 * 我的订单列表
 * GET /api/member/orders
 * Query: page, pageSize, status
 */
export async function getOrders(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const status = req.query.status as string | undefined

    const where: any = { memberId }
    if (status && status !== 'all') {
      where.status = status
    }

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, images: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])

    return paginate(res, list, total, page, pageSize)
  } catch (error) {
    console.error('getOrders error:', error)
    return fail(res, '获取订单列表失败')
  }
}

/**
 * 订单详情
 * GET /api/member/orders/:id
 */
export async function getOrderDetail(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)

    const order = await prisma.order.findFirst({
      where: { id, memberId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true },
            },
          },
        },
      },
    })

    if (!order) {
      return fail(res, '订单不存在', -1, 404)
    }

    return success(res, order)
  } catch (error) {
    console.error('getOrderDetail error:', error)
    return fail(res, '获取订单详情失败')
  }
}

/**
 * 取消订单
 * PUT /api/member/orders/:id/cancel
 */
export async function cancelOrder(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)

    const order = await prisma.order.findFirst({
      where: { id, memberId },
      include: { items: true },
    })

    if (!order) {
      return fail(res, '订单不存在', -1, 404)
    }

    if (order.status !== 'pending') {
      return fail(res, '只有待付款订单可以取消')
    }

    // 事务：取消订单 + 恢复库存
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'cancelled' },
      })

      // 恢复库存
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    })

    return success(res, null, '订单已取消')
  } catch (error) {
    console.error('cancelOrder error:', error)
    return fail(res, '取消订单失败')
  }
}

/**
 * 确认收货
 * PUT /api/member/orders/:id/confirm
 */
export async function confirmReceive(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)

    const order = await prisma.order.findFirst({
      where: { id, memberId },
    })

    if (!order) {
      return fail(res, '订单不存在', -1, 404)
    }

    if (order.status !== 'shipped') {
      return fail(res, '该订单状态不可确认收货')
    }

    await prisma.order.update({
      where: { id },
      data: { status: 'delivered' },
    })

    return success(res, null, '已确认收货')
  } catch (error) {
    console.error('confirmReceive error:', error)
    return fail(res, '确认收货失败')
  }
}

// ===== 辅助函数 =====

function generateOrderNo(): string {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return dateStr + random
}

function extractFirstImage(images: string | null): string | null {
  if (!images) return null
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null
  } catch {
    return null
  }
}
