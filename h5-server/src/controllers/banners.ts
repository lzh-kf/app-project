import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail } from '../utils/response'

/**
 * 获取启用的 Banner 列表
 * GET /api/member/banners
 */
export async function getBanners(_req: Request, res: Response) {
  try {
    const banners = await prisma.banner.findMany({
      where: { status: 1 },
      orderBy: { sort: 'asc' },
    })
    return success(res, banners)
  } catch (error) {
    console.error('getBanners error:', error)
    return fail(res, '获取Banner失败')
  }
}
