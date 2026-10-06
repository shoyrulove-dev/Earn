"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";
declare global { interface Window { turnstile?: { render: (node: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void } } }
export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const render = () => { if (sitekey && ref.current && window.turnstile && !widget.current) widget.current = window.turnstile.render(ref.current, { sitekey, theme: "dark", callback: onToken, "expired-callback": () => onToken("") }); };
  useEffect(() => { render(); return () => { if (widget.current && window.turnstile) window.turnstile.remove(widget.current); }; }, []);
  if (!sitekey) return null;
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render}/><div ref={ref} className="min-h-[65px] overflow-hidden rounded-xl"/></>;
}
