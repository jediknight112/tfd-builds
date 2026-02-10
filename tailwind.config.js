/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
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
        'tfd-success': '#00ff88',
        'tfd-warning': '#D4A373',
        'tfd-error': '#ff006e',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0, 240, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.08) 1px, transparent 1px)",
        'hex-pattern': "url('data:image/svg+xml,%3Csvg width='28' height='49' viewBox='0 0 28 49' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='rgba(0,240,255,0.05)' fill-rule='evenodd'%3E%3Cg fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      backgroundSize: {
        'grid': '24px 24px',
        'hex': '28px 49px',
      },
      fontFamily: {
        'gaming': ['"Rajdhani"', '"Barlow Condensed"', '"Elice Digital Baeum"', 'sans-serif'],
        'body': ['"Inter"', '"Roboto"', 'sans-serif'],
        'mono': ['"Roboto Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-strong': '0 0 15px rgba(0, 240, 255, 0.8), 0 0 30px rgba(0, 240, 255, 0.5), 0 0 45px rgba(0, 240, 255, 0.3)',
        'gold-glow': '0 0 10px rgba(212, 163, 115, 0.6), 0 0 20px rgba(212, 163, 115, 0.4)',
        'gold-glow-strong': '0 0 15px rgba(212, 163, 115, 0.8), 0 0 30px rgba(212, 163, 115, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 240, 255, 0.1)',
        'glass-gold': '0 8px 32px 0 rgba(212, 163, 115, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      clipPath: {
        'hexagon': 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        'angle': 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      },
    },
  },
  plugins: [],
}
