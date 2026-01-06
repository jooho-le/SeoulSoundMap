import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b0f14',
        mist: '#d7e2eb',
        low: '#bfe8da',
        mid: '#f3c77a',
        high: '#d9624c'
      },
      boxShadow: {
        glow: '0 18px 40px rgba(30, 40, 60, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
