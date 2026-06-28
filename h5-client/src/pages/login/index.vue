<template>
  <div class="login-page">
    <div class="login-header">
      <h1>欢迎回来</h1>
      <p>登录您的账号</p>
    </div>
    <van-form @submit="onLogin" class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="form.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
          ]"
        />
        <van-field
          v-model="form.password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          type="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>
      <div class="login-submit">
        <van-button round block type="danger" native-type="submit" :loading="authStore.loading">
          登录
        </van-button>
      </div>
    </van-form>
    <div class="login-footer">
      还没有账号？<router-link to="/register">立即注册</router-link>
    </div>
    <div class="login-home">
      <router-link to="/">回到首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  phone: '',
  password: '',
})

async function onLogin() {
  try {
    await authStore.login({ phone: form.phone, password: form.password })
    showToast('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch {
    // 错误已在 request 拦截器中处理
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  overflow-y: auto;
  padding: 60px 16px 0;
  background: #fff;
  box-sizing: border-box;
}
.login-header {
  text-align: center;
  margin-bottom: 40px;
}
.login-header h1 {
  font-size: 24px;
  margin: 0 0 8px;
}
.login-header p {
  color: #999;
  margin: 0;
  font-size: 14px;
}
.login-form {
  margin-bottom: 24px;
}
.login-submit {
  margin: 24px 16px 0;
}
.login-footer {
  text-align: center;
  font-size: 14px;
  color: #999;
}
.login-footer a {
  color: #ee0a24;
}
.login-home {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
}
.login-home a {
  color: #bbb;
}
</style>
