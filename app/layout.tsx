import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earn.blissbiovn.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Pure Earn – Làm nhiệm vụ, nhận thưởng", template: "%s | Pure Earn" },
  description: "Pure Earn là nền tảng nhiệm vụ và offerwall giúp bạn khám phá ưu đãi, hoàn thành minijob và nhận thưởng minh bạch.",
  applicationName: "Pure Earn",
  keywords: ["Pure Earn", "kiếm tiền online", "nhiệm vụ nhận thưởng", "minijob", "offerwall", "CPA"],
  authors: [{ name: "Pure Earn", url: siteUrl }],
  creator: "Pure Earn",
  publisher: "Pure Earn",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website", locale: "vi_VN", url: "/", siteName: "Pure Earn",
    title: "Pure Earn – Làm nhiệm vụ, nhận thưởng",
    description: "Hoàn thành nhiệm vụ, khám phá offer và nhận thưởng cùng Pure Earn.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Pure Earn" }]
  },
  twitter: { card: "summary_large_image", title: "Pure Earn – Làm nhiệm vụ, nhận thưởng", description: "Hoàn thành nhiệm vụ và nhận thưởng cùng Pure Earn.", images: ["/opengraph-image"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "finance"
};

export const viewport = { themeColor: "#09070f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className="dark"><body>{children}</body></html>;
}
