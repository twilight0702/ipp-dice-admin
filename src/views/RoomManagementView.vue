<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { updateRoomRound, getRoomRank, openRoom, closeRoom, getRoomInfoVO } from '@/api/room'

// 定义组件属性
const props = defineProps<{
  roomId: string
  roomName: string
  ttl: number
  round: number
}>()

const router = useRouter()

// 房间信息
const roomInfo = reactive({
  roomId: props.roomId,
  name: props.roomName,
  ttl: props.ttl,
  round: props.round,
  qrCodeUrl: '',
  qrCodeImage: '',
  isOpen: 1, // 默认房间是开启的
})

// 轮数修改
const newRound = ref(props.round)
const isUpdatingRound = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 排行榜相关
const rankRoleType = ref(1) // 默认按最高分
const rankData = ref<any[]>([])
const loadingRank = ref(false)
const isRankVisible = ref(false) // 默认不显示排行榜

// 房间开关状态
const isRoomOpen = ref(true)
const isTogglingRoom = ref(false)

// 轮询相关
const rankPollingTimer = ref<number | null>(null)
const POLLING_INTERVAL = 5000 // 5秒轮询一次

// 排行榜容器引用
const rankContainer = ref<HTMLElement | null>(null)
const rankContent = ref<HTMLElement | null>(null)
const rankCover = ref<HTMLElement | null>(null)

// 生成二维码（模拟）
const generateQRCode = (url: string): Promise<string> => {
  // 使用qrcode库生成二维码
  return new Promise<string>((resolve, reject) => {
    import('qrcode')
      .then(({ default: QRCode }) => {
        QRCode.toDataURL(url, { width: 256, margin: 2 }).then(resolve).catch(reject)
      })
      .catch(reject)
  })
}

// 初始化二维码
onMounted(async () => {
  try {
    // 获取房间详细信息（包括isOpen状态）
    const roomInfoResponse = await getRoomInfoVO(roomInfo.roomId)
    if (roomInfoResponse.data) {
      roomInfo.isOpen = roomInfoResponse.data.isOpen
      isRoomOpen.value = roomInfoResponse.data.isOpen === 1
    }

    if (import.meta.env.DEV) {
      // 开发环境，生成完整的URL指向另一个前端应用的开发服务器
      roomInfo.qrCodeUrl = `http://localhost:5173/?roomId=${roomInfo.roomId}`
    } else {
      // 生产环境，生成完整的URL指向同服务器下的/frontend/路径
      const baseUrl = window.location.origin
      const basePath = window.location.pathname.split('/').slice(0, -2).join('/')
      roomInfo.qrCodeUrl = `${baseUrl}${basePath}/frontend/?roomId=${roomInfo.roomId}`
    }
    roomInfo.qrCodeImage = await generateQRCode(roomInfo.qrCodeUrl)

    // 不再在初始化时获取排行榜，只有在可见时才获取
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
})

// 组件销毁时清除定时器
onUnmounted(() => {
  stopRankPolling()
})

// 监听排行榜可见性变化
watch(isRankVisible, async (newVal) => {
  if (newVal) {
    // 如果变为可见，开始轮询（仅在房间开启时）
    if (isRoomOpen.value) {
      await fetchRankData()
      startRankPolling()
    }
  } else {
    // 如果变为不可见，停止轮询
    stopRankPolling()
  }
})

// 监听排行榜类型变化
watch(rankRoleType, async (newVal, oldVal) => {
  if (oldVal !== undefined && isRankVisible.value) { // 避免初始化时的触发，并确保可见
    // 仅在房间开启时刷新数据
    if (isRoomOpen.value) {
      await fetchRankData()
    }
  }
})

// 获取排行榜数据
const fetchRankData = async () => {
  if (!isRankVisible.value) return // 如果不可见，不获取数据
  if (!isRoomOpen.value) return // 如果房间关闭，不获取数据

  try {
    const response = await getRoomRank(roomInfo.roomId, rankRoleType.value)
    // 使用更平滑的更新方式，避免整个列表重新渲染
    updateRankDataSmoothly(response.data.playerRecords)
  } catch (error) {
    console.error('获取排行榜失败:', error)
    // 出错时不清空列表，保持现有数据
  }
}

// 平滑更新排行榜数据，避免页面闪烁
const updateRankDataSmoothly = (newData: any[]) => {
  // 检查数据是否发生变化
  if (JSON.stringify(rankData.value) !== JSON.stringify(newData)) {
    rankData.value = newData
  }
}

// 启动排行榜轮询
const startRankPolling = () => {
  // 先清除已存在的定时器
  stopRankPolling()

  // 仅在房间开启时设置新的定时器
  if (isRoomOpen.value) {
    rankPollingTimer.value = window.setInterval(async () => {
      await fetchRankData()
    }, POLLING_INTERVAL)
  }
}

// 停止排行榜轮询
const stopRankPolling = () => {
  if (rankPollingTimer.value) {
    window.clearInterval(rankPollingTimer.value)
    rankPollingTimer.value = null
  }
}

// 切换排行榜可见性
const toggleRankVisibility = () => {
  isRankVisible.value = !isRankVisible.value
}

// 处理进入动画
const onEnter = (element: Element) => {
  const el = element as HTMLElement;
  if (rankContainer.value) {
    // 获取元素的自然高度
    const height = el.scrollHeight;
    // 设置容器高度为0开始动画
    rankContainer.value.style.height = '0';

    // 在下一帧设置目标高度
    requestAnimationFrame(() => {
      rankContainer.value!.style.height = `${height}px`;
    });

    // 动画结束后清除高度样式，让其自适应
    setTimeout(() => {
      if (rankContainer.value) {
        rankContainer.value.style.height = '';
      }
    }, 300);
  }
};

// 处理离开动画
const onLeave = (element: Element) => {
  const el = element as HTMLElement;
  if (rankContainer.value) {
    // 获取元素的自然高度
    const height = el.scrollHeight;
    // 设置容器高度为当前高度
    rankContainer.value.style.height = `${height}px`;

    // 在下一帧设置高度为0
    requestAnimationFrame(() => {
      rankContainer.value!.style.height = '0';
    });
  }
};

// 修改轮数
const updateRound = async () => {
  if (newRound.value <= 0) {
    errorMessage.value = '轮数必须大于0'
    return
  }

  if (newRound.value > 100) {
    errorMessage.value = '轮数不能超过100'
    return
  }

  isUpdatingRound.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 调用API更新轮数
    await updateRoomRound(roomInfo.roomId, newRound.value)

    // 更新本地状态
    roomInfo.round = newRound.value
    successMessage.value = '轮数更新成功！'

    // 清除成功消息
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '更新轮数失败，请重试'
  } finally {
    isUpdatingRound.value = false
  }
}

