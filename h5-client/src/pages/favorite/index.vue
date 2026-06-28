<template>
  <div class="favorite-page">
    <van-nav-bar title="我的收藏" left-arrow fixed placeholder @click-left="goBack" />

    <EmptyState v-if="!loading && items.length === 0" description="暂无收藏" />

    <div v-else class="fav-list">
      <van-swipe-cell v-for="item in items" :key="item.id">
        <div class="fav-item" @click="goDetail(item.productId)">
          <van-image :src="item.images[0] || 'https://picsum.photos/seed/p/200/200'" fit="cover" width="90" height="90" radius="8" />
          <div class="fav-info">
            <div class="fav-name">{{ item.name }}</div>
            <div class="fav-price-row">
              <span class="fav-price">¥{{ item.price }}</span>
              <span v-if="item.originalPrice && item.originalPrice > item.price" class="fav-original">¥{{ item.originalPrice }}</span>
            </div>
            <div class="fav-stock" v-if="item.stock <= 0" style="color:#ee0a24">已售罄</div>
          </div>
        </div>
        <template #right>
          <van-button square type="danger" text="删除" class="delete-btn" @click="onDelete(item)" />
        </template>
      </van-swipe-cell>
    </div>

    <van-loading v-if="loading" type="spinner" size="24" class="loading-center" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { favoritesApi } from '@/api/favorites'
import type { FavoriteItem } from '@/api/favorites'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const items = ref<FavoriteItem[]>([])
const loading = ref(false)

async function loadFavorites() {
  loading.value = true
  try {
    items.value = await favoritesApi.getList()
  } catch { items.value = [] } finally {
    loading.value = false
  }
}

async function onDelete(item: FavoriteItem) {
  try {
    await favoritesApi.remove(item.productId)
    items.value = items.value.filter(i => i.id !== item.id)
    showToast('已取消收藏')
  } catch { /* */ }
}

function goDetail(productId: number) {
  router.push(`/product/${productId}`)
}

function goBack() { router.back() }

onMounted(() => { loadFavorites() })
</script>

<style scoped>
.favorite-page {
  height: 100vh; overflow-y: auto;
  background: #f5f6f8;
  box-sizing: border-box;
}

.fav-list {
  padding: 12px;
}

.fav-item {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 8px;
}

.fav-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.fav-name {
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
}

.fav-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.fav-price {
  font-size: 16px;
  font-weight: 700;
  color: #ee0a24;
}

.fav-original {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.fav-stock {
  font-size: 11px;
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
