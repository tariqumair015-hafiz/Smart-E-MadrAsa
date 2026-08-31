import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('--- Setting up Supabase RAG Database Schema ---');
  
  // Test if BookChunks table already exists or try inserting test vector
  const { data, error } = await supabase.from('BookChunks').select('id').limit(1);
  
  if (error) {
    console.log('BookChunks table check response:', error.message);
    if (error.code === '42P01') {
      console.log('⚠️ BookChunks table does NOT exist yet.');
      console.log('Please execute the SQL commands from `rag_schema.sql` in your Supabase SQL Editor.');
    }
  } else {
    console.log('✅ BookChunks table exists in Supabase!');
  }
}

setupDatabase();
