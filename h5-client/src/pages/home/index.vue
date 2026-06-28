<template>
  <div class="home-page">
    <!-- 顶部搜索 — sticky 固定 -->
    <div class="search-header">
      <div class="search-box" @click="goSearch">
        <van-icon name="search" size="16" color="#999" />
        <span class="search-placeholder">搜索商品</span>
      </div>
    </div>

    <!-- Banner轮播 -->
    <div class="banner-wrap" v-if="banners.length">
      <van-swipe :autoplay="3000" indicator-color="white" class="banner-swipe">
        <van-swipe-item v-for="banner in banners" :key="banner.id" @click="goBanner(banner.link)">
          <van-image :src="banner.image" :alt="banner.title" fit="cover" class="banner-image" />
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 分类入口 — 横向可滑动 -->
    <div class="cate-panel">
      <div class="cate-scroll">
        <div
          v-for="(cat, idx) in categories"
          :key="cat.id"
          class="cate-item"
          @click="goCategory(cat.id)"
        >
          <span class="cate-emoji">{{ cateIcons[idx] || '📦' }}</span>
          <span class="cate-name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- 推荐商品 -->
    <div class="goods-section">
      <div class="section-head">
        <span class="head-bar" />
        <span class="head-title">为你推荐</span>
      </div>
      <div v-if="featuredProducts.length" class="goods-grid">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>
      <EmptyState v-else description="暂无推荐商品" />
    </div>

    <van-loading v-if="loading" type="spinner" size="24" class="loading-center" />
  </div>
</template>

<script lang="ts">
export default { name: 'HomePage' }
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeApi } from '@/api/home'
import type { Banner, Product, Category } from '@/types/product'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const loading = ref(false)
const banners = ref<Banner[]>([])
const featuredProducts = ref<Product[]>([])
const categories = ref<Category[]>([])

const cateIcons = ['📱', '👗', '🍔', '🏠', '💄', '📚', '🎮', '🛒']

async function loadHomeData() {
  loading.value = true
  try {
    const data = await homeApi.getHomeData()
    banners.value = data.banners || []
    featuredProducts.value = data.featuredProducts || []
    categories.value = data.categories || []
  } catch { /* */ } finally {
    loading.value = false
  }
}

function goSearch() { router.push('/search') }
function goBanner(link?: string) {
  if (!link) return
  router.push(link)
}
function goCategory(categoryId?: number) {
  if (categoryId) {
    router.push({ path: '/category', query: { id: categoryId } })
  } else {
    router.push('/category')
  }
}

onMounted(() => { loadHomeData() })
</script>

<style scoped>
.home-page {
  background: #f5f6f8;
  padding-bottom: 20px;
}

/* ===== 搜索栏 — sticky 固定顶部 ===== */
.search-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  padding: 8px 14px;
  /* 初始无阴影，滚动时通过 JS 添加？不用，用细微阴影即可 */
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  background: #f5f6f8;
  border-radius: 18px;
  cursor: pointer;
}
.search-placeholder {
  font-size: 14px;
  color: #b0b0b0;
}

/* ===== Banner ===== */
.banner-wrap {
  margin: 10px 12px 0;
}
.banner-swipe {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.banner-image {
  width: 100%;
  height: 170px;
}

/* ===== 分类 — 横向滑动 ===== */
.cate-panel {
  margin: 12px 0 0;
  padding: 0 12px;
}
.cate-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;          /* Firefox */
  padding: 4px 0;
}
.cate-scroll::-webkit-scrollbar {
  display: none;                  /* Chrome/Safari */
}
.cate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 64px;
  padding: 10px 0 8px;
  cursor: pointer;
}
.cate-emoji {
  font-size: 30px;
  line-height: 1;
}
.cate-name {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

/* ===== 推荐商品 ===== */
.goods-section {
  margin-top: 16px;
  padding: 0 12px;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.head-bar {
  width: 3px;
  height: 16px;
  background: #ee0a24;
  border-radius: 2px;
}
.head-title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}
.goods-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 40px;
}
</style>
