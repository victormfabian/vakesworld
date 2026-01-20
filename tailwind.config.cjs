module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#ffffff',
        charcoal: '#1b1b1b',
        accent: '#ffde00',
        grey: '#8f8f8f',
        card: '#ffffff',
      },
      fontFamily: {
        sans: ['Fredoka', 'Trebuchet MS', 'Arial', 'sans-serif'],
        display: ['Bangers', 'Trebuchet MS', 'Arial', 'sans-serif'],
        title: ['Oswald', 'Trebuchet MS', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
