# 🚀 LeadFlow CRM — Lead-Tracking CRM for Web Dev Agencies

LeadFlow CRM is a full-featured, team-enabled CRM built for solo developers and web agencies pitching e-commerce websites to local shops and Instagram/Facebook profiles.

---

## ✨ Features

- **📊 Drag-and-Drop Kanban Board**: Visual pipeline across 7 deal stages (`New`, `Contacted`, `Follow-up`, `Interested`, `Proposal Sent`, `Won`, `Lost`) powered by `@dnd-kit`.
- **🌡️ Automatic Lead Temperature & Stale Lead Scoring**: Auto-calculates `Hot`, `Warm`, `Cold`, or `Frozen` status based on contact recency, and flags stale deals.
- **✨ Gemini AI Note Summarization**: Server-side integration with Google Gemini to instantly generate 2-3 sentence summaries of all logged prospect activity and suggest next actions.
- **🔔 Follow-Up Tracking**: Schedule follow-ups with due date alerts, overdue badges on Kanban cards, and filter by overdue/due-today leads.
- **👥 Multi-User Team Support**: Invite teammates, assign prospects to owners, and collaborate with Row-Level Security (RLS) isolating team data.
- **📞 Activity Logging**: Quick-log phone calls, internal notes, and automatic status change audits.
- **📈 Analytics Dashboard**: Track conversion rates, revenue by stage, and channel breakdown (Instagram, Facebook, Google Maps, Other).
- **🔒 Enterprise Security**: Supabase Auth with RLS database isolation and encrypted API key management.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+ (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark Mode Design System)
- **Database & Auth**: Supabase (PostgreSQL + RLS + Built-in Auth)
- **Drag-and-Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **AI**: Google Gemini API (`@google/generative-ai`)
- **Icons**: Lucide React
- **Notifications**: Sonner

---

## ⚡ Quick Start & Deployment Guide

### 1. Supabase Database Setup

1. Create a free project at [Supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it in the SQL Editor. This initializes all tables, enums, indexes, triggers, and Row Level Security (RLS) policies.
4. Enable **Email/Password** authentication in **Authentication -> Providers -> Email**.
5. Manually create your initial team user under **Authentication -> Users** (e.g. `you@agency.com`).

### 2. Local Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and sign in. On your first login, you'll be prompted to name your agency organization.

---

## 🚀 Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into **Vercel**.
3. In the Vercel project settings, set the **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will automatically build and deploy the Next.js application with zero additional configuration required.

---

## 🔒 Gemini API Key Setup

You can configure your Gemini API key in two ways:
1. **Via UI (Recommended)**: Go to **Settings -> AI Key Settings** in the app and paste your key. It will be saved securely to your organization record and accessed only server-side.
2. **Via Environment Variable**: Add `GEMINI_API_KEY=your_key` to `.env.local` or Vercel environment variables as a global fallback.
