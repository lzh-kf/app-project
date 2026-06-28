<template>
  <div class="search-page">
    <div class="search-bar-wrap">
      <van-search
        v-model="keyword"
        shape="round"
        placeholder="搜索商品"
        show-action
        autofocus
        @search="onSearchConfirm"
        @clear="onClear"
        @cancel="goBack"
        @focus="showSuggestion = !!keyword"
      />
    </div>

    <!-- ===== 联想下拉 ===== -->
    <div v-if="keyword && showSuggestion" class="suggest-overlay" @click.self="showSuggestion = false">
      <div class="suggest-panel">
        <van-loading v-if="loading" type="spinner" size="20" class="suggest-loading" />
        <template v-else>
          <div class="suggest-item suggest-action" @click="confirmSearch(keyword)">
            <van-icon name="search" size="16" color="#ee0a24" />
            <span class="suggest-text">搜索 "<b>{{ keyword }}</b>"</span>
          </div>
          <div
            v-for="item in suggestions"
            :key="item.id"
            class="suggest-item"
            @click="onSuggestClick(item)"
          >
            <van-icon name="search" size="14" color="#999" />
            <span class="suggest-text" v-html="highlight(item.name, keyword)" />
          </div>
          <div v-if="suggestions.length === 0" class="suggest-empty">暂无相关商品</div>
        </template>
      </div>
    </div>
    <div v-if="keyword && showSuggestion" class="suggest-mask" @click="showSuggestion = false" />

    <!-- ===== 搜索历史 ===== -->
    <div v-if="!keyword && !searched && history.length" class="search-section">
      <div class="section-header">
        <span>搜索历史</span>
        <van-icon name="delete-o" size="18" @click="clearHistory" />
      </div>
      <div class="history-tags">
        <span v-for="item in history" :key="item" class="history-tag" @click="searchHistory(item)">{{ item }}</span>
      </div>
    </div>

    <!-- ===== 搜索结果 ===== -->
    <div v-if="searched && !showSuggestion" class="search-results">
      <!-- 筛选栏 -->
      <div class="sort-bar">
        <span
          v-for="s in sortOptions"
          :key="s.value"
          :class="['sort-item', { active: isSortActive(s.value) }]"
          @click="onSortClick(s.value)"
        >
          {{ s.label }}
          <template v-if="s.value === 'price'">
            <span class="price-arrows">
              <van-icon name="arrow-up" size="10" :class="{ on: activeSort === 'price_asc' }" />
              <van-icon name="arrow-down" size="10" :class="{ on: activeSort === 'price_desc' }" />
            </span>
          </template>
        </span>
        <span :class="['sort-item', 'filter-btn', { active: filterCategoryId }]" @click="openFilter">
          <van-icon name="filter-o" size="12" />
          筛选
        </span>
      </div>

      <van-loading v-if="loading" type="spinner" size="24" class="loading-center" />
      <template v-else>
        <div v-if="results.length" class="results-header">找到 {{ results.length }} 个相关商品</div>
        <div v-if="results.length" class="goods-grid">
          <ProductCard v-for="product in results" :key="product.id" :product="product" />
        </div>
        <EmptyState v-else description="未找到相关商品" />
      </template>
    </div>

    <EmptyState v-if="!keyword && !searched && !history.length" description="输入关键词搜索商品" image="search" />

    <!-- ===== 筛选侧边栏 ===== -->
    <van-popup v-model:show="showFilter" position="right" :style="{ width: '80%', height: '100%' }" round>
      <div class="filter-panel">
        <div class="filter-header">
          <span>筛选</span>
          <van-icon name="cross" size="18" @click="showFilter = false" />
        </div>

        <div class="filter-body">
          <!-- 全部分类 -->
          <span
            :class="['filter-all', { active: !filterCategoryId }]"
            @click="selectCategory(0)"
          >全部分类</span>

          <!-- 可展开的分类分组 -->
          <div v-for="cat in filterCategories" :key="cat.id" class="filter-group">
            <div class="filter-parent" @click="toggleExpand(cat.id)">
              <span>{{ cat.name }}</span>
              <van-icon :name="expandedId === cat.id ? 'arrow-up' : 'arrow-down'" size="14" color="#999" />
            </div>
            <div v-show="expandedId === cat.id" class="filter-children">
              <span
                :class="['filter-chip', { active: filterCategoryId === cat.id }]"
                @click="selectCategory(cat.id)"
              >全部</span>
              <span
                v-for="sub in cat.children"
                :key="sub.id"
                :class="['filter-chip', { active: filterCategoryId === sub.id }]"
                @click="selectCategory(sub.id)"
              >{{ sub.name }}</span>
            </div>
          </div>
        </div>

        <div class="filter-footer">
          <van-button plain block @click="resetFilter">重置</van-button>
          <van-button type="danger" block @click="applyFilter">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import type { Product, Category } from '@/types/product'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const loading = ref(false)
