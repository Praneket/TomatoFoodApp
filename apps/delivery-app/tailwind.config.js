/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6b35',
          50:  '#fff4f0', 100: '#ffe4d9', 200: '#ffcab3',
          300: '#ffa07a', 400: '#ff8c5a', 500: '#ff6b35',
          600: '#e85520', 700: '#c44018', 800: '#9e3214', 900: '#7d2810',
        },
        secondary: {
          DEFAULT: '#f7c59f',
          400: '#f7c59f', 500: '#f4b07a', 600: '#e89050',
        },
        accent: { DEFAULT: '#ffd166', dark: '#f4b942' },
        success: { DEFAULT: '#06d6a0', dark: '#059669' },
        danger:  { DEFAULT: '#ef476f', dark: '#dc2626' },
        info:    { DEFAULT: '#118ab2', dark: '#0369a1' },
        dark: {
          DEFAULT: '#0d0d1a',
          card:    '#16162a',
          border:  'rgba(255,107,53,0.15)',
          muted:   '#1e1e32',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'sm':    '0 2px 8px rgba(255,107,53,0.08)',
        'md':    '0 4px 24px rgba(255,107,53,0.12)',
        'lg':    '0 8px 40px rgba(255,107,53,0.18)',
        'xl':    '0 16px 60px rgba(255,107,53,0.22)',
        'glass': '0 8px 32px rgba(31,38,135,0.15)',
        'glow':  '0 0 30px rgba(255,107,53,0.35)',
        'glow-lg': '0 0 60px rgba(255,107,53,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.15)',
        'card':  '0 4px 24px rgba(0,0,0,0.06)',
        'hover': '0 12px 40px rgba(255,107,53,0.22)',
      },
      backgroundImage: {
        'gradient-primary':  'linear-gradient(135deg, #ff6b35 0%, #e85520 100%)',
        'gradient-warm':     'linear-gradient(135deg, #fff8f5 0%, #fff0e8 100%)',
        'gradient-hero':     'linear-gradient(135deg, #fff8f5 0%, #ffffff 50%, #fff0e8 100%)',
        'gradient-card':     'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,248,245,0.9) 100%)',
        'gradient-dark':     'linear-gradient(135deg, #0d0d1a 0%, #111128 100%)',
        'gradient-radial':   'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'shimmer':           'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
      },
      animation: {
        'float':       'float 4s ease-in-out infinite',
        'float-slow':  'float 6s ease-in-out infinite',
        'float-fast':  'float 2.5s ease-in-out infinite',
        'pulse-ring':  'pulse-ring 1.5s ease-out infinite',
        'slide-up':    'slide-up 0.4s ease-out',
        'slide-down':  'slide-down 0.4s ease-out',
        'fade-in':     'fade-in 0.5s ease-out',
        'bounce-in':   'bounce-in 0.6s cubic-bezier(0.68,-0.55,0.265,1.55)',
        'gradient':    'gradient-shift 4s ease infinite',
        'shimmer':     'shimmer 1.6s infinite',
        'spin-slow':   'spin 3s linear infinite',
        'blob':        'blob-morph 8s ease-in-out infinite',
        'wiggle':      'wiggle 0.5s ease-in-out',
        'ping-slow':   'ping 2s cubic-bezier(0,0,0.2,1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':      { transform: 'translateY(-12px) rotate(3deg)' },
          '66%':      { transform: 'translateY(-6px) rotate(-2deg)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.08)' },
          '70%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'blob-morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%':      { borderRadius: '50% 60% 30% 60% / 30% 60% 70% 40%' },
          '75%':      { borderRadius: '60% 40% 60% 30% / 70% 30% 60% 40%' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        },
      },
      backdropBlur: { xs: '2px', sm: '4px' },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring':    'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
};
