"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Locale = "en" | "vi" | "zh" | "es";

const footerCopy = {
  en: { terms: "Terms of Service", privacy: "Privacy Policy", faq: "FAQ", support: "Support", product: "A PureHub Product" },
  vi: { terms: "Điều khoản dịch vụ", privacy: "Chính sách bảo mật", faq: "Câu hỏi thường gặp", support: "Hỗ trợ", product: "Một sản phẩm của PureHub" },
  zh: { terms: "服务条款", privacy: "隐私政策", faq: "常见问题", support: "客户支持", product: "PureHub 旗下产品" },
  es: { terms: "Términos del servicio", privacy: "Política de privacidad", faq: "Preguntas frecuentes", support: "Soporte", product: "Un producto de PureHub" },
};

export default function SiteFooter() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("pureearn_locale") as Locale | null;
    if (saved && saved in footerCopy) setLocale(saved);
    const update = (event: Event) => {
      const next = (event as CustomEvent<Locale>).detail;
      if (next && next in footerCopy) setLocale(next);
    };
    window.addEventListener("pureearn:locale", update);
    return () => window.removeEventListener("pureearn:locale", update);
  }, []);

  if (pathname !== "/") return null;
  const t = footerCopy[locale];

  return (
    <footer className="relative flex flex-wrap justify-center gap-x-5 gap-y-3 border-t border-white/10 bg-[#17112b] px-4 py-7 text-xs text-slate-400">
      <a href="/terms">{t.terms}</a>
      <a href="/privacy">{t.privacy}</a>
      <a href="/faq">{t.faq}</a>
      <a href="/support">{t.support}</a>
      <span>{t.product} · © 2026</span>
    </footer>
  );
}

