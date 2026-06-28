<template>
  <van-empty :description="description" :image="image" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ description?: string; image?: string }>(), {
  description: '暂无数据',
  image: 'search',
})
</script>
