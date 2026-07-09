/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0A0A',
          900: '#0D0D0D',
          850: '#111111',
          800: '#161616',
          700: '#1A1A1A',
          600: '#222222',
          500: '#2A2A2A',
          400: '#333333',
        },
        amber: {
          DEFAULT: '#F5B800',
          50: '#FFF8E6',
          100: '#FFEFB8',
          200: '#FFE08A',
          300: '#FFD14D',
          400: '#F5B800',
          500: '#E0A800',
          600: '#B88A00',
          700: '#8A6600',
        },
        muted: {
          DEFAULT: '#666666',
          light: '#888888',
          lighter: '#A0A0A0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '16px',
      },
      boxShadow: {
        'amber-glow': '0 0 20px rgba(245, 184, 0, 0.35), 0 0 40px rgba(245, 184, 0, 0.15)',
        'amber-glow-sm': '0 0 12px rgba(245, 184, 0, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(245, 184, 0, 0.25)' },
          '50%': { boxShadow: '0 0 24px rgba(245, 184, 0, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
