import React, { useState, useEffect } from 'react';

export default function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false); // controla la vista en móvil

  useEffect(() => {
    let convs = JSON.parse(localStorage.getItem('imago_conversations') || '[]');
    if (convs.length === 0) {
      convs = [
        {
          id: 'wa_573001234567',
          name: 'Ana Gómez',
          channel: 'WhatsApp',
          avatar: 'AG',
          status: 'new',
          unread: 2,
          messages: [
            { from: 'client', text: 'Hola! ¿Hacen sesiones de fotos para e-commerce?', time: '10:15' },
            { from: 'bot', text: '¡Hola Ana! Sí, somos especialistas en fotografía de producto 📸. ¿Cuántos productos necesitas fotografiar?', time: '10:15' },
            { from: 'client', text: 'Tengo como 50 productos para mi tienda de ropa', time: '10:17' },
          ]
        },
        {
          id: 'web_abc123',
          name: 'Carlos Ruiz',
          channel: 'Web Chat',
          avatar: 'CR',
          status: 'progress',
          unread: 0,
          messages: [
            { from: 'client', text: 'Necesito un logo para mi restaurante', time: 'Ayer' },
            { from: 'bot', text: '¡Con gusto! 🎨 ¿Tienes algún estilo o referencia en mente para el diseño?', time: 'Ayer' },
          ]
        },
        {
          id: 'ig_987654',
          name: 'María Torres',
          channel: 'Instagram',
          avatar: 'MT',
          status: 'new',
          unread: 1,
          messages: [
            { from: 'client', text: '¿Cuánto vale el paquete de redes sociales?', time: '09:30' },
          ]
        },
      ];
      localStorage.setItem('imago_conversations', JSON.stringify(convs));
    }
    setConversations(convs);
  }, []);

  const saveConversations = (updated) => {
    setConversations(updated);
    localStorage.setItem('imago_conversations', JSON.stringify(updated));
  };

  const openConversation = (id) => {
    const updated = conversations.map(c =>
      c.id === id ? { ...c, unread: 0 } : c
    );
    saveConversations(updated);
    setActiveChat(updated.find(c => c.id === id));
    setShowChat(true); // en móvil, pasar a vista de chat
  };

  const goBackToList = () => {
    setShowChat(false);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeChat) return;
    const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const newMsg = { from: 'user', text: replyText, time: now };
    const updated = conversations.map(c =>
      c.id === activeChat.id
        ? { ...c, messages: [...c.messages, newMsg] }
        : c
    );
    saveConversations(updated);
    setActiveChat(updated.find(c => c.id === activeChat.id));
    setReplyText('');
  };

  const moveToKanban = (status) => {
    if (!activeChat) return;
    let leads = JSON.parse(localStorage.getItem('imago_leads') || '[]');
    const exists = leads.find(l => l.id === activeChat.id);
    if (!exists) {
      leads.push({
        id: activeChat.id,
        name: activeChat.name,
        email: '',
        phone: activeChat.id.startsWith('wa_') ? activeChat.id.replace('wa_', '+') : '',
        service: '',
        notes: `Origen: ${activeChat.channel}`,
        status,
        date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
      });
    } else {
      exists.status = status;
    }
    localStorage.setItem('imago_leads', JSON.stringify(leads));
    alert(`Contacto movido a Kanban (${status === 'progress' ? 'En Progreso' : 'Cerrado'})`);
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.channel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex h-full bg-slate-950 text-slate-100 overflow-hidden">

      {/* ── Panel de lista de conversaciones ── */}
      <div className={`
        flex flex-col bg-slate-900/20 border-r border-slate-800 shrink-0
        w-full sm:w-80 lg:w-80
        ${showChat ? 'hidden sm:flex' : 'flex'}
      `}>
        <div className="p-3 sm:p-4 border-b border-slate-800">
          <div className="relative">
            <i className="fas fa-search absolute left-3.5 top-3 text-slate-500 text-xs" />
            <input
              type="text"
              placeholder="Buscar conversación..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-slate-800/40">
          {filteredConversations.length === 0 ? (
            <p className="text-center text-slate-600 text-xs p-6">No hay conversaciones</p>
          ) : (
            filteredConversations.map(c => (
              <div
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`p-3 sm:p-4 cursor-pointer hover:bg-slate-900/40 transition-colors flex items-start gap-3 relative ${
                  activeChat?.id === c.id ? 'bg-slate-900/60 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
                    {c.avatar}
                  </div>
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white shadow-md">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate text-white">{c.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {c.messages.length > 0 ? c.messages[c.messages.length - 1].time : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                    <i className={`fab ${
                      c.channel === 'WhatsApp' ? 'fa-whatsapp text-green-500' :
                      c.channel === 'Instagram' ? 'fa-instagram text-pink-500' : 'fa-globe text-blue-400'
                    }`} />
                    <span>{c.channel}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate leading-snug">
                    {c.messages.length > 0 ? c.messages[c.messages.length - 1].text : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Panel de chat activo ── */}
      <div className={`
        flex-grow flex flex-col bg-slate-950 min-w-0
        ${showChat ? 'flex' : 'hidden sm:flex'}
      `}>
        {!activeChat ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-600 p-8">
            <i className="fas fa-comments text-5xl mb-4 opacity-25 text-blue-400" />
            <p className="text-sm text-center">Selecciona una conversación del listado</p>
          </div>
        ) : (
          <div className="flex-grow flex flex-col h-full overflow-hidden">
            {/* Cabecera del chat */}
            <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/20 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Botón volver (solo en móvil) */}
                  <button
                    onClick={goBackToList}
                    className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <i className="fas fa-arrow-left text-sm" />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {activeChat.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-white truncate">{activeChat.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <i className={`fab ${
                        activeChat.channel === 'WhatsApp' ? 'fa-whatsapp text-green-500' :
                        activeChat.channel === 'Instagram' ? 'fa-instagram text-pink-500' : 'fa-globe text-blue-400'
                      }`} />
                      <span className="truncate">{activeChat.channel}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => moveToKanban('progress')}
                    className="px-2 sm:px-3.5 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-all duration-200 whitespace-nowrap"
                  >
                    <i className="fas fa-arrow-right sm:mr-1.5" />
                    <span className="hidden sm:inline">En Progreso</span>
                  </button>
                  <button
                    onClick={() => moveToKanban('closed')}
                    className="px-2 sm:px-3.5 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold hover:bg-green-500/20 transition-all duration-200 whitespace-nowrap"
                  >
                    <i className="fas fa-check sm:mr-1.5" />
                    <span className="hidden sm:inline">Cerrar Lead</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-grow overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-slate-950 flex flex-col">
              {activeChat.messages.map((m, idx) => {
                const isAgent = m.from === 'user';
                return (
                  <div key={idx} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isAgent
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      <div>{m.text}</div>
                      <div className={`text-[10px] mt-1 text-right ${isAgent ? 'text-blue-200' : 'text-slate-500'}`}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Caja de respuesta */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/10 shrink-0 flex gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Escribe una respuesta manual..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                className="flex-grow bg-slate-950 border border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <button
                onClick={handleSendReply}
                className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-150 shrink-0"
              >
                <i className="fas fa-paper-plane text-sm text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
