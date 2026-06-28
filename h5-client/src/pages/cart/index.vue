<template>
  <div class="cart-page">
    <van-nav-bar title="购物车" />

    <!-- 空状态 -->
    <div v-if="!loading && items.length === 0" class="empty-cart">
      <EmptyState description="购物车是空的" />
      <div class="empty-action">
        <van-button round type="danger" block @click="goShopping">去逛逛</van-button>
      </div>
    </div>

    <!-- 购物车列表 -->
    <div v-else class="cart-list">
      <van-swipe-cell v-for="item in items" :key="item.id">
        <div class="cart-item card">
          <van-checkbox
            :model-value="item.selected === 1"
            @update:model-value="onToggleSelect(item.id)"
            icon-size="18"
            checked-color="#ee0a24"
            class="cart-checkbox"
          />
          <van-image :src="item.productImage || 'https://picsum.photos/seed/p/200/200'" fit="cover" width="84" height="84" radius="8" />
          <div class="cart-item-info">
            <div class="cart-item-name">{{ item.productName }}</div>
            <div class="cart-item-bottom">
              <span class="cart-item-price">¥{{ item.price }}</span>
              <van-stepper
                v-model="item.quantity"
                :min="1"
                :max="item.stock"
                theme="round"
                button-size="24"
                @change="onQuantityChange(item.id, $event)"
              />
            </div>
          </div>
        </div>
        <template #right>
          <van-button square type="danger" text="删除" class="delete-btn" @click="onDelete(item.id)" />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 底部结算栏 -->
    <van-submit-bar
      v-if="items.length"
      :price="totalPrice * 100"
      button-text="去结算"
      button-color="#ee0a24"
      @submit="goCheckout"
      safe-area-inset-bottom
    >
      <van-checkbox
        :model-value="allSelected"
        @update:model-value="onToggleAll"
        icon-size="18"
        checked-color="#ee0a24"
      >
        全选
      </van-checkbox>
    </van-submit-bar>

    <van-loading v-if="loading" type="spinner" size="24" class="loading-center" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const items = computed(() => cartStore.items)
const loading = computed(() => cartStore.loading)
const totalPrice = computed(() => cartStore.totalPrice)
const allSelected = computed(() => cartStore.allSelected)

async function onToggleSelect(id: number) { await cartStore.toggleSelect(id) }
async function onToggleAll(val: boolean) { await cartStore.toggleSelect(undefined, val) }

async function onQuantityChange(id: number, quantity: number) {
  await cartStore.updateQuantity(id, quantity)
}

async function onDelete(id: number) {
  await cartStore.removeItem(id)
  showToast('已删除')
}

function goShopping() {
  router.push('/search?from=cart')
}

function goCheckout() {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/checkout' } })
    return
  }
  if (cartStore.selectedItems.length === 0) {
    showToast('请选择要结算的商品')
    return
  }
  router.push('/checkout')
}

onMounted(() => { cartStore.fetchCart() })
</script>

<style scoped>
.cart-page {
  background: #f5f6f8;
  padding-bottom: 110px;
}

/* submit-bar 位于 tabbar 上方 */
.cart-page :deep(.van-submit-bar) {
  bottom: 50px;
  bottom: calc(50px + constant(safe-area-inset-bottom));
  bottom: calc(50px + env(safe-area-inset-bottom));
}

.empty-cart {
  padding-top: 60px;
}
.empty-action {
  margin: 20px 40px 0;
}

.cart-list {
  padding: 12px;
}

.card {
  background: #fff;
  border-radius: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  gap: 10px;
}

.cart-checkbox {
  flex-shrink: 0;
}

.cart-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 84px;
}

.cart-item-name {
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
}

.cart-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-item-price {
  font-size: 16px;
  font-weight: 700;
  color: #ee0a24;
}

.delete-btn {
  height: 100%;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 40px;
}
</style>
