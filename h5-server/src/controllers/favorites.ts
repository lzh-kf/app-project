import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail } from '../utils/response'

/**
 * 我的收藏列表
 * GET /api/member/favorites
 */
export async function getFavorites(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId

    const list = await prisma.favorite.findMany({
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

    // 解析图片 + 过滤已下架
    const items = list
      .filter((f) => f.product.status === 1)
      .map((f) => ({
        id: f.id,
        productId: f.productId,
        name: f.product.name,
        price: f.product.price,
        originalPrice: f.product.originalPrice,
        stock: f.product.stock,
        images: parseImages(f.product.images),
        createdAt: f.createdAt,
      }))

    return success(res, items)
  } catch (error) {
    console.error('getFavorites error:', error)
    return fail(res, '获取收藏列表失败')
  }
}

/**
 * 添加收藏
 * POST /api/member/favorites
 * Body: { productId }
 */
export async function addFavorite(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const { productId } = req.body

    if (!productId) {
      return fail(res, '商品ID不能为空')
    }

    // 检查商品是否存在
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 1 },
    })
    if (!product) {
      return fail(res, '商品不存在或已下架')
    }

    // 已收藏则直接返回成功
    const existing = await prisma.favorite.findUnique({
      where: { memberId_productId: { memberId, productId } },
    })
    if (existing) {
      return success(res, null, '已收藏')
    }

    await prisma.favorite.create({
      data: { memberId, productId },
    })

    return success(res, null, '收藏成功')
  } catch (error) {
    console.error('addFavorite error:', error)
    return fail(res, '收藏失败')
  }
}

/**
 * 取消收藏
 * DELETE /api/member/favorites/:productId
 */
export async function removeFavorite(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const productId = parseInt(req.params.productId)

    const existing = await prisma.favorite.findUnique({
      where: { memberId_productId: { memberId, productId } },
    })

    if (!existing) {
      return fail(res, '未收藏该商品')
    }

    await prisma.favorite.delete({
      where: { id: existing.id },
    })

    return success(res, null, '已取消收藏')
  } catch (error) {
    console.error('removeFavorite error:', error)
    return fail(res, '取消收藏失败')
  }
}

function parseImages(images: string | null): string[] {
  if (!images) return []
  try {
    const arr = JSON.parse(images)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}
