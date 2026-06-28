export const config = {
  port: parseInt(process.env.PORT || '3001'),
  memberJwtSecret: process.env.MEMBER_JWT_SECRET || 'h5-member-jwt-secret-2024',
  memberJwtExpiresIn: process.env.MEMBER_JWT_EXPIRES_IN || '30d',
}
