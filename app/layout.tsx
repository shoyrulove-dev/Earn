import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/site-footer";
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earn.blissbiovn.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Pure Earn – Complete Tasks, Earn Rewards", template: "%s | Pure Earn" },
  description: "Pure Earn is a trusted minijob and offerwall platform where you can discover offers, complete tasks, and earn rewards.",
  applicationName: "Pure Earn",
  keywords: ["Pure Earn", "earn rewards", "paid tasks", "online minijobs", "offerwall", "CPA offers"],
  authors: [{ name: "Pure Earn", url: siteUrl }],
  creator: "Pure Earn",
  publisher: "Pure Earn",
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website", locale: "en_US", url: "/", siteName: "Pure Earn",
    title: "Pure Earn – Complete Tasks, Earn Rewards",
    description: "Complete tasks, discover offers, and earn rewards with Pure Earn.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Pure Earn" }]
  },
  twitter: { card: "summary_large_image", title: "Pure Earn – Complete Tasks, Earn Rewards", description: "Complete tasks and earn rewards with Pure Earn.", images: ["/opengraph-image"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  category: "finance"
};

export const viewport = { themeColor: "#211936", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`dark ${beVietnamPro.variable}`}><body>{children}<SiteFooter/></body></html>;
}
