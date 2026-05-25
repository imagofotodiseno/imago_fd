import React, { useState } from 'react';
import { geminiGenerate } from '../services/api';

export default function StrategicAgent() {
  const [researchInput, setResearchInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // 'research', 'audience', 'strategy'

  const runMarketResearch = async () => {
    const topic = researchInput.trim() || "marketing digital y diseño en Colombia";
    setLoading(true);
    setActiveTab('research');
    setResult('');
    try {
      const system = "Analista de Mercado Estratégico. Devuelve respuestas detalladas en español estructuradas con viñetas claras.";
      const prompt = `Analiza las tendencias actuales sobre: "${topic}". Dame un resumen en bullet points de lo que funciona ahora y qué pasos exactos seguir para aprovechar estas tendencias.`;
      const data = await geminiGenerate({ prompt, system, useSearch: true });
      setResult(data.text);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateAudience = async () => {
    const topic = audienceInput.trim() || "fotografía de producto y diseño";
    setLoading(true);
    setActiveTab('audience');
    setResult('');
    try {
      const system = "Experto en Buyer Personas y Segmentación de Audiencias.";
      const prompt = `Define 2 perfiles de público objetivo (Buyer Personas) ideales para: "${topic}". Incluye para cada uno: nombre, edad, intereses, dolores principales, y qué pasos estratégicos seguir para conectar con ellos y venderles.`;
      const data = await geminiGenerate({ prompt, system, useSearch: false });
      setResult(data.text);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateContentStrategy = async () => {
    const topic = strategyInput.trim() || "la marca Imago Fotodiseño en Instagram y TikTok";
    setLoading(true);
    setActiveTab('strategy');
    setResult('');
    try {
      const system = "Content Strategist y Creativo Senior.";
      const prompt = `Crea una estrategia de contenido accionable para: "${topic}". Define 3 pilares de contenido y detalla una lista de pasos a seguir para ejecutar esta estrategia con éxito esta semana.`;
      const data = await geminiGenerate({ prompt, system, useSearch: false });
      setResult(data.text);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-8 bg-slate-950 overflow-y-auto max-h-screen text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400">
            🤖 Panel Estratégico
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Potencia la toma de decisiones utilizando modelos avanzados de IA con acceso en tiempo real a Google Search.
          </p>
        </div>

        {/* Módulos en Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Investigación de Mercado */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col hover:border-blue-500/50 transition-all duration-300">
            <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
              <i className="fas fa-search text-blue-400 text-lg"></i>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Investigación</h3>
            <p className="text-xs text-slate-400 mb-6">Analiza tendencias globales o locales utilizando Google Search en vivo.</p>
            <div className="mt-auto space-y-4">
              <input
                type="text"
                value={researchInput}
                onChange={(e) => setResearchInput(e.target.value)}
                placeholder="Ej. Restaurantes en Medellín"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none p-3.5 rounded-xl text-xs text-slate-200 transition-colors"
              />
              <button
                onClick={runMarketResearch}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold w-full transition-all duration-200"
              >
                {loading && activeTab === 'research' ? 'Analizando...' : 'Analizar Tendencias'}
              </button>
            </div>
          </div>

          {/* Card 2: Buyer Personas */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col hover:border-purple-500/50 transition-all duration-300">
            <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/20">
              <i className="fas fa-users text-purple-400 text-lg"></i>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Públicos Meta</h3>
            <p className="text-xs text-slate-400 mb-6">Diseña perfiles Buyer Personas detallados para dirigir tus campañas.</p>
            <div className="mt-auto space-y-4">
              <input
                type="text"
                value={audienceInput}
                onChange={(e) => setAudienceInput(e.target.value)}
                placeholder="Ej. Menú digital para bares"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none p-3.5 rounded-xl text-xs text-slate-200 transition-colors"
              />
              <button
                onClick={generateAudience}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold w-full transition-all duration-200"
              >
                {loading && activeTab === 'audience' ? 'Definiendo...' : 'Definir Público'}
              </button>
            </div>
          </div>

          {/* Card 3: Estrategia de Contenidos */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 flex flex-col hover:border-pink-500/50 transition-all duration-300">
            <div className="bg-pink-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-pink-500/20">
              <i className="fas fa-layer-group text-pink-400 text-lg"></i>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Estrategia</h3>
            <p className="text-xs text-slate-400 mb-6">Planifica pilares de contenido estratégico y secuencias de pauta.</p>
            <div className="mt-auto space-y-4">
              <input
                type="text"
                value={strategyInput}
                onChange={(e) => setStrategyInput(e.target.value)}
                placeholder="Ej. Lanzamiento marca de ropa"
                className="w-full bg-slate-950 border border-slate-800 focus:border-pink-500 focus:outline-none p-3.5 rounded-xl text-xs text-slate-200 transition-colors"
              />
              <button
                onClick={generateContentStrategy}
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-500 disabled:bg-pink-800/40 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold w-full transition-all duration-200"
              >
                {loading && activeTab === 'strategy' ? 'Generando...' : 'Generar Estrategia'}
              </button>
            </div>
          </div>
        </div>

        {/* Panel de Resultados */}
        {(result || loading) && (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 via-violet-500 to-pink-500"></div>
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                {activeTab === 'research' && 'Resultado de Investigación (Google Search)'}
                {activeTab === 'audience' && 'Buyer Personas Generadas'}
                {activeTab === 'strategy' && 'Plan de Contenidos Estratégicos'}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  alert('Copiado al portapapeles');
                }}
                className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1.5"
              >
                <i className="far fa-copy"></i> Copiar
              </button>
            </div>

            {loading ? (
              <div className="flex items-center text-slate-400 py-6">
                <i className="fas fa-circle-notch fa-spin mr-3 text-lg text-blue-400"></i>
                <span>Generando respuesta estratégica con Gemini...</span>
              </div>
            ) : (
              <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
