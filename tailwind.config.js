/**
 * 테마 토큰은 src/styles/theme.css 의 CSS 변수에 모여 있습니다.
 * 여기서는 그 변수를 Tailwind 클래스 이름(bg-royal, text-gold …)에 연결만 합니다.
 * 톤을 바꾸려면 theme.css 의 값만 수정하세요.
 */
const withAlpha = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: {
          DEFAULT: withAlpha('royal'),
          deep: withAlpha('royal-deep'),
          light: withAlpha('royal-light'),
        },
        gold: {
          DEFAULT: withAlpha('gold'),
          light: withAlpha('gold-light'),
          dark: withAlpha('gold-dark'),
        },
        hanji: {
          DEFAULT: withAlpha('hanji'),
          dark: withAlpha('hanji-dark'),
          card: withAlpha('hanji-card'),
        },
        ink: {
          DEFAULT: withAlpha('ink'),
          soft: withAlpha('ink-soft'),
          faint: withAlpha('ink-faint'),
        },
        indigo: { DEFAULT: withAlpha('indigo') },
        success: withAlpha('success'),
      },
      fontFamily: {
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
      },
      borderRadius: {
        collar: 'var(--radius-collar)',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        royal: 'var(--shadow-card)',
        glow: 'var(--shadow-glow)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sparkle: {
          '0%': { opacity: '0', transform: 'scale(0.3) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(90deg)' },
          '100%': { opacity: '0', transform: 'scale(0.4) rotate(180deg) translateY(-30px)' },
        },
        'slow-spin': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shake: 'shake 0.45s ease-in-out',
        'fade-up': 'fade-up 0.35s ease-out both',
        sparkle: 'sparkle 1.4s ease-out forwards',
        'slow-spin': 'slow-spin 60s linear infinite',
      },
    },
  },
  plugins: [],
};
