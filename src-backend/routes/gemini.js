const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

router.post('/', async (req, res) => {
  try {
    const { prompt, query, system, useSearch, apiKey } = req.body || {};
    const finalPrompt = (prompt || query || '').trim();

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Falta el campo prompt.' });
    }

    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(500).json({ error: 'Falta GEMINI_API_KEY en el servidor (o apiKey en el request).' });
    }

    const ai = new GoogleGenAI({ apiKey: activeApiKey });
    const config = {};
    if (system) config.systemInstruction = system;
    if (useSearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config
    });

    return res.status(200).json({ text: response.text || '' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
  }
});

module.exports = router;