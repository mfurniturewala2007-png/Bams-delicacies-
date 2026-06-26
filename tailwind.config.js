/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFF8EE',
        surface: '#FFFAF4',
        'surface-2': '#F5ECD8',
        border: '#E8D5BE',
        yellow: {
          DEFAULT: '#F5C200',
          dim: '#C49A00',
          glow: 'rgba(245, 194, 0, 0.20)', // #F5C20033
        },
        primary: {
          DEFAULT: '#C8511B',
          hover: '#A03D12',
        },
        heading: '#8B3A00',
        text: '#3D2000',
        muted: '#A07850',
        success: '#2D6A4F',
        error: '#B91C1C',
        warning: '#C8511B',
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
