<template>
  <div class="order-detail-page">
    <van-nav-bar title="订单详情" left-arrow fixed placeholder @click-left="goBack" />

    <van-loading v-if="loading" type="spinner" class="loading-center" />

    <template v-if="order">
      <!-- 状态步骤条 -->
      <div class="status-bar">
        <van-steps :active="stepIndex" active-color="#ee0a24">
          <van-step v-for="step in steps" :key="step.status">{{ step.label }}</van-step>
        </van-steps>
      </div>

      <!-- 收货地址 -->
      <div class="section">
        <div class="section-label">收货信息</div>
        <div>{{ order.consignee }} {{ order.phone }}</div>
        <div class="address-text">{{ order.address }}</div>
      </div>

      <!-- 商品信息 -->
      <div class="section">
        <div class="section-label">商品信息</div>
        <div v-for="item in order.items" :key="item.id" class="order-item">
          <van-image :src="itemImage(item)" fit="cover" class="item-image" />
          <div class="item-info">
            <div class="item-name">{{ item.productName }}</div>
            <div class="item-price-row">
              <span>¥{{ item.price }} x {{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="section">
        <div class="section-label">订单信息</div>
        <van-cell title="订单编号" :value="order.orderNo" />
        <van-cell title="下单时间" :value="formatDate(order.createdAt)" />
        <van-cell title="订单状态" :value="statusLabel(order.status)" />
        <van-cell v-if="order.remark" title="备注" :value="order.remark" />
      </div>

      <!-- 合计 -->
      <div class="section total-section">
        <span>实付金额：</span>
        <span class="total-price">¥{{ order.totalAmount }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="actions" v-if="order.status === 'pending' || order.status === 'shipped'">
        <van-button
          v-if="order.status === 'pending'"
          type="danger"
          block
          @click="onCancel"
        >取消订单</van-button>
        <van-button
          v-if="order.status === 'shipped'"
          type="primary"
          block
          @click="onConfirm"
        >确认收货</van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { ordersApi } from '@/api/orders'
import { OrderStatusLabels, OrderStatusSteps } from '@/types/order'
import type { Order, OrderItem } from '@/types/order'
import { formatDate } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const order = ref<Order | null>(null)
const loading = ref(false)

const steps = OrderStatusSteps

const stepIndex = computed(() => {
  if (!order.value) return 0
  if (order.value.status === 'cancelled') return -1
  const idx = steps.findIndex((s) => s.status === order.value!.status)
  return idx >= 0 ? idx : 0
})

function statusLabel(status: string): string {
  return OrderStatusLabels[status] || status
}

function itemImage(item: OrderItem): string {
  if (item.productImage) return item.productImage
  if (item.product?.images) {
    try {
      const arr = JSON.parse(item.product.images)
      return arr[0] || 'https://picsum.photos/seed/p/200/200'
    } catch {
      return 'https://picsum.photos/seed/p/200/200'
    }
  }
  return 'https://picsum.photos/seed/p/200/200'
}

async function loadOrder() {
  const id = parseInt(route.params.id as string)
  if (isNaN(id)) return
  loading.value = true
  try {
    order.value = await ordersApi.getDetail(id)
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

async function onCancel() {
  if (!order.value) return
  try {
    await showConfirmDialog({ title: '提示', message: '确定要取消该订单吗？' })
    await ordersApi.cancel(order.value.id)
    showToast('已取消')
    loadOrder()
  } catch { /* 取消操作 */ }
}

async function onConfirm() {
  if (!order.value) return
  try {
    await showConfirmDialog({ title: '提示', message: '确认已收到货？' })
    await ordersApi.confirmReceive(order.value.id)
    showToast('已确认收货')
    loadOrder()
  } catch { /* 取消操作 */ }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.order-detail-page {
  height: 100vh; overflow-y: auto;
  padding-bottom: 30px;
  background: #f7f8fa;
}
.status-bar {
  background: #fff;
  padding: 20px 16px;
}
.section {
  background: #fff;
  margin-top: 8px;
  padding: 12px 16px;
}
.section-label {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}
.address-text {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}
.order-item {
  display: flex;
  margin-bottom: 10px;
}
.item-image {
  width: 64px;
  height: 64px;
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
}
.item-price-row {
  font-size: 14px;
  color: #ee0a24;
  font-weight: bold;
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
.actions {
  margin-top: 20px;
  padding: 0 16px;
}
.loading-center {
  display: flex;
  justify-content: center;
  padding: 60px;
}
</style>
