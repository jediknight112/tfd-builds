/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'void-deep': 'rgb(var(--void-deep) / <alpha-value>)',
        'void-blue': 'rgb(var(--void-blue) / <alpha-value>)',
        'void-lighter': 'rgb(var(--void-lighter) / <alpha-value>)',

        'cyber-cyan': 'rgb(var(--cyber-cyan) / <alpha-value>)',
        'cyber-cyan-dim': 'rgb(var(--cyber-cyan-dim) / <alpha-value>)',
        'cyber-cyan-glow': 'rgb(var(--cyber-cyan-glow) / <alpha-value>)',

        'amber-gold': 'rgb(var(--amber-gold) / <alpha-value>)',
        'amber-dark': 'rgb(var(--amber-dark) / <alpha-value>)',
        'amber-bright': 'rgb(var(--amber-bright) / <alpha-value>)',

        'steel-grey': 'rgb(var(--steel-grey) / <alpha-value>)',
        'steel-dark': 'rgb(var(--steel-dark) / <alpha-value>)',
        'steel-light': 'rgb(var(--steel-light) / <alpha-value>)',

        'tier-1': 'rgb(var(--tier-1) / <alpha-value>)',
        'tier-2': 'rgb(var(--tier-2) / <alpha-value>)',
        'tier-3': 'rgb(var(--tier-3) / <alpha-value>)',
        'tier-4': 'rgb(var(--tier-4) / <alpha-value>)',

        'tfd-primary': 'rgb(var(--cyber-cyan) / <alpha-value>)',
        'tfd-secondary': 'rgb(var(--amber-gold) / <alpha-value>)',
        'tfd-dark': 'rgb(var(--void-blue) / <alpha-value>)',
        'tfd-darker': 'rgb(var(--void-deep) / <alpha-value>)',
        'tfd-accent': 'rgb(var(--cyber-cyan-dim) / <alpha-value>)',
      },
      fontFamily: {
        gaming: [
          '"Rajdhani"',
          '"Barlow Condensed"',
          '"Elice Digital Baeum"',
          'sans-serif',
        ],
        body: ['"Inter"', '"Roboto"', 'sans-serif'],
        mono: ['"Roboto Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        neon: 'var(--neon-shadow)',
        'neon-strong': 'var(--neon-shadow-strong)',
        'gold-glow': 'var(--gold-shadow)',
        'gold-glow-strong': 'var(--gold-shadow-strong)',
        glass: 'var(--glass-shadow)',
        'glass-gold': 'var(--glass-gold-shadow)',
      },
    },
  },
  plugins: [],
};
