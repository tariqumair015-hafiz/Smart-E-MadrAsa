import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function undoRepair() {
  const content = fs.readFileSync('full_cover_audit.txt', 'utf8');
  const lines = content.split('\n');
  const ids = [];

  for (const line of lines) {
    const match = line.match(/^\d+\. \[ID: (\d+)\] (.*?) \((.*?)\)$/);
    if (match) ids.push(match[1]);
  }

  console.log(`Setting ${ids.length} books back to cover_url = null...`);
  
  // Batch updates of 50
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { error } = await supabase
      .from('Books')
      .update({ cover_url: null })
      .in('id', batch);
    if (error) console.error(error.message);
  }
  
  console.log("Undo complete.");
}

undoRepair();
