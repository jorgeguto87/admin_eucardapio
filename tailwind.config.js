/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#FF6B2C', light: '#FF8C5A', dark: '#E05520' },
        secondary: { DEFAULT: '#1A1A2E', light: '#2D2D4E' },
        success:   '#22C55E',
        warning:   '#F59E0B',
        danger:    '#EF4444',
        surface:   '#FFFFFF',
        bg:        '#F4F5F7',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
