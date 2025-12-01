/**** Tailwind config ****/
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'sans-serif'],
      },
      colors: {
        // Light theme tokens (Professional & Minimal)
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          header: '#F1F5F9',
          text: {
            primary: '#0F172A',
            secondary: '#475569',
          },
          border: '#E2E8F0',
          accent: {
            primary: '#2563EB',
            hover: '#1E40AF',
            secondary: '#06B6D4',
          },
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
        },
        // Dark theme tokens (Deep, Rich, Modern)
        dark: {
          bg: '#0B0F19',
          surface: '#151A27',
          header: '#0E131F',
          text: {
            primary: '#F8FAFC',
            secondary: '#CBD5E1',
          },
          border: '#1E2635',
          accent: {
            primary: '#3B82F6',
            hover: '#60A5FA',
            secondary: '#06B6D4',
          },
          success: '#22C55E',
          warning: '#EAB308',
          danger: '#EF4444',
        },
      },
      borderRadius: {
        xl: '0.75rem',
      },
      boxShadow: {
        soft: '0 10px 20px -10px rgba(15, 23, 42, 0.08)',
        softdark: '0 10px 20px -10px rgba(0, 0, 0, 0.6)',
      },
      gradientColorStops: {
        'brand-start': '#2563EB',
        'brand-end': '#1E40AF',
        'teal-start': '#0EA5E9',
        'teal-end': '#06B6D4',
        'slate-start': '#1E293B',
        'slate-end': '#0F172A',
      },
    },
  },
  plugins: [],
};
