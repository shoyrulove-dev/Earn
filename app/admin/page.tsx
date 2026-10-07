"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  ClipboardCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BINGX_DEFAULTS, type BingXConfig } from "@/lib/bingx";

type Submission = {
  _id: string;
  proofUrl: string;
  userId?: { email?: string; name?: string };
  minijobId?: { title?: string; reward?: number };
};
type Stats = { users: number; minijobs: number; pending: number };
type BingXSubmission = {
  _id: string;
  tier: number;
  bingxUid: string;
  proofImageUrl: string;
  rewardPht: number;
  holdDays: number;
  userId?: { email?: string; name?: string; userId?: string };
};
type AdminTransaction = {
  _id: string;
  type: string;
  amount: number;
  source?: string;
  status: string;
  createdAt: string;
  userId?: { email?: string; name?: string; country?: string };
  metadata?: {
    netPht?: number;
    netUsd?: number;
    account?: string;
    bankName?: string;
    accountName?: string;
  };
};

export default function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");
  const [telegramText, setTelegramText] = useState("");
  const [telegramTarget, setTelegramTarget] = useState("news");
  const [telegramReady, setTelegramReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [bingx, setBingx] = useState<BingXConfig>(BINGX_DEFAULTS);
  const [bingxItems, setBingxItems] = useState<BingXSubmission[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [totp, setTotp] = useState("");

  async function load() {
    const [submissions, summary, telegram, bingxData, transactionData] =
      await Promise.all([
        fetch("/api/admin/submissions"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/telegram"),
        fetch("/api/admin/bingx"),
        fetch("/api/admin/transactions"),
      ]);
    if (!submissions.ok) return setMessage("Admin access required");
    setItems((await submissions.json()).submissions || []);
    if (summary.ok) setStats(await summary.json());
    if (telegram.ok) setTelegramReady((await telegram.json()).configured);
    if (bingxData.ok) {
      const d = await bingxData.json();
      setBingx((x) => ({ ...x, ...d.config }));
      setBingxItems(d.submissions || []);
    }
    if (transactionData.ok)
      setTransactions((await transactionData.json()).transactions || []);
  }

  async function review(id: string, status: "approved" | "rejected") {
    const res = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setMessage(`Submission ${status}`);
      load();
    } else setMessage("Review failed");
  }

  async function publish() {
    setSending(true);
    setMessage("");
    const res = await fetch("/api/admin/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: telegramText, target: telegramTarget }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? "Telegram post published successfully."
        : data.error || "Telegram publish failed",
    );
    if (res.ok) setTelegramText("");
    setSending(false);
  }
  async function testTelegram() {
    const r = await fetch("/api/admin/telegram", { method: "PUT" }),
      d = await r.json();
    setMessage(
      r.ok && d.ok
        ? `Telegram ready: ${d.bot}`
        : d.error ||
            `Bot lacks admin rights: ${JSON.stringify(d.checks || [])}`,
    );
  }
  async function saveBingX() {
    const r = await fetch("/api/admin/bingx", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bingx),
      }),
      d = await r.json();
    setMessage(r.ok ? "BingX settings saved." : d.error || "Save failed");
    if (r.ok) load();
  }
  async function reviewBingX(id: string, status: "approved" | "rejected") {
    const r = await fetch("/api/admin/bingx", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      }),
      d = await r.json();
    setMessage(
      r.ok ? `BingX submission ${status}.` : d.error || "Review failed",
    );
    if (r.ok) load();
  }
  async function reviewTransaction(
    id: string,
    status: "approved" | "rejected",
  ) {
    const r = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status, totp }),
      }),
      d = await r.json();
    setMessage(r.ok ? `Transaction ${status}.` : d.error || "Review failed");
    if (r.ok) {
      setTotp("");
      load();
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#100b1f] p-5 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[.24em] text-violet-300">
              <ShieldCheck size={16} /> Pure Earn Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold">Operations dashboard</h1>
            <p className="mt-2 text-slate-400">
              Manage rewards, proofs and official communications.
            </p>
          </div>
          <button
            onClick={load}
            className="rounded-xl border border-white/10 p-3 text-slate-300"
          >
            <RefreshCw size={18} />
          </button>
        </header>
        {message && (
          <p className="mt-5 rounded-xl border border-violet-400/20 bg-violet-400/10 p-3 text-sm text-violet-100">
            {message}
          </p>
        )}
        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            icon={<Users />}
            label="Users"
            value={String(stats?.users ?? "—")}
          />
          <Stat
            icon={<BriefcaseBusiness />}
            label="Active minijobs"
            value={String(stats?.minijobs ?? "—")}
          />
          <Stat
            icon={<ClipboardCheck />}
            label="Pending proofs"
            value={String(stats?.pending ?? items.length)}
          />
          <Stat icon={<ShieldCheck />} label="System" value="Online" />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#211737] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Telegram Publisher</h2>
              <p className="mt-1 text-sm text-slate-400">
                Publish announcements to Pure Earn News and Community.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${telegramReady ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}
            >
              {telegramReady ? "Bot connected" : "Token required"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["news", "News · @pureearnglobal"],
              ["community", "Community · @pureearngroup"],
              ["both", "Post to both"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTelegramTarget(key)}
                className={`rounded-xl px-4 py-2 text-sm ${telegramTarget === key ? "bg-violet-500" : "bg-white/5"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={telegramText}
            onChange={(e) => setTelegramText(e.target.value)}
            maxLength={4096}
            rows={6}
            className="field mt-3 resize-y"
            placeholder="Write an announcement..."
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={testTelegram}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs"
            >
              Test bot & admin rights
            </button>
            <small className="text-slate-500">{telegramText.length}/4096</small>
            <button
              disabled={sending || !telegramText.trim()}
              onClick={publish}
              className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold disabled:opacity-40"
            >
              <Send size={16} />
              {sending ? "Publishing..." : "Publish"}
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-cyan-300/15 bg-[#18243b] p-5">
          <h2 className="text-xl font-semibold">BingX tiered program</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure KYC, deposit and trading-volume milestones. Every tier is
            manually reconciled before its reward enters the pending balance.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              className="field"
              value={bingx.affiliateId || ""}
              onChange={(e) =>
                setBingx({ ...bingx, affiliateId: e.target.value })
              }
              placeholder="BingX affiliate ID / code"
            />
            <input
              className="field"
              value={bingx.affiliateUrl || ""}
              onChange={(e) =>
                setBingx({ ...bingx, affiliateUrl: e.target.value })
              }
              placeholder="https://bingx.com/invite/..."
            />
            <input
              className="field md:col-span-2"
              value={bingx.mysteryBox || ""}
              onChange={(e) =>
                setBingx({ ...bingx, mysteryBox: e.target.value })
              }
              placeholder="Partner benefit disclosure"
            />
            <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
              {([1, 2, 3] as const).map((tier) => {
                const key = String(tier) as "1" | "2" | "3";
                const item = bingx.tiers[key];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-white/10 bg-black/10 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <b>Tier {tier}</b>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={(e) =>
                            setBingx({
                              ...bingx,
                              tiers: {
                                ...bingx.tiers,
                                [key]: { ...item, active: e.target.checked },
                              },
                            })
                          }
                        />
                        Active
                      </label>
                    </div>
                    <input
                      className="field mt-3"
                      type="number"
                      min="0"
                      value={item.rewardPht}
                      onChange={(e) =>
                        setBingx({
                          ...bingx,
                          tiers: {
                            ...bingx.tiers,
                            [key]: {
                              ...item,
                              rewardPht: Number(e.target.value),
                            },
                          },
                        })
                      }
                      placeholder="Reward PHT"
                    />
                    <input
                      className="field mt-2"
                      type="number"
                      min="1"
                      max="60"
                      value={item.holdDays}
                      onChange={(e) =>
                        setBingx({
                          ...bingx,
                          tiers: {
                            ...bingx.tiers,
                            [key]: {
                              ...item,
                              holdDays: Number(e.target.value),
                            },
                          },
                        })
                      }
                      placeholder="Hold days"
                    />
                    <textarea
                      className="field mt-2 resize-y"
                      rows={3}
                      value={item.requirement}
                      onChange={(e) =>
                        setBingx({
                          ...bingx,
                          tiers: {
                            ...bingx.tiers,
                            [key]: { ...item, requirement: e.target.value },
                          },
                        })
                      }
                      placeholder="Requirement"
                    />
                  </div>
                );
              })}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(bingx.active)}
                onChange={(e) =>
                  setBingx({ ...bingx, active: e.target.checked })
                }
              />{" "}
              Publish program after affiliate URL is saved
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(bingx.autoAnnounce)}
                onChange={(e) =>
                  setBingx({ ...bingx, autoAnnounce: e.target.checked })
                }
              />{" "}
              Auto-post to Pure Earn News on first activation or link change
            </label>
            <button
              onClick={saveBingX}
              className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#101a2d] md:col-span-2"
            >
              Save BingX program
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {bingxItems.map((x) => (
              <article
                key={x._id}
                className="rounded-xl border border-white/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <b>{x.userId?.email || x.userId?.name}</b>
                    <p className="text-sm text-slate-400">
                      Tier {x.tier} · UID: {x.bingxUid} · {x.rewardPht} PHT ·{" "}
                      {x.holdDays} days
                    </p>
                    <a
                      href={x.proofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-300 underline"
                    >
                      Open Tier {x.tier} proof
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewBingX(x._id, "rejected")}
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => reviewBingX(x._id, "approved")}
                      className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-bold text-[#101a2d]"
                    >
                      Approve Tier {x.tier}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#211737] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending proof reviews</h2>
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200">
              {items.length} pending
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-500">
                No pending submissions.
              </p>
            ) : (
              items.map((item) => (
                <article
                  key={item._id}
                  className="flex flex-col gap-4 rounded-xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {item.minijobId?.title || "Minijob submission"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.userId?.email || item.userId?.name || "User"}
                    </p>
                    <a
                      className="mt-2 inline-block text-xs text-violet-300 underline"
                      href={item.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open proof
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => review(item._id, "rejected")}
                      className="rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => review(item._id, "approved")}
                      className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold"
                    >
                      Approve
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#211737] p-4">
      <div className="text-violet-300">{icon}</div>
      <p className="mt-4 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
