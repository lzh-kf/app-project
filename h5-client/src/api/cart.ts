import request from './request'
import type { CartItem } from '@/types/cart'

export const cartApi = {
  getList() {
    return request.get<CartItem[]>('/cart')
  },

  addItem(productId: number, quantity: number = 1) {
    return request.post<CartItem>('/cart', { productId, quantity })
  },

  updateQuantity(id: number, quantity: number) {
    return request.put(`/cart/${id}`, { quantity })
  },

  removeItem(id: number) {
    return request.delete(`/cart/${id}`)
  },

  toggleSelect(id?: number, selected?: boolean) {
    return request.put('/cart/select', { id, selected })
  },
}
