<template>
  <div class="checkout-page">
    <van-nav-bar title="确认订单" left-arrow fixed placeholder @click-left="goBack" />

    <!-- 收货地址 -->
    <div class="section" @click="goSelectAddress">
      <div v-if="selectedAddress" class="address-card">
        <div class="address-content">
          <div class="address-info">
            <span class="address-name">{{ selectedAddress.consignee }}</span>
            <span class="address-phone">{{ selectedAddress.phone }}</span>
          </div>
          <div class="address-detail">
            {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }} {{ selectedAddress.detail }}
          </div>
        </div>
        <van-icon name="arrow" class="address-arrow" />
      </div>
      <div v-else class="no-address">
        请选择收货地址 <van-icon name="arrow" />
      </div>
    </div>

    <!-- 商品列表 -->
    <div class="section">
      <div class="section-title">商品信息</div>
      <div v-for="item in orderItems" :key="item.productId" class="order-item">
        <van-image :src="item.productImage || 'https://picsum.photos/seed/p/200/200'" fit="cover" class="item-image" />
        <div class="item-info">
          <div class="item-name">{{ item.productName }}</div>
          <div class="item-price-row">
            <span class="item-price">¥{{ item.price }}</span>
            <span class="item-qty">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 备注 -->
    <div class="section">
      <van-field v-model="remark" label="订单备注" placeholder="选填" />
    </div>

    <!-- 合计 -->
    <div class="section total-section">
      <span>合计：</span>
      <span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
    </div>

    <!-- 提交 -->
    <div class="submit-wrapper">
      <van-button round block type="danger" :loading="submitting" @click="submitOrder">
        提交订单 (¥{{ totalAmount.toFixed(2) }})
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { ordersApi } from '@/api/orders'
import { productsApi } from '@/api/products'
import { useAddressStore } from '@/stores/address'
import { useCartStore } from '@/stores/cart'
import type { Address } from '@/types/member'

const router = useRouter()
const route = useRoute()
const addressStore = useAddressStore()
const cartStore = useCartStore()

const selectedAddress = ref<Address | null>(null)
const remark = ref('')
const submitting = ref(false)

// 判断是购物车结算还是立即购买
const isBuyNow = computed(() => route.query.buyNow === '1')

interface OrderProduct {
  productId: number
  productName: string
  productImage: string
  price: number
  quantity: number
}

const orderItems = ref<OrderProduct[]>([])

const totalAmount = computed(() =>
  orderItems.value.reduce((s, i) => s + i.price * i.quantity, 0)
)

async function loadData() {
  // 加载地址
  await addressStore.fetchAddresses()
  selectedAddress.value = addressStore.defaultAddress || addressStore.addresses[0] || null

  // 加载商品
  if (isBuyNow.value) {
    const productId = parseInt(route.query.productId as string)
    const quantity = parseInt(route.query.quantity as string) || 1
    try {
      const product = await productsApi.getDetail(productId)
      orderItems.value = [{
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || '',
        price: product.price,
        quantity,
      }]
    } catch {
      showToast('商品信息加载失败')
    }
  } else {
    orderItems.value = cartStore.selectedItems.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      price: i.price,
      quantity: i.quantity,
    }))
  }
}

function goBack() {
  router.back()
}

function goSelectAddress() {
  router.push('/address?select=1')
}

async function submitOrder() {
  if (!selectedAddress.value) {
    showToast('请选择收货地址')
    return
  }
  if (orderItems.value.length === 0) {
    showToast('没有可结算的商品')
    return
  }

  submitting.value = true
  try {
    const params: any = {
      addressId: selectedAddress.value.id,
      remark: remark.value || undefined,
    }

    if (isBuyNow.value) {
      const item = orderItems.value[0]
      params.buyNowProductId = item.productId
      params.buyNowQuantity = item.quantity
    } else {
      params.cartItemIds = cartStore.selectedItems.map((i) => i.id)
    }

    await ordersApi.create(params)
    showToast('下单成功')
    router.replace('/orders')
  } catch {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.checkout-page {
  height: 100vh; overflow-y: auto;
  padding-bottom: 80px;
  background: #f7f8fa;
}
.section {
  background: #fff;
  margin-top: 8px;
  padding: 12px 16px;
}
.section-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
}
.address-card {
  display: flex;
  align-items: flex-start;
  position: relative;
}
.address-content {
  flex: 1;
  min-width: 0;
}
.address-info {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}
.address-name {
  font-size: 15px;
  font-weight: bold;
}
.address-phone {
  color: #666;
  font-size: 14px;
}
.address-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
.address-arrow {
  flex-shrink: 0;
  margin-top: 2px;
}
.no-address {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ee0a24;
  font-size: 14px;
}
.order-item {
  display: flex;
  margin-bottom: 12px;
}
.item-image {
  width: 70px;
  height: 70px;
  border-radius: 4px;
  flex-shrink: 0;
}
.item-info {
  flex: 1;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.item-name {
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.item-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-price {
  font-size: 14px;
  font-weight: bold;
  color: #ee0a24;
}
.item-qty {
  font-size: 13px;
  color: #999;
}
.total-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 14px;
}
.total-price {
  font-size: 18px;
  font-weight: bold;
  color: #ee0a24;
}
.submit-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0));
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}
</style>
