"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { countryOptions, normalizeCountry } from "@/lib/countries";

const words = {
  en: {
    tag: "Your rewards, your way",
    title: "Small tasks. Real rewards.",
    intro:
      "Complete trusted offers, grow your PHT balance and cash out securely.",
    start: "Create your account",
    login: "Sign in to Pure Earn",
    create: "Create account",
    signin: "Sign in",
    country: "Country or region",
    free: "Free to join",
    secure: "Secure wallet",
    google: "Continue with Google",
    user: "Username (optional — we can create one)",
    name: "Full name",
    email: "Email",
    loginId: "Email or username",
    password: "Password (8+ characters)",
    or: "OR",
  },
  vi: {
    tag: "Phần thưởng theo cách của bạn",
    title: "Nhiệm vụ nhỏ. Phần thưởng thật.",
    intro: "Hoàn thành ưu đãi uy tín, tích lũy PHT và rút thưởng an toàn.",
    start: "Tạo tài khoản",
    login: "Đăng nhập Pure Earn",
    create: "Đăng ký",
    signin: "Đăng nhập",
    country: "Quốc gia hoặc khu vực",
    free: "Tham gia miễn phí",
    secure: "Ví bảo mật",
    google: "Tiếp tục với Google",
    user: "Tên người dùng (không bắt buộc)",
    name: "Họ và tên",
    email: "Email",
    loginId: "Email hoặc tên người dùng",
    password: "Mật khẩu (từ 8 ký tự)",
    or: "HOẶC",
  },
  zh: {
    tag: "你的奖励，由你决定",
    title: "小任务，真实奖励。",
    intro: "完成可信任务，积累 PHT 并安全提现。",
    start: "创建账户",
    login: "登录 Pure Earn",
    create: "注册",
    signin: "登录",
    country: "国家或地区",
    free: "免费加入",
    secure: "安全钱包",
    google: "使用 Google 继续",
    user: "用户名（可选）",
    name: "姓名",
    email: "电子邮箱",
    loginId: "电子邮箱或用户名",
    password: "密码（至少 8 位）",
    or: "或",
  },
  es: {
    tag: "Tus recompensas, a tu manera",
    title: "Tareas pequeñas. Recompensas reales.",
    intro: "Completa ofertas confiables, acumula PHT y retira de forma segura.",
    start: "Crear una cuenta",
    login: "Iniciar sesión en Pure Earn",
    create: "Crear cuenta",
    signin: "Entrar",
    country: "País o región",
    free: "Gratis",
    secure: "Cartera segura",
    google: "Continuar con Google",
    user: "Usuario (opcional)",
    name: "Nombre completo",
    email: "Correo electrónico",
    loginId: "Correo o usuario",
    password: "Contraseña (8+ caracteres)",
    or: "O",
  },
};
type Locale = keyof typeof words;

export default function LandingPage() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("OTHER");
  const [countryName, setCountryName] = useState("");
  const [locale, setLocale] = useState<Locale>("en");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = words[locale];

  function changeLocale(next: Locale) {
    setLocale(next);
    document.documentElement.lang = next;
    localStorage.setItem("pureearn_locale", next);
    window.dispatchEvent(new CustomEvent("pureearn:locale", { detail: next }));
  }

  useEffect(() => {
    fetch("/api/locale")
      .then((r) => r.json())
      .then((x) => {
        setCountry(normalizeCountry(x.country));
        const saved = localStorage.getItem("pureearn_locale") as Locale | null;
        changeLocale(
          saved && saved in words ? saved : ((x.locale || "en") as Locale),
        );
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (mode === "register") {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          name,
          email,
          password,
          country,
          countryName,
          locale,
          referralCode: new URLSearchParams(location.search).get("ref"),
        }),
      });
      if (!r.ok) {
        setError((await r.json()).error);
        setBusy(false);
        return;
      }
    }
    const r = await signIn("credentials", { email, password, redirect: false });
    if (r?.error)
      setError(
        locale === "vi"
          ? "Email, tên người dùng hoặc mật khẩu không đúng"
          : "Invalid email/username or password",
      );
    else location.href = "/dashboard";
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#17112b] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_-10%,#8a54d8_0%,transparent_38%)] opacity-60" />
      <div className="relative mx-auto max-w-6xl px-5 pb-12 md:px-8">
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Image
              src="/pht-logo.png"
              alt="Pure Earn"
              width={48}
              height={48}
              className="rounded-2xl shadow-[0_0_24px_rgba(168,85,247,.4)]"
              priority
            />
            <span className="text-xl font-black">
              Pure <span className="text-violet-300">Earn</span>
            </span>
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => changeLocale(e.target.value as Locale)}
              className="rounded-xl bg-[#2a1e43] px-2"
            >
              <option value="en">EN</option>
              <option value="vi">VI</option>
              <option value="zh">中文</option>
              <option value="es">ES</option>
            </select>
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold"
            >
              {mode === "login" ? t.create : t.signin}
            </button>
          </div>
        </nav>
        <section className="grid items-center gap-10 py-8 md:grid-cols-[1.05fr_.95fr] md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-4 py-2 text-xs">
              <Sparkles size={14} />
              {t.tag}
            </span>
            <h1 className="mt-6 max-w-[650px] text-4xl font-black leading-[1.08] tracking-[-.025em] sm:text-5xl md:text-6xl">
              {t.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              {t.intro}
            </p>
            <div className="mt-7 flex gap-5 text-sm">
              <span className="flex gap-2">
                <CheckCircle2 className="text-emerald-300" size={17} />
                {t.free}
              </span>
              <span className="flex gap-2">
                <LockKeyhole className="text-violet-300" size={17} />
                {t.secure}
              </span>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/15 bg-[#2a1e43]/95 p-5 md:p-7">
            <h2 className="text-2xl font-bold">
              {mode === "register" ? t.start : t.login}
            </h2>
            <form onSubmit={submit} className="mt-5 space-y-3">
              {mode === "register" && (
                <>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.user}
                    className="field"
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.name}
                    className="field"
                  />
                  <label className="block text-xs text-slate-400">
                    {t.country}
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="field mt-1"
                    >
                      {countryOptions(locale).map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                      <option value="OTHER">Other</option>
                    </select>
                    {country === "OTHER" && (
                      <input
                        required
                        value={countryName}
                        onChange={(e) => setCountryName(e.target.value)}
                        placeholder={
                          locale === "vi"
                            ? "Nhập quốc gia hoặc vùng lãnh thổ"
                            : "Enter country or territory"
                        }
                        className="field mt-2"
                        maxLength={80}
                      />
                    )}
                  </label>
                </>
              )}
              <input
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === "register" ? t.email : t.loginId}
                className="field"
              />
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password}
                className="field"
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-400 py-3 font-bold"
              >
                {busy ? "..." : mode === "register" ? t.create : t.signin}
                <ArrowRight size={18} />
              </button>
            </form>
            <div className="my-4 text-center text-xs text-slate-500">
              {t.or}
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full rounded-xl border border-white/15 py-3 font-semibold"
            >
              {t.google}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
