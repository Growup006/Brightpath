const express = require('express');

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

router.post('/', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini tutor is not configured on the server yet.' });
    }

    const { system_instruction, contents, generationConfig } = req.body;

    if (!contents) {
      return res.status(400).json({ error: 'contents is required' });
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: system_instruction,
        contents: contents,
        generationConfig: generationConfig || { maxOutputTokens: 800, temperature: 0.7 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(502).json({ error: 'Gemini tutor is unavailable right now. Try again in a moment.' });
    }

    res.json(data);
  } catch (err) {
    console.error('Gemini tutor route error:', err);
    res.status(500).json({ error: 'Gemini tutor is unavailable right now. Try again in a moment.' });
  }
});

module.exports = router;
