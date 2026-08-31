import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'

export const supabase = createClient(supabaseUrl, supabaseKey)
