import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTaqiUsmaniLinks() {
  console.log('🔍 Checking links for Asaan Tarjuma Quran By Mufti Taqi Usmani...')
  
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, pdf_url, description')
    .ilike('title', '%Asaan Tarjuma Quran%Mufti Taqi Usmani%')

  if (error) {
    console.error('❌ Error fetching books:', error)
    return
  }

  data.forEach(book => {
    console.log(`\n📖 [${book.id}] ${book.title}`)
    console.log(`🔗 Main PDF URL: ${book.pdf_url}`)
    
    if (book.description) {
      try {
        const parsed = JSON.parse(book.description)
        if (Array.isArray(parsed)) {
          parsed.forEach((vol, i) => {
            console.log(`   - Vol ${i+1}: ${vol.url}`)
          })
        }
      } catch (e) { }
    }
  })
}

checkTaqiUsmaniLinks()
