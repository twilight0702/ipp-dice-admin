<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RoomManagementView from './RoomManagementView.vue'
import { getRoomInfo } from '@/api/room'

const router = useRouter()
const route = useRoute()

const roomId = ref<string>('')
const isFromQRCode = ref(false)
const showRoomManagement = ref(false)
const isLoading = ref(false)

// 房间信息
const roomInfo = ref({
  name: '',
  ttl: 0,
  round: 0
})

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

const joinRoom = async () => {
  if (!roomId.value.trim()) {
    alert('请输入房间ID')
    return
  }

  isLoading.value = true
  try {
    // 调用API获取房间详情
    const response = await getRoomInfo(roomId.value)
    
    // 保存房间信息
    if (response.data) {
      roomInfo.value.name = response.data.name
      roomInfo.value.ttl = response.data.ttl
      roomInfo.value.round = response.data.round
      
      // 显示房间管理界面
      showRoomManagement.value = true
    }
  } catch (error) {
    // 处理错误，特别是房间不存在的情况
    const errorMessage = error instanceof Error ? error.message : '加入房间失败'
    alert(errorMessage)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div v-if="!showRoomManagement" class="content">
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
            :disabled="!roomId.trim() || isLoading"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            <span class="btn-icon">🚀</span>
            {{ isLoading ? '加入中...' : '加入房间' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 房间管理界面 -->
    <RoomManagementView 
      v-else
      :room-id="roomId"
      :room-name="roomInfo.name"
      :ttl="roomInfo.ttl"
      :round="roomInfo.round"
    />
  </div>
</template>

<style scoped>
/* 无需额外样式，全部使用公共CSS */
</style>