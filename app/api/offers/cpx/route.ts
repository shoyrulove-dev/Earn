import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { cpxClientIp } from "@/lib/cpx";

const CPX_API = "https://live-api.cpx-research.com/api/get-surveys.php";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appId = process.env.CPX_APP_ID;
  const secure = process.env.CPX_SECURE_HASH;
  if (!appId || !secure) return NextResponse.json({ error: "CPX is not configured" }, { status: 503 });

  await connectDB();
  const user = (await User.findById(session.user.id).select("userId").lean()) as { userId?: string } | null;
  const userId = String(user?.userId || session.user.id);
  const clientIp = cpxClientIp(request);
  if (!clientIp) return NextResponse.json({ error: "Unable to identify a valid client IP" }, { status: 400 });
  const url = new URL(CPX_API);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("ext_user_id", userId);
  url.searchParams.set("output_method", "api");
  url.searchParams.set("ip_user", clientIp);
  url.searchParams.set("subid_1", "pureearn");
  url.searchParams.set("subid_2", "web");
  url.searchParams.set("user_agent", request.headers.get("user-agent") || "");
  url.searchParams.set("limit", "12");
  url.searchParams.set("secure_hash", crypto.createHash("md5").update(`${userId}-${secure}`).digest("hex"));

  // CPX recommends refreshing API inventory at most every 120 seconds.
  // The URL is unique per member/IP, so this keeps a stable short-lived
  // snapshot without mixing survey inventories between members.
  const response = await fetch(url, { next: { revalidate: 120 } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: "CPX survey API unavailable" }, { status: 503 });
  return NextResponse.json(
    { ok: true, surveys: Array.isArray(body) ? body : body.data || body.surveys || [], currency: "PHT", factor: Number(process.env.CPX_CURRENCY_FACTOR || 400) },
    { headers: { "Cache-Control": "private, max-age=120" } },
  );
}
