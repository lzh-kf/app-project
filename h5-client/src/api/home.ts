import request from './request'
import type { Banner, Category, Product } from '@/types/product'

export interface HomeData {
  banners: Banner[]
  featuredProducts: Product[]
  categories: Category[]
}

export const homeApi = {
  getHomeData() {
    return request.get<HomeData>('/home')
  },
}
