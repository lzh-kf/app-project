import request from './request'

export interface FavoriteItem {
  id: number
  productId: number
  name: string
  price: number
  originalPrice?: number
  stock: number
  images: string[]
  createdAt: string
}

export const favoritesApi = {
  getList() {
    return request.get<FavoriteItem[]>('/favorites')
  },
  add(productId: number) {
    return request.post('/favorites', { productId })
  },
  remove(productId: number) {
    return request.delete(`/favorites/${productId}`)
  },
}