// 开启/关闭房间
const toggleRoomStatus = async () => {
  isTogglingRoom.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (isRoomOpen.value) {
      // 关闭房间
      await closeRoom(roomInfo.roomId)
      isRoomOpen.value = false
      roomInfo.isOpen = 0
      successMessage.value = '房间已关闭！'

      // 如果房间关闭了，停止轮询
      stopRankPolling()
    } else {
      // 开启房间
      await openRoom(roomInfo.roomId)
      isRoomOpen.value = true
      roomInfo.isOpen = 1
      successMessage.value = '房间已开启！'

      // 如果排行榜可见，重新开始轮询
      if (isRankVisible.value) {
        await fetchRankData()
        startRankPolling()
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : (isRoomOpen.value ? '关闭房间失败，请重试' : '开启房间失败，请重试')
    // 恢复原来的状态
    isRoomOpen.value = !isRoomOpen.value
  } finally {
    isTogglingRoom.value = false

    // 清除消息
    setTimeout(() => {
      successMessage.value = ''
      errorMessage.value = ''
    }, 3000)
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 重新创建房间
const createNewRoom = () => {
  router.push('/create-room')
}
</script>

<template>
  <div class="content">
    <div class="page-header">
      <h1 class="page-title">🎲 房间管理</h1>
      <p class="page-description">房间信息和邀请码</p>
    </div>

    <div class="room-info-container">
      <!-- 左侧区域 -->
      <div class="left-column">
        <!-- 二维码展示 -->
        <div class="info-card">
          <h3 class="card-title">📱 房间邀请码</h3>
          <div class="qr-code-wrapper">
            <img
              v-if="roomInfo.qrCodeImage"
              :src="roomInfo.qrCodeImage"
              alt="房间二维码"
              class="qr-code-image"
            />
            <p class="qr-code-text">扫码加入房间</p>
            <a
              :href="roomInfo.qrCodeUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary"
            >
              <span class="btn-icon">🔗</span>
              点击打开加入房间页面
            </a>
          </div>
        </div>

        <!-- 房间基本信息 -->
        <div class="info-card">
          <h3 class="card-title">📋 房间信息</h3>
          <div class="info-item">
            <span class="info-label">房间ID:</span>
            <span class="info-value">{{ roomInfo.roomId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">房间名称:</span>
            <span class="info-value">{{ roomInfo.name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前轮数:</span>
            <span class="info-value">{{ roomInfo.round }} 轮</span>
          </div>
          <div class="info-item">
            <span class="info-label">房间状态:</span>
            <span class="info-value" :class="{ 'status-open': isRoomOpen, 'status-closed': !isRoomOpen }">
              {{ isRoomOpen ? '开启中' : '已关闭' }}
            </span>
          </div>
        </div>

        <!-- 轮数修改 -->
        <div class="info-card">
          <h3 class="card-title">⚙️ 修改轮数</h3>
          <div class="round-update-form">
            <input
              v-model.number="newRound"
              type="number"
              class="form-input"
              placeholder="新轮数"
              min="1"
              max="100"
            />
            <button @click="updateRound" class="btn btn-primary" :disabled="isUpdatingRound || !isRoomOpen">
              <span v-if="isUpdatingRound" class="loading-spinner"></span>
              <span class="btn-icon">🔄</span>
              {{ isUpdatingRound ? '更新中...' : '更新轮数' }}
            </button>
          </div>
        </div>

        <!-- 房间开关 -->
        <div class="info-card">
          <h3 class="card-title">🚪 房间开关</h3>
          <div class="room-toggle-form">
            <button
              @click="toggleRoomStatus"
              class="btn"
              :class="isRoomOpen ? 'btn-warning' : 'btn-success'"
              :disabled="isTogglingRoom"
            >
              <span v-if="isTogglingRoom" class="loading-spinner"></span>
              <span class="btn-icon">{{ isRoomOpen ? '🔒' : '🔓' }}</span>
              {{ isTogglingRoom ? (isRoomOpen ? '关闭中...' : '开启中...') : (isRoomOpen ? '关闭房间' : '开启房间') }}
            </button>
            <p class="room-status-tip">
              {{ isRoomOpen ? '房间当前处于开启状态，玩家可以加入游戏' : '房间当前处于关闭状态，玩家无法加入游戏' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧区域 - 排行榜 -->
      <div class="right-column">
        <div class="info-card">
          <div class="rank-header">
            <div class="rank-title-container">
              <h3 class="card-title">🏆 排行榜</h3>
              <!-- 滑块开关 -->
              <div class="switch-container">
                <label class="switch">
                  <input type="checkbox" v-model="isRankVisible">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 排行榜内容区域 -->
          <div class="rank-container" ref="rankContainer">
            <transition
              name="smooth"
              mode="out-in"
              @enter="onEnter"
              @leave="onLeave"
            >
              <div v-if="isRankVisible" class="rank-content" ref="rankContent" key="rank-content">
                <!-- 排行榜类型选择 -->
                <div class="rank-type-selector">
                  <label class="radio-item">
                    <input
                      type="radio"
                      v-model="rankRoleType"
                      :value="1"
                      name="rankType"
                    />
                    <span class="radio-label">按最高分</span>
                  </label>
                  <label class="radio-item">
                    <input
                      type="radio"
                      v-model="rankRoleType"
                      :value="2"
                      name="rankType"
                    />
                    <span class="radio-label">按最后一次</span>
                  </label>
                  <label class="radio-item">
                    <input
                      type="radio"
                      v-model="rankRoleType"
                      :value="3"
                      name="rankType"
                    />
                    <span class="radio-label">按总分</span>
                  </label>
                </div>

                <!-- 排行榜列表 -->
                <div class="rank-list" v-if="!loadingRank && rankData.length > 0">
                  <div
                    v-for="(player, index) in rankData"
                    :key="player.playerId"
                    class="rank-item"
                    :class="{ 'rank-first': index === 0, 'rank-second': index === 1, 'rank-third': index === 2 }"
                  >
                    <div class="rank-position">{{ index + 1 }}</div>
                    <div class="player-info">
                      <div class="player-name">{{ player.name }}</div>
                    </div>
                    <div class="player-score">{{ player.score }}</div>
                    <!-- 按总分(值为3)时不显示结果 -->
                    <div class="player-outcome" v-if="rankRoleType !== 3">
                      {{ player.diceOutcome }}
                    </div>
                  </div>
                </div>

                <!-- 加载状态 -->
                <div class="rank-loading" v-if="loadingRank">
                  <p>加载中...</p>
                </div>

                <!-- 空状态 -->
                <div class="rank-empty" v-if="!loadingRank && rankData.length === 0">
                  <p>暂无排行数据</p>
                </div>
              </div>

              <!-- 遮盖状态提示 -->
              <div v-else class="rank-cover" ref="rankCover" key="rank-cover">
                <p v-if="isRoomOpen">排行榜已被隐藏</p>
                <p v-else>房间已关闭，无法查看排行榜</p>
                <p v-if="isRoomOpen">切换开关查看排行榜</p>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="createNewRoom" class="btn btn-secondary">
          <span class="btn-icon">➕</span>
          创建新房间
        </button>
        <button @click="goHome" class="btn btn-primary">
          <span class="btn-icon">🏠</span>
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 房间信息容器布局 */
.room-info-container {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 修改为1:1的比例，使右侧区域更宽 */
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
}

/* 左右列布局 */
.left-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

/* 排行榜类型选择器 */
.rank-type-selector {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.radio-item input[type="radio"] {
  accent-color: var(--primary-color);
}

.radio-label {
  font-size: 0.9rem;
}

/* 排行榜列表 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  /* 添加过渡效果，减少闪烁感 */
  transition: opacity 0.3s ease;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-secondary);
  transition: all 0.2s ease;
  /* 添加唯一key的标识，帮助Vue优化渲染 */
  transform: translateZ(0); /* 触发硬件加速 */
}

.rank-item:hover {
  background-color: var(--bg-hover);
}

.rank-first {
  background-color: #fff9e6;
  border-left: 4px solid #ffd700;
}

.rank-second {
  background-color: #f0f8ff;
  border-left: 4px solid #c0c0c0;
}

.rank-third {
  background-color: #fff5ee;
  border-left: 4px solid #cd7f32;
}

.rank-position {
  font-weight: bold;
  width: 24px;
  text-align: center;
}

.player-info {
  flex: 1;
  margin-left: var(--spacing-md);
}

.player-name {
  font-weight: 500;
}

.player-score {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--primary-color);
  min-width: 50px;
  text-align: right;
}

.player-outcome {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background-color: var(--bg-hover);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: var(--spacing-sm);
  white-space: nowrap;
}

.rank-loading,
.rank-empty {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

/* 排行榜容器 */
.rank-container {
  position: relative;
  overflow: hidden;
  transition: height 0.3s ease;
}

.rank-content,
.rank-cover {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.rank-cover {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
  background-color: var(--bg-hover);
  border-radius: var(--border-radius-md);
}

/* 平滑过渡动画 */
.smooth-enter-active,
.smooth-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.smooth-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.smooth-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: var(--bg-hover);
}

/* 滑动动画 */
.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-leave-active {
  transition: all 0.3s ease-in;
}

.slide-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 轮数修改表单 */
.round-update-form {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.round-update-form .form-input {
  flex: 1;
}

/* 房间开关表单 */
.room-toggle-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.room-status-tip {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 操作按钮布局 */
.action-buttons {
  grid-column: 1 / -1;
  display: flex;
  gap: var(--spacing-lg);
  justify-content: center;
  margin-top: var(--spacing-xl);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .room-info-container {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;
  }

  .action-buttons .btn {
    width: 100%;
    max-width: 300px;
  }

  .rank-type-selector {
    justify-content: center;
  }
}

/* 排行榜头部 */
.rank-header {
  margin-bottom: var(--spacing-lg);
}

.rank-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-header .card-title {
  margin: 0;
}

/* 滑块开关样式 */
.switch-container {
  display: flex;
  align-items: center;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* 移除滑块过渡效果，实现瞬时切换 */
input:checked + .slider:before {
  transform: translateX(26px);
  transition: none; /* 瞬时切换，不使用过渡动画 */
}

/* 房间状态样式 */
.status-open {
  color: #28a745;
  font-weight: bold;
}

.status-closed {
  color: #dc3545;
  font-weight: bold;
}

/* 警告按钮样式 */
.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e0a800;
  border-color: #d39e00;
}

.btn-warning:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 成功按钮样式 */
.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
}

.btn-success:hover:not(:disabled) {
  background-color: #218838;
  border-color: #1e7e34;
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
