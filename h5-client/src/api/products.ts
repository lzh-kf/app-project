import request from './request'
import type { Product } from '@/types/product'
import type { PaginatedData } from '@/types/api'

export interface ProductQuery {
  page?: number
  pageSize?: number
  keyword?: string
  categoryId?: number
  sort?: string
}

export const productsApi = {
  getList(params: ProductQuery = {}) {
    return request.get<PaginatedData<Product>>('/products', { params })
  },

  getFeatured(limit?: number) {
    return request.get<Product[]>('/products/featured', { params: { limit } })
  },

  getDetail(id: number) {
    return request.get<Product>(`/products/${id}`)
  },
}
