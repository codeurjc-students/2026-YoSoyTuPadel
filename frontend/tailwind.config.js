/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e60012',
          dark: '#0b0b0c',
          ink: '#111318',
          muted: '#697386',
          canvas: '#f6f7f9',
          line: '#e5e7eb',
        },
      },
      boxShadow: {
        soft: '0 12px 32px rgba(17, 19, 24, 0.08)',
        red: '0 10px 24px rgba(230, 0, 18, 0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
