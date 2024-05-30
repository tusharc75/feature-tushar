/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        link: 'var(--link)'
      }
    }
  },
  plugins: [],
  darkMode: ['class', '[data-mode="dark"]']
};
