import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: "Thamizh's Life Command Centre",
        short_name: 'LifeCMD',
        description: 'PhD · TCS · CCDV-F · UGC NET · Govt Jobs · Health · Career Command Centre',

        theme_color: '#0D1117',
        background_color: '#0D1117',

        display: 'standalone',
        orientation: 'portrait',

        scope: '/',
        start_url: '/',

        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],

        categories: [
          'productivity',
          'education',
          'lifestyle'
        ],

        shortcuts: [
          {
            name: 'PhD Planner',
            url: '/?tab=phd',
            description: 'Open PhD research planner'
          },
          {
            name: 'Govt Radar',
            url: '/?tab=radar',
            description: 'Open government job radar'
          },
          {
            name: 'Office Tracker',
            url: '/?tab=office',
            description: 'Open TCS office tracker'
          }
        ]
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}'
        ],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'anthropic-api-queue',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          }
        ]
      }
    })
  ]
})