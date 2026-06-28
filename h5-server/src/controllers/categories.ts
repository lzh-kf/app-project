import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail } from '../utils/response'

/**
 * 分类树
 * GET /api/member/categories/tree
 */
export async function getCategoryTree(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    })

    const tree = buildTree(categories, null)

    return success(res, tree)
  } catch (error) {
    console.error('getCategoryTree error:', error)
    return fail(res, '获取分类失败')
  }
}

/**
 * 分类列表（扁平）
 * GET /api/member/categories/list
 */
export async function getCategoryList(_req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
      select: {
        id: true,
        name: true,
        parentId: true,
        description: true,
        sort: true,
        _count: { select: { products: { where: { status: 1 } } } },
      },
    })

    return success(res, categories)
  } catch (error) {
    console.error('getCategoryList error:', error)
    return fail(res, '获取分类失败')
  }
}

// 递归构建树结构
function buildTree(
  list: any[],
  parentId: number | null
): any[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(list, item.id),
    }))
}
