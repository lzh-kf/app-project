<template>
  <div class="product-detail-page">
    <van-nav-bar title="商品详情" left-arrow fixed placeholder @click-left="goBack" />

    <!-- 商品图片轮播 -->
    <van-swipe v-if="product?.images?.length" :autoplay="3000" indicator-color="white" class="product-swipe">
      <van-swipe-item v-for="(img, index) in product.images" :key="index">
        <van-image :src="img" fit="cover" class="product-image" />
      </van-swipe-item>
    </van-swipe>
    <van-image v-else src="https://picsum.photos/seed/product/400/400" fit="cover" class="product-image-single" />

    <!-- 商品信息 -->
    <div class="product-info" v-if="product">
      <div class="price-row">
        <span class="price">¥{{ product.price }}</span>
        <span class="original-price" v-if="product.originalPrice && product.originalPrice > product.price">
          ¥{{ product.originalPrice }}
        </span>
      </div>
      <h2 class="product-name">{{ product.name }}</h2>
      <div class="product-meta">
        <span v-if="product.category" class="category-tag">{{ product.category.name }}</span>
        <span class="stock">库存：{{ product.stock }}</span>
      </div>
      <div class="product-desc" v-if="product.description">
        <div class="desc-title">商品描述</div>
        <div class="desc-content" v-html="product.description" />
      </div>
    </div>

    <!-- 加载中 -->
    <van-loading v-if="loading" type="spinner" class="loading-center" />

    <!-- 底部操作栏 -->
    <van-action-bar v-if="product" safe-area-inset-bottom>
      <van-action-bar-icon icon="chat-o" text="客服" />
      <van-action-bar-icon icon="cart-o" text="购物车" :badge="cartBadge" @click="goCart" />
      <van-action-bar-icon
        :icon="isFavorited ? 'star' : 'star-o'"
        :text="isFavorited ? '已收藏' : '收藏'"
        :color="isFavorited ? '#ff976a' : ''"
        @click="toggleFavorite"
      />
      <van-action-bar-button type="warning" text="加入购物车" @click="addToCart" />
      <van-action-bar-button type="danger" text="立即购买" @click="buyNow" />
    </van-action-bar>

    <!-- 数量选择弹窗 -->
    <van-popup v-model:show="showPopup" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <span>选择数量</span>
          <van-icon name="cross" @click="showPopup = false" />
        </div>
        <div class="popup-body">
          <van-stepper v-model="quantity" :min="1" :max="product?.stock || 1" />
        </div>
        <van-button round block type="danger" @click="confirmAction">
          {{ actionType === 'cart' ? '加入购物车' : '立即购买' }}
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { favoritesApi } from '@/api/favorites'
import type { Product } from '@/types/product'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()

const product = ref<Product | null>(null)
const loading = ref(false)
const isFavorited = ref(false)
const showPopup = ref(false)
const quantity = ref(1)
const actionType = ref<'cart' | 'buy'>('cart')

const cartBadge = computed(() => {
  const count = cartStore.totalCount
  return count > 0 ? (count > 99 ? '99+' : String(count)) : ''
})

async function loadProduct() {
  const id = parseInt(route.params.id as string)
  if (isNaN(id)) return

  loading.value = true
  try {
    const [res, favs] = await Promise.all([
      productsApi.getDetail(id),
      authStore.isLoggedIn ? favoritesApi.getList().catch(() => []) : [],
    ])
    product.value = res
    if (authStore.isLoggedIn) {
      isFavorited.value = (favs as any[]).some((f: any) => f.productId === id)
    }
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
}

async function toggleFavorite() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!product.value) return
  try {
    if (isFavorited.value) {
      await favoritesApi.remove(product.value.id)
      isFavorited.value = false
      showToast('已取消收藏')
    } else {
      await favoritesApi.add(product.value.id)
      isFavorited.value = true
      showToast('已收藏')
    }
  } catch { /* */ }
}

function goBack() {
  router.back()
}

function goCart() {
  router.push('/cart')
}

function addToCart() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  actionType.value = 'cart'
  quantity.value = 1
  showPopup.value = true
}

function buyNow() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  actionType.value = 'buy'
  quantity.value = 1
  showPopup.value = true
}

async function confirmAction() {
  if (!product.value) return

  if (actionType.value === 'cart') {
    await cartStore.addItem(product.value.id, quantity.value)
    showToast('已加入购物车')
    showPopup.value = false
  } else {
    // 立即购买：跳转到结算页
    showPopup.value = false
    router.push({
      path: '/checkout',
      query: {
        buyNow: '1',
        productId: String(product.value.id),
        quantity: String(quantity.value),
      },
    })
  }
}

onMounted(() => {
  loadProduct()
  cartStore.fetchCart()
})
</script>

<style scoped>
.product-detail-page {
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 50px;
  background: #f7f8fa;
  box-sizing: border-box;
}
.product-swipe {
  height: 375px;
}
.product-image,
.product-image-single {
  width: 100%;
  height: 375px;
}
.product-info {
  background: #fff;
  padding: 16px;
  margin-top: 8px;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.price {
  font-size: 24px;
  font-weight: bold;
  color: #ee0a24;
}
.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}
.product-name {
  font-size: 16px;
  font-weight: bold;
  margin: 8px 0;
  color: #333;
}
.product-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}
.category-tag {
  background: #fff2f3;
  color: #ee0a24;
  padding: 2px 8px;
  border-radius: 4px;
}
.product-desc {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
.desc-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.desc-content {
  font-size: 14px;
  color: #444;
  line-height: 1.8;
  word-break: break-all;
  overflow: hidden;
}
.desc-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 8px 0;
  border-radius: 4px;
}
.desc-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.desc-content :deep(td),
.desc-content :deep(th) {
  border: 1px solid #eee;
  padding: 6px 8px;
}
.desc-content :deep(p) {
  margin: 0 0 8px;
}
.desc-content :deep(ul),
.desc-content :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
.loading-center {
  display: flex;
  justify-content: center;
  padding: 60px;
}
.popup-content {
  padding: 20px 16px 30px;
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
}
.popup-body {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}
</style>
