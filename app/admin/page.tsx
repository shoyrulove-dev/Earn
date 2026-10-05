"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, ClipboardCheck, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";

type Submission = { _id: string; proofUrl: string; userId?: { email?: string; name?: string }; minijobId?: { title?: string; reward?: number } };
type Stats = { users: number; minijobs: number; pending: number };

export default function AdminPage() {
  const [items,setItems] = useState<Submission[]>([]);
  const [stats,setStats] = useState<Stats|null>(null);
  const [message,setMessage] = useState("");
  const [telegramText,setTelegramText] = useState("");
  const [telegramTarget,setTelegramTarget] = useState("news");
  const [telegramReady,setTelegramReady] = useState(false);
  const [sending,setSending] = useState(false);

  async function load() {
    const [submissions, summary, telegram] = await Promise.all([
      fetch("/api/admin/submissions"),
      fetch("/api/admin/stats"),
      fetch("/api/admin/telegram"),
    ]);
    if (!submissions.ok) return setMessage("Admin access required");
    setItems((await submissions.json()).submissions || []);
    if (summary.ok) setStats(await summary.json());
    if (telegram.ok) setTelegramReady((await telegram.json()).configured);
  }

  async function review(id:string,status:"approved"|"rejected") {
    const res=await fetch("/api/admin/submissions",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id,status})});
    if(res.ok){setMessage(`Submission ${status}`);load()}else setMessage("Review failed");
  }

  async function publish() {
    setSending(true);
    setMessage("");
    const res = await fetch("/api/admin/telegram", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ text:telegramText, target:telegramTarget }) });
    const data = await res.json();
    setMessage(res.ok ? "Telegram post published successfully." : data.error || "Telegram publish failed");
    if (res.ok) setTelegramText("");
    setSending(false);
  }

  useEffect(()=>{load()},[]);

  return <main className="min-h-screen bg-[#100b1f] p-5 text-white md:p-10"><div className="mx-auto max-w-6xl">
    <header className="flex items-center justify-between"><div><p className="flex items-center gap-2 text-xs uppercase tracking-[.24em] text-violet-300"><ShieldCheck size={16}/> Pure Earn Admin</p><h1 className="mt-2 text-3xl font-bold">Operations dashboard</h1><p className="mt-2 text-slate-400">Manage rewards, proofs and official communications.</p></div><button onClick={load} className="rounded-xl border border-white/10 p-3 text-slate-300"><RefreshCw size={18}/></button></header>
    {message&&<p className="mt-5 rounded-xl border border-violet-400/20 bg-violet-400/10 p-3 text-sm text-violet-100">{message}</p>}
    <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat icon={<Users/>} label="Users" value={String(stats?.users??"—")}/><Stat icon={<BriefcaseBusiness/>} label="Active minijobs" value={String(stats?.minijobs??"—")}/><Stat icon={<ClipboardCheck/>} label="Pending proofs" value={String(stats?.pending??items.length)}/><Stat icon={<ShieldCheck/>} label="System" value="Online"/></section>

    <section className="mt-8 rounded-2xl border border-white/10 bg-[#211737] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Telegram Publisher</h2><p className="mt-1 text-sm text-slate-400">Publish announcements to Pure Earn News and Community.</p></div><span className={`rounded-full px-3 py-1 text-xs ${telegramReady?"bg-emerald-400/15 text-emerald-300":"bg-amber-400/15 text-amber-200"}`}>{telegramReady?"Bot connected":"Token required"}</span></div>
      <div className="mt-4 flex flex-wrap gap-2">{[["news","News · @pureearnglobal"],["community","Community · @pureearngroup"],["both","Post to both"]].map(([key,label])=><button key={key} onClick={()=>setTelegramTarget(key)} className={`rounded-xl px-4 py-2 text-sm ${telegramTarget===key?"bg-violet-500":"bg-white/5"}`}>{label}</button>)}</div>
      <textarea value={telegramText} onChange={e=>setTelegramText(e.target.value)} maxLength={4096} rows={6} className="field mt-3 resize-y" placeholder="Write an announcement..."/>
      <div className="mt-2 flex items-center justify-between"><small className="text-slate-500">{telegramText.length}/4096</small><button disabled={sending||!telegramText.trim()} onClick={publish} className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold disabled:opacity-40"><Send size={16}/>{sending?"Publishing...":"Publish"}</button></div>
    </section>

    <section className="mt-8 rounded-2xl border border-white/10 bg-[#211737] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Pending proof reviews</h2><span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200">{items.length} pending</span></div><div className="mt-5 space-y-3">{items.length===0?<p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-500">No pending submissions.</p>:items.map(item=><article key={item._id} className="flex flex-col gap-4 rounded-xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{item.minijobId?.title||"Minijob submission"}</p><p className="mt-1 text-sm text-slate-400">{item.userId?.email||item.userId?.name||"User"}</p><a className="mt-2 inline-block text-xs text-violet-300 underline" href={item.proofUrl} target="_blank" rel="noreferrer">Open proof</a></div><div className="flex gap-2"><button onClick={()=>review(item._id,"rejected")} className="rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300">Reject</button><button onClick={()=>review(item._id,"approved")} className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold">Approve</button></div></article>)}</div></section>
  </div></main>;
}

function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) {
  return <div className="rounded-2xl border border-white/10 bg-[#211737] p-4"><div className="text-violet-300">{icon}</div><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}

