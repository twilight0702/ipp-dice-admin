<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RoomManagementView from './RoomManagementView.vue'
import { getRoomInfo } from '@/api/room'
import { getRoomList, type RoomInfoVO } from '@/api/room'

// PrimeVue 组件
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import FloatLabel from 'primevue/floatlabel'

const router = useRouter()
const route = useRoute()
const toast = useToast()

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
  round: 0,
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
    toast.add({ severity: 'warn', summary: '提示', detail: '请输入房间ID', life: 2500 })
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
    toast.add({ severity: 'error', summary: '加入失败', detail: errorMessage, life: 3000 })
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
      <div class="flex align-items-center justify-content-between mb-3">
        <Button
          label="返回首页"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="goBack"
        />
      </div>
      <div class="text-center">
        <h1 class="page-title text-5xl text-primary">进入房间</h1>
        <p
          class="page-description text-color-surface"
          v-if="!isFromQRCode"
          style="color: var(--p-primary-300)"
        >
          在这里你可以加入已存在的骰子房间
        </p>
        <p class="page-description text-color-surface" v-else style="color: var(--p-primary-300)">
          扫码成功！请确认加入房间
        </p>
      </div>

      <div class="form-container flex justify-content-center px-5">
        <Card class="w-full max-w-30rem">
          <template #content>
            <div class="flex flex-column gap-3">
              <div class="flex flex-column gap-2 w-full">
                <FloatLabel variant="on" class="w-full">
                  <InputText
                    id="roomId"
                    v-model="roomId"
                    :readonly="isFromQRCode"
                    autocomplete="off"
                    class="w-full"
                  />
                  <label for="roomId">房间ID</label>
                </FloatLabel>
              </div>

              <div v-if="isFromQRCode" class="flex align-items-center gap-2">
                <Tag value="通过二维码扫描获取房间信息" severity="success" />
              </div>

              <div>
                <Button
                  class="w-full"
                  :label="isLoading ? '加入中...' : '加入房间'"
                  icon="pi pi-sign-in"
                  :loading="isLoading"
                  :disabled="!roomId.trim() || isLoading"
                  @click="joinRoom()"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
      <!-- 房间列表 -->
      <div class="w-full mt-3 px-5">
        <Card>
          <template #content>
            <div class="flex align-items-center justify-content-center gap-2 mb-3">
              <i class="pi pi-home text-3xl mr-2"></i>
              <h2 class="text-center m-0">当前房间列表</h2>
            </div>
            <Card>
              <template #content>
                <DataTable
                  :value="roomList"
                  paginator
                  :rows="5"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  tableStyle="min-width: 50rem"
                  removableSort
                  dataKey="id"
                  :rowHover="true"
                  :stripedRows="true"
                  class="w-full"
                  :emptyMessage="'暂无房间数据'"
                >
                  <Column field="name" header="名称" sortable />
                  <Column field="expireTime" header="过期时间" sortable />
                  <Column field="round" header="轮次" sortable />
                  <Column field="isOpen" header="是否开启" sortable>
                    <template #body="{ data }">
                      <Tag
                        :severity="data.isOpen === 1 ? 'success' : 'danger'"
                        :value="getRoomStatus(data.isOpen)"
                      />
                    </template>
                  </Column>
                  <Column field="createTime" header="创建时间" sortable>
                    <template #body="{ data }">{{ formatDateTime(data.createTime) }}</template>
                  </Column>
                  <Column header="操作">
                    <template #body="{ data }">
                      <Button
                        label="进入"
                        size="small"
                        severity="secondary"
                        @click.stop.prevent="joinRoom(data.id.toString())"
                      />
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>
          </template>
        </Card>
      </div>
    </div>

    <!-- 房间管理界面 -->
    <RoomManagementView
      v-if="showRoomManagement"
      :room-id="roomId"
      :room-name="roomInfo.name"
      :ttl="roomInfo.ttl"
      :round="roomInfo.round"
    />
  </div>
</template>
