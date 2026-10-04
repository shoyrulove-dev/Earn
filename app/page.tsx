"use client";

import { motion } from "@/components/motion";
import { Bell, CheckCircle2, ChevronRight, CircleDollarSign, Globe2, Home, LayoutGrid, UserRound, WalletCards } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type Locale = "en" | "zh" | "vi" | "es";
const locales: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" }, { code: "zh", label: "简体中文", short: "中文" },
  { code: "vi", label: "Tiếng Việt", short: "VI" }, { code: "es", label: "Español", short: "ES" },
];

const copy = {
  en: { greeting: "Good morning", balance: "Available balance", week: "this week", test: "Test reward", goal: "Daily goal", streak: "Keep your earning streak", progress: "4 of 6 tasks completed today", heading: "Tasks picked for you", sub: "Complete quickly and earn instantly", all: "View all", moreLanguages: "More languages", poweredBy: "Powered by Google Translate", tabs: ["Home", "Tasks", "Wallet", "Profile"], offers: [["Discover PureHub", "New"], ["Create a FinPay account", "Hot"], ["Watch a video and earn", "1 min"]] },
  zh: { greeting: "早上好", balance: "可用余额", week: "本周", test: "测试奖励", goal: "每日目标", streak: "保持您的赚钱连胜", progress: "今天已完成 4/6 个任务", heading: "为您推荐的任务", sub: "快速完成，即时获得奖励", all: "查看全部", moreLanguages: "更多语言", poweredBy: "由 Google 翻译提供支持", tabs: ["首页", "任务", "钱包", "我的"], offers: [["探索 PureHub", "新"], ["创建 FinPay 账户", "热门"], ["观看视频并赚取奖励", "1 分钟"]] },
  vi: { greeting: "Chào buổi sáng", balance: "Số dư khả dụng", week: "tuần này", test: "Thử phần thưởng", goal: "Mục tiêu hôm nay", streak: "Giữ nhịp kiếm tiền", progress: "Đã hoàn thành 4/6 nhiệm vụ hôm nay", heading: "Nhiệm vụ dành cho bạn", sub: "Hoàn thành nhanh, nhận thưởng ngay", all: "Xem tất cả", moreLanguages: "Ngôn ngữ khác", poweredBy: "Dịch bằng Google Translate", tabs: ["Trang chủ", "Nhiệm vụ", "Ví", "Cá nhân"], offers: [["Khám phá PureHub", "Mới"], ["Tạo tài khoản FinPay", "Hot"], ["Xem video và nhận thưởng", "1 phút"]] },
  es: { greeting: "Buenos días", balance: "Saldo disponible", week: "esta semana", test: "Probar recompensa", goal: "Meta diaria", streak: "Mantén tu racha de ganancias", progress: "4 de 6 tareas completadas hoy", heading: "Tareas para ti", sub: "Completa rápido y gana al instante", all: "Ver todo", moreLanguages: "Más idiomas", poweredBy: "Traducido con Google Translate", tabs: ["Inicio", "Tareas", "Cartera", "Perfil"], offers: [["Descubre PureHub", "Nuevo"], ["Crea una cuenta FinPay", "Popular"], ["Mira un vídeo y gana", "1 min"]] },
} satisfies Record<Locale, Record<string, unknown>>;

