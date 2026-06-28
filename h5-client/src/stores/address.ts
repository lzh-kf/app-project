import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { addressesApi } from '@/api/addresses'
import type { Address, AddressForm } from '@/types/member'

export const useAddressStore = defineStore('address', () => {
  const addresses = ref<Address[]>([])
  const loading = ref(false)

  const defaultAddress = computed(() => addresses.value.find((a) => a.isDefault === 1))

  async function fetchAddresses() {
    loading.value = true
    try {
      const res = await addressesApi.getList()
      addresses.value = res
    } catch {
      addresses.value = []
    } finally {
      loading.value = false
    }
  }

  async function createAddress(data: AddressForm) {
    await addressesApi.create(data)
    await fetchAddresses()
  }

  async function updateAddress(id: number, data: Partial<AddressForm>) {
    await addressesApi.update(id, data)
    await fetchAddresses()
  }

  async function deleteAddress(id: number) {
    await addressesApi.delete(id)
    addresses.value = addresses.value.filter((a) => a.id !== id)
  }

  async function setDefault(id: number) {
    const res = await addressesApi.setDefault(id)
    addresses.value = res
  }

  return {
    addresses,
    loading,
    defaultAddress,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefault,
  }
})
