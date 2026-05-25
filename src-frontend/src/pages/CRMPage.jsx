import React, { useState, useEffect } from 'react';

export default function CRMPage() {
  const [leads, setLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    notes: ''
  });
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  useEffect(() => {
    let stored = JSON.parse(localStorage.getItem('imago_leads') || '[]');
    if (stored.length === 0) {
      stored = [
        { id: 'l1', name: 'Ana Gómez', email: '', phone: '3001234567', service: 'Fotografía de Producto', notes: '50 productos para e-commerce', status: 'new', date: '17 May' },
        { id: 'l2', name: 'Carlos Ruiz', email: 'carlos@mail.com', phone: '', service: 'Branding / Identidad Visual', notes: 'Logo para restaurante', status: 'progress', date: '16 May' },
        { id: 'l3', name: 'María Torres', email: '', phone: '', service: 'Gestión de Redes Sociales', notes: 'Consulta por precios', status: 'new', date: '17 May' },
      ];
      localStorage.setItem('imago_leads', JSON.stringify(stored));
    }
    setLeads(stored);
  }, []);

  const saveLeads = (updated) => {
    setLeads(updated);
    localStorage.setItem('imago_leads', JSON.stringify(updated));
  };

  const handleDragStart = (id) => {
    setDraggedLeadId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus) => {
    if (!draggedLeadId) return;
    const updated = leads.map(l => {
      if (l.id === draggedLeadId) {
        return { ...l, status: newStatus };
      }
      return l;
    });
    saveLeads(updated);
    setDraggedLeadId(null);
  };

  const deleteLead = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este lead?')) {
      const updated = leads.filter(l => l.id !== id);
      saveLeads(updated);
    }
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!newLead.name.trim()) return;

    const created = {
      id: 'l_' + Date.now(),
      name: newLead.name.trim(),
      email: newLead.email.trim(),
      phone: newLead.phone.trim(),
      service: newLead.service,
      notes: newLead.notes.trim(),
      status: 'new',
      date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    };

    const updated = [...leads, created];
    saveLeads(updated);
    setNewLead({ name: '', email: '', phone: '', service: '', notes: '' });
    setIsModalOpen(false);
  };

  const columns = [
    { id: 'new', label: 'Nuevo Lead', color: 'bg-blue-400', border: 'border-l-blue-500' },
    { id: 'progress', label: 'En Progreso', color: 'bg-amber-400', border: 'border-l-amber-500' },
    { id: 'closed', label: 'Cerrado / Ganado', color: 'bg-green-400', border: 'border-l-green-500' }
  ];

  return (
    <div className="flex-grow p-8 bg-slate-950 overflow-y-auto max-h-screen text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400">
              📊 CRM Kanban Pipeline
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Arrastra y suelta las tarjetas para actualizar la etapa de tus oportunidades comerciales.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all duration-150"
          >
            <i className="fas fa-plus"></i> Nuevo Lead
          </button>
        </div>

        {/* Tablero Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => {
            const colLeads = leads.filter(l => l.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col.id)}
                className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 flex flex-col min-h-[500px]"
              >
                {/* Cabecera Columna */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`}></span>
                    <span className="text-sm font-bold text-slate-200">{col.label}</span>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-semibold">
                    {colLeads.length}
                  </span>
                </div>

                {/* Tarjetas */}
                <div className="flex-grow flex flex-col gap-3 overflow-y-auto">
                  {colLeads.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs py-8 border-2 border-dashed border-slate-800/60 rounded-2xl flex items-center justify-center">
                      Arrastra leads aquí
                    </div>
                  ) : (
                    colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        className={`bg-slate-950 border border-slate-800 hover:border-slate-700/80 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:shadow-lg transition-all relative border-l-4 ${col.border}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">
                            {lead.date}
                          </span>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-slate-600 hover:text-red-400 transition-colors text-xs"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">{lead.name}</h4>
                        {lead.service && (
                          <div className="text-[10px] text-blue-400 mt-1.5 flex items-center gap-1">
                            <i className="fas fa-tag"></i> {lead.service}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <i className="fas fa-phone-alt"></i> {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <i className="far fa-envelope"></i> {lead.email}
                          </div>
                        )}
                        {lead.notes && (
                          <p className="text-xs text-slate-400 mt-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 leading-relaxed">
                            {lead.notes}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Nuevo Lead */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
              <h3 className="font-bold text-lg text-white mb-6">Agregar Nuevo Lead</h3>
              <form onSubmit={handleCreateLead} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Nombre completo *"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-200"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-200"
                />
                <input
                  type="tel"
                  placeholder="Teléfono / WhatsApp"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-200"
                />
                <select
                  value={newLead.service}
                  onChange={(e) => setNewLead({ ...newLead, service: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-350"
                >
                  <option value="">Servicio de interés...</option>
                  <option value="Fotografía de Producto">Fotografía de Producto</option>
                  <option value="Branding / Identidad Visual">Branding / Identidad Visual</option>
                  <option value="Diseño Editorial">Diseño Editorial</option>
                  <option value="Diseño Web (SEO)">Diseño Web (SEO)</option>
                  <option value="Impresión Litográfica">Impresión Litográfica</option>
                  <option value="Marquillas y Etiquetas">Marquillas y Etiquetas</option>
                </select>
                <textarea
                  placeholder="Notas adicionales..."
                  rows="3"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-200 resize-none"
                ></textarea>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl text-sm border border-slate-800 text-slate-400 hover:bg-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-lg shadow-blue-500/25"
                  >
                    Guardar Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