const offerMeta = [
  { source: "MINIJOB", reward: "$1.20", icon: "P", tone: "bg-violet-500 text-white" },
  { source: "ACCESS TRADE", reward: "$2.50", icon: "F", tone: "bg-blue-400 text-blue-950" },
  { source: "TIMEWALL", reward: "$0.50", icon: "▶", tone: "bg-violet-400 text-violet-950" },
];
const tabIcons = [Home, LayoutGrid, WalletCards, UserRound];

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [balance, setBalance] = useState(12.48);
  const t = copy[locale];

  useEffect(() => { const saved = localStorage.getItem("pureearn-selected-locale") as Locale | null; if (saved && saved in copy) setLocale(saved); }, []);
  function selectLocale(next: Locale) { setLocale(next); localStorage.setItem("pureearn-selected-locale", next); document.documentElement.lang = next === "zh" ? "zh-CN" : next; setLanguageOpen(false); }
  function openGoogleTranslate() { const url = encodeURIComponent(window.location.href); window.open(`https://translate.google.com/?sl=en&op=websites&u=${url}`, "_blank", "noopener,noreferrer"); setLanguageOpen(false); }

  return <main className="mx-auto h-screen w-full max-w-md overflow-hidden bg-ink shadow-2xl shadow-violet-950/30">
    <div className="h-full overflow-y-auto pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-violet-200/10 bg-ink/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3"><Image src="/icon.svg" alt="Pure Earn" width={40} height={40} priority className="rounded-2xl shadow-glow"/><div><p className="text-xs text-slate-400">{t.greeting},</p><p className="font-semibold">Minh Anh <span className="text-neon">✦</span></p></div></div>
        <div className="flex items-center gap-2"><div className="relative"><button onClick={() => setLanguageOpen(!languageOpen)} aria-label="Change language" className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-2 text-xs font-semibold text-slate-300"><Globe2 size={17}/>{locales.find((item) => item.code === locale)?.short}</button>{languageOpen && <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-white/10 bg-panel p-1 shadow-2xl">{locales.map((item) => <button key={item.code} onClick={() => selectLocale(item.code)} className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm ${locale === item.code ? "bg-violet-500 text-white" : "text-slate-300 hover:bg-white/5"}`}>{item.label}</button>)}<div className="my-1 border-t border-white/10"/><button onClick={openGoogleTranslate} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"><span className="block">{t.moreLanguages}</span><span className="mt-0.5 block text-[10px] text-slate-500">{t.poweredBy}</span></button></div>}</div><button aria-label="Notifications" className="relative rounded-full border border-white/10 p-2.5 text-slate-300"><Bell size={19}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-neon"/></button></div>
      </header>
      <section className="px-5 pt-6"><p className="mb-2 text-sm text-slate-400">{t.balance}</p><div className="flex items-end justify-between"><div><motion.p key={balance} initial={{ opacity: .3, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight">${balance.toFixed(2)}</motion.p><p className="mt-2 flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={13}/> +$4.20 {t.week}</p></div><button onClick={() => setBalance((v) => v + .5)} className="rounded-xl bg-neon px-3 py-2 text-xs font-bold text-white shadow-glow">+ {t.test}</button></div></section>
      <section className="mx-5 mt-7 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#21163b] to-panel p-5 shadow-glow"><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-widest text-neon">{t.goal}</p><p className="mt-2 text-lg font-semibold">{t.streak}</p></div><CircleDollarSign className="text-reward" size={28}/></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-2 w-2/3 rounded-full bg-neon"/></div><p className="mt-2 text-xs text-slate-400">{t.progress}</p></section>
      <section className="px-5 pt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">{t.heading}</h2><p className="mt-1 text-sm text-slate-400">{t.sub}</p></div><button className="shrink-0 text-sm font-medium text-neon">{t.all}</button></div><div className="space-y-3">{offerMeta.map((offer, index) => <motion.button whileTap={{ scale: .98 }} key={offer.source} className="group flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-panel p-3 text-left shadow-lg shadow-black/10 transition-colors duration-200 hover:border-violet-400/70"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-black ${offer.tone}`}>{offer.icon}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{t.offers[index][0]}</span><span className="mt-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500"><span>{offer.source}</span><span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">{t.offers[index][1]}</span></span></span><span className="flex items-center gap-1 rounded-xl bg-neon px-2.5 py-2 text-xs font-bold text-white shadow-glow">+{offer.reward}<ChevronRight size={14}/></span></motion.button>)}</div></section>
    </div>
    <nav className="fixed bottom-0 z-20 w-full max-w-md border-t border-violet-200/15 bg-[#211936]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="flex justify-around">{tabIcons.map((Icon, index) => <button key={index} onClick={() => setActive(index)} className={`relative flex min-w-[64px] flex-col items-center gap-1 text-[10px] transition ${active === index ? "text-neon" : "text-violet-200/60"}`}><Icon size={20} strokeWidth={active === index ? 2.5 : 1.8}/>{t.tabs[index]}{active === index && <motion.span layoutId="active-dot" className="absolute -bottom-3 h-1 w-1 rounded-full bg-neon"/>}</button>)}</div></nav>
  </main>;
}
