import React, { useState, useEffect } from 'react';
import { geminiGenerate } from '../services/api';

export default function StrategicAgent() {
  // Estado principal
  const [objetivo, setObjetivo] = useState('');
  const [industria, setIndustria] = useState('ecommerce');
  const [ciudad, setCiudad] = useState('Colombia');
  const [tono, setTono] = useState('profesional');
  
  // Estados de ejecución
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState(null); // null | 'investigacion' | 'audiencias' | 'estrategia' | 'completado'
  const [error, setError] = useState('');
  
  // Resultados estructurados
  const [resultados, setResultados] = useState({
    investigacion: null,
    audiencias: null,
    estrategia: null,
    resumen_ejecutivo: null,
    plan_7_dias: null,
    metricas: null
  });
  
  // Historial
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [sesionActual, setSesionActual] = useState(null);

  // Cargar historial al montar
  useEffect(() => {
    const saved = localStorage.getItem('imago_estrategias');
    if (saved) {
      try {
        setHistorial(JSON.parse(saved));
      } catch (e) {
        console.error('Error al cargar historial:', e);
      }
    }
  }, []);

  // Guardar en historial
  const guardarSesion = () => {
    const sesion = {
      id: Date.now(),
      fecha: new Date().toLocaleString('es-ES'),
      objetivo,
      industria,
      resultados,
      estado: paso
    };
    
    const nuevoHistorial = [sesion, ...historial].slice(0, 20);
    setHistorial(nuevoHistorial);
    localStorage.setItem('imago_estrategias', JSON.stringify(nuevoHistorial));
    setSesionActual(sesion.id);
  };

  // Cargar sesión del historial
  const cargarSesion = (sesionId) => {
    const sesion = historial.find(s => s.id === sesionId);
    if (sesion) {
      setObjetivo(sesion.objetivo);
      setIndustria(sesion.industria);
      setResultados(sesion.resultados);
      setPaso(sesion.estado);
      setSesionActual(sesionId);
      setMostrarHistorial(false);
    }
  };

  // Eliminar sesión
  const eliminarSesion = (sesionId) => {
    const nuevas = historial.filter(s => s.id !== sesionId);
    setHistorial(nuevas);
    localStorage.setItem('imago_estrategias', JSON.stringify(nuevas));
  };

  // Parsear JSON desde respuesta Gemini
  const parseRespuesta = (texto) => {
    try {
      const match = texto.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        return JSON.parse(match[1]);
      }
      return JSON.parse(texto);
    } catch {
      return null;
    }
  };

  // Ejecutar flujo completo
  const ejecutarFlujo = async () => {
    if (!objetivo.trim()) {
      setError('Define un objetivo para comenzar');
      return;
    }

    setError('');
    setResultados({
      investigacion: null,
      audiencias: null,
      estrategia: null,
      resumen_ejecutivo: null,
      plan_7_dias: null,
      metricas: null
    });
    setLoading(true);
    setPaso('investigacion');

    try {
      // PASO 1: Investigación
      const promptInvestigacion = `Como Analista de Mercado Estratégico especializado en ${industria}, 
analiza las tendencias actuales para: "${objetivo}" en ${ciudad}.

Responde ÚNICAMENTE en formato JSON con esta estructura:
\`\`\`json
{
  "tendencias_principales": ["trend1", "trend2", "trend3"],
  "oportunidades": ["opp1", "opp2"],
  "amenazas": ["threat1", "threat2"],
  "pasos_a_seguir": ["paso1", "paso2", "paso3"]
}
\`\`\``;

      const respInv = await geminiGenerate({
        prompt: promptInvestigacion,
        system: `Eres un analista estratégico experto. Responde siempre en JSON válido. Tono: ${tono}.`
      });

      const datosInv = parseRespuesta(respInv.text);
      setResultados(prev => ({ ...prev, investigacion: datosInv || respInv.text }));

      // PASO 2: Audiencias
      setPaso('audiencias');
      const contextInv = typeof datosInv === 'object' ? JSON.stringify(datosInv) : respInv.text;
      
      const promptAudiencias = `Basándote en esta investigación: ${contextInv}

Define 2 Buyer Personas ideales para: "${objetivo}" en ${ciudad}.

Responde ÚNICAMENTE en JSON:
\`\`\`json
{
  "buyer_personas": [
    {
      "nombre": "Nombre",
      "edad": "rango",
      "ocupacion": "ocupación",
      "dolor_principal": "dolor",
      "solucion_que_busca": "solucion",
      "canales_comunicacion": ["canal1", "canal2"]
    }
  ]
}
\`\`\``;

      const respAud = await geminiGenerate({
        prompt: promptAudiencias,
        system: `Eres experto en Buyer Personas. Responde siempre en JSON válido. Tono: ${tono}.`
      });

      const datosAud = parseRespuesta(respAud.text);
      setResultados(prev => ({ ...prev, audiencias: datosAud || respAud.text }));

      // PASO 3: Estrategia + Plan 7 días
      setPaso('estrategia');
      const contextAud = typeof datosAud === 'object' ? JSON.stringify(datosAud) : respAud.text;
      
      const promptEstrategia = `Basándote en:
Investigación: ${contextInv}
Audiencias: ${contextAud}

Crea una estrategia de contenido accionable para: "${objetivo}".

Responde ÚNICAMENTE en JSON:
\`\`\`json
{
  "pilares_contenido": ["pilar1", "pilar2", "pilar3"],
  "plan_7_dias": [
    {"dia": "Lunes", "accion": "acción", "objetivo": "objetivo"},
    {"dia": "Martes", "accion": "acción", "objetivo": "objetivo"}
  ],
  "metricas_exito": {
    "alcance_minimo": "número",
    "engagement_objetivo": "número",
    "conversiones": "número"
  },
  "presupuesto_estimado": "rango",
  "recursos_necesarios": ["recurso1", "recurso2"]
}
\`\`\``;

      const respEst = await geminiGenerate({
        prompt: promptEstrategia,
        system: `Eres Content Strategist Senior. Responde siempre en JSON válido. Tono: ${tono}.`
      });

      const datosEst = parseRespuesta(respEst.text);
      setResultados(prev => ({
        ...prev,
        estrategia: datosEst || respEst.text,
        plan_7_dias: datosEst?.plan_7_dias || null,
        metricas: datosEst?.metricas_exito || null
      }));

      // RESUMEN EJECUTIVO
      const promptResumen = `Basándote en toda la información previa, crea un resumen ejecutivo de 3-4 líneas máximo para: "${objetivo}".`;
      
      const respResumen = await geminiGenerate({
        prompt: promptResumen,
        system: `Eres ejecutivo senior. Sé conciso y directo. Tono: ${tono}.`
      });

      setResultados(prev => ({
        ...prev,
        resumen_ejecutivo: respResumen.text
      }));

      setPaso('completado');
      guardarSesion();
    } catch (err) {
      setError(`Error: ${err.message}`);
      setPaso(null);
    } finally {
      setLoading(false);
    }
  };

  // Exportar como Markdown
  const exportarMarkdown = () => {
    let markdown = `# Estrategia: ${objetivo}\n\n`;
    markdown += `**Industria:** ${industria} | **Ubicación:** ${ciudad} | **Tono:** ${tono}\n\n`;
    
    if (resultados.resumen_ejecutivo) {
      markdown += `## Resumen Ejecutivo\n${resultados.resumen_ejecutivo}\n\n`;
    }
    
    if (resultados.investigacion) {
      markdown += `## Investigación\n${JSON.stringify(resultados.investigacion, null, 2)}\n\n`;
    }
    
    if (resultados.audiencias) {
      markdown += `## Buyer Personas\n${JSON.stringify(resultados.audiencias, null, 2)}\n\n`;
    }
    
    if (resultados.plan_7_dias) {
      markdown += `## Plan 7 Días\n`;
      resultados.plan_7_dias.forEach(item => {
        markdown += `- **${item.dia}:** ${item.accion}\n`;
      });
      markdown += '\n';
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estrategia-${objetivo.replace(/\s+/g, '-')}.md`;
    a.click();
  };

  return (
    <div className="flex-grow p-6 md:p-8 bg-slate-950 overflow-y-auto text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              🎯 Generador de Estrategia
            </h1>
            <p className="text-slate-400 text-sm mt-1">Automatiza tu plan de marketing en 2 minutos</p>
          </div>
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            📋 Historial ({historial.length})
          </button>
        </div>

        {/* Historial Modal */}
        {mostrarHistorial && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold">Sesiones Guardadas</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historial.length === 0 ? (
                <p className="text-slate-400 text-sm">Sin historial aún</p>
              ) : (
                historial.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{s.objetivo}</p>
                      <p className="text-xs text-slate-400">{s.fecha}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => cargarSesion(s.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold">Cargar</button>
                      <button onClick={() => eliminarSesion(s.id)} className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded text-xs font-semibold text-red-400">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Panel de Entrada */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">🎯 Objetivo Principal *</label>
            <input
              type="text"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ej: Aumentar ventas de servicios de fotografía en Instagram"
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-lg text-slate-100 placeholder-slate-500 transition-colors disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">🏢 Industria</label>
              <select value={industria} onChange={(e) => setIndustria(e.target.value)} disabled={loading} className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 px-3 py-2 rounded-lg text-slate-100">
                <option>ecommerce</option>
                <option>servicios</option>
                <option>salud</option>
                <option>educacion</option>
                <option>restaurante</option>
                <option>inmobiliario</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">📍 Ciudad</label>
              <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} disabled={loading} className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-lg text-slate-100" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">🎤 Tono</label>
              <select value={tono} onChange={(e) => setTono(e.target.value)} disabled={loading} className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-lg text-slate-100">
                <option value="profesional">Profesional</option>
                <option value="casual">Casual</option>
                <option value="premium">Premium</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {error && <div className="p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 text-sm">{error}</div>}

          <button
            onClick={ejecutarFlujo}
            disabled={!objetivo.trim() || loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                {paso === 'investigacion' && 'Investigando...'}
                {paso === 'audiencias' && 'Analizando audiencias...'}
                {paso === 'estrategia' && 'Generando estrategia...'}
              </>
            ) : (
              <>
                <i className="fas fa-bolt"></i>
                Generar Estrategia Completa
              </>
            )}
          </button>
        </div>

        {/* Resultados */}
        {paso === 'completado' && (
          <div className="space-y-4">
            
            {/* Resumen Ejecutivo */}
            {resultados.resumen_ejecutivo && (
              <div className="bg-gradient-to-r from-blue-900/30 to-violet-900/30 border border-blue-500/50 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-300 mb-2">📋 Resumen Ejecutivo</p>
                <p className="text-slate-200">{resultados.resumen_ejecutivo}</p>
              </div>
            )}

            {/* Grid de Resultados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Investigación */}
              {resultados.investigacion && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <h3 className="font-bold text-blue-400 mb-3">🔍 Investigación</h3>
                  {typeof resultados.investigacion === 'object' ? (
                    <div className="space-y-2 text-sm">
                      {resultados.investigacion.tendencias_principales && (
                        <div>
                          <p className="text-slate-400 font-semibold">Tendencias:</p>
                          <ul className="list-disc list-inside text-slate-300">
                            {resultados.investigacion.tendencias_principales.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                      {resultados.investigacion.oportunidades && (
                        <div>
                          <p className="text-slate-400 font-semibold">Oportunidades:</p>
                          <ul className="list-disc list-inside text-slate-300">
                            {resultados.investigacion.oportunidades.slice(0, 2).map((o, i) => <li key={i}>{o}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm">{typeof resultados.investigacion === 'string' ? resultados.investigacion.substring(0, 200) : 'Ver resultado'}</p>
                  )}
                </div>
              )}

              {/* Audiencias */}
              {resultados.audiencias && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <h3 className="font-bold text-purple-400 mb-3">👥 Buyer Personas</h3>
                  {typeof resultados.audiencias === 'object' && resultados.audiencias.buyer_personas ? (
                    <div className="space-y-2 text-sm">
                      {resultados.audiencias.buyer_personas.slice(0, 2).map((p, i) => (
                        <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800">
                          <p className="font-bold text-slate-200">{p.nombre}</p>
                          <p className="text-slate-400 text-xs">{p.edad} • {p.ocupacion}</p>
                          <p className="text-slate-300 text-xs mt-1">💡 {p.dolor_principal}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm">Ver audiencias definidas</p>
                  )}
                </div>
              )}

              {/* Plan 7 Días */}
              {resultados.plan_7_dias && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:col-span-2">
                  <h3 className="font-bold text-green-400 mb-3">📅 Plan 7 Días</h3>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {resultados.plan_7_dias.slice(0, 7).map((item, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                        <p className="text-xs font-bold text-slate-300">{item.dia}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.accion.substring(0, 25)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Métricas */}
              {resultados.metricas && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 md:col-span-2">
                  <h3 className="font-bold text-orange-400 mb-3">📊 Métricas de Éxito</h3>
                  {typeof resultados.metricas === 'object' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {Object.entries(resultados.metricas).map(([key, value]) => (
                        <div key={key} className="bg-slate-950 p-2 rounded border border-slate-800">
                          <p className="text-slate-400 text-xs font-semibold capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-slate-100 font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm">{resultados.metricas}</p>
                  )}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-slate-800">
              <button onClick={exportarMarkdown} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                <i className="fas fa-download"></i> Exportar Markdown
              </button>
              <button onClick={guardarSesion} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                <i className="fas fa-save"></i> Guardar Sesión
              </button>
              <button onClick={() => { setObjetivo(''); setPaso(null); setResultados({ investigacion: null, audiencias: null, estrategia: null, resumen_ejecutivo: null, plan_7_dias: null, metricas: null }); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                <i className="fas fa-plus"></i> Nueva Estrategia
              </button>
            </div>
          </div>
        )}

        {/* Estado Vacío */}
        {paso === null && !objetivo && (
          <div className="text-center py-16 text-slate-400">
            <i className="fas fa-lightbulb text-4xl mb-4"></i>
            <p>Define un objetivo para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
