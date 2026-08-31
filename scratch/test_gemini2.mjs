const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text: 'Hello world' }] },
      outputDimensionality: 768
    })
  });
  
  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log('Embedding values length:', data.embedding.values.length);
}

test();
