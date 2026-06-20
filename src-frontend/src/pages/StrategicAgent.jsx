import React, { useState } from 'react';
import { geminiGenerate } from '../services/api';

export default function StrategicAgent() {
  const [researchInput, setResearchInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');
  const [strategyInput, setStrategyInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // 'research', 'audience', 'strategy'

  // Contexto global para encadenar agentes
  const [strategyContext, setStrategyContext] = useState({
    investigacionData: '',
    publicosData: '',
    estrategiaFinal: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0); // 0: idle, 1: research, 2: audience, 3: strategy
  const [copied, setCopied] = useState(false);

  const getTextFromResponse = (data) => {
    if (data && typeof data.text === 'string' && data.text.trim()) {
      return data.text;
    }
    throw new Error(data?.error || 'La API no devolvio texto util.');
  };

  const runMarketResearch = async (overrideTopic) => {
    const topic = (typeof overrideTopic === 'string' ? overrideTopic : researchInput).trim() || "marketing digital y diseño en Colombia";
    setLoading(true);
    setActiveTab('research');
    setResult('');
    try {
      const system = "Analista de Mercado Estratégico. Devuelve respuestas detalladas en español estructuradas con viñetas claras.";
      const prompt = `Analiza las tendencias actuales sobre: "${topic}". Dame un resumen en bullet points de lo que funciona ahora y qué pasos exactos seguir para aprovechar estas tendencias.`;
      const data = await geminiGenerate({ prompt, system, useSearch: true });
      const text = getTextFromResponse(data);
      
      setResult(text);
      setStrategyContext(prev => ({
        ...prev,
        investigacionData: text
      }));
      return text;
    } catch (err) {
      const errMsg = `Error: ${err.message}`;
      setResult(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const generateAudience = async (overrideTopic, researchContext) => {
    const topic = (typeof overrideTopic === 'string' ? overrideTopic : audienceInput).trim() || "fotografía de producto y diseño";
    setLoading(true);
    setActiveTab('audience');
    setResult('');
    try {
      const activeResearchContext = researchContext !== undefined ? researchContext : strategyContext.investigacionData;
      
      let system = "Experto en Buyer Personas y Segmentación de Audiencias.";
      if (activeResearchContext) {
        system += `\n\n[CONTEXTO DE INVESTIGACIÓN PREVIA]
Usa los siguientes datos de investigación de mercado como contexto obligatorio para guiar la segmentación:
${activeResearchContext}`;
      }

      const prompt = `Define 2 perfiles de público objetivo (Buyer Personas) ideales para: "${topic}". Incluye para cada uno: nombre, edad, intereses, dolores principales, y qué pasos estratégicos seguir para conectar con ellos y venderles.`;
      const data = await geminiGenerate({ prompt, system, useSearch: false });
      const text = getTextFromResponse(data);
      
      setResult(text);
      setStrategyContext(prev => ({
        ...prev,
        publicosData: text
      }));
      return text;
    } catch (err) {
      const errMsg = `Error: ${err.message}`;
      setResult(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const generateContentStrategy = async (overrideTopic, researchContext, audienceContext) => {
    const topic = (typeof overrideTopic === 'string' ? overrideTopic : strategyInput).trim() || "la marca Imago Fotodiseño en Instagram y TikTok";
    setLoading(true);
    setActiveTab('strategy');
    setResult('');
    try {
      const activeResearchContext = researchContext !== undefined ? researchContext : strategyContext.investigacionData;
      const activeAudienceContext = audienceContext !== undefined ? audienceContext : strategyContext.publicosData;

      let system = "Content Strategist y Creativo Senior.";
      let extraContext = "";
      if (activeResearchContext) {
        extraContext += `Datos de investigación previa:\n${activeResearchContext}\n\n`;
      }
      if (activeAudienceContext) {
        extraContext += `Públicos meta y buyer personas definidas:\n${activeAudienceContext}\n\n`;
      }
      if (extraContext) {
        system += `\n\nTienes el siguiente contexto previo del negocio/campaña:\n\n${extraContext}Utiliza esta información para que la estrategia sea completamente coherente con la investigación y el público objetivo ya definidos. NO preguntes ni ignores lo que ya se definió; en su lugar, constrúyelo directamente a partir de estas bases.`;
      }

      const prompt = `Crea una estrategia de contenido accionable para: "${topic}". Define 3 pilares de contenido y detalla una lista de pasos a seguir para ejecutar esta estrategia con éxito esta semana.`;
      const data = await geminiGenerate({ prompt, system, useSearch: false });
      const text = getTextFromResponse(data);
      
      setResult(text);
      setStrategyContext(prev => ({
        ...prev,
        estrategiaFinal: text
      }));
      return text;
    } catch (err) {
      const errMsg = `Error: ${err.message}`;
      setResult(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const runSequentialChain = async () => {
    if (loading || isSyncing) return;

    const initialTopic = researchInput.trim() || "marketing digital y diseño en Colombia";
    
    // Sincronizar inputs de las otras tarjetas
    setAudienceInput(initialTopic);
    setStrategyInput(initialTopic);

    setIsSyncing(true);
    try {
      // Paso 1: Investigación
      setSyncStep(1);
      const researchRes = await runMarketResearch(initialTopic);
      
      // Paso 2: Públicos Meta
      setSyncStep(2);
      const audienceRes = await generateAudience(initialTopic, researchRes);
      
      // Paso 3: Estrategia
      setSyncStep(3);
      await generateContentStrategy(initialTopic, researchRes, audienceRes);

    } catch (err) {
      console.error("Error en la ejecución encadenada:", err);
    } finally {
      setIsSyncing(false);
      setSyncStep(0);
    }
  };

  const resetEntireFlow = () => {
    setResearchInput('');
    setAudienceInput('');
    setStrategyInput('');
    setResult('');
    setStrategyContext({
      investigacionData: '',
      publicosData: '',
      estrategiaFinal: ''
    });
  };

  return (
    <div className="flex-grow p-8 bg-slate-950 overflow-y-auto max-h-screen text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400">
            🤖 Panel Estratégico
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Potencia la toma de decisiones utilizando modelos avanzados de IA con acceso en tiempo real a Google Search.
          </p>
        </div>

        {/* IntegrationHub Component */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                </span>
                <h2 className="text-base font-bold text-white tracking-wide">Hub de Integración Estratégica</h2>
              </div>
              <p className="text-xs text-slate-400">
                Controla el flujo de datos y sincroniza tus agentes en cadena para mantener la coherencia.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={runSequentialChain}
                disabled={loading || isSyncing || !researchInput.trim()}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-300 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] flex-1 md:flex-initial"
              >
                <i className={`fas ${isSyncing ? 'fa-circle-notch fa-spin' : 'fa-bolt'}`}></i>
                {isSyncing ? 'Sincronizando...' : 'Sincronización Total'}
              </button>
              
              <button
                onClick={resetEntireFlow}
                disabled={loading || isSyncing}
                className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:bg-slate-950 disabled:hover:border-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 transition-colors flex-1 md:flex-initial"
              >
                <i className="fas fa-trash-alt"></i>
                Resetear Flujo
              </button>
            </div>
          </div>

          {/* Status Pipeline Visual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/60">
            <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <div className={`w-2.5 h-2.5 rounded-full ${strategyContext.investigacionData ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : syncStep === 1 ? 'bg-blue-400 animate-pulse' : 'bg-slate-700'}`}></div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-500">Agente 1: Investigación</p>
                <p className="text-xs text-slate-300 truncate">
                  {strategyContext.investigacionData ? (researchInput || "marketing digital y diseño...") : syncStep === 1 ? "Analizando..." : "Sin ejecutar"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <div className={`w-2.5 h-2.5 rounded-full ${strategyContext.publicosData ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : syncStep === 2 ? 'bg-purple-400 animate-pulse' : strategyContext.investigacionData ? 'bg-purple-500/30' : 'bg-slate-700'}`}></div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-500">Agente 2: Públicos Meta</p>
                <p className="text-xs text-slate-300 truncate">
                  {strategyContext.publicosData ? (audienceInput || "fotografía de producto...") : syncStep === 2 ? "Definiendo..." : strategyContext.investigacionData ? "Listo para inyectar" : "Esperando paso 1"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-900">
              <div className={`w-2.5 h-2.5 rounded-full ${strategyContext.estrategiaFinal ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : syncStep === 3 ? 'bg-pink-400 animate-pulse' : strategyContext.publicosData ? 'bg-pink-500/30' : 'bg-slate-700'}`}></div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase font-bold text-slate-500">Agente 3: Estrategia</p>
                <p className="text-xs text-slate-300 truncate">
                  {strategyContext.estrategiaFinal ? (strategyInput || "la marca Imago...") : syncStep === 3 ? "Generando..." : strategyContext.publicosData ? "Listo para inyectar" : "Esperando paso 2"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos de Flujo Encadenados */}
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4 lg:gap-2">
          
          {/* Card 1: Investigación de Mercado */}
          <div className={`bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-6 flex flex-col hover:border-blue-500/50 transition-all duration-300 flex-1 ${
            strategyContext.investigacionData 
              ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <i className="fas fa-search text-blue-400 text-lg"></i>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                <span className={`w-2 h-2 rounded-full ${strategyContext.investigacionData ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {strategyContext.investigacionData ? 'Completado' : 'Paso 1'}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">Investigación</h3>
            <p className="text-xs text-slate-400 mb-6">Analiza tendencias globales o locales utilizando Google Search en vivo.</p>
            
            <div className="mt-auto space-y-4">
              <input
                type="text"
                value={researchInput}
                onChange={(e) => setResearchInput(e.target.value)}
                placeholder="Ej. Restaurantes en Medellín"
                disabled={loading || isSyncing}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none p-3.5 rounded-xl text-xs text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => runMarketResearch()}
                disabled={loading || isSyncing}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold w-full transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && activeTab === 'research' && <i className="fas fa-circle-notch fa-spin"></i>}
                {loading && activeTab === 'research' ? 'Analizando...' : 'Analizar Tendencias'}
              </button>
            </div>
          </div>

          {/* Conector 1 */}
          <div className="flex lg:flex-col items-center justify-center self-center lg:w-10 my-1 lg:my-0">
            <div className="hidden lg:flex items-center justify-center w-10 h-6">
              <svg className="w-full h-4" viewBox="0 0 40 16" preserveAspectRatio="none">
                <path
                  d="M 0 8 H 40"
                  stroke={strategyContext.investigacionData ? "#a855f7" : "#334155"}
                  strokeWidth="3"
                  strokeDasharray={strategyContext.investigacionData ? "6 4" : "none"}
                  className={strategyContext.investigacionData ? "animate-flow-line" : ""}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex lg:hidden items-center justify-center w-6 h-8">
              <svg className="w-4 h-full" viewBox="0 0 16 32" preserveAspectRatio="none">
                <path
                  d="M 8 0 V 32"
                  stroke={strategyContext.investigacionData ? "#a855f7" : "#334155"}
                  strokeWidth="3"
                  strokeDasharray={strategyContext.investigacionData ? "6 4" : "none"}
                  className={strategyContext.investigacionData ? "animate-flow-line" : ""}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Buyer Personas */}
          <div className={`bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-6 flex flex-col hover:border-purple-500/50 transition-all duration-300 flex-1 ${
            strategyContext.publicosData
              ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              : strategyContext.investigacionData
              ? 'border-purple-500/40 animate-pulse'
              : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <i className="fas fa-users text-purple-400 text-lg"></i>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                <span className={`w-2 h-2 rounded-full ${strategyContext.publicosData ? 'bg-emerald-400' : strategyContext.investigacionData ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {strategyContext.publicosData ? 'Completado' : strategyContext.investigacionData ? 'Listo' : 'Espera 1'}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">Públicos Meta</h3>
            <p className="text-xs text-slate-400 mb-6">Diseña perfiles Buyer Personas detallados para dirigir tus campañas.</p>
            
            <div className="mt-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                  placeholder="Ej. Menú digital para bares"
                  disabled={loading || isSyncing}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none p-3.5 rounded-xl text-xs text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {strategyContext.investigacionData && !strategyContext.publicosData && (
                  <span className="absolute -top-2.5 right-3 bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-md text-[9px] font-semibold tracking-wider">
                    Contexto Inyectado
                  </span>
                )}
              </div>
              <button
                onClick={() => generateAudience()}
                disabled={loading || isSyncing}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/40 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold w-full transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && activeTab === 'audience' && <i className="fas fa-circle-notch fa-spin"></i>}
                {loading && activeTab === 'audience' ? 'Definiendo...' : 'Definir Público'}
              </button>
            </div>
          </div>

          {/* Conector 2 */}
          <div className="flex lg:flex-col items-center justify-center self-center lg:w-10 my-1 lg:my-0">
            <div className="hidden lg:flex items-center justify-center w-10 h-6">
              <svg className="w-full h-4" viewBox="0 0 40 16" preserveAspectRatio="none">
                <path
                  d="M 0 8 H 40"
                  stroke={strategyContext.publicosData ? "#ec4899" : "#334155"}
                  strokeWidth="3"
                  strokeDasharray={strategyContext.publicosData ? "6 4" : "none"}
                  className={strategyContext.publicosData ? "animate-flow-line" : ""}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex lg:hidden items-center justify-center w-6 h-8">
              <svg className="w-4 h-full" viewBox="0 0 16 32" preserveAspectRatio="none">
                <path
                  d="M 8 0 V 32"
                  stroke={strategyContext.publicosData ? "#ec4899" : "#334155"}
                  strokeWidth="3"
                  strokeDasharray={strategyContext.publicosData ? "6 4" : "none"}
                  className={strategyContext.publicosData ? "animate-flow-line" : ""}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: Estrategia de Contenidos */}
          <div className={`bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-6 flex flex-col hover:border-pink-500/50 transition-all duration-300 flex-1 ${
            strategyContext.estrategiaFinal
              ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
              : strategyContext.publicosData
              ? 'border-pink-500/40 animate-pulse'
              : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-pink-500/10 w-12 h-12 rounded-2xl flex items-center justify-center border border-pink-500/20">
                <i className="fas fa-layer-group text-pink-400 text-lg"></i>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                <span className={`w-2 h-2 rounded-full ${strategyContext.estrategiaFinal ? 'bg-emerald-400' : strategyContext.publicosData ? 'bg-pink-400 animate-pulse' : 'bg-slate-600'}`}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {strategyContext.estrategiaFinal ? 'Completado' : strategyContext.publicosData ? 'Listo' : 'Espera 2'}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">Estrategia</h3>
            <p className="text-xs text-slate-400 mb-6">Planifica pilares de contenido strategic y secuencias de pauta.</p>
            
            <div className="mt-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={strategyInput}
                  onChange={(e) => setStrategyInput(e.target.value)}
                  placeholder={
                    (!strategyContext.investigacionData || !strategyContext.publicosData)
                      ? "Esperando datos de Investigación y Públicos..."
                      : "Ej. Lanzamiento marca de ropa"
                  }
                  disabled={loading || isSyncing}
                  className={`w-full bg-slate-950 border focus:outline-none p-3.5 rounded-xl text-xs text-slate-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    (!strategyContext.investigacionData || !strategyContext.publicosData)
                      ? 'border-slate-800/40 placeholder-slate-600'
                      : 'border-slate-800 focus:border-pink-500'
                  }`}
                />
                {strategyContext.publicosData && !strategyContext.estrategiaFinal && (
                  <span className="absolute -top-2.5 right-3 bg-pink-950 text-pink-300 border border-pink-800/80 px-2 py-0.5 rounded-md text-[9px] font-semibold tracking-wider">
                    Contexto Inyectado
                  </span>
                )}
              </div>
              <button
                onClick={() => generateContentStrategy()}
                disabled={loading || isSyncing}
                className="bg-pink-600 hover:bg-pink-500 disabled:bg-pink-800/40 disabled:text-slate-500 py-3 rounded-xl text-xs font-bold w-full transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading && activeTab === 'strategy' && <i className="fas fa-circle-notch fa-spin"></i>}
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
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1.5"
              >
                <i className={`far ${copied ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                {copied ? '¡Copiado!' : 'Copiar'}
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
