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
        // susCoin Color Palette using CSS variables
        'sus': {
          'bg': 'var(--bg)',
          'card': 'var(--card)',
          'text': 'var(--text)',
          'muted': 'var(--muted)',
          'primary': 'var(--primary)',
          'secondary': 'var(--secondary)',
          'accent': 'var(--accent)',
          'line': 'var(--line)',
          'success': 'var(--success)',
          'warning': 'var(--warning)',
          'error': 'var(--error)',
          'info': 'var(--info)',
          // Data visualization colors (colorblind-safe)
          'data': {
            '1': 'var(--data-1)',
            '2': 'var(--data-2)',
            '3': 'var(--data-3)',
            '4': 'var(--data-4)',
            '5': 'var(--data-5)',
            '6': 'var(--data-6)',
            '7': 'var(--data-7)',
            '8': 'var(--data-8)',
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
