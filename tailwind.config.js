/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        peach: '#FFE8D6',
        coral: '#E8735A',
        'coral-hover': '#D4614A',
        deep: '#2C1810',
        mid: '#5C3D2E',
        soft: '#8B6F5E',
        butter: '#FFF4C2',
        'butter-soft': '#FFF4C2',
        sage: '#A8C5A0',
        'sage-bg': '#E8F0E6',
        lav: '#6B21A8',
        'lav-bg': '#EDE8F5',
        red: '#DC2626',
        'red-bg': '#FEE2E2',
        amber: '#B45309',
        'amber-bg': '#FFF4C2',
        green: '#15803D',
        'green-bg': '#E8F0E6',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '22px',
      },
    },
  },
  plugins: [],
}
