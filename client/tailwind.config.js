/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#1e1e2e',
          sidebar: '#181825',
          panel: '#11111b',
          border: '#313244',
          text: '#cdd6f4',
          textMuted: '#6c7086',
          accent: '#89b4fa',
          accentHover: '#74c7ec',
          success: '#a6e3a1',
          warning: '#f9e2af',
          error: '#f38ba8',
          surface: '#1e1e2e',
          overlay: '#181825',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};
