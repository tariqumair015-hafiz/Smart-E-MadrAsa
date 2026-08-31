import { supabase } from '../src/supabaseClient.js';

async function cleanup() {
  const { data, error } = await supabase.from('Books').delete().ilike('title', 'Test Book %');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Cleanup successful.');
  }
  process.exit(0);
}

cleanup();
