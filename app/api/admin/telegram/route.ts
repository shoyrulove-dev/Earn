import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

const chats = {
  news: process.env.TELEGRAM_NEWS_CHAT_ID || "-1004353318290",
  community: process.env.TELEGRAM_COMMUNITY_CHAT_ID || "-5467216486",
};

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    channels: [
      { key: "news", name: "Pure Earn News", username: "@pureearnglobal", url: "https://t.me/pureearnglobal" },
      { key: "community", name: "PureEarn Community", username: "@pureearngroup", url: "https://t.me/pureearngroup" },
    ],
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 503 });

  const body = await request.json();
  const text = String(body.text || "").trim();
  const target = String(body.target || "news") as "news" | "community" | "both";
  if (!text || text.length > 4096) return NextResponse.json({ error: "Message must contain 1–4096 characters" }, { status: 400 });
  if (!["news", "community", "both"].includes(target)) return NextResponse.json({ error: "Invalid Telegram target" }, { status: 400 });

  const destinations = target === "both" ? [chats.news, chats.community] : [chats[target]];
  const results = await Promise.all(destinations.map(async chat_id => {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id, text, disable_web_page_preview: false }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.description || "Telegram rejected the message");
    return { chatId: chat_id, messageId: payload.result.message_id };
  }));

  return NextResponse.json({ ok: true, results });
}

export async function PUT() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 503 });
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache:"no-store" }).then(r=>r.json());
  if (!me.ok) return NextResponse.json({ error: me.description || "Telegram token rejected" }, { status: 502 });
  const checks = await Promise.all(Object.entries(chats).map(async ([key,chat_id])=>{const data=await fetch(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${chat_id}&user_id=${me.result.id}`,{cache:"no-store"}).then(r=>r.json());return {key,ok:Boolean(data.ok),status:data.result?.status||data.description};}));
  return NextResponse.json({ ok:checks.every(x=>x.ok&&["administrator","creator"].includes(x.status)), bot:`@${me.result.username}`, checks });
}

