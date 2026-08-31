import { supabase } from '../src/supabaseClient.js';
const { data, error } = await supabase.from('Books').select('id').eq('category', 'تجوید و قراءت');
console.log('Tajweed books in DB:', data?.length);
process.exit(0);
