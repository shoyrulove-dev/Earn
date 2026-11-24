import net from "node:net";

export function cpxClientIp(request: Request) {
  const candidates = [
    request.headers.get("x-forwarded-for")?.split(",")[0],
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
  ];
  for (const raw of candidates) {
    let value = String(raw || "").trim();
    if (value.startsWith("::ffff:")) value = value.slice(7);
    if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(value)) value = value.replace(/:\d+$/, "");
    if (net.isIP(value)) return value;
  }
  return null;
}
