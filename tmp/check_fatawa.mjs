import { supabase } from '../src/supabaseClient.js';

async function main() {
  console.log("Fetching Books...");
  const { data, error } = await supabase.from('Books').select('title').ilike('title', '%Fatawa%').limit(50);
  data.forEach(d => console.log(d.title));
  console.log("Data length:", data?.length);
  console.log("Data:", data);
  console.log("Error:", error);
  process.exit(0);
}

main();
