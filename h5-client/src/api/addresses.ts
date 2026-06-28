import request from './request'
import type { Address, AddressForm } from '@/types/member'

export const addressesApi = {
  getList() {
    return request.get<Address[]>('/addresses')
  },

  create(data: AddressForm) {
    return request.post<Address>('/addresses', data)
  },

  update(id: number, data: Partial<AddressForm>) {
    return request.put<Address>(`/addresses/${id}`, data)
  },

  delete(id: number) {
    return request.delete(`/addresses/${id}`)
  },

  setDefault(id: number) {
    return request.put<Address[]>(`/addresses/${id}/default`)
  },
}
