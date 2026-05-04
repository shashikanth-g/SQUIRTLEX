/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-bg': '#0A1628',
        'surface': '#132039',
        'surface-elevated': '#1A2847',
        'primary': '#00D4FF',
        'secondary': '#4ECDC4',
        'accent': '#FF6B6B',
        'warning': '#FFD93D',
        'success': '#6BCF7F',
        'text-primary': '#E8F1F5',
        'text-secondary': '#8FA3B0',
        'text-muted': '#5A6C7D',
        'border': 'rgba(0,212,255,0.15)',
        'border-active': 'rgba(0,212,255,0.4)'
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
