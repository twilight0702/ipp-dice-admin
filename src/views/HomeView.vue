<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToCreateRoom = () => {
  router.push('/create-room')
}

const goToJoinRoom = () => {
  router.push('/join-room')
}
</script>

<template>
  <div class="home-container">
    <div class="welcome-section">
      <h1 class="title">IPP骰子管理系统</h1>
      <p class="subtitle">选择你的操作</p>
    </div>
    
    <div class="button-section">
      <button class="action-button create-button" @click="goToCreateRoom">
        <span class="button-icon">🎲</span>
        <span class="button-text">创建房间</span>
      </button>
      
      <button class="action-button join-button" @click="goToJoinRoom">
        <span class="button-icon">🚪</span>
        <span class="button-text">进入房间</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.button-section {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  font-family: inherit;
}

.create-button {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
}

.join-button {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: white;
}

.action-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
}

.action-button:active {
  transform: translateY(-2px);
}

.button-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.button-text {
  font-size: 1.2rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .button-section {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .action-button {
    width: 180px;
    height: 180px;
  }
}
</style>
