/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/**/*.html",
    "./src/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // susCoin Color Palette
        'sus': {
          'bg': '#F6F8FA',
          'card': '#FFFFFF',
          'text': '#0B1220',
          'muted': '#64748B',
          'primary': '#065F46',
          'secondary': '#1D4ED8',
          'accent': '#A3E635',
          'line': '#E5E7EB',
          'success': '#16A34A',
          'warning': '#F59E0B',
          'error': '#EF4444',
          'info': '#0891B2',
          // Data visualization colors (colorblind-safe)
          'data': {
            '1': '#0072B2',
            '2': '#E69F00',
            '3': '#009E73',
            '4': '#F0E442',
            '5': '#56B4E9',
            '6': '#D55E00',
            '7': '#CC79A7',
            '8': '#000000',
          }
        },
        // Dark theme colors
        'sus-dark': {
          'bg': '#0F172A',
          'card': '#111827',
          'text': '#F3F4F6',
          'muted': '#9CA3AF',
          'primary': '#22C55E',
          'secondary': '#60A5FA',
          'accent': '#BEF264',
          'line': '#1F2937',
        }
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
