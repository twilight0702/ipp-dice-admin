/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// PrimeVue类型声明
declare module 'primevue/config'
declare module 'primevue/*'
declare module '@primevue/themes/*'