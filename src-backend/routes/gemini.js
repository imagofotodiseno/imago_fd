const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

router.post('/', async (req, res) => {
  try {
    const { prompt, system, useSearch } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Falta el prompt' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'El agente no está configurado. Falta la GEMINI_API_KEY en el servidor.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const config = {};
    
    if (system) {
      config.systemInstruction = system;
    }
    
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error('Error in /api/gemini backend route:', err);
    res.status(500).json({ error: err.message || 'Error interno al generar contenido' });
  }
});

module.exports = router;
