// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: true,
  modules: [
    // '@nuxt/content',
    // '@nuxt/eslint',
  ],
  experimental: {
    payloadExtraction: true, // Извлечение данных для предварительного рендеринга
    appManifest: true,
  },
  nitro: {
    preset: 'node-server',
    prerender: {
      ignore: [
        '/.well-known/appspecific/com.chrome.devtools.json',
        '/__nuxt_content/content/sql_dump',
        'sql_dump',
        '/profile',
        '/booking',
        '/about',
        '/restaurant/[id]',
        '/__nuxt_content/**',
      ],
      crawlLinks: false, // Предварительный рендеринг ссылок (для SSG)
    },
    // storage: {
    //   cache: {
    //     driver: 'fs', // Используем файловую систему для кэша
    //     base: './.cache'
    //   }
    // },
    compressPublicAssets: true, // Сжатие статических файлов
  },
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'false'
      }
    }
  },
  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  },
  vite: {
    build: {
      minify: "terser", // Минификация кода
      cssMinify: true, // Минификация CSS
    },
  },
});