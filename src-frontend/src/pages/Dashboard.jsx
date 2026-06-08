import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="flex-grow p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* Cabecera */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            CRM IMAGO Command Center
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Bienvenido al panel unificado de Imago Fotodiseño. Accede a las herramientas de gestión y automatización con IA.
          </p>
        </div>

        {/* Sección 1: Gestión de Operaciones */}
        <div>
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
            Gestión y Operaciones CRM
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

            <Link to="/import" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-blue-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-blue-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <i className="fas fa-file-import text-blue-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">📥 Importador Inteligente</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Carga tus contactos de Excel, mapea las columnas visualmente y limpia teléfonos automáticamente.
                </p>
              </div>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/contacts" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-violet-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-violet-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-violet-500/20 transition-colors">
                  <i className="fas fa-address-book text-violet-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">👥 Gestión de Contactos</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Visualiza el listado completo de clientes, orígenes de importación y variables dinámicas.
                </p>
              </div>
              <span className="text-[10px] text-violet-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/campaigns" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-indigo-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-indigo-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-indigo-500/20 transition-colors">
                  <i className="fas fa-paper-plane text-indigo-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">📧 Campañas Masivas</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Envía plantillas oficiales de WhatsApp con pacing inteligente y control de reintentos automáticos.
                </p>
              </div>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/appointments" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-emerald-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-emerald-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <i className="fas fa-calendar-alt text-emerald-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">📅 Agenda y Citas</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Controla la agenda y programa recordatorios de WhatsApp automatizados a las 24 horas previas.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

          </div>
        </div>

        {/* Sección 2: Agentes y Automatización */}
        <div>
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
            Agentes Inteligentes y Conversaciones
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

            <Link to="/strategy" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-pink-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-pink-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-pink-500/20 transition-colors">
                  <i className="fas fa-chart-pie text-pink-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">🧠 Panel Estratégico</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Genera buyer personas, pilares de contenido e investiga tendencias con Gemini y Google Search en vivo.
                </p>
              </div>
              <span className="text-[10px] text-pink-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/chat" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-blue-400/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-blue-400/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-400/20 transition-colors">
                  <i className="fas fa-robot text-blue-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">💬 Chatbot Experto</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Interactúa directamente con el agente virtual oficial entrenado para vender servicios creativos de Imago.
                </p>
              </div>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/ads" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-purple-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-purple-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <i className="fas fa-bullhorn text-purple-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">📢 Meta Ads Copywriter</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Crea copys publicitarios de alto impacto (estructura AIDA) y genera imágenes creativas con IA al instante.
                </p>
              </div>
              <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/inbox" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-amber-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-amber-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <i className="fas fa-inbox text-amber-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">📥 Inbox Multicanal</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Gestiona las conversaciones entrantes de WhatsApp, Instagram y Web Widget de forma manual.
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

            <Link to="/crm-kanban" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-teal-500/50 p-4 sm:p-5 lg:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group">
              <div>
                <div className="bg-teal-500/10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-teal-500/20 transition-colors">
                  <i className="fas fa-columns text-teal-400 text-base sm:text-lg" />
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base leading-snug">📋 Tablero Kanban</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed hidden sm:block">
                  Controla tu pipeline y embudo de conversión arrastrando prospectos entre las diferentes etapas de venta.
                </p>
              </div>
              <span className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase mt-3 block">Entrar →</span>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}
