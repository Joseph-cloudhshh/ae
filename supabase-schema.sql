-- ═══════════════════════════════════════════════════════════════
-- AETHER CHAT — SUPABASE SQL SETUP
-- Run this in your Supabase project's SQL Editor
-- Project: https://khxpktnhseoyeoumusou.supabase.co
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── CONVERSATIONS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast newest-first queries (used by getConversations)
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
  ON conversations (created_at DESC);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────
-- Enable RLS (recommended for production)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations using the service role key (backend)
-- The anon key is used only for reads if you expose getConversations publicly.
-- Since our API uses the SERVICE ROLE KEY, RLS is bypassed on the server.
-- These policies protect direct client-side access:

-- Allow anon reads (the frontend can list conversations directly if needed)
CREATE POLICY "Allow anon read"
  ON conversations
  FOR SELECT
  TO anon
  USING (true);

-- Block anon writes — all writes go through the backend service role
CREATE POLICY "Block anon insert"
  ON conversations
  FOR INSERT
  TO anon
  WITH CHECK (false);

CREATE POLICY "Block anon update"
  ON conversations
  FOR UPDATE
  TO anon
  USING (false);

CREATE POLICY "Block anon delete"
  ON conversations
  FOR DELETE
  TO anon
  USING (false);

-- ─── SEED DATA (optional — remove if not wanted) ─────────────────
INSERT INTO conversations (title, content) VALUES
(
  'React hydration debugging',
  'You: Why am I getting a hydration mismatch error in Next.js?

Aether: Hydration mismatches happen when the HTML rendered on the server doesn''t match what React tries to render on the client.

Common causes:
- Using Math.random() or Date.now() during render
- Browser extensions modifying the DOM
- Conditional rendering based on typeof window

Fix with suppressHydrationWarning for expected differences, or use useEffect to delay client-only code:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```'
),
(
  'Postgres query optimisation',
  'You: How do I speed up a query filtering by status = ''active'' on a 10M row table?

Aether: Create a partial index — it only indexes the rows that match your filter, making it far smaller and faster:

```sql
CREATE INDEX idx_users_active
ON users (created_at DESC)
WHERE status = ''active'';
```

This works well when active is a minority of rows. Also make sure you''re ANALYZEing the table after large writes so the planner picks the index.'
),
(
  'Glassmorphism CSS deep dive',
  'You: How do I get that frosted glass effect in CSS?

Aether: The key property is backdrop-filter: blur(). Here is the core pattern:

```css
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
}
```

Make sure there is actual content *behind* the element for the blur to be visible. Works best over images or colorful gradients. Browser support is now excellent — just keep the -webkit- prefix for Safari.'
);

-- ─── VERIFY ──────────────────────────────────────────────────────
-- Run this to confirm the table and data look correct:
-- SELECT id, title, LEFT(content, 60) AS preview, created_at FROM conversations ORDER BY created_at DESC;
