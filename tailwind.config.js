/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#4F46E5',   // Indigo 600
                secondary: '#8B5CF6', // Violet 500
                accent: '#EC4899',    // Pink 500
                danger: '#F43F5E',    // Rose 500
                success: '#10B981',   // Emerald 500
                'brand-teal': '#0F766E', // Teal 600
                'brand-dark': '#115E59', // Teal 800
                'focus-zone': '#0F172A', // Slate 900
                'roster-bg': '#F8FAFC',  // Slate 50
                'surface': '#FFFFFF',
                'surface-muted': '#E2E8F0', // Slate 200 - darker for contrast
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 10px 25px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(79, 70, 229, 0.4)',
                'floating': '0 20px 40px -10px rgba(0,0,0,0.08)',
            }
        },
    },
    plugins: [],
}
