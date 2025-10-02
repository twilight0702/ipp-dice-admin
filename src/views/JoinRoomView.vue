<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RoomManagementView from './RoomManagementView.vue'
import { getRoomInfo } from '@/api/room'
import { getRoomList, type RoomInfoVO } from '@/api/room'

const router = useRouter()
const route = useRoute()

const roomId = ref<string>('')
const isFromQRCode = ref(false)
const showRoomManagement = ref(false)
const isLoading = ref(false)
const roomList = shallowRef<RoomInfoVO[]>([])
const pollingTimer = ref<number | null>(null)
const lastRoomListHash = ref<string>('')

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
  
  // 获取房间列表并启动轮询
  fetchRoomList()
  startPolling()
})

onUnmounted(() => {
  // 组件销毁时停止轮询
  stopPolling()
})

// 监听showRoomManagement变化，控制轮询的启停
watch(showRoomManagement, (newVal) => {
  if (newVal) {
    // 进入房间管理界面，停止轮询
    stopPolling()
  } else {
    // 回到加入房间界面，重新启动轮询
    startPolling()
  }
})

const goBack = () => {
  router.push('/')
}

const joinRoom = async (id?: string) => {
  // 防止重复点击
  if (isLoading.value) {
    console.log('防止重复点击，直接返回')
    return
  }
  
  if (id) {
    roomId.value = id
  }
  
  if (!roomId.value.trim()) {
    alert('请输入房间ID')
    return
  }

  console.log('开始请求房间信息，房间ID:', roomId.value)
  isLoading.value = true
  try {
    // 调用API获取房间详情
    const response = await getRoomInfo(roomId.value)
    console.log('房间信息请求成功，响应数据:', response)
    
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
    console.error('加入房间失败:', error)
    alert(errorMessage)
  } finally {
    isLoading.value = false
    console.log('请求处理完成')
  }
}

const fetchRoomList = async () => {
  try {
    const response = await getRoomList()
    if (response.data && response.data.roomInfoVOS) {
      // 计算数据哈希值以判断是否需要更新
      const newHash = JSON.stringify(response.data.roomInfoVOS)
      if (newHash !== lastRoomListHash.value) {
        roomList.value = response.data.roomInfoVOS
        lastRoomListHash.value = newHash
      }
    }
  } catch (error) {
    console.error('获取房间列表失败:', error)
  }
}

const startPolling = () => {
  // 确保不会重复启动轮询
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
  }
  
  // 启动轮询，每5秒获取一次房间列表
  pollingTimer.value = window.setInterval(() => {
    fetchRoomList()
  }, 5000)
}

const stopPolling = () => {
  // 停止轮询
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getRoomStatus = (isOpen: number) => {
  return isOpen === 1 ? '开启' : '关闭'
}

const getRoomStatusClass = (isOpen: number) => {
  return isOpen === 1 ? 'status-open' : 'status-closed'
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
            @click="joinRoom()" 
            class="btn btn-primary btn-full-width"
            :disabled="!roomId.trim() || isLoading"
          >
            <span v-if="isLoading" class="loading-spinner"></span>
            <span class="btn-icon">🚀</span>
            {{ isLoading ? '加入中...' : '加入房间' }}
          </button>
        </div>
      </div>
      
      <!-- 房间列表 -->
      <div class="room-list-container">
        <h2 class="section-title">🎲 当前房间列表</h2>
        <div class="table-container">
          <div class="info-card room-table-wrapper">
            <table class="room-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>过期时间</th>
                  <th>轮次</th>
                  <th>是否开启</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="room in roomList" :key="room.id">
                  <td>{{ room.name }}</td>
                  <td>{{ room.expireTime }}</td>
                  <td>{{ room.round }}</td>
                  <td>
                    <span :class="['status-badge', getRoomStatusClass(room.isOpen)]">
                      {{ getRoomStatus(room.isOpen) }}
                    </span>
                  </td>
                  <td>{{ formatDateTime(room.createTime) }}</td>
                  <td>
                    <!-- 添加.stop.prevent修饰符防止事件冒泡和默认行为 -->
                    <button @click.stop.prevent="joinRoom(room.id.toString())" class="btn btn-secondary">
                      进入
                    </button>
                  </td>
                </tr>
                <tr v-if="roomList.length === 0">
                  <td colspan="6" class="no-data">暂无房间数据</td>
                </tr>
              </tbody>
            </table>
          </div>
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
.room-list-container {
  margin-top: 30px;
  width: 100%;
}

.section-title {
  text-align: center;
  margin-bottom: 20px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 1.5rem;
}

.table-container {
  overflow-x: auto;
}

.room-table-wrapper {
  background: rgba(255, 255, 255, 0.95);
  padding: 0;
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: none; /* 移除过渡效果 */
}

.room-table-wrapper:hover {
  transform: none; /* 确保没有悬停时的变换效果 */
}

.room-table {
  width: 100%;
  border-collapse: collapse;
}

.room-table th,
.room-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

.room-table th {
  background-color: var(--bg-light);
  font-weight: bold;
  color: var(--text-primary);
  position: sticky;
  top: 0;
}

.room-table tbody tr:last-child td {
  border-bottom: none;
}

.room-table tbody tr:hover {
  background-color: var(--primary-light);
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-style: italic;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-round);
  font-size: var(--font-xs);
  font-weight: 500;
}

.status-open {
  background-color: var(--success-light);
  color: var(--success-color);
}

.status-closed {
  background-color: var(--error-light);
  color: var(--error-color);
}

/* 使用公共CSS中的按钮样式 */
.btn-secondary {
  padding: 6px 12px;
  background: var(--bg-glass);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-medium);
  cursor: pointer;
  font-size: var(--font-sm);
  font-weight: 600;
  transition: var(--transition-fast);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--primary-light);
  transform: translateY(-2px);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .room-table {
    font-size: var(--font-xs);
  }
  
  .room-table th,
  .room-table td {
    padding: 8px 10px;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
}
</style>