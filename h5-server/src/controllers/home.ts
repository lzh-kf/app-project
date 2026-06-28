import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail } from '../utils/response'

/**
 * 首页聚合数据
 * GET /api/member/home
 * 返回：banners + 推荐商品 + 分类列表
 */
export async function getHomeData(_req: Request, res: Response) {
  try {
    const [banners, featuredProducts, categories] = await Promise.all([
      // Banner
      prisma.banner.findMany({
        where: { status: 1 },
        orderBy: { sort: 'asc' },
      }),
      // 推荐商品（前20个）
      prisma.product.findMany({
        where: { status: 1, isFeatured: 1 },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
      // 分类列表（含商品数量）
      prisma.category.findMany({
        where: { status: 1, parentId: null },
        orderBy: { sort: 'asc' },
        include: {
          children: {
            where: { status: 1 },
            orderBy: { sort: 'asc' },
            select: { id: true, name: true },
          },
          _count: { select: { products: { where: { status: 1 } } } },
        },
      }),
    ])

    // 解析商品图片
    const parsedProducts = featuredProducts.map((p) => ({
      ...p,
      images: parseImagesField(p.images),
    }))

    return success(res, {
      banners,
      featuredProducts: parsedProducts,
      categories,
    })
  } catch (error) {
    console.error('getHomeData error:', error)
    return fail(res, '获取首页数据失败')
  }
}

function parseImagesField(images: string | null): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
