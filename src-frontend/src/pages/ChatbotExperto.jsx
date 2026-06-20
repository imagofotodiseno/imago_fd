import React, { useState, useEffect, useRef } from 'react';
import { apiCall } from '../services/api';

export default function ChatbotExperto() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu Agente Experto de Imago Fotodiseño. ¿En qué proyecto o estrategia de marketing trabajamos hoy? 🚀' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Generar o recuperar un senderId único para esta sesión de navegador
  const [senderId] = useState(() => {
    let id = localStorage.getItem('imago_chat_sender_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('imago_chat_sender_id', id);
    }
    return id;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      // Obtener API key del localStorage como fallback
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('imago_gemini_key') : null;
      
      // Llamada al endpoint local de chat que interconecta con el orquestador
      const response = await apiCall('POST', '/api/chat/web', {
        senderId,
        message: text,
        apiKey: apiKey || undefined
      });

      // Agregar respuesta del bot
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: No se pudo obtener respuesta del agente. ${err.message || 'Verifica: 1) Conexión con servidor, 2) API Key configurada en Configuración'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow p-8 bg-slate-950 flex flex-col h-screen overflow-hidden text-slate-100">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Cabecera del Chat */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <i className="fas fa-robot text-white text-sm"></i>
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Agente Estratega Imago</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-400 font-medium">Activo e integrado con Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>

        {/* Mensajes del Chat */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4 flex flex-col">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-md ${
                  isUser ? 'bg-slate-700' : 'bg-gradient-to-br from-blue-600 to-purple-600'
                }`}>
                  <i className={`fas fa-${isUser ? 'user' : 'robot'} text-xs text-white`}></i>
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 shadow-md">
                <i className="fas fa-robot text-xs text-white"></i>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
                <i className="fas fa-circle-notch fa-spin text-blue-500"></i>
                Escribiendo respuesta...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input del Chat */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Escribe tu mensaje o pregunta sobre mercadeo y diseño..."
            className="flex-grow bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3.5 rounded-2xl text-sm text-slate-200 placeholder-slate-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-150"
          >
            <i className="fas fa-paper-plane text-sm text-white"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
