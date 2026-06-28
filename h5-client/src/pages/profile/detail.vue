<template>
  <div class="profile-detail-page">
    <van-nav-bar title="个人信息" left-arrow fixed placeholder @click-left="goBack" />

    <!-- 头像 -->
    <div class="avatar-section">
      <van-image round width="72" height="72" fit="cover" :src="member?.avatar || defaultAvatar" />
    </div>

    <!-- 信息列表 -->
    <van-cell-group inset>
      <van-cell title="昵称" :value="member?.nickname || '-'" />
      <van-cell title="手机号" :value="maskPhone(member?.phone || '')" />
      <van-cell title="性别" :value="genderLabel(member?.gender)" />
      <van-cell title="生日" :value="member?.birthday ? member.birthday.slice(0, 10) : '-'" />
    </van-cell-group>

    <!-- 编辑按钮 -->
    <div class="edit-btn-area">
      <van-button round block type="danger" @click="goEdit">编辑资料</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const member = computed(() => authStore.member)

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIHJ4PSI2MCIgZmlsbD0iI2YwZjBmMCIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjZGRkIi8+PHBhdGggZD0iTTIwIDk1YzAtMjIuMDkxIDE3LjkwOS00MCA0MC00MHM0MCAxNy45MDkgNDAgNDAiIGZpbGw9IiNkZGQiLz48L3N2Zz4='

function genderLabel(g?: number): string {
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '保密'
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

function goEdit() {
  router.push('/profile/edit')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.profile-detail-page {
  height: 100vh;
  overflow-y: auto;
  background: #f7f8fa;
}

/* 头像区 */
.avatar-section {
  display: flex;
  justify-content: center;
  padding: 24px 0 20px;
}

/* 编辑按钮 */
.edit-btn-area {
  margin: 24px 16px;
}
</style>
