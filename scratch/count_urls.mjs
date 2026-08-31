const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'

async function count() {
  try {
    const url = `${supabaseUrl}/rest/v1/Books?select=pdf_url`
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })

    if (!res.ok) {
      console.error('Error fetching:', res.status)
      return
    }

    const books = await res.json()
    let archiveCount = 0
    let supabaseCount = 0
    let otherCount = 0

    books.forEach(b => {
      if (!b.pdf_url) return
      if (b.pdf_url.includes('archive.org')) {
        archiveCount++
      } else if (b.pdf_url.includes('supabase.co')) {
        supabaseCount++
      } else {
        otherCount++
      }
    })

    console.log(`Total books analyzed: ${books.length}`)
    console.log(`Archive.org URLs: ${archiveCount}`)
    console.log(`Supabase URLs: ${supabaseCount}`)
    console.log(`Other URLs: ${otherCount}`)
  } catch (err) {
    console.error(err)
  }
}

count()
