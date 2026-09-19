import { nextui } from '@nextui-org/react';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Anton', 'Oswald', 'sans-serif'],
        heading: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Ball-colour identity system — see src/theme.ts for the single source of truth.
        ink: '#111111',
        'ink-soft': '#55534C',
        'ink-faint': '#9C9A8F',
        line: '#111111',
        ball1: '#F4C21A', // Billar
        ball2: '#1C5FAE', // Venta Directa
        ball4: '#6A2E8C', // Licorera
        ball6: '#1E7A45', // success / available
        ball5: '#E0641E', // warning / low stock
        ball3: '#C4272B', // alert / destructive
        tint1: '#FDF3D2',
        tint2: '#E4EEF9',
        tint4: '#F1E7F5',
        tint6: '#E5F3EA',
        tint5: '#FBE7DA',
        tint3: '#FBE4E4',
      },
      boxShadow: {
        sticker: '4px 4px 0 rgba(17,17,17,0.15)',
        'sticker-sm': '3px 3px 0 rgba(17,17,17,0.15)',
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: '#FFFFFF',
            foreground: '#111111',
            focus: '#111111',
            primary: {
              DEFAULT: '#111111',
              foreground: '#FFFFFF',
            },
            success: {
              DEFAULT: '#1E7A45',
              foreground: '#FFFFFF',
            },
            warning: {
              DEFAULT: '#E0641E',
              foreground: '#FFFFFF',
            },
            danger: {
              DEFAULT: '#C4272B',
              foreground: '#FFFFFF',
            },
          },
        },
      },
    }),
  ],
};
