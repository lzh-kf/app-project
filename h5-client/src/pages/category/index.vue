<template>
  <div class="category-page">
    <div class="category-container">
      <!-- 左侧分类边栏：固定不滚动 -->
      <div class="sidebar">
        <div
          v-for="cat in categories"
          :key="cat.id"
          :class="['sidebar-item', { active: activeCategory === cat.id }]"
          @click="selectCategory(cat)"
        >
          {{ cat.name }}
        </div>
      </div>

      <!-- 右侧内容：只有这里滚动 -->
      <div class="content" ref="contentRef">
        <!-- 子分类标签：sticky 固定 -->
        <div v-if="currentCategory?.children?.length" class="sub-cats">
          <span
            :class="['sub-tag', { 'sub-active': activeSubCategory === null }]"
            @click="selectCategory(currentCategory!)"
          >全部</span>
          <span
            v-for="sub in currentCategory.children"
            :key="sub.id"
            :class="['sub-tag', { 'sub-active': activeSubCategory === sub.id }]"
            @click="selectSubCategory(sub.id)"
          >{{ sub.name }}</span>
        </div>

        <!-- 商品网格 -->
        <div v-if="products.length" class="product-grid">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>
        <EmptyState v-else-if="!loading" description="暂无商品" />
        <van-loading v-if="loading" type="spinner" size="24" class="loading-center" />

        <!-- 回到顶部（仅内容区域） -->
        <van-back-top :target="contentRef" visibility-height="400" right="12" bottom="60" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'CategoryPage' }
</script>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categoriesApi } from '@/api/categories'
import { productsApi } from '@/api/products'
import type { Category, Product } from '@/types/product'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()

const categories = ref<Category[]>([])
const currentCategory = ref<Category | null>(null)
const activeCategory = ref<number | null>(null)
const activeSubCategory = ref<number | null>(null)
const products = ref<Product[]>([])
const loading = ref(false)
const contentRef = ref<HTMLElement>()

async function loadCategories() {
  const list = await categoriesApi.getTree()
  categories.value = list
  if (list.length === 0) return

  // 从 URL query 获取要定位的分类 ID
  const targetId = parseInt(route.query.id as string)
  if (targetId) {
    const target = findCategoryById(list, targetId)
    if (target) {
      selectCategory(target)
      return
    }
  }
  // 默认选第一个
  selectCategory(list[0])
}

/** 递归查找指定 ID 的分类 */
function findCategoryById(tree: Category[], id: number): Category | null {
  for (const cat of tree) {
    if (cat.id === id) return cat
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, id)
      if (found) return found
    }
  }
  return null
}

async function selectCategory(cat: Category) {
  activeCategory.value = cat.id
  currentCategory.value = cat
  activeSubCategory.value = null
  // 切换分类时滚动回顶部
  if (contentRef.value) contentRef.value.scrollTop = 0
  await loadProducts(cat.id)
}

async function selectSubCategory(subId: number) {
  activeSubCategory.value = subId
  if (contentRef.value) contentRef.value.scrollTop = 0
  await loadProducts(subId)
}

async function loadProducts(categoryId: number) {
  loading.value = true
  try {
    const res = await productsApi.getList({ categoryId, pageSize: 50 })
    products.value = res.list
  } catch { products.value = [] } finally {
    loading.value = false
  }
}

onMounted(() => { loadCategories() })

// keep-alive 缓存后，从首页跳转不同分类时通过 watch 响应
watch(() => route.query.id, (newId) => {
  if (newId && categories.value.length) {
    const id = parseInt(newId as string)
    if (activeCategory.value !== id) {
      const target = findCategoryById(categories.value, id)
      if (target) selectCategory(target)
    }
  }
})
</script>

<style scoped>
.category-page {
  height: 100%;
}
.category-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* 左侧边栏 — 固定，仅内容过多时自身滚动 */
.sidebar {
  width: 88px;
  background: #f5f6f8;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 0;
}
.sidebar-item {
  padding: 15px 8px;
  font-size: 13px;
  text-align: center;
  color: #666;
  position: relative;
  transition: all 0.2s;
}
.sidebar-item.active {
  background: #fff;
  color: #333;
  font-weight: 600;
}
.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background: #ee0a24;
  border-radius: 3px;
}

/* 右侧内容 — 可滚动 */
.content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fff;
  padding: 0 12px 12px;
}

/* 子分类标签 — 粘性固定在顶部 */
.sub-cats {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 0;
  margin-bottom: 10px;
}
.sub-tag {
  display: inline-block;
  padding: 5px 14px;
  font-size: 12px;
  color: #666;
  background: #f5f6f8;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}
.sub-active {
  background: #ee0a24;
  color: #fff;
}

/* 回到顶部 — 低调半透明 */
.content :deep(.van-back-top) {
  --van-back-top-background: rgba(0, 0, 0, 0.18);
}
.content :deep(.van-back-top__icon) {
  color: rgba(255, 255, 255, 0.85);
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 30px;
}
</style>
