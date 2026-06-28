<template>
  <div class="profile-edit-page">
    <van-nav-bar title="编辑资料" left-arrow fixed placeholder @click-left="goBack" />

    <van-form @submit="onSubmit" class="edit-form">
      <van-cell-group inset>
        <van-field
          v-model="form.nickname"
          name="nickname"
          label="昵称"
          placeholder="请输入昵称"
          maxlength="20"
        />
        <van-field name="gender" label="性别">
          <template #input>
            <van-radio-group v-model="form.gender" direction="horizontal" class="gender-group">
              <van-radio :name="0">保密</van-radio>
              <van-radio :name="1">男</van-radio>
              <van-radio :name="2">女</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field
          v-model="form.birthday"
          name="birthday"
          label="生日"
          placeholder="请选择生日"
          readonly
          is-link
          @click="showBirthdayPicker = true"
        />
      </van-cell-group>

      <div class="form-submit">
        <van-button round block type="danger" native-type="submit" :loading="saving">
          保存
        </van-button>
      </div>
    </van-form>

    <!-- 生日选择器 -->
    <van-popup v-model:show="showBirthdayPicker" position="bottom" round>
      <van-date-picker
        v-model="birthdayPickerValue"
        title="选择生日"
        :min-date="new Date(1950, 0, 1)"
        :max-date="new Date()"
        @confirm="onBirthdayConfirm"
        @cancel="showBirthdayPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const showBirthdayPicker = ref(false)
const birthdayPickerValue = ref([String(new Date().getFullYear()), '01', '01'])

const form = reactive({
  nickname: '',
  gender: 0,
  birthday: '',
})

function onBirthdayConfirm(val: { selectedValues: string[] }) {
  const [year, month, day] = val.selectedValues
  form.birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  showBirthdayPicker.value = false
}

async function onSubmit() {
  saving.value = true
  try {
    await authStore.updateProfile({
      nickname: form.nickname,
      gender: form.gender,
      birthday: form.birthday || undefined,
    })
    showToast('保存成功')
    router.back()
  } catch {
    // 错误已处理
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  const m = authStore.member
  if (m) {
    form.nickname = m.nickname || ''
    form.gender = m.gender || 0
    form.birthday = m.birthday ? m.birthday.slice(0, 10) : ''
  }
})
</script>

<style scoped>
.profile-edit-page {
  height: 100vh; overflow-y: auto;
  background: #f7f8fa;
}
.edit-form {
  margin-top: 12px;
}
.gender-group {
  display: flex;
  gap: 16px;
}
.form-submit {
  margin: 24px 16px;
}
</style>
