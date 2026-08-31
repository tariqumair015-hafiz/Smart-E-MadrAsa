import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function transcribe() {
  const filePath = 'C:/Users/IQRA TRADERS/.gemini/antigravity-ide/brain/a7ad9b7d-dfc7-4e7d-bb2b-398df2204699/uploaded_media_1782493262572.img';
  const audioData = fs.readFileSync(filePath);
  const base64Audio = audioData.toString('base64');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: base64Audio
              }
            },
            {
              text: 'Listen to this voice message from the user. It is in Urdu or English. Provide the transcription of what they say, and if it is in Urdu, provide both the exact Urdu transcription and the English translation/summary. Also summarize what they want us to do in the codebase.'
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    console.error('API Error:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    console.log(data.candidates[0].content.parts[0].text);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

transcribe().catch(console.error);
