<template>
  <div class="order-list-page">
    <van-nav-bar title="我的订单" left-arrow fixed placeholder @click-left="goBack" />

    <div class="tabs-sticky">
      <van-tabs v-model:active="activeTab" @update:active="onTabChange">
        <van-tab title="全部" name="all" />
        <van-tab title="待付款" name="pending" />
        <van-tab title="待发货" name="confirmed" />
        <van-tab title="待收货" name="shipped" />
        <van-tab title="已完成" name="delivered" />
      </van-tabs>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <!-- 首次加载中 -->
      <van-loading v-if="loading" type="spinner" size="24" class="loading-center" />
      <template v-else>
        <van-list
          v-if="orders.length"
          v-model:loading="loadingMore"
          :finished="finished"
          finished-text="已加载全部订单"
          @load="onLoadMore"
        >
          <div v-for="order in orders" :key="order.id" class="order-card" @click="goDetail(order.id)">
            <!-- 头部 -->
            <div class="order-top">
              <span class="order-no">订单号：{{ order.orderNo }}</span>
              <span class="order-status" :class="'status-' + order.status">{{ statusLabel(order.status) }}</span>
            </div>

            <!-- 商品 -->
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <van-image :src="itemImage(item)" fit="cover" width="72" height="72" radius="6" class="item-img" />
              <div class="item-body">
                <div class="item-name">{{ item.productName }}</div>
                <div class="item-bottom">
                  <span class="item-price">¥{{ item.price }}</span>
                  <span class="item-qty">×{{ item.quantity }}</span>
                </div>
              </div>
            </div>

            <!-- 底部 -->
            <div class="order-bottom">
              <span class="order-time">{{ fmtTime(order.createdAt) }}</span>
              <span class="order-total">
                共 {{ totalQty(order) }} 件 &nbsp;合计：<b>¥{{ order.totalAmount }}</b>
              </span>
            </div>

            <!-- 操作 -->
            <div class="order-actions" v-if="order.status === 'pending'">
              <van-button size="small" plain type="default" @click.stop="onCancel(order.id)">取消</van-button>
              <van-button size="small" type="danger" @click.stop="onPay(order.id)">去付款</van-button>
            </div>
            <div class="order-actions" v-if="order.status === 'shipped'">
              <van-button size="small" plain type="default" @click.stop="goDetail(order.id)">查看详情</van-button>
              <van-button size="small" type="primary" @click.stop="onConfirm(order.id)">确认收货</van-button>
            </div>
            <div class="order-actions" v-if="order.status === 'confirmed'">
              <van-button size="small" plain type="default" @click.stop="onCancel(order.id)">取消</van-button>
            </div>
          </div>
        </van-list>
        <EmptyState v-else description="暂无订单" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { ordersApi } from '@/api/orders'
import { OrderStatusLabels } from '@/types/order'
import type { Order, OrderItem } from '@/types/order'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const route = useRoute()
const activeTab = ref((route.query.status as string) || 'all')
const orders = ref<Order[]>([])
const loading = ref(false)
const loadingMore = ref(false)

// 分页
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const finished = computed(() => {
  if (total.value === 0) return true
  return orders.value.length >= total.value
})

function statusLabel(s: string) { return OrderStatusLabels[s] || s }
function totalQty(o: Order) { return o.items.reduce((s, i) => s + i.quantity, 0) }

function fmtTime(d: string) {
  const t = new Date(d)
  return `${t.getMonth() + 1}-${t.getDate()} ${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`
}

function itemImage(item: OrderItem): string {
  if (item.productImage) return item.productImage
  try {
    if (item.product?.images) {
      const arr = JSON.parse(item.product.images)
      return arr[0] || ''
    }
  } catch { /* */ }
  return 'https://picsum.photos/seed/ph/200/200'
}

async function fetchOrders(append = false) {
  if (append) {
    loadingMore.value = true
    page.value++
  } else {
    loading.value = true
    page.value = 1
  }

  try {
    const s = activeTab.value === 'all' ? undefined : activeTab.value
    const res = await ordersApi.getList({ page: page.value, pageSize: pageSize.value, status: s })
    if (append) {
      orders.value.push(...res.list)
    } else {
      orders.value = res.list
    }
    total.value = res.total
  } catch {
    if (!append) orders.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onLoadMore() {
  fetchOrders(true)
}

function onTabChange() { fetchOrders() }
function goBack() { router.back() }
function goDetail(id: number) { router.push(`/order/${id}`) }

function onPay(_id: number) { showToast('支付功能开发中') }

async function onCancel(id: number) {
  try {
    await showConfirmDialog({ title: '提示', message: '确定要取消该订单吗？' })
    await ordersApi.cancel(id)
    showToast('已取消')
    fetchOrders()
  } catch { /* 取消 */ }
}

async function onConfirm(id: number) {
  try {
    await showConfirmDialog({ title: '确认收货', message: '确认已收到货？' })
    await ordersApi.confirmReceive(id)
    showToast('已确认')
    fetchOrders()
  } catch { /* 取消 */ }
}

onMounted(() => { fetchOrders() })
</script>

<style scoped>
.order-list-page {
  height: 100vh;
  overflow-y: auto;
  background: #f5f6f8;
}

/* tabs 粘在 navbar 下方 */
.tabs-sticky {
  position: sticky;
  top: 46px;
  z-index: 99;
  background: #fff;
}

.order-list {
  padding: 12px;
}

/* 订单卡片 */
.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
}

.order-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}
.order-no {
  font-size: 12px;
  color: #999;
}
.order-status {
  font-size: 13px;
  font-weight: 600;
}
.status-pending { color: #ff976a; }
.status-confirmed { color: #1989fa; }
.status-shipped { color: #07c160; }
.status-delivered { color: #999; }
.status-cancelled { color: #ccc; text-decoration: line-through; }

/* 商品项 */
.order-item {
  display: flex;
  padding: 10px 0;
  gap: 10px;
}
.order-item + .order-item {
  border-top: 1px solid #f9f9f9;
}
.item-img {
  flex-shrink: 0;
}
.item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.item-name {
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
}
.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.item-price {
  font-size: 14px;
  font-weight: 600;
  color: #ee0a24;
}
.item-qty {
  font-size: 12px;
  color: #999;
}

/* 底部 */
.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 0;
  border-top: 1px solid #f9f9f9;
  font-size: 12px;
  color: #999;
}
.order-total b {
  font-size: 14px;
  color: #ee0a24;
}

/* 操作 */
.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f9f9f9;
  margin-top: 10px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 40px;
}

/* van-list 底部文字 */
.order-list :deep(.van-list__finished-text) {
  font-size: 13px;
  color: #999;
  padding: 4px 0;
}
.order-list :deep(.van-list__loading) {
  padding: 4px 0;
}
</style>
