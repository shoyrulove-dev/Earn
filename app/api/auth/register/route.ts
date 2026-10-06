import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { ensureUserIdentity } from "@/lib/user-identity";
import User from "@/models/User";
import { normalizeCountry } from "@/lib/countries";
import crypto from "node:crypto";
import { createWelcomeReward } from "@/lib/referrals";
import { rateLimit, requestIp, secureHash, verifyTurnstile } from "@/lib/security";
import { sendVerificationEmail } from "@/lib/email";

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
    turnstileToken,
  } = await request.json();
  const ip = requestIp(request);
  const limited = await rateLimit("register", ip, 5, 60 * 60 * 1000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many registrations. Please try again later." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  if (!(await verifyTurnstile(turnstileToken, ip))) return NextResponse.json({ error: "Security check failed. Please try again." }, { status: 400 });
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
  const signupIpHash = ip
    ? crypto
        .createHash("sha256")
        .update(`${process.env.AUTH_SECRET || "pureearn"}:${ip}`)
        .digest("hex")
    : undefined;
  const referrer = referralCode
    ? await User.findOne({
        referralCode: String(referralCode).trim().toUpperCase(),
      }).select("_id +signupIpHash")
    : null;
  const passwordHash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const user = await User.create({
    name: name?.trim() || handle || normalized.split("@")[0],
    ...(handle ? { username: handle } : {}),
    email: normalized,
    passwordHash,
    emailVerificationTokenHash: secureHash(verificationToken),
    emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    referredBy: referrer?._id,
    signupIpHash,
    referralRisk:
      referrer?.signupIpHash && signupIpHash === referrer.signupIpHash
        ? ["shared-signup-ip"]
        : [],
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
  if (referrer?._id) await createWelcomeReward(user._id, referrer._id);
  const verificationEmailSent = await sendVerificationEmail(normalized, verificationToken);
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
      verificationEmailSent,
    },
    { status: 201 },
  );
}
