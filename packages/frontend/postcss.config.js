export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-nested': {}, // 支持CSS嵌套语法，兼容旧浏览器
    '@csstools/postcss-cascade-layers': {}, // 支持 CSS Cascade Layers，兼容旧浏览器
    autoprefixer: {}, // 将自动读取项目根目录的 .browserslistrc 配置
  },
}
