import request from './request'
import type { Order } from '@/types/order'
import type { PaginatedData } from '@/types/api'

export interface CreateOrderParams {
  addressId: number
  remark?: string
  cartItemIds?: number[]
  buyNowProductId?: number
  buyNowQuantity?: number
}

export const ordersApi = {
  create(params: CreateOrderParams) {
    return request.post<Order>('/orders', params)
  },

  getList(params: { page?: number; pageSize?: number; status?: string } = {}) {
    return request.get<PaginatedData<Order>>('/orders', { params })
  },

  getDetail(id: number) {
    return request.get<Order>(`/orders/${id}`)
  },

  cancel(id: number) {
    return request.put(`/orders/${id}/cancel`)
  },

  confirmReceive(id: number) {
    return request.put(`/orders/${id}/confirm`)
  },
}
