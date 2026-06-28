export interface OrderItem {
  id: number
  orderId: number
  productId: number
  productName: string
  productImage?: string
  price: number
  quantity: number
  product?: { id: number; name: string; images: string }
}

export interface Order {
  id: number
  orderNo: string
  userId: number
  memberId?: number
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  consignee: string
  phone: string
  address: string
  remark?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

export const OrderStatusLabels: Record<string, string> = {
  pending: '待付款',
  confirmed: '待发货',
  shipped: '待收货',
  delivered: '已完成',
  cancelled: '已取消',
}

export const OrderStatusSteps = [
  { status: 'pending', label: '已下单' },
  { status: 'confirmed', label: '已付款' },
  { status: 'shipped', label: '已发货' },
  { status: 'delivered', label: '已完成' },
]
