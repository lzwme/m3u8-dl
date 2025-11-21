/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  // 浏览器兼容性配置
  future: {
    // 禁用可能不兼容的实验性功能
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: '#10B981',
        accent: '#8B5CF6',
        neutral: {
          DEFAULT: '#1F2937',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },
      // 兼容性增强配置
      screens: {
        // 为旧设备添加更多断点
        xs: '475px',
        '3xl': '1600px',
      },
    },
  },
  // 禁用需要现代浏览器支持的功能
  corePlugins: {
    // 保持所有核心插件启用，但通过 PostCSS 处理兼容性
    container: true,
  },
  // Tailwind CSS 4.x 也支持传统的 config 方式，与 @theme 指令可以同时使用
}
