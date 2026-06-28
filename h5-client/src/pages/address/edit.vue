<template>
  <div class="address-edit-page">
    <van-nav-bar :title="isEdit ? '编辑地址' : '新增地址'" left-arrow fixed placeholder @click-left="goBack" />

    <van-form @submit="onSubmit" class="address-form">
      <van-cell-group inset>
        <van-field
          v-model="form.consignee"
          name="consignee"
          label="收货人"
          placeholder="请输入收货人姓名"
          :rules="[{ required: true, message: '请输入收货人' }]"
        />
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
          v-model="areaText"
          is-link
          readonly
          label="所在地区"
          placeholder="请选择省市区"
          :rules="[{ required: true, message: '请选择地区' }]"
          @click="showArea = true"
        />
        <van-field
          v-model="form.detail"
          name="detail"
          label="详细地址"
          placeholder="街道、门牌号等"
          type="textarea"
          rows="2"
          :rules="[{ required: true, message: '请输入详细地址' }]"
        />
      </van-cell-group>

      <div class="default-switch">
        <span>设为默认地址</span>
        <van-switch v-model="isDefault" />
      </div>

      <div class="form-submit">
        <van-button round block type="danger" native-type="submit" :loading="submitting">
          保存
        </van-button>
      </div>
    </van-form>

    <!-- 地区选择器 -->
    <van-popup v-model:show="showArea" position="bottom" round>
      <van-area
        :area-list="areaList"
        title="选择地区"
        @confirm="onAreaConfirm"
        @cancel="showArea = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useAddressStore } from '@/stores/address'
import { areaList } from '@vant/area-data'

const router = useRouter()
const route = useRoute()
const addressStore = useAddressStore()

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const showArea = ref(false)
const isDefault = ref(false)

const form = reactive({
  consignee: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
})

const areaText = ref('')

function onAreaConfirm(val: { selectedOptions: Array<{ text: string; value: string }> }) {
  const [province, city, district] = val.selectedOptions
  form.province = province.text
  form.city = city.text
  form.district = district?.text || ''
  areaText.value = `${province.text} ${city.text} ${district?.text || ''}`
  showArea.value = false
}

async function onSubmit() {
  submitting.value = true
  try {
    const data = {
      consignee: form.consignee,
      phone: form.phone,
      province: form.province,
      city: form.city,
      district: form.district,
      detail: form.detail,
      isDefault: isDefault.value,
    }

    if (isEdit.value) {
      const id = parseInt(route.params.id as string)
      await addressStore.updateAddress(id, data)
    } else {
      await addressStore.createAddress(data)
    }

    showToast(isEdit.value ? '已更新' : '已添加')
    router.back()
  } catch {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(async () => {
  await addressStore.fetchAddresses()

  if (isEdit.value) {
    const id = parseInt(route.params.id as string)
    const addr = addressStore.addresses.find((a) => a.id === id)
    if (addr) {
      form.consignee = addr.consignee
      form.phone = addr.phone
      form.province = addr.province
      form.city = addr.city
      form.district = addr.district
      form.detail = addr.detail
      areaText.value = `${addr.province} ${addr.city} ${addr.district}`
      isDefault.value = addr.isDefault === 1
    }
  }
})
</script>

<style scoped>
.address-edit-page {
  height: 100vh; overflow-y: auto;
  background: #f7f8fa;
}
.address-form {
  margin-top: 12px;
}
.default-switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-top: 12px;
  background: #fff;
  font-size: 14px;
}
.form-submit {
  margin: 24px 16px;
}
</style>
