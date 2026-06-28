export interface Product {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  stock: number
  categoryId?: number
  category?: { id: number; name: string }
  images: string[]
  status: number
  isFeatured: number
  createdAt: string
}

export interface Category {
  id: number
  name: string
  parentId?: number
  description?: string
  sort: number
  children?: Category[]
  _count?: { products: number }
}

export interface Banner {
  id: number
  title: string
  image: string
  link?: string
  sort: number
}
