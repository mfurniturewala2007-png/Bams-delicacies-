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
        'surface-2': '#2B2B2B',
        border: '#3D3D3D',
        yellow: {
          DEFAULT: '#F5C200',
          dim: '#C49A00',
          glow: 'rgba(245, 194, 0, 0.20)', // #F5C20033
        },
        primary: {
          DEFAULT: '#F5C200',
          hover: '#C49A00',
        },
        heading: '#FFFFFF',
        text: '#F3F4F6', // text-gray-100 equivalent
        muted: '#D1D5DB', // text-gray-300 equivalent
        success: '#2D6A4F',
        error: '#EF4444',
        warning: '#F5C200',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(61, 32, 0, 0.08)',
        yellow: '0 0 20px rgba(245, 194, 0, 0.15)',
        'yellow-strong': '0 0 32px rgba(245, 194, 0, 0.35)',
        primary: '0 0 20px rgba(200, 81, 27, 0.2)',
        'primary-strong': '0 0 32px rgba(200, 81, 27, 0.35)',
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
