import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { ensureUserIdentity } from "@/lib/user-identity";
import { cookies } from "next/headers";
import { createWelcomeReward } from "@/lib/referrals";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/security";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email or username",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const h = await headers();
        const ip = String(h.get("x-forwarded-for") || h.get("x-real-ip") || "unknown").split(",")[0].trim();
        const login = String(credentials.email).toLowerCase().trim();
        const limited = await rateLimit("login", `${ip}:${login}`, 10, 15 * 60 * 1000);
        if (!limited.allowed) throw new Error("Too many login attempts");
        await connectDB();
        const user = (await User.findOne({
          $or: [{ email: login }, { username: login }],
        }).lean()) as {
          _id: unknown;
          email: string;
          name?: string;
          image?: string;
          passwordHash?: string;
          role?: string;
        } | null;
        if (
          !user?.passwordHash ||
          !(await bcrypt.compare(credentials.password, user.passwordHash))
        )
          return null;
        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        } as never;
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      await connectDB();
      const email = user.email.toLowerCase();
      const existing = await User.findOne({ email }).select("_id referredBy");
      const admin = process.env.ADMIN_EMAIL?.toLowerCase() === email;
      const dbUser = await User.findOneAndUpdate(
        { email },
        {
          $set: {
            name: user.name,
            image: user.image,
            ...(account?.provider === "google" ? { emailVerifiedAt: new Date() } : {}),
            ...(admin ? { role: "admin" } : {}),
          },
          $setOnInsert: { email },
        },
        { upsert: true, new: true },
      );
      await ensureUserIdentity(dbUser);
      if (!existing && account?.provider === "google") {
        const referralCode = (await cookies()).get("pureearn_ref")?.value;
        if (referralCode) {
          const referrer = await User.findOne({
            referralCode: referralCode.trim().toUpperCase(),
            _id: { $ne: dbUser._id },
          }).select("_id");
          if (referrer) {
            dbUser.referredBy = referrer._id;
            await dbUser.save();
            await createWelcomeReward(dbUser._id, referrer._id);
          }
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        await connectDB();
        const dbUser = (await User.findOne({
          email: session.user.email.toLowerCase(),
        }).lean()) as { _id: unknown; role?: string } | null;
        if (dbUser) {
          session.user.id = String(dbUser._id);
          (session.user as typeof session.user & { role?: string }).role =
            dbUser.role;
        }
      }
      return session;
    },
  },
};
export const getAuthSession = () => getServerSession(authOptions);
