<template>
  <div class="test-container">
    <h1>PrimeVue 组件测试</h1>
    
    <!-- 按钮测试 -->
    <div class="test-section">
      <h2>按钮组件</h2>
      <Button label="Primary Button" />
      <Button label="Secondary" severity="secondary" />
      <Button label="Success" severity="success" />
      <Button label="Info" severity="info" />
      <Button label="Warning" severity="warning" />
      <Button label="Help" severity="help" />
      <Button label="Danger" severity="danger" />
    </div>

    <!-- 输入框测试 -->
    <div class="test-section">
      <h2>输入框组件</h2>
      <InputText v-model="testInput" placeholder="请输入文本" />
      <p>输入的内容: {{ testInput }}</p>
    </div>

    <!-- 下拉框测试 -->
    <div class="test-section">
      <h2>下拉框组件</h2>
      <Dropdown 
        v-model="selectedCity" 
        :options="cities" 
        optionLabel="name" 
        placeholder="选择城市" 
      />
      <p>选择的城市: {{ selectedCity?.name }}</p>
    </div>

    <!-- 消息提示测试 -->
    <div class="test-section">
      <h2>消息提示</h2>
      <Button label="显示成功消息" @click="showSuccess" />
      <Button label="显示错误消息" @click="showError" severity="danger" />
    </div>

    <!-- 图标测试 -->
    <div class="test-section">
      <h2>图标测试</h2>
      <i class="pi pi-check" style="font-size: 2rem; color: green;"></i>
      <i class="pi pi-times" style="font-size: 2rem; color: red;"></i>
      <i class="pi pi-star" style="font-size: 2rem; color: gold;"></i>
      <i class="pi pi-heart" style="font-size: 2rem; color: pink;"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const testInput = ref('')
const selectedCity = ref()

const cities = ref([
  { name: '北京', code: 'BJ' },
  { name: '上海', code: 'SH' },
  { name: '广州', code: 'GZ' },
  { name: '深圳', code: 'SZ' }
])

const showSuccess = () => {
  toast.add({
    severity: 'success',
    summary: '成功',
    detail: '这是一个成功消息',
    life: 3000
  })
}

const showError = () => {
  toast.add({
    severity: 'error',
    summary: '错误',
    detail: '这是一个错误消息',
    life: 3000
  })
}
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.test-section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.test-section h2 {
  margin-top: 0;
  color: #333;
}

.test-section > * {
  margin: 0.5rem;
}

.test-section p {
  margin-top: 1rem;
  font-weight: bold;
  color: #666;
}
</style>