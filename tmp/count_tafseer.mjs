import { supabase } from '../src/supabaseClient.js';
const { data, error } = await supabase.from('Books').select('id').eq('category', 'تفسیر القرآن');
console.log('Tafseer books in DB:', data?.length);
console.log('Error:', error);
process.exit(0);
