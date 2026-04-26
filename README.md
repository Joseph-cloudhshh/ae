# Aether Chat — Deployment Guide

## Stack
- **Frontend**: Vanilla JS + CSS (no build step) → `public/index.html`
- **Backend**: Vercel Serverless Functions (Node.js ES Modules)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter → Claude 3 Haiku

---

## 1. Supabase Setup

1. Open your Supabase project → **SQL Editor**
2. Paste and run the contents of `supabase-schema.sql`
3. This creates the `conversations` table, indexes, RLS policies, and seed data

---

## 2. Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
npm install -g vercel
cd aether-chat
vercel login
vercel
```

When prompted, set these **Environment Variables** in Vercel:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://khxpktnhseoyeoumusou.supabase.co` |
| `SUPABASE_ANON_KEY` | *(see .env.example)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(see .env.example)* |
| `OPENROUTER_API_KEY` | *(see .env.example)* |

Or set them all at once after first deploy:
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENROUTER_API_KEY
vercel --prod
```

### Option B — Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Add the 4 environment variables above in **Settings → Environment Variables**
4. Deploy

---

## 3. Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Run locally (Vercel dev server)
npm run dev
```

Then open `http://localhost:3000`

---

## File Structure

```
aether-chat/
├── api/
│   ├── chat.js                # POST /api/chat — main AI endpoint
│   ├── saveConversation.js    # POST /api/saveConversation
│   └── getConversations.js    # GET  /api/getConversations
├── lib/
│   ├── supabaseClient.js      # Supabase anon + service role clients
│   └── memoryBuilder.js       # Fetches memories from DB, builds context
├── public/
│   └── index.html             # Full Aether frontend (self-contained)
├── supabase-schema.sql        # Run this in Supabase SQL Editor
├── vercel.json                # Vercel routing config
├── package.json
└── .env.example               # Copy to .env.local for local dev
```

---

## API Reference

### `POST /api/chat`
```json
{
  "message": "string (required)",
  "selectedMemoryIds": ["uuid", "uuid"],   // optional — DB memory IDs
  "memory": ["text snippet"],              // optional — inline memory strings
  "history": [{ "role": "user|ai", "content": "..." }]  // optional
}
```
Returns: `{ "reply": "string" }`

### `POST /api/saveConversation`
```json
{ "title": "string", "content": "string" }
```
Returns: `{ "success": true, "conversation": { ...row } }`

### `GET /api/getConversations`
Query params: `?limit=50&offset=0`  
Returns: `{ "conversations": [...], "total": N, "limit": 50, "offset": 0 }`

---

## Frontend Features

- ✅ Live conversations loaded from Supabase on startup
- ✅ Memory sidebar — select snippets to inject into AI context
- ✅ Chat history sent with each request (last 10 turns)
- ✅ Export button (↓) saves current chat to Supabase
- ✅ Session restore on page reload (sessionStorage)
- ✅ Typing indicator, toast notifications, mobile responsive
