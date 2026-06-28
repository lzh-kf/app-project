import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail } from '../utils/response'

/**
 * 获取购物车列表
 * GET /api/member/cart
 */
export async function getCart(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId

    const items = await prisma.cart.findMany({
      where: { memberId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            originalPrice: true,
            stock: true,
            status: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 过滤掉已下架的商品，并解析图片
    const validItems = items
      .filter((item) => item.product.status === 1)
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: parseFirstImage(item.product.images),
        price: item.product.price,
        originalPrice: item.product.originalPrice,
        stock: item.product.stock,
        quantity: item.quantity,
        selected: item.selected,
      }))

    return success(res, validItems)
  } catch (error) {
    console.error('getCart error:', error)
    return fail(res, '获取购物车失败')
  }
}

/**
 * 加入购物车
 * POST /api/member/cart
 * Body: { productId, quantity? }
 */
export async function addToCart(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const { productId, quantity = 1 } = req.body

    if (!productId) {
      return fail(res, '商品ID不能为空')
    }

    // 验证商品存在且已上架
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 1 },
    })

    if (!product) {
      return fail(res, '商品不存在或已下架')
    }

    if (product.stock < quantity) {
      return fail(res, '库存不足')
    }

    // 使用 upsert：已存在则累加数量，不存在则创建
    const existing = await prisma.cart.findUnique({
      where: { memberId_productId: { memberId, productId } },
    })

    let cartItem
    if (existing) {
      cartItem = await prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      cartItem = await prisma.cart.create({
        data: { memberId, productId, quantity },
      })
    }

    return success(res, cartItem, '已加入购物车')
  } catch (error) {
    console.error('addToCart error:', error)
    return fail(res, '加入购物车失败')
  }
}

/**
 * 更新购物车商品数量
 * PUT /api/member/cart/:id
 * Body: { quantity }
 */
export async function updateCartItem(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)
    const { quantity } = req.body

    if (!quantity || quantity < 1) {
      return fail(res, '数量不能小于1')
    }

    // 验证该购物车项属于当前会员
    const item = await prisma.cart.findFirst({
      where: { id, memberId },
    })

    if (!item) {
      return fail(res, '购物车项不存在', -1, 404)
    }

    // 检查库存
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (product && quantity > product.stock) {
      return fail(res, '库存不足')
    }

    const updated = await prisma.cart.update({
      where: { id },
      data: { quantity },
    })

    return success(res, updated, '更新成功')
  } catch (error) {
    console.error('updateCartItem error:', error)
    return fail(res, '更新失败')
  }
}

/**
 * 删除购物车商品
 * DELETE /api/member/cart/:id
 */
export async function removeCartItem(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)

    const item = await prisma.cart.findFirst({
      where: { id, memberId },
    })

    if (!item) {
      return fail(res, '购物车项不存在', -1, 404)
    }

    await prisma.cart.delete({ where: { id } })

    return success(res, null, '已删除')
  } catch (error) {
    console.error('removeCartItem error:', error)
    return fail(res, '删除失败')
  }
}

/**
 * 切换购物车选中状态
 * PUT /api/member/cart/select
 * Body: { id?: number, selected?: boolean }  id为空时全选/全不选
 */
export async function toggleSelect(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const { id, selected } = req.body

    if (id !== undefined && id !== null) {
      // 切换单个
      const item = await prisma.cart.findFirst({
        where: { id, memberId },
      })

      if (!item) {
        return fail(res, '购物车项不存在', -1, 404)
      }

      await prisma.cart.update({
        where: { id },
        data: { selected: item.selected === 1 ? 0 : 1 },
      })
    } else {
      // 全选/全不选
      const newSelected = selected ? 1 : 0
      await prisma.cart.updateMany({
        where: { memberId },
        data: { selected: newSelected },
      })
    }

    // 返回最新购物车数据
    const items = await prisma.cart.findMany({
      where: { memberId },
      include: {
        product: {
          select: { id: true, name: true, price: true, originalPrice: true, stock: true, status: true, images: true },
        },
      },
    })

    return success(res, items)
  } catch (error) {
    console.error('toggleSelect error:', error)
    return fail(res, '操作失败')
  }
}

// ===== 辅助函数 =====

function parseFirstImage(images: string | null): string {
  if (!images) return ''
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : ''
  } catch {
    return ''
  }
}
