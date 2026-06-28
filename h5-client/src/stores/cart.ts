import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartApi } from '@/api/cart'
import type { CartItem } from '@/types/cart'
import { useAuthStore } from './auth'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)

  // 计算属性
  const selectedItems = computed(() => items.value.filter((i) => i.selected === 1))
  const totalCount = computed(() => selectedItems.value.reduce((s, i) => s + i.quantity, 0))
  const totalPrice = computed(() =>
    selectedItems.value.reduce((s, i) => s + i.price * i.quantity, 0)
  )
  const allSelected = computed(
    () => items.value.length > 0 && items.value.every((i) => i.selected === 1)
  )

  // 加载购物车
  async function fetchCart() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      items.value = []
      return
    }
    loading.value = true
    try {
      const res = await cartApi.getList()
      items.value = res
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  // 加入购物车
  async function addItem(productId: number, quantity: number = 1) {
    await cartApi.addItem(productId, quantity)
    await fetchCart() // 重新拉取整列表
  }

  // 更新数量
  async function updateQuantity(id: number, quantity: number) {
    await cartApi.updateQuantity(id, quantity)
    const item = items.value.find((i) => i.id === id)
    if (item) item.quantity = quantity
  }

  // 删除商品
  async function removeItem(id: number) {
    await cartApi.removeItem(id)
    items.value = items.value.filter((i) => i.id !== id)
  }

  // 切换选中
  async function toggleSelect(id?: number, selected?: boolean) {
    await cartApi.toggleSelect(id, selected)
    await fetchCart()
  }

  return {
    items,
    loading,
    selectedItems,
    totalCount,
    totalPrice,
    allSelected,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    toggleSelect,
  }
})
