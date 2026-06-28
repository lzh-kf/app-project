import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface MemberTokenPayload {
  memberId: number
  phone: string
}

export function signMemberToken(payload: MemberTokenPayload): string {
  return jwt.sign(payload, config.memberJwtSecret, {
    expiresIn: config.memberJwtExpiresIn,
  } as jwt.SignOptions)
}

export function verifyMemberToken(token: string): MemberTokenPayload {
  return jwt.verify(token, config.memberJwtSecret) as MemberTokenPayload
}
