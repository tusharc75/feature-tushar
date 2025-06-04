const plugin = require('tailwindcss/plugin');

const containerPlugin = plugin(
  function containerQueries({ matchUtilities, matchVariant, theme }) {
    let values = theme('containers') ?? {};

    function parseValue(value) {
      let numericValue = value.match(/^(\d+\.\d+|\d+|\.\d+)\D+/)?.[1] ?? null;
      if (numericValue === null) return null;
      return parseFloat(value);
    }

    matchUtilities(
      {
        '@container': (value, { modifier }) => {
          return {
            'container-type': value,
            'container-name': modifier
          };
        }
      },
      {
        values: {
          DEFAULT: 'inline-size',
          normal: 'normal'
        },
        modifiers: 'any'
      }
    );

    matchVariant(
      '@',
      (value = '', { modifier }) => {
        let parsed = parseValue(value);

        return parsed !== null ? `@container ${modifier ?? ''} (min-width: ${value})` : [];
      },
      {
        values,
        sort(aVariant, zVariant) {
          let a = parseFloat(aVariant.value);
          let z = parseFloat(zVariant.value);

          if (a === null || z === null) return 0;

          // Sort values themselves regardless of unit
          if (a - z !== 0) return a - z;

          let aLabel = aVariant.modifier ?? '';
          let zLabel = zVariant.modifier ?? '';

          // Explicitly move empty labels to the end
          if (aLabel === '' && zLabel !== '') {
            return 1;
          } else if (aLabel !== '' && zLabel === '') {
            return -1;
          }

          // Sort labels alphabetically in the English locale
          // We are intentionally overriding the locale because we do not want the sort to
          // be affected by the machine's locale (be it a developer or CI environment)
          return aLabel.localeCompare(zLabel, 'en', { numeric: true });
        }
      }
    );
  },
  {
    theme: {
      containers: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem'
      }
    }
  }
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        link: 'var(--link)',
        'new-theme-color': 'hsl(var(--new-theme-color-hsl))',
        theme: 'hsl(var(--new-theme-color-hsl))'
      },
      backgroundColor: {
        theme: 'hsl(var(--new-theme-color-hsl))',
        darkPrimary: 'hsl(var(--dark-primary-hsl))'
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
        'ripple-animation': {
          to: {
            transform: 'scale(4)',
            opacity: '0'
          }
        },
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
  plugins: [require('@tailwindcss/typography'), containerPlugin],
  darkMode: ['class', '[data-mode="dark"]']
};
