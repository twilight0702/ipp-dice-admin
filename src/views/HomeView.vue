<script setup lang="ts">
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()

const goToCreateRoom = () => {
  router.push('/create-room')
}

const goToJoinRoom = () => {
  router.push('/join-room')
}
</script>

<template>
  <div class="flex flex-column justify-content-start align-items-center min-h-screen pt-8 p-4">
    <Card class="w-full max-w-30rem">
      <template #header>
        <div class="text-center">
          <h1 class="text-5xl">IPP招新抽奖</h1>
          <p class="text-color-surface" style="color: var(--p-primary-300)">选择你的操作</p>
        </div>
      </template>
      <template #content>
        <div class="flex gap-3 flex-wrap justify-content-center">
          <Button 
            label="创建房间" 
            icon="pi pi-plus" 
            class="p-button-lg" 
            @click="goToCreateRoom" 
          />
          <Button 
            label="进入房间" 
            icon="pi pi-sign-in" 
            severity="secondary" 
            class="p-button-lg" 
            @click="goToJoinRoom" 
          />
        </div>
      </template>
    </Card>
  </div>
</template>
