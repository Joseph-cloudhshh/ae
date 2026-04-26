import { buildMemoryContext } from '../lib/memoryBuilder.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3-haiku';

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, selectedMemoryIds = [], memory = [], history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build memory context from Supabase (selectedMemoryIds = UUIDs from DB)
    // Also support raw memory strings passed directly from the frontend
    let memoryContext = '';
    if (selectedMemoryIds.length > 0) {
      memoryContext = await buildMemoryContext(selectedMemoryIds);
    } else if (memory.length > 0) {
      // Frontend sent plain text memory snippets (from the local MEMORIES array)
      memoryContext = [
        '=== MEMORY CONTEXT ===',
        'The following user preferences and context apply:',
        '',
        memory.map((m, i) => `[${i + 1}] ${m}`).join('\n'),
        '=== END MEMORY CONTEXT ===',
      ].join('\n');
    }

    // Build the user prompt
    const userPrompt = memoryContext
      ? `${memoryContext}\n\nUser message: ${message.trim()}`
      : message.trim();

    // Build conversation history for OpenRouter
    const messages = [];

    // Inject prior turns from the frontend's in-memory history
    if (history.length > 0) {
      for (const turn of history.slice(-10)) {
        if (turn.role === 'user' || turn.role === 'assistant') {
          messages.push({ role: turn.role, content: turn.content });
        } else if (turn.role === 'ai') {
          messages.push({ role: 'assistant', content: turn.content });
        }
      }
    }

    messages.push({ role: 'user', content: userPrompt });

    // Call OpenRouter
    const orRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aether.chat',
        'X-Title': 'Aether AI Chat',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        system: 'You are Aether, a helpful AI assistant with memory capabilities. When memory context is provided, use it to personalise your responses. Be concise, accurate, and helpful.',
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!orRes.ok) {
      const errBody = await orRes.text().catch(() => '');
      console.error('[chat] OpenRouter error:', orRes.status, errBody);
      return res.status(502).json({ error: `AI service error: ${orRes.status}` });
    }

    const orData = await orRes.json();
    const reply = orData.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('[chat] Unexpected OpenRouter response shape:', JSON.stringify(orData));
      return res.status(502).json({ error: 'No reply from AI service' });
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('[chat] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
