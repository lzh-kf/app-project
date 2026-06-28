import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { signMemberToken } from '../utils/jwt'
import { success, fail } from '../utils/response'

/**
 * 会员注册
 * POST /api/member/auth/register
 * Body: { phone, password, nickname? }
 */
export async function register(req: Request, res: Response) {
  try {
    const { phone, password, nickname } = req.body

    if (!phone || !password) {
      return fail(res, '手机号和密码不能为空')
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return fail(res, '手机号格式不正确')
    }

    if (password.length < 6) {
      return fail(res, '密码长度不能少于6位')
    }

    // 检查手机号是否已注册
    const existing = await prisma.member.findUnique({ where: { phone } })
    if (existing) {
      return fail(res, '该手机号已注册')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const member = await prisma.member.create({
      data: {
        phone,
        password: hashedPassword,
        nickname: nickname || `用户${phone.slice(-4)}`,
      },
    })

    const token = signMemberToken({ memberId: member.id, phone: member.phone })

    return success(res, {
      token,
      member: {
        id: member.id,
        phone: member.phone,
        nickname: member.nickname,
        avatar: member.avatar,
      },
    }, '注册成功')
  } catch (error) {
    console.error('register error:', error)
    return fail(res, '注册失败')
  }
}

/**
 * 会员登录
 * POST /api/member/auth/login
 * Body: { phone, password }
 */
export async function login(req: Request, res: Response) {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      return fail(res, '手机号和密码不能为空')
    }

    const member = await prisma.member.findUnique({ where: { phone } })

    if (!member) {
      return fail(res, '手机号未注册')
    }

    if (member.status === 0) {
      return fail(res, '账号已被禁用')
    }

    const valid = await bcrypt.compare(password, member.password)
    if (!valid) {
      return fail(res, '密码错误')
    }

    const token = signMemberToken({ memberId: member.id, phone: member.phone })

    return success(res, {
      token,
      member: {
        id: member.id,
        phone: member.phone,
        nickname: member.nickname,
        avatar: member.avatar,
        gender: member.gender,
        birthday: member.birthday,
      },
    }, '登录成功')
  } catch (error) {
    console.error('login error:', error)
    return fail(res, '登录失败')
  }
}

/**
 * 获取当前会员信息
 * GET /api/member/auth/me
 */
export async function getMe(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        gender: true,
        birthday: true,
        status: true,
        createdAt: true,
      },
    })

    if (!member) {
      return fail(res, '用户不存在', -1, 404)
    }

    if (member.status === 0) {
      return fail(res, '账号已被禁用')
    }

    return success(res, member)
  } catch (error) {
    console.error('getMe error:', error)
    return fail(res, '获取用户信息失败')
  }
}

/**
 * 更新会员资料
 * PUT /api/member/auth/profile
 * Body: { nickname?, avatar?, gender?, birthday? }
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const memberId = req.member!.memberId
    const { nickname, avatar, gender, birthday } = req.body

    const data: Record<string, any> = {}
    if (nickname !== undefined) data.nickname = nickname
    if (avatar !== undefined) data.avatar = avatar
    if (gender !== undefined) data.gender = gender
    if (birthday !== undefined) data.birthday = birthday ? new Date(birthday) : undefined

    const member = await prisma.member.update({
      where: { id: memberId },
      data,
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        gender: true,
        birthday: true,
      },
    })

    return success(res, member, '更新成功')
  } catch (error) {
    console.error('updateProfile error:', error)
    return fail(res, '更新失败')
  }
}
