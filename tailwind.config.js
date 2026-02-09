/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'tfd-primary': '#00d9ff',
        'tfd-secondary': '#ff6b00',
        'tfd-dark': '#0a0e1a',
        'tfd-darker': '#05070f',
        'tfd-accent': '#7b2cbf',
        'tfd-success': '#00ff88',
        'tfd-warning': '#ffd60a',
        'tfd-error': '#ff006e',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
      fontFamily: {
        'gaming': ['"Elice Digital Baeum"', 'Pretendard', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 217, 255, 0.5), 0 0 20px rgba(0, 217, 255, 0.3)',
        'neon-strong': '0 0 15px rgba(0, 217, 255, 0.7), 0 0 30px rgba(0, 217, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