const showSuggestion = ref(false)
const searched = ref(false)
const results = ref<Product[]>([])
const history = ref<string[]>(getHistory())
const activeSort = ref('')
const showFilter = ref(false)
const filterCategoryId = ref<number>(0)
const filterCategories = ref<Category[]>([])
const expandedId = ref<number>(0)

const sortOptions = [
  { label: '综合', value: '' },
  { label: '最新', value: 'newest' },
  { label: '价格', value: 'price' },
]

function isSortActive(val: string): boolean {
  if (val === 'price') return activeSort.value === 'price_asc' || activeSort.value === 'price_desc'
  return activeSort.value === val
}

function onSortClick(val: string) {
  if (val === 'price') {
    // 仅在升/降序间切换，不回退到综合
    activeSort.value = activeSort.value === 'price_asc' ? 'price_desc' : 'price_asc'
  } else {
    activeSort.value = val
  }
  doSearch()
}

function openFilter() {
  expandedId.value = 0
  showFilter.value = true
}

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? 0 : id
}

function selectCategory(id: number) {
  filterCategoryId.value = id
}

function applyFilter() {
  showFilter.value = false
  doSearch()
}

function resetFilter() {
  filterCategoryId.value = 0
  expandedId.value = 0
  activeSort.value = ''
  doSearch()
}

// 联想词
const suggestions = computed(() => results.value.slice(0, 8))

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(keyword, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val.trim()) {
    results.value = []
    loading.value = false
    showSuggestion.value = false
    searched.value = false
    return
  }
  showSuggestion.value = true
  searched.value = false
  loading.value = true
  debounceTimer = setTimeout(() => fetchSuggestions(val.trim()), 250)
})

async function fetchSuggestions(kw: string) {
  loading.value = true
  try {
    const res = await productsApi.getList({ keyword: kw, pageSize: 8 })
    results.value = res.list
  } catch { results.value = [] } finally {
    loading.value = false
  }
}

function onSuggestClick(item: Product) {
  keyword.value = item.name
  confirmSearch(item.name)
}

function onSearchConfirm(val: string) {
  const kw = val.trim()
  if (!kw) return
  confirmSearch(kw)
}

function confirmSearch(kw: string) {
  saveHistory(kw)
  showSuggestion.value = false
  searched.value = true
  activeSort.value = ''
  filterCategoryId.value = 0
  loadFilterCategories()
  doSearch()
}

function doSearch() {
  loading.value = true
  const params: Record<string, any> = { pageSize: 50 }
  if (keyword.value) params.keyword = keyword.value
  if (activeSort.value && activeSort.value !== '') params.sort = activeSort.value
  if (filterCategoryId.value > 0) params.categoryId = filterCategoryId.value
  productsApi.getList(params).then(res => {
    results.value = res.list
  }).catch(() => { results.value = [] }).finally(() => {
    loading.value = false
  })
}

async function loadFilterCategories() {
  try {
    const list = await categoriesApi.getTree()
    filterCategories.value = list
  } catch { filterCategories.value = [] }
}

function onClear() {
  results.value = []
  showSuggestion.value = false
  searched.value = false
  filterCategoryId.value = 0
}

function searchHistory(kw: string) {
  keyword.value = kw
  confirmSearch(kw)
}

function goBack() { router.back() }

// ===== 高亮 =====
function highlight(text: string, kw: string): string {
  if (!kw) return text
  const reg = new RegExp(`(${escapeRegExp(kw)})`, 'gi')
  return text.replace(reg, '<em style="color:#ee0a24;font-style:normal">$1</em>')
}
function escapeRegExp(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// ===== 搜索历史 =====
function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem('search_history') || '[]') } catch { return [] }
}
function saveHistory(kw: string) {
  const list = getHistory().filter(h => h !== kw)
  list.unshift(kw)
  localStorage.setItem('search_history', JSON.stringify(list.slice(0, 10)))
  history.value = list.slice(0, 10)
}
function clearHistory() {
  localStorage.removeItem('search_history')
  history.value = []
}

