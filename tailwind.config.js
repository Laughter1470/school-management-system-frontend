/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 make sure this stays here (not at the bottom)
  content: [
    './index.html',          // 👈 add this line for full coverage
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'custom-fade': 'fade 1000ms ease-in-out',
        'custom-fade-out': 'fade-out 1000ms ease-in-out',
        'shake': 'shake 0.3s ease-in-out',
      },
      keyframes: {
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '50%': { transform: 'translateX(4px)' },
          '75%': { transform: 'translateX(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
