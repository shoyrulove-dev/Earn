import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { ensureUserIdentity } from "@/lib/user-identity";
import User from "@/models/User";
import { normalizeCountry } from "@/lib/countries";

export async function POST(request: Request) {
  const {
    name,
    username,
    email,
    password,
    referralCode,
    country,
    countryName,
    locale,
  } = await request.json();
  if (!email || !password || password.length < 8)
    return NextResponse.json(
      { error: "Email and a password of at least 8 characters are required" },
      { status: 400 },
    );
  const normalized = String(email).toLowerCase().trim();
  const handle = username ? String(username).toLowerCase().trim() : "";
  if (handle && !/^[a-z0-9_]{3,24}$/.test(handle))
    return NextResponse.json(
      {
        error:
          "Username must be 3-24 characters: letters, numbers or underscore",
      },
      { status: 400 },
    );
  const countryCode = normalizeCountry(
    country || request.headers.get("x-vercel-ip-country"),
  );
  if (countryCode === "OTHER" && !String(countryName || "").trim())
    return NextResponse.json(
      { error: "Please enter your country or territory" },
      { status: 400 },
    );
  const language = ["en", "vi", "zh", "es"].includes(locale)
    ? locale
    : countryCode === "VN"
      ? "vi"
      : countryCode === "CN"
        ? "zh"
        : countryCode === "ES"
          ? "es"
          : "en";
  await connectDB();
  const conflicts: Record<string, string>[] = [{ email: normalized }];
  if (handle) conflicts.push({ username: handle });
  if (await User.exists({ $or: conflicts }))
    return NextResponse.json(
      { error: "Email or username is already in use" },
      { status: 409 },
    );
  const referrer = referralCode
    ? await User.findOne({
        referralCode: String(referralCode).trim().toUpperCase(),
      }).select("_id")
    : null;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name?.trim() || handle || normalized.split("@")[0],
    ...(handle ? { username: handle } : {}),
    email: normalized,
    passwordHash,
    referredBy: referrer?._id,
    country: countryCode,
    countryName:
      countryCode === "OTHER"
        ? String(countryName || "")
            .trim()
            .slice(0, 80)
        : undefined,
    locale: language,
    role:
      process.env.ADMIN_EMAIL?.toLowerCase() === normalized ? "admin" : "user",
  });
  await ensureUserIdentity(user);
  const ready = await User.findById(user._id);
  return NextResponse.json(
    {
      user: {
        id: ready!.id,
        userId: ready!.userId,
        username: ready!.username,
        email: ready!.email,
        name: ready!.name,
        referralCode: ready!.referralCode,
      },
    },
    { status: 201 },
  );
}
