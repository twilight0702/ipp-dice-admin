<script setup lang="ts">
import { ref, reactive, onMounted, watch, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { updateRoomRound, getRoomRank, openRoom, closeRoom, getRoomInfoVO } from '@/api/room'
import { useToast } from 'primevue/usetoast'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import RadioButton from 'primevue/radiobutton'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Image from 'primevue/image'
import Fieldset from 'primevue/fieldset'
import Toast from 'primevue/toast'
import Message from 'primevue/message'
import Toolbar from 'primevue/toolbar'

// Define component props
const props = defineProps<{
  roomId: string
  roomName: string
  ttl: number
  round: number
}>()

const router = useRouter()
const toast = useToast()

// Room information
const roomInfo = reactive({
  roomId: props.roomId,
  name: props.roomName,
  ttl: props.ttl,
  round: props.round,
  qrCodeUrl: '',
  qrCodeImage: '',
  isOpen: 1, // Default to open
})

// Round modification
const newRound = ref(props.round)
const isUpdatingRound = ref(false)

// Leaderboard
const rankRoleType = ref(1) // Default to highest score
const rankData = ref<any[]>([])
const loadingRank = ref(false)
const isRankVisible = ref(false) // 默认关闭，不显示
const lastRankHash = ref<string>('')

// 排行榜折叠状态与显示开关分离：用户可独立折叠，不影响显示开关
const isFieldsetCollapsed = ref(false)

// Room status
const isRoomOpen = ref(true)
const isTogglingRoom = ref(false)

// Polling
const rankPollingTimer = ref<number | null>(null)
const POLLING_INTERVAL = 5000 // 5 seconds

// QR Code generation
const generateQRCode = (url: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    import('qrcode')
      .then(({ default: QRCode }) => {
        QRCode.toDataURL(url, { width: 256, margin: 2 }).then(resolve).catch(reject)
      })
      .catch(reject)
  })
}

// Initialize
onMounted(async () => {
  try {
    const roomInfoResponse = await getRoomInfoVO(roomInfo.roomId)
    if (roomInfoResponse.data) {
      roomInfo.isOpen = roomInfoResponse.data.isOpen
      isRoomOpen.value = roomInfoResponse.data.isOpen === 1
    }

    if (import.meta.env.DEV) {
      roomInfo.qrCodeUrl = `http://localhost:5173/?roomId=${roomInfo.roomId}`
    } else {
      const baseUrl = window.location.origin
      const basePath = window.location.pathname.split('/').slice(0, -2).join('/')
      roomInfo.qrCodeUrl = `${baseUrl}${basePath}/frontend/?roomId=${roomInfo.roomId}`
    }
    roomInfo.qrCodeImage = await generateQRCode(roomInfo.qrCodeUrl)
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '生成二维码失败', life: 3000 })
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopRankPolling()
})

// Watch for leaderboard visibility change
watch(isRankVisible, async (newVal) => {
  if (newVal) {
    await fetchRankData()
    if (isRoomOpen.value) {
      startRankPolling()
    } else {
      stopRankPolling()
    }
  } else {
    stopRankPolling()
  }
})

// Watch for rank type change
watch(rankRoleType, async () => {
  if (isRankVisible.value) {
    await fetchRankData()
  }
})

