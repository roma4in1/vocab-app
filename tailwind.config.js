/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'tail-wag': {
          '0%, 100%': { 
            transform: 'rotate(0deg)',
          },
          '25%': { 
            transform: 'rotate(8deg)',
          },
          '75%': { 
            transform: 'rotate(-8deg)',
          },
        },
        'happy-bounce': {
          '0%, 100%': { 
            transform: 'scale(1) translateY(0)',
          },
          '50%': { 
            transform: 'scale(1.05) translateY(-5px)',
          },
        },
        'sad-sway': {
          '0%, 100%': { 
            transform: 'translateY(0px)',
          },
          '50%': { 
            transform: 'translateY(3px)',
          },
        },
      },
      animation: {
        'tail-wag': 'tail-wag 2s ease-in-out infinite',
        'happy-bounce': 'happy-bounce 0.6s ease-in-out 1',
        'sad-sway': 'sad-sway 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}