/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#10151e',
          sidebar: '#151c27',
          panel: '#0b1018',
          border: '#293447',
          borderLight: '#45475a',
          text: '#e2e8f0',
          textMuted: '#94a3b8',
          textSubtle: '#8391a7',
          accent: '#7dd3fc',
          accentHover: '#74c7ec',
          accentDim: '#7dd3fc20',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
          surface: '#10151e',
          surfaceHover: '#293447',
          overlay: '#151c27',
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
        'gradient-accent': 'linear-gradient(135deg, #7dd3fc, #74c7ec)',
        'gradient-subtle': 'linear-gradient(180deg, #10151e 0%, #151c27 100%)',
      }
    },
  },
  plugins: [],
};
