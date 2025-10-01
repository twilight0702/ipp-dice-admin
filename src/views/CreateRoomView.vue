<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createRoom, updateRoomRound, type CreateRoomRequest } from '@/api/room'

const router = useRouter()

// 页面状态
const showCreateForm = ref(true)
const showRoomInfo = ref(false)
const isTransitioning = ref(false)

// 表单数据
const formData = reactive<CreateRoomRequest>({
  name: '',
  ttl: 3600, // 默认1小时
  round: 10, // 默认10轮
})

// 房间信息
const roomInfo = reactive({
  roomId: '',
  name: '',
  ttl: 3600,
  round: 10,
  qrCodeUrl: '',
  qrCodeImage: '',
})

// 表单状态
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 轮数修改
const newRound = ref(10)
const isUpdatingRound = ref(false)

// 表单验证规则
const validateForm = (): boolean => {
  errorMessage.value = ''

  if (!formData.name.trim()) {
    errorMessage.value = '请输入房间名称'
    return false
  }

  if (formData.name.length > 50) {
    errorMessage.value = '房间名称不能超过50个字符'
    return false
  }

  if (formData.ttl < 300 || formData.ttl > 86400) {
    errorMessage.value = '房间存活时间必须在5分钟到24小时之间'
    return false
  }

  if (formData.round < 1 || formData.round > 100) {
    errorMessage.value = '游戏轮数必须在1到100之间'
    return false
  }

  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await createRoom(formData)

    // 保存房间信息
    roomInfo.roomId = response.data.roomId
    roomInfo.name = formData.name
    roomInfo.ttl = formData.ttl
    roomInfo.round = formData.round
    newRound.value = formData.round

    // 生成二维码
    if (import.meta.env.DEV) {
      // 开发环境，生成完整的URL指向另一个前端应用的开发服务器
      roomInfo.qrCodeUrl = `/frontend/?roomId=${response.data.roomId}`
    } else {
      // 生产环境，生成完整的URL指向同服务器下的/frontend/路径
      const baseUrl = window.location.origin
      const basePath = window.location.pathname.split('/').slice(0, -2).join('/')
      roomInfo.qrCodeUrl = `${baseUrl}${basePath}/frontend/?roomId=${response.data.roomId}`
    }
    roomInfo.qrCodeImage = await generateQRCode(roomInfo.qrCodeUrl)

    // 开始页面切换动画
    isTransitioning.value = true

    // 表单窗口缓缓消失
    setTimeout(() => {
      showCreateForm.value = false
    }, 100)

    // 房间信息窗口出现
    setTimeout(() => {
      showRoomInfo.value = true
      isTransitioning.value = false
    }, 800)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建房间失败，请重试'
    isLoading.value = false
  }
}

// TTL选项（秒）
const ttlOptions = [
  { label: '5分钟', value: 300 },
  { label: '30分钟', value: 1800 },
  { label: '1小时', value: 3600 },
  { label: '2小时', value: 7200 },
  { label: '6小时', value: 21600 },
  { label: '12小时', value: 43200 },
  { label: '24小时', value: 86400 },
]

// 接收一个url，生成对应的二维码
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

// 返回首页
const goHome = () => {
  router.push('/')
}

// 重新创建房间
const createNewRoom = () => {
  showRoomInfo.value = false
  showCreateForm.value = true

  // 重置表单数据
  formData.name = ''
  formData.ttl = 3600
  formData.round = 10

  // 清除消息
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = false
}
</script>

<template>
  <div class="page-container">
    <!-- 创建房间表单 -->
    <Transition name="fade-out" appear>
      <div v-if="showCreateForm" class="content">
        <div class="page-header">
          <button class="back-button" @click="goHome">
            <span class="back-icon">←</span>
            返回首页
          </button>
          <h1 class="page-title">🎲 创建房间</h1>
          <p class="page-description">填写房间信息，创建一个新的骰子游戏房间</p>
        </div>

        <div class="form-container">
          <div class="form-card">
            <form @submit.prevent="handleSubmit" class="room-form">
              <div class="form-group">
                <label for="roomName" class="form-label">
                  <span class="label-icon">🎲</span>
                  房间名称
                </label>
                <input
                  id="roomName"
                  v-model="formData.name"
                  type="text"
                  class="form-input"
                  placeholder="请输入房间名称"
                  required
                />
              </div>

              <div class="form-group">
                <label for="ttl" class="form-label">
                  <span class="label-icon">⏰</span>
                  房间存活时间
                </label>
                <select id="ttl" v-model="formData.ttl" class="form-input" required>
                  <option v-for="option in ttlOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="round" class="form-label">
                  <span class="label-icon">🔢</span>
                  游戏轮数
                </label>
                <input
                  id="round"
                  v-model.number="formData.round"
                  type="number"
                  class="form-input"
                  placeholder="请输入游戏轮数"
                  min="1"
                  max="100"
                  required
                />
                <small class="form-hint">建议设置为 10 轮</small>
              </div>

              <button type="submit" class="btn btn-primary btn-full-width" :disabled="isLoading">
                <span v-if="isLoading" class="loading-spinner"></span>
                <span class="btn-icon">🚀</span>
                {{ isLoading ? '创建中...' : '创建房间' }}
              </button>
            </form>

            <!-- 错误消息 -->
            <div v-if="errorMessage" class="message error-message">
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 房间信息展示 -->
    <Transition name="fade-in" appear>
      <div v-if="showRoomInfo" class="content">
        <div class="page-header">
          <h1 class="page-title">✅ 房间创建成功</h1>
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
                <span class="info-label">存活时间:</span>
                <span class="info-value">{{ Math.floor(roomInfo.ttl / 60) }} 分钟</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前轮数:</span>
                <span class="info-value">{{ roomInfo.round }} 轮</span>
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
                <button @click="updateRound" class="btn btn-primary" :disabled="isUpdatingRound">
                  <span v-if="isUpdatingRound" class="loading-spinner"></span>
                  <span class="btn-icon">🔄</span>
                  {{ isUpdatingRound ? '更新中...' : '更新轮数' }}
                </button>
              </div>
            </div>

          </div>

          <!-- 右侧区域 - 排行榜 -->
          <div class="right-column">
            <div class="info-card">
              <h3 class="card-title">🏆 排行榜</h3>
              <div class="leaderboard-placeholder">
                <p>排行榜内容区域</p>
                <p>（待实现）</p>
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

          <!-- 消息提示 -->
          <div v-if="errorMessage" class="message error-message">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="message success-message">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>

/* 房间信息容器布局 */
.room-info-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
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

/* 排行榜占位符 */
.leaderboard-placeholder {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
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
}
</style>
