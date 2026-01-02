/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom color palette from design spec - Light mode defaults
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        // Accent colors
        primary: '#3B82F6',
        'primary-hover': '#2563EB',
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
      },
      backdropBlur: {
        glass: '14px',
      },
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.65)',
      },
    },
  },
  plugins: [],
}
