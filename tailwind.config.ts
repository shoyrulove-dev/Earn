import type { Config } from "tailwindcss";
const config: Config = { darkMode: ["class"], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#151026", panel: "#211936", neon: "#a970ff", primary: "hsl(var(--primary))", reward: "#fbbf24" }, boxShadow: { glow: "0 0 28px rgba(169,112,255,.28)" } } }, plugins: [] };
export default config;
