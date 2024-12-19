/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        link: 'var(--link)'
      },
      typography: {
        DEFAULT: {
          css: {
            a: {
              color: 'var(--link)',
              '&:hover': {
                textDecoration: 'underline'
              }
            }
          }
        }
      },
      keyframes: {
        shake: {
          '0%': { transform: 'translateX(0rem)' },
          '25%': { transform: 'translateX(0.5rem)' },
          '75%': { transform: 'translateX(-0.5rem)' },
          '100%': { transform: 'translateX(0rem)' }
        },
        wave: {
          '0%': { transform: 'rotate(0.0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10.0deg)' },
          '60%': { transform: 'rotate(0.0deg)' },
          '100%': { transform: 'rotate(0.0deg)' }
        }
      },
      animation: {
        shake: 'shake 0.2s ease-in-out 0s 2'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: ['class', '[data-mode="dark"]']
};
