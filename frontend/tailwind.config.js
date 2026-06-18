/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul institucional
        navy: {
          50: '#f1f5fb',
          100: '#dde7f4',
          200: '#bccfeb',
          300: '#8caedb',
          400: '#5384c8',
          500: '#3265b1',
          600: '#234f94',
          700: '#1d4179',
          800: '#1a365d',
          900: '#152a4a',
          950: '#0d1a30',
        },
        // Naranja/rojo de acento
        coral: {
          50: '#fef3f1',
          100: '#fee4df',
          200: '#fecdc4',
          300: '#fcaa9a',
          400: '#f87a62',
          500: '#e74c3c',
          600: '#d8311f',
          700: '#b62517',
          800: '#962217',
          900: '#7d2218',
        },
      },
      fontFamily: {
        // Tipografías distintivas que evitan el look genérico
        display: ['"Instrument Serif"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
