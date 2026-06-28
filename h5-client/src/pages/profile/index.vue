<template>
  <div class="profile-page">
    <!-- 用户信息头部 -->
    <div class="profile-header">
      <div class="header-bg" />
      <div class="header-content">
        <van-image round width="64" height="64" fit="cover" :src="member?.avatar || defaultAvatar" />
        <div class="header-info">
          <div class="header-name">{{ member?.nickname || '点击登录' }}</div>
          <div class="header-phone" v-if="member">{{ maskPhone(member.phone) }}</div>
        </div>
        <van-icon v-if="member" name="setting-o" size="20" @click="goEditProfile" />
        <van-icon v-else name="arrow" size="18" color="#fff" @click="router.push('/login')" />
      </div>
    </div>

    <!-- 未登录时 -->
    <template v-if="!authStore.isLoggedIn">
      <div class="login-area">
        <van-button round block type="danger" size="large" @click="router.push('/login')">登录 / 注册</van-button>
      </div>

      <div class="guest-tips">
        <div class="guest-item" @click="router.push('/login')">
          <van-icon name="orders-o" size="20" color="#999" />
          <span>我的订单</span>
        </div>
        <div class="guest-item" @click="router.push('/login')">
          <van-icon name="location-o" size="20" color="#999" />
          <span>收货地址</span>
        </div>
        <div class="guest-item" @click="router.push('/login')">
          <van-icon name="cart-o" size="20" color="#999" />
          <span>购物车</span>
        </div>
      </div>
    </template>

    <!-- 已登录 -->
    <template v-else>
      <!-- 订单面板 -->
      <div class="order-panel card">
        <div class="panel-header">
          <span class="panel-title">我的订单</span>
          <router-link to="/orders" class="panel-link">查看全部 <van-icon name="arrow" /></router-link>
        </div>
        <van-grid :column-num="4" :border="false" class="order-grid">
          <van-grid-item
            v-for="item in orderEntries"
            :key="item.status"
            :text="item.label"
            :icon="item.icon"
            @click="router.push(`/orders?status=${item.status}`)"
          >
            <template #icon>
              <div class="order-icon-wrap">
                <van-icon :name="item.icon" :size="item.size" :color="item.color" />
              </div>
            </template>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 功能菜单 -->
      <div class="menu-panel card">
        <van-cell title="我的收藏" is-link @click="router.push('/favorite')" center>
          <template #icon><van-icon name="star-o" size="18" /></template>
        </van-cell>
        <van-cell title="收货地址" is-link @click="router.push('/address')" center>
          <template #icon><van-icon name="location-o" size="18" /></template>
        </van-cell>
        <van-cell title="个人信息" is-link @click="router.push('/profile/detail')" center>
          <template #icon><van-icon name="user-o" size="18" /></template>
        </van-cell>
      </div>

      <!-- 退出 -->
      <div class="logout-area">
        <van-button round block plain type="default" @click="onLogout">退出登录</van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const member = computed(() => authStore.member)

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIHJ4PSI2MCIgZmlsbD0iI2YwZjBmMCIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjZGRkIi8+PHBhdGggZD0iTTIwIDk1YzAtMjIuMDkxIDE3LjkwOS00MCA0MC00MHM0MCAxNy45MDkgNDAgNDAiIGZpbGw9IiNkZGQiLz48L3N2Zz4='

const orderEntries = [
  { status: 'pending', label: '待付款', icon: 'balance-o', size: 22, color: '#ff976a', count: 0 },
  { status: 'confirmed', label: '待发货', icon: 'clock-o', size: 22, color: '#1989fa', count: 0 },
  { status: 'shipped', label: '待收货', icon: 'logistics', size: 22, color: '#07c160', count: 0 },
  { status: 'delivered', label: '已完成', icon: 'checked', size: 22, color: '#999', count: 0 },
]

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function goEditProfile() {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/profile/edit')
}

async function onLogout() {
  try {
    await showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' })
    authStore.logout()
    showToast('已退出登录')
  } catch { /* 取消 */ }
}
</script>

<style scoped>
.profile-page {
  background: #f5f6f8;
  padding-bottom: 30px;
}

/* 头部 */
.profile-header {
  position: relative;
  padding: 24px 20px 32px;
  overflow: hidden;
}
.header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #ee0a24 0%, #ff4d4f 50%, #ff7875 100%);
  border-radius: 0 0 24px 24px;
}
.header-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  color: #fff;
}
.header-info {
  flex: 1;
  min-width: 0;
}
.header-name {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.header-phone {
  font-size: 13px;
  opacity: 0.75;
  margin-top: 4px;
}

/* 登录按钮区 */
.login-area {
  margin: 24px 16px 0;
}

/* 未登录功能入口 */
.guest-tips {
  display: flex;
  margin: 20px 12px 0;
  background: #fff;
  border-radius: 12px;
  padding: 8px 0;
}
.guest-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

/* 卡片通用 */
.card {
  margin: 12px 12px 0;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

/* 订单面板 */
.order-panel {
  margin: 16px 12px 0;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 6px;
}
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.panel-link {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 2px;
  text-decoration: none;
}
.order-grid {
  padding-bottom: 8px;
}
.order-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}
.order-grid :deep(.van-grid-item__text) {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 菜单面板 */
.menu-panel :deep(.van-cell__title) {
  font-size: 14px;
}
.menu-panel :deep(.van-cell__left-icon) {
  margin-right: 10px;
  color: #666;
}

/* 退出 */
.logout-area {
  margin: 24px 16px;
}
</style>
