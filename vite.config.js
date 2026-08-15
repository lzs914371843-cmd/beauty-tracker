import { defineConfig } from 'vite'
import react from '@vitejs me/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '变好看日志 App',
        short_name: '变好看',
        description: '变好看日志记录',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // 🔑 核心：强制全屏无地址栏
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: './' // 确保路径正确
})
