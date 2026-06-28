<template>
  <div class="address-list-page">
    <van-nav-bar title="地址管理" left-arrow fixed placeholder @click-left="goBack" />

    <div class="address-list">
      <EmptyState v-if="!loading && addresses.length === 0" description="暂无收货地址" />

      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="address-card"
        :class="{ 'is-select': isSelectMode }"
        @click="onSelectAddress(addr)"
      >
        <div class="address-top">
          <span class="address-name">{{ addr.consignee }}</span>
          <span class="address-phone">{{ addr.phone }}</span>
          <van-tag v-if="addr.isDefault === 1" type="danger" size="medium">默认</van-tag>
        </div>
        <div class="address-detail">
          {{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}
        </div>
        <div class="address-actions">
          <van-icon name="edit" size="18" @click.stop="editAddress(addr.id)" />
          <van-icon name="delete-o" size="18" @click.stop="onDelete(addr.id)" />
        </div>
      </div>
    </div>

    <div class="add-btn">
      <van-button round block type="danger" @click="addAddress">新增地址</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useAddressStore } from '@/stores/address'
import type { Address } from '@/types/member'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const route = useRoute()
const addressStore = useAddressStore()

const addresses = computed(() => addressStore.addresses)
const loading = computed(() => addressStore.loading)

// 是否处于选择地址模式（从结算页进入）
const isSelectMode = computed(() => route.query.select === '1')

function goBack() {
  router.back()
}

function addAddress() {
  router.push('/address/edit')
}

function editAddress(id: number) {
  router.push(`/address/edit/${id}`)
}

async function onDelete(id: number) {
  try {
    await showConfirmDialog({ title: '提示', message: '确定要删除该地址吗？' })
    await addressStore.deleteAddress(id)
    showToast('已删除')
  } catch { /* 取消操作 */ }
}

function onSelectAddress(addr: Address) {
  if (isSelectMode.value) {
    // 返回结算页
    router.back()
  }
}

onMounted(() => {
  addressStore.fetchAddresses()
})
</script>

<style scoped>
.address-list-page {
  height: 100vh; overflow-y: auto;
  padding-bottom: 80px;
  background: #f7f8fa;
}
.address-list {
  padding: 8px 0;
}
.address-card {
  background: #fff;
  margin: 8px 12px;
  padding: 14px;
  border-radius: 8px;
  position: relative;
}
.address-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.address-name {
  font-size: 15px;
  font-weight: bold;
}
.address-phone {
  font-size: 14px;
  color: #666;
}
.address-detail {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
.address-actions {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: flex;
  gap: 16px;
  color: #999;
}
.add-btn {
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
