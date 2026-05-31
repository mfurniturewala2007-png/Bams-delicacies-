/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#2B2B2B',
        surface: '#1E1E1E',
        'surface-2': '#333333',
        border: '#3D3D3D',
        yellow: {
          DEFAULT: '#F5C200',
          dim: '#C49A00',
          glow: 'rgba(245, 194, 0, 0.20)', // #F5C20033
        },
        white: '#F5F5F5',
        muted: '#999999',
        success: '#4CAF50',
        error: '#EF4444',
        warning: '#FB923C',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        yellow: '0 0 20px rgba(245, 194, 0, 0.15)',
        'yellow-strong': '0 0 32px rgba(245, 194, 0, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        'full': '9999px',
        'xl': '0.75rem',
      }
    },
  },
  plugins: [],
}
