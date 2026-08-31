import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Green Ngoria design token system
      colors: {
        // Brand
        brand: {
          50: '#f0faf0',
          100: '#d9f2d9',
          200: '#b3e5b3',
          300: '#7acf7a',
          400: '#3db53d',
          500: '#1a7a2a', // Primary brand green
          600: '#166624',
          700: '#12521c',
          800: '#0e3f16',
          900: '#0a2d10',
          950: '#061a09',
        },
        // Surface tokens
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          elevated: 'hsl(var(--surface-elevated))',
          sunken: 'hsl(var(--surface-sunken))',
        },
        // Semantic tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        subtle: 'hsl(var(--subtle-foreground))',
        border: 'hsl(var(--border))',
        hairline: 'hsl(var(--hairline))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Component tokens
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Status
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        // Mining palette
        mineral: {
          graphite: '#242a27',
          charcoal: '#121614',
          slate: '#1b2320',
          stone: '#8a8a8a',
          steel: '#4a5568',
          gold: '#c8a84b',
          copper: '#b87333',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Fluid typography using clamp. Display is capped below 6rem.
        'display-2xl': [
          'clamp(2.5rem,1.9rem + 2.6vw,4.75rem)',
          { lineHeight: '0.98', letterSpacing: '-0.042em' },
        ],
        'display-xl': [
          'clamp(2rem,1.6rem + 2.1vw,3.5rem)',
          { lineHeight: '1.02', letterSpacing: '-0.038em' },
        ],
        'display-lg': [
          'clamp(1.75rem,1.4rem + 1.6vw,2.625rem)',
          { lineHeight: '1.06', letterSpacing: '-0.032em' },
        ],
        'display-md': [
          'clamp(1.4rem,1.18rem + 1.05vw,2rem)',
          { lineHeight: '1.12', letterSpacing: '-0.026em' },
        ],
        'display-sm': [
          'clamp(1.2rem,1.06rem + 0.65vw,1.5rem)',
          { lineHeight: '1.18', letterSpacing: '-0.022em' },
        ],
        'tech-label': [
          '0.6875rem',
          { lineHeight: '1', letterSpacing: '0.14em', fontWeight: '600' },
        ],
        'data-lg': [
          '1.75rem',
          {
            lineHeight: '1',
            letterSpacing: '-0.03em',
            fontWeight: '700',
          },
        ],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Real shadows: vertical offset + soft blur, never a zero-offset halo.
        hairline: '0 1px 0 0 hsl(var(--hairline))',
        low: '0 1px 2px -1px hsl(var(--shadow-color) / 0.14), 0 2px 6px -2px hsl(var(--shadow-color) / 0.10)',
        mid: '0 2px 4px -2px hsl(var(--shadow-color) / 0.14), 0 8px 18px -6px hsl(var(--shadow-color) / 0.16)',
        high: '0 4px 8px -4px hsl(var(--shadow-color) / 0.16), 0 18px 40px -12px hsl(var(--shadow-color) / 0.22)',
        panel:
          '0 8px 16px -8px hsl(var(--shadow-color) / 0.20), 0 32px 64px -24px hsl(var(--shadow-color) / 0.28)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      transitionDuration: {
        // Motion tiers from DESIGN.md §14
        micro: '150ms',
        ui: '240ms',
        emphasis: '420ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'panel-in': {
          from: {
            opacity: '0',
            transform: 'translateY(-6px) scale(0.985)',
            filter: 'blur(4px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)',
          },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'flow-dash': {
          to: { strokeDashoffset: '-24' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.42s cubic-bezier(0.16,1,0.3,1)',
        'panel-in': 'panel-in 0.24s cubic-bezier(0.16,1,0.3,1)',
        'sheet-in': 'sheet-in 0.24s cubic-bezier(0.16,1,0.3,1)',
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'flow-dash': 'flow-dash 1.1s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
