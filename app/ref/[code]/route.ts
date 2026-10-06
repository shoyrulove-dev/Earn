import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const target = new URL("/", request.url);
  target.searchParams.set("ref", String(code || "").trim());
  return NextResponse.redirect(target, 307);
}
