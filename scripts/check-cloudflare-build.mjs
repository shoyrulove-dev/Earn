import { existsSync } from "node:fs";

if (existsSync(".env.production")) process.loadEnvFile(".env.production");

if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) {
  console.error("Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in the Cloudflare build environment before deploying PureEarn.");
  process.exitCode = 1;
}
