import { useEffect, useMemo, useState } from 'react';
import { uploadFile, previewImport, commitImport, getMetaConfig, saveMetaConfig, pingMeta, syncTemplates, getAppointments, createAppointment, getTemplates, getContacts, createCampaign, scheduleCampaign, getCampaignStatus } from './services/api';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
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
  const [campaign, setCampaign] = useState({ name: '', templateId: '', messageBody: '' });
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const mappedHeaders = useMemo(() => headers.length ? headers : ['Teléfono', 'Nombre', 'Variable 1', 'Variable 2'], [headers]);

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

  const handleDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    const result = await uploadFile(form);
    setFilePath(result.filePath);
    setHeaders(result.headers);
    setLoading(false);
    setMessage('Archivo subido. Selecciona el mapeo y visualiza el preview.');
  };

  const handlePreview = async () => {
    if (!filePath) return;
    setLoading(true);
    const result = await previewImport({ filePath, mapping, defaultCountry: '+57' });
    setPreview(result);
    setLoading(false);
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
      case 'import':
        return (
          <div className={card}>
            <h2 className="text-2xl font-semibold mb-4">Importador Inteligente</h2>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="border border-dashed border-slate-700 rounded-3xl p-10 text-center text-slate-400 cursor-pointer hover:border-slate-500 transition">
              <p className="text-xl">Arrastra un archivo .xlsx o .csv aquí.</p>
              <p className="text-sm text-slate-500 mt-2">También puedes hacer click para seleccionar un archivo.</p>
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
