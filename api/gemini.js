// api/gemini.js — Vercel Serverless Function
// Proxy seguro para llamadas directas de Gemini desde el Frontend

const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, system, useSearch } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Falta el campo prompt.' });
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

        return res.status(200).json({ text: response.text });

    } catch (error) {
        console.error('Error en /api/gemini:', error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
    }
};
