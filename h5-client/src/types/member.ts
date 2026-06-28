export interface MemberInfo {
  id: number
  phone: string
  nickname?: string
  avatar?: string
  gender?: number
  birthday?: string
  status?: number
  createdAt?: string
}

export interface LoginParams {
  phone: string
  password: string
}

export interface RegisterParams {
  phone: string
  password: string
  nickname?: string
}

export interface Address {
  id: number
  memberId: number
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: number
}

export interface AddressForm {
  consignee: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault?: boolean
}
