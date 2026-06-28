import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { success, fail } from '../utils/response'

/**
 * 获取收货地址列表
 * GET /api/member/addresses
 */
export async function getAddresses(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId

    const addresses = await prisma.address.findMany({
      where: { memberId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })

    return success(res, addresses)
  } catch (error) {
    console.error('getAddresses error:', error)
    return fail(res, '获取地址列表失败')
  }
}

/**
 * 创建地址
 * POST /api/member/addresses
 */
export async function createAddress(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const { consignee, phone, province, city, district, detail, isDefault } = req.body

    if (!consignee || !phone || !province || !city || !district || !detail) {
      return fail(res, '请填写完整的地址信息')
    }

    // 如果设为默认，先取消其他默认地址
    if (isDefault) {
      await prisma.address.updateMany({
        where: { memberId, isDefault: 1 },
        data: { isDefault: 0 },
      })
    }

    const address = await prisma.address.create({
      data: {
        memberId,
        consignee,
        phone,
        province,
        city,
        district,
        detail,
        isDefault: isDefault ? 1 : 0,
      },
    })

    return success(res, address, '添加成功')
  } catch (error) {
    console.error('createAddress error:', error)
    return fail(res, '添加地址失败')
  }
}

/**
 * 更新地址
 * PUT /api/member/addresses/:id
 */
export async function updateAddress(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)
    const { consignee, phone, province, city, district, detail, isDefault } = req.body

    // 验证地址属于当前会员
    const existing = await prisma.address.findFirst({ where: { id, memberId } })
    if (!existing) {
      return fail(res, '地址不存在', -1, 404)
    }

    // 如果设为默认，先取消其他默认地址
    if (isDefault) {
      await prisma.address.updateMany({
        where: { memberId, isDefault: 1 },
        data: { isDefault: 0 },
      })
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        consignee,
        phone,
        province,
        city,
        district,
        detail,
        isDefault: isDefault ? 1 : 0,
      },
    })

    return success(res, address, '更新成功')
  } catch (error) {
    console.error('updateAddress error:', error)
    return fail(res, '更新地址失败')
  }
}

/**
 * 删除地址
 * DELETE /api/member/addresses/:id
 */
export async function deleteAddress(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)

    const existing = await prisma.address.findFirst({ where: { id, memberId } })
    if (!existing) {
      return fail(res, '地址不存在', -1, 404)
    }

    await prisma.address.delete({ where: { id } })

    return success(res, null, '删除成功')
  } catch (error) {
    console.error('deleteAddress error:', error)
    return fail(res, '删除地址失败')
  }
}

/**
 * 设为默认地址
 * PUT /api/member/addresses/:id/default
 */
export async function setDefaultAddress(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const id = parseInt(req.params.id)

    const existing = await prisma.address.findFirst({ where: { id, memberId } })
    if (!existing) {
      return fail(res, '地址不存在', -1, 404)
    }

    // 先取消所有默认
    await prisma.address.updateMany({
      where: { memberId, isDefault: 1 },
      data: { isDefault: 0 },
    })

    // 设置当前为默认
    await prisma.address.update({
      where: { id },
      data: { isDefault: 1 },
    })

    const addresses = await prisma.address.findMany({
      where: { memberId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })

    return success(res, addresses, '已设为默认地址')
  } catch (error) {
    console.error('setDefaultAddress error:', error)
    return fail(res, '设置失败')
  }
}
