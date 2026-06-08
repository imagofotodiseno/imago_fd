import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('imago_gemini_key') || '');
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  useEffect(() => {
    const updateUnread = () => {
      const convs = JSON.parse(localStorage.getItem('imago_conversations') || '[]');
      const count = convs.reduce((s, c) => s + (c.unread || 0), 0);
      setUnreadCount(count);
    };
    updateUnread();
    const interval = setInterval(updateUnread, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSetupApiKey = () => {
    const key = prompt('Pega tu API Key de Gemini aquí (Se guardará localmente en tu navegador):', apiKey);
    if (key !== null) {
      setApiKey(key);
      localStorage.setItem('imago_gemini_key', key);
      alert('API Key guardada localmente.');
    }
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { to: '/import', label: 'Importar Contactos', icon: 'fas fa-file-import' },
    { to: '/contacts', label: 'Lista Contactos', icon: 'fas fa-address-book' },
    { to: '/campaigns', label: 'Campañas Masivas', icon: 'fas fa-paper-plane' },
    { to: '/appointments', label: 'Agenda Citas', icon: 'fas fa-calendar-alt' },
    { type: 'divider', label: 'Agentes de IA' },
    { to: '/strategy', label: 'Panel Estratégico', icon: 'fas fa-chart-pie' },
    { to: '/chat', label: 'Chatbot Experto', icon: 'fas fa-robot' },
    { to: '/ads', label: 'Meta Ads Copywriter', icon: 'fas fa-bullhorn' },
    { to: '/inbox', label: 'Inbox', icon: 'fas fa-inbox', badge: unreadCount },
    { to: '/crm-kanban', label: 'CRM Kanban', icon: 'fas fa-columns' },
    { type: 'divider', label: 'Configuración' },
    { to: '/meta', label: 'Configuración Meta', icon: 'fas fa-cog' },
  ];

  return (
    <>
      {/* Overlay de fondo en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 w-72
          bg-slate-900 border-r border-slate-800
          flex flex-col shrink-0 text-slate-300
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:w-64 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + Botón cerrar (móvil) */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <i className="fas fa-rocket text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-white tracking-wide">IMAGO</h1>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">CRM & IA Control</span>
            </div>
          </div>
          {/* Botón X solo en móvil */}
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar menú"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-grow overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item, idx) => {
            if (item.type === 'divider') {
              return (
                <div key={idx} className="pt-4 pb-1.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {item.label}
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                      : 'hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <i className={`${item.icon} w-5 text-center text-slate-400 group-hover:text-white transition-colors`} />
                <span className="truncate">{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* API Key */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleSetupApiKey}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-400/5 border border-dashed border-amber-400/20 transition-all"
          >
            <i className="fas fa-key text-amber-500 w-5 text-center" />
            <span className="truncate">{apiKey ? 'API Key Guardada ✓' : 'Configurar API Key'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
