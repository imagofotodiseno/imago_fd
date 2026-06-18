import React, { useState } from 'react';
import { geminiGenerate } from '../services/api';

export default function MetaAdsCopywriter() {
  const [service, setService] = useState('');
  const [audience, setAudience] = useState('');
  const [copyResult, setCopyResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePromptUsed, setImagePromptUsed] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const generateAdCopy = async () => {
    if (!service.trim()) {
      alert('Por favor ingresa el servicio o producto.');
      return;
    }

    setLoading(true);
    setImageLoading(true);
    setCopyResult('');
    setImageUrl('');
    setImagePromptUsed('');

    try {
      const targetAudience = audience.trim() || 'público general';
      
      // 1. Generar Copy Persuasivo (Fórmula AIDA)
      const copyPrompt = `Crea un anuncio AIDA persuasivo para Meta Ads (Facebook/Instagram) sobre: "${service.trim()}". Dirigido a: "${targetAudience}". Incluye: Emojis, un gancho (Hook) muy atractivo en la primera línea, descripción del valor/solución, y un Call to Action (CTA) claro.`;
      const copyPromise = geminiGenerate({
        prompt: copyPrompt,
        system: "Copywriter Experto en Meta Ads y Redacción Persuasiva."
      });

      // 2. Generar el Prompt en Inglés para la imagen de IA
      const imagePromptGen = `Create a highly detailed, photorealistic image prompt (in english) for an ad about: "${service.trim()}" targeted to "${targetAudience}". The image should be commercial, high quality, and visually striking. Just return the english prompt, no other text or explanation.`;
      const imagePromise = geminiGenerate({
        prompt: imagePromptGen,
        system: "Expert Midjourney Prompt Engineer"
      });

      const [copyResponse, imageResponse] = await Promise.all([copyPromise, imagePromise]);

      setCopyResult(copyResponse.text);
      
      const rawPrompt = imageResponse.text.trim();
      setImagePromptUsed(rawPrompt);

      // 3. Montar la URL de Pollinations AI
      const encodedPrompt = encodeURIComponent(rawPrompt);
      const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true`;
      setImageUrl(pollUrl);

    } catch (err) {
      console.error(err);
      setCopyResult(`Error al generar copy: ${err.message}`);
      setImageLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-8 bg-slate-950 overflow-y-auto max-h-screen text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            📢 Meta Ads Copywriter
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Redacta anuncios de alto impacto bajo la estructura AIDA y genera su respectiva pieza gráfica publicitaria.
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Formulario Izquierda */}
            <div className="space-y-5 lg:col-span-2">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">
                  Producto o Servicio
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Ej. Sesión de fotos de producto"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none p-4 rounded-xl text-sm text-slate-200 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">
                  Público Objetivo
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Ej. Restaurantes y emprendimientos"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none p-4 rounded-xl text-sm text-slate-200 transition-colors"
                />
              </div>

              <button
                onClick={generateAdCopy}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 py-4 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/10 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> Creando Anuncio...
                  </span>
                ) : (
                  <span>
                    <i className="fas fa-magic mr-2"></i> Generar Anuncio y Diseño
                  </span>
                )}
              </button>
            </div>

            {/* Resultados Derecha */}
            <div className="lg:col-span-3 min-h-[300px] border border-slate-800 bg-slate-950 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-center">
              {!copyResult && !loading ? (
                <div className="text-center text-slate-500 p-8">
                  <i className="fas fa-bullhorn text-4xl mb-4 opacity-30 text-blue-500"></i>
                  <p className="text-sm max-w-xs mx-auto">Completa los campos a la izquierda y presiona "Generar Anuncio" para comenzar.</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 h-full">
                  {/* Copy publicitario */}
                  <div className="flex-1 whitespace-pre-wrap text-sm text-slate-300 pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 leading-relaxed font-sans">
                    {loading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <i className="fas fa-circle-notch fa-spin text-blue-500"></i> Escribiendo copy persuasivo...
                      </div>
                    ) : (
                      copyResult
                    )}
                  </div>

                  {/* Diseño visual */}
                  <div className="flex-1 flex flex-col items-center gap-4">
                    <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1.5 self-start">
                      <i className="fas fa-image text-purple-400"></i> Diseño Visual Generado
                    </h4>
                    
                    <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800/80 flex items-center justify-center">
                      {imageLoading && (
                        <div className="absolute inset-0 bg-slate-900 z-10 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                          <i className="fas fa-spinner fa-spin text-2xl text-purple-500"></i>
                          <span>Creando composición...</span>
                        </div>
                      )}
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="Diseño Publicitario Generado"
                          className="w-full h-full object-cover relative z-0 transition-transform duration-300 hover:scale-105 cursor-pointer"
                          onLoad={() => setImageLoading(false)}
                          onClick={() => window.open(imageUrl, '_blank')}
                          title="Click para ampliar"
                        />
                      )}
                    </div>

                    {imagePromptUsed && (
                      <p className="text-[10px] text-slate-500 text-center italic mt-2 px-2 max-h-16 overflow-y-auto w-full leading-normal">
                        "{imagePromptUsed}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
