import request from './request'
import type { Category } from '@/types/product'

export const categoriesApi = {
  getTree() {
    return request.get<Category[]>('/categories/tree')
  },
  getList() {
    return request.get<Category[]>('/categories/list')
  },
}
