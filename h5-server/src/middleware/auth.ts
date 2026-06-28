import { Request, Response, NextFunction } from 'express'
import { verifyMemberToken, MemberTokenPayload } from '../utils/jwt'
import { fail } from '../utils/response'

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      member?: MemberTokenPayload
    }
  }
}

/**
 * Member JWT 认证中间件
 * 从 Authorization header 提取 Bearer token 并验证
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, '未登录，请先登录', 40101, 401)
  }

  try {
    const token = header.split(' ')[1]
    req.member = verifyMemberToken(token)
    next()
  } catch {
    return fail(res, '登录已过期，请重新登录', 40101, 401)
  }
}

/**
 * 可选认证中间件
 * 如果携带有效 token 则解析，不携带也不拒绝
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1]
      req.member = verifyMemberToken(token)
    } catch {
      // token 无效也放行
    }
  }

  next()
}
