<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createRoom, updateRoomRound, type CreateRoomRequest } from '@/api/room'
import RoomManagementView from './RoomManagementView.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()

// 页面状态
const showCreateForm = ref(true)
const showRoomManagement = ref(false)
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

  // if (formData.ttl < 300 || formData.ttl > 86400) {
  //   errorMessage.value = '房间存活时间必须在5分钟到24小时之间'
  //   return false
  // }

  if (formData.round < 1 || formData.round > 100) {
    errorMessage.value = '游戏轮数必须在1到100之间'
    return false
  }

  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    toast.add({ severity: 'warn', summary: '表单校验', detail: errorMessage.value || '请检查输入', life: 2500 })
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

    // 房间管理窗口出现
    setTimeout(() => {
      showRoomManagement.value = true
      isTransitioning.value = false
    }, 800)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建房间失败，请重试'
    isLoading.value = false
    toast.add({ severity: 'error', summary: '创建失败', detail: errorMessage.value, life: 3000 })
  }
}

// TTL选项（秒）
const ttlOptions = [
  { label: '无限制', value: -1},
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

// 返回首页
const goHome = () => {
  router.push('/')
}

</script>

<template>
  <div class="page-container">
    <!-- 创建房间表单 -->
    <Transition name="fade-out" appear>
      <div v-if="showCreateForm" class="grid justify-content-center p-3">
        <div class="col-12 md:col-6">
          <Card>
            <template #title>
              <span class="text-3xl font-bold"><i class="pi pi-home text-3xl mr-2"></i> 创建房间</span>
            </template>
            <template #subtitle>
              <div class="mb-4">填写房间信息，创建一个新的骰子游戏房间</div>
            </template>
            <template #content>
              <form @submit.prevent="handleSubmit" class="flex flex-column gap-5">
                <div class="flex flex-column gap-1">
                  <FloatLabel variant="on">
                    <InputText
                      id="roomName"
                      v-model="formData.name"
                      class="w-full"
                      autocomplete="off"
                      required
                    />
                    <label for="roomName">房间名称</label>
                  </FloatLabel>
                </div>

                <div class="flex flex-column gap-1">
                  <FloatLabel variant="on">
                    <Dropdown
                      id="ttl"
                      v-model="formData.ttl"
                      :options="ttlOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      required
                    />
                    <label for="ttl">房间存活时间</label>
                  </FloatLabel>
                </div>

                <div class="flex flex-column gap-1">
                  <FloatLabel variant="on">
                    <InputNumber
                      id="round"
                      v-model="formData.round"
                      :min="1"
                      :max="100"
                      showButtons
                      class="w-full"
                      required
                    />
                    <label for="round">游戏轮数</label>
                  </FloatLabel>
                  <small class="text-600">建议设置为 10 轮</small>
                </div>

                <Button
                  type="submit"
                  class="w-full"
                  :label="isLoading ? '创建中...' : '创建房间'"
                  :icon="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-plus'"
                  :loading="isLoading"
                />

                <Message v-if="errorMessage" severity="error" class="w-full">
                  {{ errorMessage }}
                </Message>
              </form>
            </template>
          </Card>
        </div>
      </div>
    </Transition>

    <!-- 房间管理界面 -->
    <Transition name="fade-in" appear>
      <RoomManagementView
        v-if="showRoomManagement"
        :room-id="roomInfo.roomId"
        :room-name="roomInfo.name"
        :ttl="roomInfo.ttl"
        :round="roomInfo.round"
      />
    </Transition>
  </div>
</template>
