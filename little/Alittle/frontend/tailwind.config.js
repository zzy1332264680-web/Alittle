/** @type {import('tailwindcss').Config} */
export default {
  // 匹配所有 React 组件文件
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // 自定义主题：主色调 + 字体
      colors: {
        primary: '#165DFF', // 科技蓝
        neutral: '#F5F7FA', // 中性灰
        white: '#FFFFFF',   // 纯白
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // 极简字体 Inter
      },
    },
  },
  plugins: [],
}