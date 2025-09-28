<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const roomId = ref<string>('')
const isFromQRCode = ref(false)

onMounted(() => {
  // 检查URL参数中是否有房间ID
  const urlRoomId = route.query.roomId as string
  if (urlRoomId) {
    roomId.value = urlRoomId
    isFromQRCode.value = true
  }
})

const goBack = () => {
  router.push('/')
}

const joinRoom = () => {
  if (roomId.value.trim()) {
    // 这里可以添加加入房间的逻辑
    alert(`正在加入房间 ID: ${roomId.value}`)
  } else {
    alert('请输入房间ID')
  }
}
</script>

<template>
  <div class="page-container">
    <div class="content">
      <div class="page-header">
        <button class="back-button" @click="goBack">
          <span class="back-icon">←</span>
          返回首页
        </button>
        <h1 class="page-title">🚪 进入房间</h1>
        <p class="page-description" v-if="!isFromQRCode">在这里你可以加入已存在的骰子房间</p>
        <p class="page-description" v-else>🎯 扫码成功！请确认加入房间</p>
      </div>
      
      <div class="form-container">
        <div class="form-card">
          <div class="form-group">
            <label for="roomId" class="form-label">
              <span class="label-icon">🎲</span>
              房间ID
            </label>
            <input
              id="roomId"
              v-model="roomId"
              type="text"
              class="form-input"
              placeholder="请输入房间ID"
              :readonly="isFromQRCode"
            />
          </div>
          
          <div v-if="isFromQRCode" class="qr-info">
            <div class="qr-success-icon">✅</div>
            <p>通过二维码扫描获取房间信息</p>
          </div>
          
          <button 
            @click="joinRoom" 
            class="btn btn-primary btn-full-width"
            :disabled="!roomId.trim()"
          >
            <span class="btn-icon">🚀</span>
            加入房间
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 无需额外样式，全部使用公共CSS */
</style>