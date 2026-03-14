/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-red': '#ff003c',
                'cyber-green': '#00ff9f',
                'neon-amber': '#ffae00',
                'primary-bg': '#050505',
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
            },
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                rajdhani: ['Rajdhani', 'sans-serif'],
                'press-start': ['"Press Start 2P"', 'cursive'],
            },
            keyframes: {
                flicker: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.85' },
                },
                pulse2: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.4' },
                },
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
            },
            animation: {
                flicker: 'flicker 8s ease-in-out infinite',
                scanline: 'scanline 6s linear infinite',
            },
            boxShadow: {
                'neon-red': '0 0 10px #ff003c, 0 0 20px #ff003c',
                'neon-green': '0 0 10px #00ff9f, 0 0 20px #00ff9f',
                'neon-amber': '0 0 10px #ffae00, 0 0 20px #ffae00',
            },
        },
    },
    plugins: [],
}
