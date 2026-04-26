import { supabaseAdmin } from '../lib/supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert([{ title: title.trim(), content: content.trim() }])
      .select()
      .single();

    if (error) {
      console.error('[saveConversation] Supabase error:', error.message);
      return res.status(500).json({ error: 'Failed to save conversation', detail: error.message });
    }

    return res.status(201).json({ success: true, conversation: data });

  } catch (err) {
    console.error('[saveConversation] Unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
