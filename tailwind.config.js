/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:              'var(--color-bg)',
        surface:         'var(--color-surface)',
        'surface-2':     'var(--color-surface-2)',
        border:          'var(--color-border)',
        primary:         'var(--color-gold-cta)',
        'primary-hover': 'var(--color-gold-hover)',
        heading:         'var(--color-heading)',
        text:            'var(--color-text)',
        muted:           'var(--color-muted)',
        accent:          'var(--color-gold)',
        'accent-dim':    'var(--color-gold-cta)',
        'accent-glow':   'var(--color-gold-tint)',
        'on-accent':     'var(--color-on-gold)',
        spice:           'var(--color-spice)',
        'spice-tint':    'var(--color-spice-tint)',
        'on-spice':      'var(--color-on-spice)',
        success:         'var(--color-success)',
        error:           'var(--color-error)',
        warning:         'var(--color-warning)',
        whatsapp:        'var(--color-whatsapp)',
        'whatsapp-dark': 'var(--color-whatsapp-dark)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(61, 32, 0, 0.08)',
        accent: '0 0 20px var(--color-yellow-glow)',
        'accent-strong': '0 0 32px var(--color-yellow-glow)',
        yellow: '0 0 20px var(--color-yellow-glow)',
        'yellow-strong': '0 0 32px var(--color-yellow-glow)',
        primary: '0 0 20px var(--color-primary)',
        'primary-strong': '0 0 32px var(--color-primary)',
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
