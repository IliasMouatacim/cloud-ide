/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#f7f8f4',
          sidebar: '#ffffff',
          panel: '#edf1eb',
          border: '#dce3d9',
          borderLight: '#bac8bc',
          text: '#243a30',
          textMuted: '#617266',
          textSubtle: '#6b7d70',
          accent: '#286b50',
          accentHover: '#1c513d',
          accentDim: '#286b5020',
          success: '#286b50',
          warning: '#98631a',
          error: '#b83c4b',
          surface: '#f7f8f4',
          surfaceHover: '#dce3d9',
          overlay: '#ffffff',
          lavender: '#b4befe',
          mauve: '#cba6f7',
          peach: '#fab387',
          teal: '#94e2d5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 12px rgba(137, 180, 250, 0.15)',
        'glow-lg': '0 0 24px rgba(137, 180, 250, 0.2)',
        'panel': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'float': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #286b50, #1c513d)',
        'gradient-subtle': 'linear-gradient(180deg, #f7f8f4 0%, #ffffff 100%)',
      }
    },
  },
  plugins: [],
};
