<template>
  <div class="register-page">
    <div class="register-header">
      <h1>创建账号</h1>
      <p>注册后即可开始购物</p>
    </div>
    <van-form @submit="onRegister">
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
          placeholder="请设置密码（至少6位）"
          type="password"
          :rules="[
            { required: true, message: '请设置密码' },
            { validator: validatePassword, message: '密码长度不能少于6位' },
          ]"
        />
        <van-field
          v-model="form.confirmPassword"
          name="confirmPassword"
          label="确认密码"
          placeholder="请再次输入密码"
          type="password"
          :rules="[
            { required: true, message: '请确认密码' },
            { validator: validateConfirmPassword, message: '两次密码不一致' },
          ]"
        />
      </van-cell-group>
      <div class="register-submit">
        <van-button round block type="danger" native-type="submit" :loading="authStore.loading">
          注册
        </van-button>
      </div>
    </van-form>
    <div class="register-footer">
      已有账号？<router-link to="/login">立即登录</router-link>
    </div>
    <div class="home-link">
      <router-link to="/">回到首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  phone: '',
  password: '',
  confirmPassword: '',
})

function validatePassword(val: string) {
  return val.length >= 6
}

function validateConfirmPassword(val: string) {
  return val === form.password
}

async function onRegister() {
  try {
    await authStore.register({ phone: form.phone, password: form.password })
    showToast('注册成功')
    router.replace('/')
  } catch {
    // 错误已在 request 拦截器中处理
  }
}
</script>

<style scoped>
.register-page {
  height: 100vh;
  overflow-y: auto;
  padding: 60px 16px 0;
  background: #fff;
  box-sizing: border-box;
}
.register-header {
  text-align: center;
  margin-bottom: 40px;
}
.register-header h1 {
  font-size: 24px;
  margin: 0 0 8px;
}
.register-header p {
  color: #999;
  margin: 0;
  font-size: 14px;
}
.register-submit {
  margin: 24px 16px 0;
}
.register-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #999;
}
.register-footer a {
  color: #ee0a24;
}
.home-link {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
}
.home-link a {
  color: #bbb;
}
</style>
