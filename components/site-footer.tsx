"use client";
import{usePathname}from"next/navigation";
export default function SiteFooter(){if(usePathname()!=="/")return null;return <footer className="relative flex flex-wrap justify-center gap-5 border-t border-white/10 bg-[#17112b] px-4 py-7 text-xs text-slate-400"><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/faq">FAQ</a><a href="/support">Support</a><span>A PureHub Product · © 2026</span></footer>}
