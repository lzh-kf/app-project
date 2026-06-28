// 统一API响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页数据
export interface PaginatedData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