// Fetch leaderboard data
const fetchRankData = async () => {
  if (!isRankVisible.value) return
  // 仅在首次或无数据时展示loading，避免频繁闪动
  const shouldShowLoading = rankData.value.length === 0
  if (shouldShowLoading) loadingRank.value = true
  try {
    const response = await getRoomRank(roomInfo.roomId, rankRoleType.value)
    const records = response?.data?.playerRecords ?? []
    const newHash = JSON.stringify(records)
    if (newHash !== lastRankHash.value) {
      rankData.value = records
      lastRankHash.value = newHash
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    toast.add({ severity: 'error', summary: '错误', detail: '获取排行榜失败', life: 3000 })
  } finally {
    if (shouldShowLoading) loadingRank.value = false
  }
}

// Start polling for leaderboard data
const startRankPolling = () => {
  stopRankPolling()
  if (isRoomOpen.value && isRankVisible.value) {
    rankPollingTimer.value = window.setInterval(fetchRankData, POLLING_INTERVAL)
  }
}

// Stop polling
const stopRankPolling = () => {
  if (rankPollingTimer.value) {
    window.clearInterval(rankPollingTimer.value)
    rankPollingTimer.value = null
  }
}

// Update round number
const updateRound = async () => {
  if (newRound.value <= 0) {
    toast.add({
      severity: 'warn',
      summary: '无效轮数',
      detail: '轮数必须大于 0',
      life: 3000,
    })
    return
  }

  isUpdatingRound.value = true
  try {
    await updateRoomRound(roomInfo.roomId, newRound.value)
    roomInfo.round = newRound.value
    toast.add({ severity: 'success', summary: '成功', detail: '轮数更新成功！', life: 3000 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新轮数失败，请重试'
    toast.add({ severity: 'error', summary: '错误', detail: message, life: 3000 })
  } finally {
    isUpdatingRound.value = false
  }
}

// 根据切换后的值执行开关操作，避免双重触发
const onSwitchChange = async (nextOpen: boolean) => {
  isTogglingRoom.value = true
  try {
    if (nextOpen) {
      await openRoom(roomInfo.roomId)
      isRoomOpen.value = true
      roomInfo.isOpen = 1
      toast.add({ severity: 'info', summary: '状态变更', detail: '房间已开启', life: 3000 })
      if (isRankVisible.value) {
        await fetchRankData()
        startRankPolling()
      }
    } else {
      await closeRoom(roomInfo.roomId)
      isRoomOpen.value = false
      roomInfo.isOpen = 0
      toast.add({ severity: 'info', summary: '状态变更', detail: '房间已关闭', life: 3000 })
      stopRankPolling()
    }
  } catch (error) {
    const action = nextOpen ? '开启' : '关闭'
    const message = error instanceof Error ? error.message : `${action}房间失败，请重试`
    toast.add({ severity: 'error', summary: '错误', detail: message, life: 3000 })
  } finally {
    isTogglingRoom.value = false
  }
}

// Navigation
const goHome = () => {
  router.push({ name: 'home' })
}

const createNewRoom = () => {
  router.push({ name: 'create-room' })
}

const rankOptions = [
  { name: '按最高分', value: 1 },
  { name: '按最后一次', value: 2 },
  { name: '按总分', value: 3 },
]
</script>

<template>
  <div class="p-4">
    <Toast />
    <Toolbar class="mb-4" style="border-radius: 1rem; padding: 1rem 1rem 1rem 1.5rem">
      <template #start>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-cog text-5xl mr-2"></i>
          <span class="text-4xl font-bold">房间管理</span>
        </div>
      </template>
      <template #end>
        <div class="flex gap-2">
          <Button
            icon="pi pi-plus"
            label="创建新房间"
            @click="createNewRoom"
            severity="secondary"
          />
          <Button icon="pi pi-home" label="返回首页" @click="goHome" />
        </div>
      </template>
    </Toolbar>

    <div class="grid justify-content-center">
      <!-- Left Column -->
      <div class="col-12 md:col-6 lg:col-5">
        <div class="flex flex-column gap-4">
          <Fieldset>
            <template #legend>
              <div class="flex align-items-center gap-3">
                <i class="pi pi-qrcode text-2xl "></i>
                <span class="font-bold text-xl">房间邀请码</span>
              </div>
            </template>
            <div class="flex flex-column align-items-center text-center gap-3">
              <Image
                v-if="roomInfo.qrCodeImage"
                :src="roomInfo.qrCodeImage"
                alt="房间二维码"
                width="250"
                preview
              />
              <p class="text-color-secondary">扫码加入房间</p>
              <Button
                as="a"
                label="点击打开加入房间页面"
                icon="pi pi-external-link"
                variant="link"
                :href="roomInfo.qrCodeUrl"
                target="_blank"
                rel="noopener"
              />
            </div>
          </Fieldset>

          <Fieldset>
            <template #legend>
              <div class="flex align-items-center gap-3">
                <i class="pi pi-info-circle text-2xl"></i>
                <span class="font-bold text-xl">房间信息</span>
              </div>
            </template>
            <ul class="list-none p-0 m-0 flex flex-column gap-3">
              <li class="flex justify-content-between">
                <span class="font-semibold">房间ID:</span>
                <span class="text-color-secondary">{{ roomInfo.roomId }}</span>
              </li>
              <li class="flex justify-content-between">
                <span class="font-semibold">房间名称:</span>
                <span class="text-color-secondary">{{ roomInfo.name }}</span>
              </li>
              <li class="flex justify-content-between">
                <span class="font-semibold">当前轮数:</span>
                <span class="text-color-secondary">{{ roomInfo.round }} 轮</span>
              </li>
              <li class="flex justify-content-between align-items-center">
                <span class="font-semibold">房间状态:</span>
                <Tag
                  :severity="isRoomOpen ? 'success' : 'danger'"
                  :value="isRoomOpen ? '开启中' : '已关闭'"
                ></Tag>
              </li>
            </ul>
          </Fieldset>

          <Fieldset>
            <template #legend>
              <div class="flex align-items-center gap-3">
                <i class="pi pi-cog text-2xl"></i>
                <span class="font-bold text-xl">修改轮数</span>
              </div>
            </template>
            <form class="flex gap-2" @submit.prevent="updateRound">
              <InputNumber
                v-model="newRound"
                placeholder="新轮数"
                :min="1"
                class="flex-grow-1"
                :disabled="!isRoomOpen"
              />
              <Button
                label="更新"
                icon="pi pi-check"
                type="submit"
                :loading="isUpdatingRound"
                :disabled="!isRoomOpen"
              />
            </form>
          </Fieldset>

          <Fieldset>
            <template #legend>
              <div class="flex align-items-center gap-3">
                <i class="pi pi-power-off text-2xl"></i>
                <span class="font-bold text-xl">房间开关</span>
              </div>
            </template>
            <div class="flex flex-column gap-3">
              <div class="flex justify-content-between align-items-center">
                <span class="font-semibold">
                  {{ isRoomOpen ? '关闭房间以禁止玩家加入' : '开启房间以允许玩家加入' }}
                </span>
                <InputSwitch
                  :modelValue="isRoomOpen"
                  @update:modelValue="onSwitchChange"
                  :disabled="isTogglingRoom"
                />
              </div>
              <Message severity="warn" :closable="false" v-if="!isRoomOpen"
                >房间当前处于关闭状态，玩家无法加入游戏。</Message
              >
            </div>
          </Fieldset>
        </div>
      </div>

      <!-- Right Column -->
      <div class="col-12 md:col-6 lg:col-7">
        <Fieldset legend="🏆 排行榜" :toggleable="true" v-model:collapsed="isFieldsetCollapsed">
          <template #legend>
            <div class="flex align-items-center gap-3">
              <i class="pi pi-trophy text-2xl"></i>
              <span class="font-bold text-xl">排行榜</span>
            </div>
          </template>
          <div class="flex justify-content-end align-items-center mb-3">
            <span class="mr-2">显示排行榜</span>
            <InputSwitch v-model="isRankVisible" />
          </div>
          <Transition name="fade-slide" mode="out-in">
            <div v-if="!isRankVisible" key="rank-hidden" class="text-center p-4">
              <p class="text-color-secondary">排行榜已隐藏，请打开右侧“显示排行榜”滑块查看。</p>
            </div>
            <div v-else key="rank-visible">
              <div class="flex justify-content-center mb-4" style="min-height: 2.5rem">
                <div class="flex flex-wrap gap-3">
                  <div
                    v-for="option in rankOptions"
                    :key="option.value"
                    class="flex align-items-center"
                  >
                    <RadioButton
                      v-model="rankRoleType"
                      :inputId="option.name"
                      name="rankType"
                      :value="option.value"
                    />
                    <label :for="option.name" class="ml-2">{{ option.name }}</label>
                  </div>
                </div>
              </div>

              <Message severity="warn" :closable="false" v-if="!isRoomOpen" class="mb-3">
                房间当前已关闭，排行榜数据不会自动刷新，但仍可查看当前排行。
              </Message>

              <DataTable
                :value="rankData"
                :loading="loadingRank"
                responsiveLayout="scroll"
                :paginator="rankData.length > 10"
                :rows="10"
                style="min-height: 16rem"
              >
                <Column header="排名" headerStyle="width: 5rem">
                  <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                  </template>
                </Column>
                <Column field="name" header="玩家"></Column>
                <Column field="score" header="分数" sortable></Column>
                <Column field="diceOutcome" header="投掷结果" v-if="rankRoleType !== 3"></Column>
                <template #empty>
                  <div class="text-center p-4">暂无排行数据</div>
                </template>
                <template #loading>
                  <div class="text-center p-4">正在加载排行榜数据...</div>
                </template>
              </DataTable>
            </div>
          </Transition>
        </Fieldset>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
