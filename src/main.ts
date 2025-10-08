// 移除自定义全局CSS，遵循PrimeVue/PrimeFlex样式体系
// import './assets/main.css'
// import './assets/common.css'
import 'primeflex/primeflex.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset, palette } from '@primeuix/themes'
import ToastService from 'primevue/toastservice'
import App from './App.vue'
import router from './router'

// 导入PrimeIcons CSS
import 'primeicons/primeicons.css'

// 自定义主题色：primary 与 surface
const primaryPalette = palette('#334155')
const surfacePalette = palette('#64748b')

const BrandAura = definePreset(Aura, {
    semantic: {
        primary: {
            50: primaryPalette[50],
            100: primaryPalette[100],
            200: primaryPalette[200],
            300: primaryPalette[300],
            400: primaryPalette[400],
            500: primaryPalette[500],
            600: primaryPalette[600],
            700: primaryPalette[700],
            800: primaryPalette[800],
            900: primaryPalette[900],
            950: primaryPalette[950]
        },
        surface: {
            50: surfacePalette[50],
            100: surfacePalette[100],
            200: surfacePalette[200],
            300: surfacePalette[300],
            400: surfacePalette[400],
            500: surfacePalette[500],
            600: surfacePalette[600],
            700: surfacePalette[700],
            800: surfacePalette[800],
            900: surfacePalette[900],
            950: surfacePalette[950]
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.500}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.700}'
                }
            },
            dark: {
                primary: {
                    color: '{primary.400}',
                    contrastColor: '{surface.900}',
                    hoverColor: '{primary.300}',
                    activeColor: '{primary.200}'
                }
            }
        }
    }
})

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: BrandAura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
 });
app.use(ToastService)

app.mount('#app')
