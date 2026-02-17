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
        // Deep Space/Void Blue
        'void-deep': '#05070A',
        'void-blue': '#0A0F1E',
        'void-lighter': '#141B2E',

        // Cyan/Electric Aqua (Main Accent)
        'cyber-cyan': '#00F0FF',
        'cyber-cyan-dim': '#00A8B5',
        'cyber-cyan-glow': '#4DFFFF',

        // Muted Gold/Amber (Ultimate/Premium)
        'amber-gold': '#D4A373',
        'amber-dark': '#B8895A',
        'amber-bright': '#E8C49A',

        // Steel Grey/Silver (Secondary)
        'steel-grey': '#A0A0A0',
        'steel-dark': '#6B6B6B',
        'steel-light': '#C8C8C8',

        // Tier Colors
        'tier-1': '#458489',
        'tier-2': '#792F86',
        'tier-3': '#BC944F',
        'tier-4': '#923626',

        // Legacy compatibility (map to new colors)
        'tfd-primary': '#00F0FF',
        'tfd-secondary': '#D4A373',
        'tfd-dark': '#0A0F1E',
        'tfd-darker': '#05070A',
        'tfd-accent': '#00A8B5',
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
        neon: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-strong':
          '0 0 15px rgba(0, 240, 255, 0.8), 0 0 30px rgba(0, 240, 255, 0.5), 0 0 45px rgba(0, 240, 255, 0.3)',
        'gold-glow':
          '0 0 10px rgba(212, 163, 115, 0.6), 0 0 20px rgba(212, 163, 115, 0.4)',
        'gold-glow-strong':
          '0 0 15px rgba(212, 163, 115, 0.8), 0 0 30px rgba(212, 163, 115, 0.5)',
        glass: '0 8px 32px 0 rgba(0, 240, 255, 0.1)',
        'glass-gold': '0 8px 32px 0 rgba(212, 163, 115, 0.15)',
      },
    },
  },
  plugins: [],
};
