<template>
  <div class="main-layout">
    <div :class="['main-content', { 'has-tabbar': showTabbar }]">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['HomePage', 'CategoryPage']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <van-tabbar v-show="showTabbar" v-model="activeTab" fixed safe-area-inset-bottom>
      <van-tabbar-item icon="home-o" @click="switchTab(0)">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" @click="switchTab(1)">分类</van-tabbar-item>
      <van-tabbar-item icon="cart-o" :badge="cartBadge" @click="switchTab(2)">购物车</van-tabbar-item>
      <van-tabbar-item icon="contact-o" @click="switchTab(3)">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const activeTab = ref(0)
const showTabbar = computed(() => route.meta.tabbar === true)

const tabRoutes = ['/', '/category', '/cart', '/profile']
const tabMap: Record<string, number> = { Home: 0, Category: 1, Cart: 2, Profile: 3 }

// 路由变化 → 同步 tab 高亮（仅在 tab 页）
watch(
  () => route.name,
  (name) => {
    if (name && tabMap[name as string] !== undefined) {
      activeTab.value = tabMap[name as string]
    }
  },
  { immediate: true }
)

function switchTab(index: number) {
  router.replace(tabRoutes[index])
}

const cartBadge = computed(() => {
  if (!authStore.isLoggedIn) return ''
  const count = cartStore.totalCount
  return count > 0 ? (count > 99 ? '99+' : String(count)) : ''
})

// 登录后加载购物车
if (authStore.isLoggedIn) {
  cartStore.fetchCart()
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}
.main-content {
  height: 100%;
}
/* 仅 tab 页面由外层滚动，二级页面自行管理滚动 */
.main-content.has-tabbar {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(50px + constant(safe-area-inset-bottom));
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}
</style>
