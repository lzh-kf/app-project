<template>
  <div class="product-card" @click="goDetail">
    <div class="product-image-wrapper">
      <van-image :src="image" :alt="product.name" fit="cover" width="100%" height="100%" radius="8px 8px 0 0">
        <template #loading>
          <van-loading type="spinner" size="20" />
        </template>
      </van-image>
    </div>
    <div class="product-info">
      <div class="product-name">{{ product.name }}</div>
      <div class="product-price-row">
        <span class="product-price">¥{{ product.price }}</span>
        <span class="product-original-price" v-if="product.originalPrice && product.originalPrice > product.price">
          ¥{{ product.originalPrice }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Product } from '@/types/product'

const props = defineProps<{ product: Product }>()
const router = useRouter()

const image = computed(() => {
  if (props.product.images && props.product.images.length > 0) {
    return props.product.images[0]
  }
  return 'https://picsum.photos/seed/product/400/400'
})

function goDetail() {
  router.push(`/product/${props.product.id}`)
}
</script>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}
.product-image-wrapper {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;
}
.product-info {
  padding: 8px 10px;
}
.product-name {
  font-size: 13px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #333;
}
.product-price-row {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.product-price {
  font-size: 15px;
  font-weight: bold;
  color: #ee0a24;
}
.product-original-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}
</style>
