# Pure Earn

Mobile-first CPA / minijob platform built with Next.js, Tailwind CSS and MongoDB.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI` and `NEXTAUTH_SECRET`.
2. Run `npm install`.
3. Run `npm run dev`.

Health check: `GET /api/health`  
Active minijobs: `GET /api/minijobs`

## Production

Set the variables from `.env.example` in Vercel Project Settings. The production URL is intended to be `https://earn.blissbiovn.com`.