onMounted(() => {
  if (route.query.from === 'cart') {
    keyword.value = ''
    searched.value = true
    showSuggestion.value = false
    activeSort.value = ''
    loadFilterCategories()
    doSearch()
  }
})
</script>

<style scoped>
.search-page {
  height: 100vh;
  overflow-y: auto;
  background: #fff;
  position: relative;
  box-sizing: border-box;
}
.search-bar-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
}

/* ===== 联想下拉 ===== */
.suggest-mask { position: fixed; inset: 0; top: 54px; background: rgba(0,0,0,0.25); z-index: 50; }
.suggest-overlay { position: relative; z-index: 51; }
.suggest-panel {
  position: absolute; top: 0; left: 0; right: 0;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  padding: 4px 0;
}
.suggest-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; }
.suggest-item:active { background: #f5f6f8; }
.suggest-action { border-bottom: 1px solid #f5f5f5; margin-bottom: 2px; }
.suggest-text { font-size: 14px; color: #333; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggest-text :deep(b) { font-weight: 600; }
.suggest-text :deep(em) { font-weight: 600; }
.suggest-empty { padding: 20px; text-align: center; font-size: 13px; color: #999; }
.suggest-loading { display: flex; justify-content: center; padding: 20px; }

/* ===== 搜索历史 ===== */
.search-section { padding: 0 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; font-size: 14px; color: #999; }
.history-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.history-tag {
  display: inline-block; padding: 6px 14px; background: #f5f6f8;
  border-radius: 20px; font-size: 13px; color: #555; cursor: pointer;
}

/* ===== 结果区 ===== */
.search-results { padding: 0 12px; }

/* 筛选栏 */
.sort-bar {
  display: flex; gap: 6px; padding: 8px 0;
  position: sticky; top: 54px; z-index: 50; background: #fff;
}
.sort-item {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 5px 12px; font-size: 12px; color: #666;
  background: #f5f6f8; border-radius: 14px; cursor: pointer; transition: all 0.2s;
}
.sort-item.active { background: #ee0a24; color: #fff; }
.price-arrows {
  display: inline-flex; flex-direction: column; line-height: 1; gap: -2px;
}
.price-arrows .van-icon { color: #ccc; transition: color 0.2s; }
.price-arrows .van-icon.on { color: #fff; }
.sort-item.active .price-arrows .van-icon { color: rgba(255,255,255,0.6); }
.sort-item.active .price-arrows .van-icon.on { color: #fff; }
.filter-btn { gap: 4px; }

.results-header { font-size: 12px; color: #999; padding: 8px 0; }
.goods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.loading-center { display: flex; justify-content: center; padding: 40px; }

/* ===== 筛选面板 ===== */
.filter-panel { display: flex; flex-direction: column; height: 100%; }
.filter-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 18px; font-size: 16px; font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}
.filter-body { flex: 1; overflow-y: auto; padding: 16px 18px; }

/* 全部分类 */
.filter-all {
  display: block; padding: 10px 14px; font-size: 14px; color: #555;
  background: #f5f6f8; border-radius: 10px; cursor: pointer; margin-bottom: 16px;
  text-align: center; transition: all 0.2s;
}
.filter-all.active { background: #fff0f1; color: #ee0a24; font-weight: 600; }

/* 分类分组 */
.filter-group {
  margin-bottom: 4px;
  border-radius: 10px;
  overflow: hidden;
}
.filter-parent {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 14px; font-size: 14px; color: #333; font-weight: 500;
  background: #fafafa; cursor: pointer;
}
.filter-children {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 12px 14px;
  background: #fff;
}
.filter-chip {
  padding: 6px 16px; font-size: 13px; color: #666;
  background: #f5f6f8; border-radius: 20px; cursor: pointer; transition: all 0.2s;
}
.filter-chip.active { background: #ee0a24; color: #fff; }

.filter-footer {
  display: flex; gap: 10px; padding: 12px 18px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
  border-top: 1px solid #f0f0f0;
}
.filter-footer .van-button { flex: 1; border-radius: 20px; }
</style>
