import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // Tail wagging animation
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
        // Happy bounce when cat becomes happy
        'happy-bounce': {
          '0%, 100%': { 
            transform: 'scale(1) translateY(0)',
          },
          '50%': { 
            transform: 'scale(1.05) translateY(-5px)',
          },
        },
        // Sad sway when cat is sad
        'sad-sway': {
          '0%, 100%': { 
            transform: 'translateY(0px)',
          },
          '50%': { 
            transform: 'translateY(3px)',
          },
        },
        // Pulse for happiness bar
        'happiness-pulse': {
          '0%, 100%': { 
            opacity: '1',
          },
          '50%': { 
            opacity: '0.8',
          },
        },
      },
      animation: {
        'tail-wag': 'tail-wag 2s ease-in-out infinite',
        'happy-bounce': 'happy-bounce 0.6s ease-in-out 1',
        'sad-sway': 'sad-sway 3s ease-in-out infinite',
        'happiness-pulse': 'happiness-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;