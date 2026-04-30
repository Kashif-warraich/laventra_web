/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#080F1E',
        card:   '#0D1629',
        el:     '#111D35',
        border: '#1A2845',
        blue:   '#2563EB',
        bluel:  '#60A5FA',
        teal:   '#14B8A6',
        red:    '#EF4444',
        amber:  '#F59E0B',
        purple: '#8B5CF6',
        tp:     '#F1F5F9',
        ts:     '#64748B',
        tm:     '#334155',
      },
    },
  },
  plugins: [],
}
