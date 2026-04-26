import { supabaseAdmin } from './supabaseClient.js';

/**
 * Fetches conversations by ID array and merges them into
 * a structured context string ready for the AI prompt.
 *
 * @param {string[]} selectedMemoryIds - UUIDs of conversations to load
 * @returns {string} - Formatted memory context block
 */
export async function buildMemoryContext(selectedMemoryIds) {
  if (!selectedMemoryIds || selectedMemoryIds.length === 0) {
    return '';
  }

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, title, content, created_at')
    .in('id', selectedMemoryIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[memoryBuilder] Supabase fetch error:', error.message);
    return '';
  }

  if (!data || data.length === 0) {
    return '';
  }

  const blocks = data.map((conv, i) => {
    const date = new Date(conv.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
    return `[Memory ${i + 1}] "${conv.title}" (${date})\n${conv.content.trim()}`;
  });

  return [
    '=== MEMORY CONTEXT ===',
    'The following memories provide relevant background. Use them to inform your response.',
    '',
    blocks.join('\n\n'),
    '=== END MEMORY CONTEXT ===',
  ].join('\n');
}
