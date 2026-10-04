"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle2, ChevronRight, CircleDollarSign, Home, LayoutGrid, UserRound, WalletCards } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const offers = [
  { name: "Discover PureHub", source: "MINIJOB", reward: "$1.20", icon: "P", tone: "bg-violet-500 text-white", tag: "New" },
  { name: "Create a FinPay account", source: "ACCESS TRADE", reward: "$2.50", icon: "F", tone: "bg-blue-400 text-blue-950", tag: "Hot" },
  { name: "Watch a video and earn", source: "TIMEWALL", reward: "$0.50", icon: "▶", tone: "bg-violet-400 text-violet-950", tag: "1 min" },
];

const tabs = [{ label: "Home", icon: Home }, { label: "Tasks", icon: LayoutGrid }, { label: "Wallet", icon: WalletCards }, { label: "Profile", icon: UserRound }];

export default function HomePage() {
  const [active, setActive] = useState("Home");
  const [balance, setBalance] = useState(12.48);
  return <main className="mx-auto h-screen w-full max-w-md overflow-hidden bg-ink shadow-2xl shadow-violet-950/20">
    <div className="h-full overflow-y-auto pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-ink/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3"><Image src="/icon.svg" alt="Pure Earn" width={40} height={40} priority className="rounded-2xl shadow-glow"/><div><p className="text-xs text-slate-400">Good morning,</p><p className="font-semibold">Minh Anh <span className="text-neon">✦</span></p></div></div>
        <button className="relative rounded-full border border-white/10 p-2.5 text-slate-300"><Bell size={19}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-neon"/></button>
      </header>
      <section className="px-5 pt-6"><p className="mb-2 text-sm text-slate-400">Available balance</p><div className="flex items-end justify-between"><div><motion.p key={balance} initial={{ opacity: .3, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight">${balance.toFixed(2)}</motion.p><p className="mt-2 flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={13}/> +$4.20 this week</p></div><button onClick={() => setBalance((v) => v + .5)} className="rounded-xl bg-neon px-3 py-2 text-xs font-bold text-ink shadow-glow">+ Test reward</button></div></section>
      <section className="mx-5 mt-7 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#21163b] to-panel p-5 shadow-glow"><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-widest text-neon">Daily goal</p><p className="mt-2 text-lg font-semibold">Keep your earning streak</p></div><CircleDollarSign className="text-reward" size={28}/></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-2 w-2/3 rounded-full bg-neon"/></div><p className="mt-2 text-xs text-slate-400">4 of 6 tasks completed today</p></section>
      <section className="px-5 pt-8"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-bold">Tasks picked for you</h2><p className="mt-1 text-sm text-slate-400">Complete quickly and earn instantly</p></div><button className="text-sm font-medium text-neon">View all</button></div><div className="space-y-3">{offers.map((offer) => <motion.button whileTap={{ scale: .98 }} key={offer.name} className="group flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-panel p-3 text-left shadow-lg shadow-black/10 transition-colors duration-200 hover:border-violet-400/70"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-black ${offer.tone}`}>{offer.icon}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{offer.name}</span><span className="mt-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500"><span>{offer.source}</span><span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">{offer.tag}</span></span></span><span className="flex items-center gap-1 rounded-xl bg-neon px-2.5 py-2 text-xs font-bold text-white shadow-glow">+{offer.reward}<ChevronRight size={14}/></span></motion.button>)}</div></section>
    </div>
    <nav className="fixed bottom-0 z-20 w-full max-w-md border-t border-white/10 bg-[#0d1119]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"> <div className="flex justify-around">{tabs.map(({label, icon: Icon}) => <button key={label} onClick={() => setActive(label)} className={`relative flex min-w-[64px] flex-col items-center gap-1 text-[10px] transition ${active === label ? "text-neon" : "text-slate-500"}`}><Icon size={20} strokeWidth={active === label ? 2.5 : 1.8}/>{label}{active === label && <motion.span layoutId="active-dot" className="absolute -bottom-3 h-1 w-1 rounded-full bg-neon"/>}</button>)}</div></nav>
  </main>;
}
