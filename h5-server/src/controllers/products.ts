import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail, paginate } from '../utils/response'
import { Prisma } from '@prisma/client'

/**
 * 商品列表（分页、搜索、筛选）
 * GET /api/member/products
 * Query: page, pageSize, keyword, categoryId, sort (price_asc|price_desc|newest|sales)
 */
export async function getProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string) || 10))
    const keyword = (req.query.keyword as string) || ''
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined
    const sort = (req.query.sort as string) || 'newest'

    const where: Prisma.ProductWhereInput = {
      status: 1, // 只查上架商品
    }

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ]
    }

    // 分类筛选（包含子分类）
    if (categoryId) {
      // 查询该分类及其所有子分类的 ID
      const childIds = await getCategoryChildIds(categoryId)
      where.categoryId = { in: [categoryId, ...childIds] }
    }

    // 排序
    let orderBy: Prisma.ProductOrderByWithRelationInput
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    // 解析 images JSON 字符串
    const parsedList = list.map((p) => ({
      ...p,
      images: parseImagesField(p.images),
    }))

    return paginate(res, parsedList, total, page, pageSize)
  } catch (error) {
    console.error('getProducts error:', error)
    return fail(res, '获取商品列表失败')
  }
}

/**
 * 推荐商品
 * GET /api/member/products/featured
 */
export async function getFeaturedProducts(req: Request, res: Response) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10)

    const list = await prisma.product.findMany({
      where: {
        status: 1,
        isFeatured: 1,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    const parsedList = list.map((p) => ({
      ...p,
      images: parseImagesField(p.images),
    }))

    return success(res, parsedList)
  } catch (error) {
    console.error('getFeaturedProducts error:', error)
    return fail(res, '获取推荐商品失败')
  }
}

/**
 * 商品详情
 * GET /api/member/products/:id
 */
export async function getProductDetail(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return fail(res, '商品ID无效')
    }

    const product = await prisma.product.findFirst({
      where: { id, status: 1 },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    if (!product) {
      return fail(res, '商品不存在或已下架', -1, 404)
    }

    return success(res, {
      ...product,
      images: parseImagesField(product.images),
    })
  } catch (error) {
    console.error('getProductDetail error:', error)
    return fail(res, '获取商品详情失败')
  }
}

// ===== 辅助函数 =====

/**
 * 解析 Product.images（JSON 字符串 → 字符串数组）
 */
function parseImagesField(images: string | null): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 递归获取子分类 ID 列表
 */
async function getCategoryChildIds(parentId: number): Promise<number[]> {
  const children = await prisma.category.findMany({
    where: { parentId, status: 1 },
    select: { id: true },
  })

  const ids = children.map((c) => c.id)

  for (const child of children) {
    const grandChildIds = await getCategoryChildIds(child.id)
    ids.push(...grandChildIds)
  }

  return ids
}
