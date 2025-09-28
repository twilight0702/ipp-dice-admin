import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const HomeView = () => import('../views/HomeView.vue')
const CreateRoomView = () => import('../views/CreateRoomView.vue')
const JoinRoomView = () => import('../views/JoinRoomView.vue')
const PrimeVueTestView = () => import('../views/PrimeVueTestView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/create-room',
    name: 'create-room',
    component: CreateRoomView,
  },
  {
    path: '/join-room',
    name: 'join-room',
    component: JoinRoomView,
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/AboutView.vue'),
  },
  {
    path: '/primevue-test',
    name: 'primevue-test',
    component: PrimeVueTestView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
