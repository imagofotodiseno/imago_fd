import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadFile, previewImport, commitImport, getMetaConfig, saveMetaConfig, pingMeta, syncTemplates, getAppointments, createAppointment, getTemplates, getContacts, createCampaign, scheduleCampaign, getCampaignStatus, geminiGenerate } from './services/api';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'strategy', label: 'Panel Estratégico' },
  { id: 'chat', label: 'Chatbot Experto' },
  { id: 'ads', label: 'Meta Ads' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'kanban', label: 'CRM Kanban' },
  { id: 'widget', label: 'Widget Web' },
  { id: 'contacts', label: 'Contactos' },
  { id: 'import', label: 'Importar' },
  { id: 'meta', label: 'Meta' },
  { id: 'campaigns', label: 'Campañas' },
  { id: 'appointments', label: 'Citas' }
];

const card = 'rounded-[2rem] border border-slate-800 bg-slate-900/90 shadow-xl shadow-black/20 p-6';

function App() {
  const [active, setActive] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [headers, setHeaders] = useState([]);
  const [filePath, setFilePath] = useState('');
  const [mapping, setMapping] = useState({ phone: '', name: '', var1: '', var2: '' });
  const [preview, setPreview] = useState(null);
  const [metaConfig, setMetaConfigState] = useState({ access_token: '', phone_number_id: '', waba_id: '' });
  const [templates, setTemplates] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactFilter, setContactFilter] = useState('');
  const [strategyPrompt, setStrategyPrompt] = useState('');
  const [strategyResult, setStrategyResult] = useState('');
  const [chatMessages, setChatMessages] = useState([{ sender: 'bot', text: 'Hola, soy tu agente de marketing. ¿En qué te puedo ayudar?' }]);
  const [chatInput, setChatInput] = useState('');
  const [adPrompt, setAdPrompt] = useState('');
  const [adResult, setAdResult] = useState('');
  const [inboxThreads] = useState([
    { id: 1, from: '+573125550123', subject: 'Consulta de servicios', preview: 'Hola, quiero información sobre el paquete de diseño...' },
    { id: 2, from: '+573125550124', subject: 'Presupuesto urgente', preview: 'Necesito una cotización para un evento...' }
  ]);
  const [campaign, setCampaign] = useState({ name: '', templateId: '', messageBody: '' });
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const mappedHeaders = useMemo(() => headers.length ? headers : ['Teléfono', 'Nombre', 'Variable 1', 'Variable 2'], [headers]);
  const filteredContacts = useMemo(() => {
    if (!contactFilter.trim()) return contacts;
    const normalizedFilter = contactFilter.trim().toLowerCase();
    return contacts.filter((contact) => {
      return [contact.phone, contact.name, contact.var1, contact.var2]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedFilter));
    });
  }, [contacts, contactFilter]);

  useEffect(() => {
    fetchMetaConfig();
    fetchAppointments();
    fetchContacts();
    fetchTemplates();
  }, []);

  const fetchMetaConfig = async () => {
    const data = await getMetaConfig();
    setMetaConfigState(data);
  };

  const fetchAppointments = async () => {
    const { appointments } = await getAppointments();
    setAppointments(appointments || []);
  };

  const fetchContacts = async () => {
    const { contacts } = await getContacts();
    setContacts(contacts || []);
  };

  const fetchTemplates = async () => {
    const { templates } = await getTemplates();
    setTemplates(templates || []);
  };

  const uploadSelectedFile = async (file) => {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    try {
      const result = await uploadFile(form);
      setFilePath(result.filePath);
      setHeaders(result.headers);
      setMessage('Archivo subido. Selecciona el mapeo y visualiza el preview.');
    } catch (error) {
      setMessage(error.message || 'Error al subir el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadSelectedFile(file);
    event.target.value = '';
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0] || event.dataTransfer.items?.[0]?.getAsFile?.();
    if (!file) return;
    await uploadSelectedFile(file);
  };

  const handlePreview = async () => {
    if (!filePath) return;
    setLoading(true);
    const result = await previewImport({ filePath, mapping, defaultCountry: '+57' });
    setPreview(result);
    setLoading(false);
  };

  const handleStrategyGenerate = async () => {
    if (!strategyPrompt.trim()) return;
    setLoading(true);
    try {
      const response = await geminiGenerate({
        prompt: strategyPrompt,
        system: 'Eres un consultor de marketing digital especializado en Imago Fotodiseño.',
        useSearch: true
      });
      setStrategyResult(response.text || 'No se obtuvo respuesta.');
    } catch (error) {
      setStrategyResult('Error al generar la estrategia.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const message = chatInput.trim();

    setChatMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await geminiGenerate({
        prompt: message,
        system: 'Eres un asistente de marketing persuasivo para Imago Fotodiseño. Responde de forma amable y comercial.',
        useSearch: false
      });
      setChatMessages((prev) => [...prev, { sender: 'bot', text: response.text || 'No hay respuesta.' }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { sender: 'bot', text: 'Error al conectar con el asistente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAd = async () => {
    if (!adPrompt.trim()) return;
    setLoading(true);

    try {
      const response = await geminiGenerate({
        prompt: `Eres un copywriter experto en Meta Ads y WhatsApp Business. Genera un texto corto y persuasivo para un anuncio sobre: ${adPrompt}`,
        system: 'Eres un experto en creación de anuncios de marketing digital.',
        useSearch: false
      });
      setAdResult(response.text || 'No se obtuvo texto de anuncio.');
    } catch (error) {
      setAdResult('Error al generar el copy de anuncio.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!filePath) return;
    setLoading(true);
    const result = await commitImport({ filePath, mapping, defaultCountry: '+57' });
    setMessage(`Importación completa. ${result.imported}/${result.totalRows} importados.`);
    setLoading(false);
    fetchContacts();
  };

  const handleSaveMeta = async () => {
    await saveMetaConfig(metaConfig);
    setMessage('Configuración guardada.');
  };

  const handlePing = async () => {
    setLoading(true);
    const result = await pingMeta();
    setMessage(result.result ? 'Conexión exitosa con Meta.' : 'Error al verificar Meta.');
    setLoading(false);
  };

  const handleSyncTemplates = async () => {
    setLoading(true);
    const result = await syncTemplates();
    setTemplates(result.templates || []);
    setMessage('Plantillas sincronizadas');
    setLoading(false);
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const body = Object.fromEntries(form.entries());
    await createAppointment(body);
    setMessage('Cita creada y notificación enviada.');
    fetchAppointments();
  };

  const handleCreateCampaign = async () => {
    const result = await createCampaign(campaign);
    if (result.campaignId) {
      setCampaign((prev) => ({ ...prev, campaignId: result.campaignId }));
      setMessage('Campaña creada con ID ' + result.campaignId);
    }
  };

  const handleScheduleCampaign = async () => {
    if (!campaign.campaignId) return;
    const contactIds = contacts.map((contact) => contact.id);
    await scheduleCampaign(campaign.campaignId, { messageBody: campaign.messageBody, contactIds });
    const statusData = await getCampaignStatus(campaign.campaignId);
    setStatus(statusData.status || []);
    setMessage('Campaña programada y en cola.');
  };

  const activeContent = () => {
    switch (active) {
      case 'dashboard':
        return (
          <div className={card}>
            <h1 className="text-3xl font-bold mb-4">IMAGO CRM</h1>
            <p className="text-slate-400 max-w-2xl leading-7">Panel central de campañas, importación de contactos, sincronización de plantillas y agenda de citas para WhatsApp Business Cloud.</p>
            <div className="grid gap-4 mt-6 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 p-5 bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Contactos</p>
                <p className="mt-4 text-3xl font-semibold">{contacts.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 p-5 bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Plantillas</p>
                <p className="mt-4 text-3xl font-semibold">{templates.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 p-5 bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Citas</p>
                <p className="mt-4 text-3xl font-semibold">{appointments.length}</p>
              </div>
            </div>
          </div>
        );
      case 'strategy':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Panel Estratégico</h2>
            <p className="text-slate-400 mb-4">Genera ideas, estudio de audiencia y estrategia de contenidos con IA.</p>
            <textarea
              value={strategyPrompt}
              onChange={(e) => setStrategyPrompt(e.target.value)}
              rows={5}
              placeholder="Describe tu producto, servicio o audiencia objetivo"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 outline-none"
            />
            <button onClick={handleStrategyGenerate} disabled={loading || !strategyPrompt.trim()} className="mt-4 rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">Generar estrategia</button>
            {strategyResult && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-4 text-slate-100 whitespace-pre-line">{strategyResult}</div>
            )}
          </div>
        );
      case 'chat':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Chatbot Experto</h2>
            <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-2">
              {chatMessages.map((message, index) => (
                <div key={index} className={`rounded-3xl p-4 ${message.sender === 'bot' ? 'bg-slate-900 text-slate-100 self-start' : 'bg-blue-600 text-white self-end'} max-w-xl`}>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe tu pregunta al asistente"
                className="flex-1 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
              />
              <button onClick={handleSendChat} disabled={loading || !chatInput.trim()} className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50">Enviar</button>
            </div>
          </div>
        );
      case 'ads':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Meta Ads Copywriter</h2>
            <p className="text-slate-400 mb-4">Genera textos cortos y persuasivos para tus anuncios de WhatsApp y Meta.</p>
            <input
              value={adPrompt}
              onChange={(e) => setAdPrompt(e.target.value)}
              placeholder="Describe el producto, promoción o público objetivo"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 outline-none"
            />
            <button onClick={handleGenerateAd} disabled={loading || !adPrompt.trim()} className="mt-4 rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50">Generar copy</button>
            {adResult && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-4 text-slate-100 whitespace-pre-line">{adResult}</div>
            )}
          </div>
        );
      case 'inbox':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Inbox</h2>
            <p className="text-slate-400 mb-6">Mensajes entrantes simulados para revisar solicitudes y leads.</p>
            <div className="space-y-4">
              {inboxThreads.map((thread) => (
                <div key={thread.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-100">{thread.subject}</p>
                      <p className="text-slate-400 text-sm">{thread.from}</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase text-slate-400">Nuevo</span>
                  </div>
                  <p className="mt-3 text-slate-400 text-sm">{thread.preview}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'kanban':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">CRM Kanban</h2>
            <p className="text-slate-400 mb-6">Visualiza tus contactos en un pipeline básico de estado.</p>
            <div className="grid gap-4 md:grid-cols-3">
              {['Nuevo', 'En Progreso', 'Cerrado'].map((statusLabel, index) => (
                <div key={statusLabel} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <h3 className="mb-4 text-sm uppercase tracking-[0.2em] text-slate-500">{statusLabel}</h3>
                  <div className="space-y-3">
                    {contacts.filter((_, idx) => idx % 3 === index).map((contact) => (
                      <div key={contact.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-3">
                        <p className="text-slate-100 font-semibold">{contact.name || contact.phone}</p>
                        <p className="text-slate-400 text-xs">{contact.phone}</p>
                      </div>
                    ))}
                    {!contacts.filter((_, idx) => idx % 3 === index).length && (
                      <p className="text-slate-500 text-sm">Sin elementos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'widget':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Widget Web</h2>
            <p className="text-slate-400 mb-4">Inserta el widget de chat en cualquier sitio web usando este script.</p>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <code className="block whitespace-pre-wrap text-sm text-slate-100">{`<script src="https://tudominio.com/widget.js" defer></script>`}</code>
            </div>
            <p className="mt-4 text-slate-400">Asegúrate de desplegar también <code className="text-slate-200">widget.css</code> y <code className="text-slate-200">widget.js</code> en el mismo dominio.</p>
          </div>
        );
      case 'contacts':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Contactos importados</h2>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-400">Total: {contacts.length} contactos</p>
              <input
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                placeholder="Buscar por teléfono, nombre o variable"
                className="w-full sm:w-auto rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
              />
            </div>
            {filteredContacts.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Var 1</th>
                      <th className="px-4 py-3">Var 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="border-b border-slate-800 hover:bg-slate-950/80">
                        <td className="px-4 py-3 text-slate-200">{contact.id}</td>
                        <td className="px-4 py-3 text-slate-200">{contact.phone}</td>
                        <td className="px-4 py-3 text-slate-200">{contact.name || '-'}</td>
                        <td className="px-4 py-3 text-slate-200">{contact.var1 || '-'}</td>
                        <td className="px-4 py-3 text-slate-200">{contact.var2 || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400">No hay contactos importados aún. Utiliza la pestaña Importar para cargar tu archivo.</p>
            )}
          </div>
        );
      case 'import':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Importador Inteligente</h2>
            <div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.csv" onChange={handleFileSelect} className="hidden" />
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className="border border-dashed border-slate-700 rounded-3xl p-10 text-center text-slate-400 cursor-pointer hover:border-slate-500 transition">
                <p className="text-xl">Arrastra un archivo .xlsx o .csv aquí.</p>
                <p className="text-sm text-slate-500 mt-2">También puedes hacer click para seleccionar un archivo.</p>
              </div>
            </div>
            {headers.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {['phone', 'name', 'var1', 'var2'].map((field) => (
                  <label key={field} className="block text-slate-300">
                    <span className="text-slate-400 text-sm uppercase tracking-[0.2em]">{field === 'phone' ? 'Teléfono' : field === 'name' ? 'Nombre' : field === 'var1' ? 'Variable 1' : 'Variable 2'}</span>
                    <select value={mapping[field]} onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))} className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm">
                      <option value="">Seleccionar columna</option>
                      {mappedHeaders.map((header) => (<option key={header} value={header}>{header}</option>))}
                    </select>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button disabled={!filePath || loading} onClick={handlePreview} className="rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-50">Ver preview</button>
              <button disabled={!preview || loading} onClick={handleCommit} className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold transition hover:bg-emerald-500 disabled:opacity-50">Importar contactos</button>
            </div>
            {preview && (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4">
                <div className="text-slate-300 mb-4">Vista preliminar ({preview.totalRows} filas)</div>
                <div className="grid grid-cols-1 gap-3">
                  {preview.preview.slice(0, 4).map((row) => (
                    <div key={row.rowIndex} className={`rounded-3xl p-4 ${row.valid ? 'bg-slate-900 border border-slate-800' : 'bg-amber-950 border border-amber-800'}`}>
                      <p className="text-sm">Fila {row.rowIndex}: {row.name} · {row.normalizedPhone || row.phone}</p>
                      {row.error && <p className="text-xs text-amber-300">{row.error}</p>}
                      {row.duplicate && <p className="text-xs text-slate-400">Duplicado detectado</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'meta':
        return (
          <div className={card}>
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Configuración Meta</h2>
                <p className="mt-2 text-slate-400">Ingresa tus credenciales de Meta Cloud para validar la cuenta y sincronizar plantillas.</p>
              </div>
              {['access_token', 'phone_number_id', 'waba_id'].map((key) => (
                <label key={key} className="block text-slate-300">
                  <span className="text-slate-400 text-sm uppercase tracking-[0.15em]">{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <input value={metaConfig[key] || ''} onChange={(e) => setMetaConfigState((prev) => ({ ...prev, [key]: e.target.value }))} className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-100 outline-none" />
                </label>
              ))}
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSaveMeta} className="rounded-3xl bg-violet-600 px-6 py-3 text-sm font-semibold hover:bg-violet-500">Guardar</button>
                <button onClick={handlePing} className="rounded-3xl bg-sky-600 px-6 py-3 text-sm font-semibold hover:bg-sky-500">Validar conexión</button>
                <button onClick={handleSyncTemplates} className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold hover:bg-emerald-500">Sincronizar plantillas</button>
              </div>
              <div className="grid gap-4 mt-6">
                {templates.slice(0, 5).map((template) => (
                  <div key={template.id} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-slate-300 font-semibold">{template.name}</div>
                    <div className="text-slate-500 text-xs mt-1">Idioma: {template.language}</div>
                  </div>
                ))}
                {!templates.length && <p className="text-slate-500">No hay plantillas sincronizadas aún.</p>}
              </div>
            </div>
          </div>
        );
      case 'campaigns':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Campañas y envío masivo</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-slate-300">
                <span className="text-slate-400 text-sm">Nombre de campaña</span>
                <input value={campaign.name} onChange={(e) => setCampaign((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" />
              </label>
              <label className="block text-slate-300">
                <span className="text-slate-400 text-sm">Plantilla</span>
                <select value={campaign.templateId} onChange={(e) => setCampaign((prev) => ({ ...prev, templateId: e.target.value }))} className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm">
                  <option value="">Seleccionar plantilla</option>
                  {templates.map((template) => (<option key={template.id} value={template.id}>{template.name}</option>))}
                </select>
              </label>
              <label className="block text-slate-300 md:col-span-2">
                <span className="text-slate-400 text-sm">Nombre de template de WhatsApp</span>
                <input value={campaign.messageBody} onChange={(e) => setCampaign((prev) => ({ ...prev, messageBody: e.target.value }))} placeholder="Ej. appointment_reminder" className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleCreateCampaign} className="rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500">Crear campaña</button>
              <button onClick={handleScheduleCampaign} className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold hover:bg-emerald-500">Programar envío</button>
            </div>
            <div className="mt-6">
              <div className="text-slate-300 font-semibold mb-3">Estado de campaña</div>
              <div className="grid gap-3 md:grid-cols-3">
                {status.map((item) => (
                  <div key={item.status} className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-slate-400 uppercase text-xs tracking-[0.2em]">{item.status}</div>
                    <div className="mt-2 text-2xl font-semibold">{item.count}</div>
                  </div>
                ))}
                {!status.length && <div className="text-slate-500">No hay datos de estado aún.</div>}
              </div>
            </div>
          </div>
        );
      case 'appointments':
        return (
          <div className={card}>
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Nueva cita</h2>
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <label className="block text-slate-300">
                    <span className="text-slate-400 text-sm">Teléfono</span>
                    <input name="phone" placeholder="+573125550123" className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" required />
                  </label>
                  <label className="block text-slate-300">
                    <span className="text-slate-400 text-sm">Nombre</span>
                    <input name="name" className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" required />
                  </label>
                  <label className="block text-slate-300">
                    <span className="text-slate-400 text-sm">Servicio</span>
                    <input name="service" className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" required />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-slate-300">
                      <span className="text-slate-400 text-sm">Inicio</span>
                      <input name="starts_at" type="datetime-local" className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" required />
                    </label>
                    <label className="block text-slate-300">
                      <span className="text-slate-400 text-sm">Fin</span>
                      <input name="ends_at" type="datetime-local" className="mt-2 w-full rounded-3xl bg-slate-950 border border-slate-800 p-3 text-sm" required />
                    </label>
                  </div>
                  <button type="submit" className="rounded-3xl bg-violet-600 px-6 py-3 text-sm font-semibold hover:bg-violet-500">Crear cita</button>
                </form>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">Citas recientes</h2>
                <div className="space-y-3">
                  {appointments.map((appoint) => (
                    <div key={appoint.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-slate-200 font-semibold">{appoint.contact_name || appoint.contact_phone}</p>
                          <p className="text-slate-400 text-sm">{appoint.service}</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{appoint.status}</span>
                      </div>
                      <p className="mt-3 text-slate-500 text-sm">{new Date(appoint.starts_at).toLocaleString()}</p>
                    </div>
                  ))}
                  {!appointments.length && <p className="text-slate-500">No se han registrado citas aún.</p>}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-[2.5rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-black/25">
            <div className="mb-8">
              <div className="mb-4 text-2xl font-bold">IMAGO CRM</div>
              <p className="text-slate-400 text-sm">Panel todo en uno para integración WhatsApp, importación, campañas y citas.</p>
            </div>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button key={tab.id} className={`w-full rounded-3xl px-5 py-4 text-left text-sm font-semibold transition ${active === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-950/70 text-slate-300 hover:bg-slate-900'}`} onClick={() => setActive(tab.id)}>{tab.label}</button>
              ))}
            </div>
          </aside>
          <section>{activeContent()}</section>
        </div>
        {message && <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-slate-100">{message}</div>}
      </div>
    </div>
  );
}

export default App;
