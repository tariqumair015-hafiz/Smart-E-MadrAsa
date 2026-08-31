const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`Failed: ${res.status}`, await res.text())
      return
    }
    const data = await res.json()
    console.log('Available models:')
    data.models.forEach(m => {
      if (m.supportedGenerationMethods.includes('embedContent') || m.supportedGenerationMethods.includes('batchEmbedContents')) {
        console.log(`- ${m.name} (${m.displayName})`)
      }
    })
  } catch (err) {
    console.error(err)
  }
}

listModels()
