const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'

async function inspect() {
  try {
    const url = `${supabaseUrl}/rest/v1/Books?select=id,title,pdf_url,author&limit=10`
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })

    if (!res.ok) {
      console.error('Error fetching books:', res.status, await res.text())
      return
    }

    const books = await res.json()
    console.log('Sample books from database:')
    console.log(JSON.stringify(books, null, 2))
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

inspect()
