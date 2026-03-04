/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#080B10',
        surface:  '#0F1318',
        surface2: '#161C24',
        border:   '#1E2732',
        border2:  '#263040',
        accent:   { DEFAULT: '#00E5FF', 2: '#7B61FF', 3: '#FF6B35' },
        tx:       { DEFAULT: '#F0F4F8', 2: '#8899AA', 3: '#4A5A6A' },
        green:    '#00FF9D',
        yellow:   '#FFD600',
        red:      '#FF4466',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        btn:   '8px',
        card:  '12px',
        panel: '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 2s infinite',
        'fade-up':    'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        shimmer: {
          '0%,100%': { filter: 'brightness(1)' },
          '50%':     { filter: 'brightness(1.3)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
