require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'competition.html')));
app.get('/competition', (req, res) => res.sendFile(path.join(__dirname, 'competition.html')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: !!process.env.OPENROUTER_API_KEY });
});

app.post('/api/translate', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not set in .env file' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sarpanch Samvaad Poster Generator',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 100000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `OpenRouter error ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim()
      .replace(/^```json?\n?/, '')
      .replace(/```$/, '')
      .trim();

    const parsed = JSON.parse(text);
    res.json({ translations: parsed });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  Sarpanch Samvaad Poster Generator`);
  console.log(`  ──────────────────────────────────`);
  console.log(`  Running at:  http://localhost:${PORT}`);
  console.log(`  Open:        http://localhost:${PORT}/competition.html\n`);
});
