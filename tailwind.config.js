/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          light:   'rgb(var(--color-primary-light) / <alpha-value>)',
          dark:    'rgb(var(--color-primary-dark) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          light:   'rgb(var(--color-secondary-light) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger:  'rgb(var(--color-danger) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-hover':  'rgb(var(--color-surface-hover) / <alpha-value>)',
        'surface-subtle': 'rgb(var(--color-surface-subtle) / <alpha-value>)',
        bg:    'rgb(var(--color-bg) / <alpha-value>)',
        ink:   'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-border': 'rgb(var(--color-muted-border) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { xl: 'var(--radius-xl)', '2xl': 'var(--radius-2xl)' },
      boxShadow: {
        card: 'var(--shadow-card)',
        'amber-glow': 'var(--shadow-amber-glow)',
      },
    },
  },
  plugins: [],
}
