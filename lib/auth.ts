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
        const adminUsername = String(process.env.ADMIN_USERNAME || "").toLowerCase().trim();
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH_B64
          ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8")
          : String(process.env.ADMIN_PASSWORD_HASH || "");
        if (adminUsername && login === adminUsername) {
          const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase().trim();
          const existingAdmin = adminEmail
            ? await User.findOne({ email: adminEmail }).select("+passwordHash")
            : null;
          const validDatabasePassword = Boolean(
            existingAdmin?.passwordHash &&
            (await bcrypt.compare(credentials.password, existingAdmin.passwordHash)),
          );
          const validFallbackPassword = Boolean(
            adminPasswordHash &&
            (await bcrypt.compare(credentials.password, adminPasswordHash)),
          );
          if (!validDatabasePassword && !validFallbackPassword) return null;
          const adminUser = (existingAdmin || (adminEmail
            ? await User.findOneAndUpdate(
                { email: adminEmail },
                { $set: { role: "admin" }, $setOnInsert: { email: adminEmail, name: "Pure Earn Admin", username: adminUsername, emailVerifiedAt: new Date() } },
                { new: true, upsert: true },
              )
            : null)) as { _id: unknown; email?: string; name?: string; image?: string; role?: string } | null;
          if (!adminUser) return null;
          if (adminUser.role !== "admin") await User.updateOne({ _id: adminUser._id }, { $set: { role: "admin" } });
          return {
            id: String(adminUser._id),
            email: adminUser.email,
            name: adminUser.name || "Pure Earn Admin",
            image: adminUser.image,
            role: "admin",
          } as never;
        }
        const user = (await User.findOne({
          $or: [{ email: login }, { username: login }],
        }).lean()) as {
          _id: unknown;
          email: string;
          name?: string;
          image?: string;
          passwordHash?: string;
          role?: string;
          accountStatus?: string;
        } | null;
        if (
          !user?.passwordHash || user.accountStatus === "suspended" ||
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
      const existing = await User.findOne({ email }).select("_id referredBy accountStatus");
      if (existing?.accountStatus === "suspended") return false;
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
      user.id = String(dbUser._id);
      (user as typeof user & { role?: string }).role = dbUser.role || "user";
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
    async jwt({ token, user }) {
      if (user) {
        token.userId = String(user.id || "");
        token.role = (user as typeof user & { role?: string }).role || "user";
      }
      if ((!token.userId || !/^[a-f0-9]{24}$/i.test(String(token.userId))) && token.email) {
        await connectDB();
        const dbUser = (await User.findOne({ email: String(token.email).toLowerCase() })
          .select("_id role")
          .lean()) as { _id?: unknown; role?: string } | null;
        if (dbUser?._id) {
          token.userId = String(dbUser._id);
          token.role = dbUser.role || "user";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId || token.sub || "");
        (session.user as typeof session.user & { role?: string }).role =
          String(token.role || "user");
      }
      return session;
    },
  },
};
export const getAuthSession = () => getServerSession(authOptions);
