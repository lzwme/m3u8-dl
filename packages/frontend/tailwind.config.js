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
  plugins: [],
}
