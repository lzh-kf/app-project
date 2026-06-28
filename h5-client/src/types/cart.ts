export interface CartItem {
  id: number
  productId: number
  productName: string
  productImage: string
  price: number
  originalPrice?: number
  stock: number
  quantity: number
  selected: number
}
