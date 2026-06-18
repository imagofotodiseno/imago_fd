import React, { useState, useCallback } from 'react';
import { apiCall } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const downloadErrorsCSV = (errorLogs) => {
  const header = 'Fila,Teléfono Original,Nombre,Error\n';
  const rows = errorLogs
    .map((e) => `${e.row},"${e.originalPhone || ''}","${e.name || ''}","${e.error}"`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'errores_importacion.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Toast = ({ type, message, onDismiss }) => {
  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    error: 'bg-red-500/10 border-red-500/40 text-red-300',
    info: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
  };
  return (
    <div className={`flex items-start gap-3 border rounded-2xl px-4 py-3 text-sm ${colors[type]}`}>
      <i className={`fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mt-0.5`}></i>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
  );
};

const StepIndicator = ({ current }) => {
  const steps = ['Subir Archivo', 'Mapear Columnas', 'Previsualizar', 'Confirmar'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = current > stepNum;
        const active = current === stepNum;
        return (
          <React.Fragment key={stepNum}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done ? 'bg-emerald-500 border-emerald-500 text-white' :
                active ? 'bg-blue-600 border-blue-500 text-white' :
                'bg-slate-900 border-slate-700 text-slate-500'
              }`}>
                {done ? <i className="fas fa-check text-[10px]"></i> : stepNum}
              </div>
              <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${
                active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-slate-600'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mb-5 mx-2 transition-all ${done ? 'bg-emerald-500/60' : 'bg-slate-800'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Dynamic mapping state
  const [phoneColumn, setPhoneColumn] = useState('');
  const [nameColumn, setNameColumn] = useState('');
  // mergeTags: [{ tagName: string, columnName: string }]
  const [mergeTags, setMergeTags] = useState([]);

  // Preview results
  const [preview, setPreview] = useState(null); // { validRecords, errorLogs, totalRows }
  const [importResult, setImportResult] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

  const buildMapping = () => ({
    phoneColumn,
    nameColumn,
    mergeTags: Object.fromEntries(
      mergeTags
        .filter((t) => t.tagName.trim() && t.columnName)
        .map((t) => [t.tagName.trim(), t.columnName])
    )
  });

  // ── Step 1: Upload ──────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', f);
    try {
      const data = await fetch('/api/import/upload', { method: 'POST', body: formData }).then(r => r.json());
      if (data.error) throw new Error(data.error);
      setFile(data);
      setHeaders(data.headers || []);
      setPhoneColumn('');
      setNameColumn('');
      setMergeTags([]);
      setStep(2);
      showToast('success', `Archivo "${f.name}" cargado. ${data.headers?.length || 0} columnas detectadas.`);
    } catch (err) {
      showToast('error', 'Error al subir el archivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleUpload({ target: { files: [f] } });
  }, []);

  // ── Step 2: Merge Tag Builder ───────────────────────────────────────────────
  const addMergeTag = () => {
    if (mergeTags.length >= 8) return;
    setMergeTags([...mergeTags, { tagName: '', columnName: '' }]);
  };
  const updateMergeTag = (index, field, value) => {
    const updated = mergeTags.map((t, i) => i === index ? { ...t, [field]: value } : t);
    setMergeTags(updated);
  };
  const removeMergeTag = (index) => setMergeTags(mergeTags.filter((_, i) => i !== index));

  // ── Step 3: Preview ─────────────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!phoneColumn) { showToast('error', 'Debes seleccionar la columna de Teléfono.'); return; }
    setLoading(true);
    try {
      const response = await apiCall('POST', '/api/import/preview', {
        filePath: file.filePath,
        mapping: buildMapping(),
        defaultCountry: '+57'
      });
      if (response.error) throw new Error(response.error);
      setPreview(response);
      setStep(3);
    } catch (err) {
      showToast('error', 'Error al previsualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Commit ──────────────────────────────────────────────────────────
  const handleCommit = async () => {
    setLoading(true);
    try {
      const response = await apiCall('POST', '/api/import/commit', {
        filePath: file.filePath,
        mapping: buildMapping(),
        defaultCountry: '+57'
      });
      if (response.error) throw new Error(response.error);
      setImportResult(response);
      setStep(4);
      showToast('success', `¡Importación completada! ${response.imported} contactos añadidos.`);
    } catch (err) {
      showToast('error', 'Error al confirmar importación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null); setHeaders([]); setStep(1); setPhoneColumn('');
    setNameColumn(''); setMergeTags([]); setPreview(null); setImportResult(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex-grow p-8 bg-slate-950 overflow-y-auto max-h-screen text-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400">
            📥 Importar Contactos
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Sube un archivo Excel o CSV, mapea las columnas y define las variables de plantilla (Merge Tags) de forma dinámica.
          </p>
        </div>

        <StepIndicator current={step} />

        {/* Toast */}
        {toast && <Toast type={toast.type} message={toast.message} onDismiss={() => setToast(null)} />}

        {/* ── STEP 1: Drop zone ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div
            className="bg-slate-900/50 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <i className="fas fa-file-excel text-blue-400 text-2xl"></i>
            </div>
            <div className="text-center">
              <p className="font-bold text-white">Arrastra tu archivo aquí</p>
              <p className="text-slate-400 text-sm mt-1">o haz clic para seleccionar</p>
              <p className="text-slate-600 text-xs mt-2">Formatos soportados: .xlsx · .csv</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <i className="fas fa-circle-notch fa-spin"></i> Procesando...
              </div>
            )}
            <input id="file-input" type="file" accept=".xlsx,.csv" className="hidden" onChange={handleUpload} />
          </div>
        )}

        {/* ── STEP 2: Column Mapping ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Mapear Columnas</h2>
              <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                {headers.length} columnas en el archivo
              </span>
            </div>

            {/* Required: Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Columna de Teléfono <span className="text-red-400">(requerido)</span>
              </label>
              <select
                value={phoneColumn}
                onChange={(e) => setPhoneColumn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-200 transition-colors"
              >
                <option value="">-- Selecciona la columna --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* Optional: Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Columna de Nombre (opcional)
              </label>
              <select
                value={nameColumn}
                onChange={(e) => setNameColumn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-xl text-sm text-slate-200 transition-colors"
              >
                <option value="">-- No mapear --</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            {/* Dynamic Merge Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  Merge Tags para Plantillas
                </label>
                <button
                  onClick={addMergeTag}
                  disabled={mergeTags.length >= 8}
                  className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  <i className="fas fa-plus mr-1"></i> Añadir variable
                </button>
              </div>

              {mergeTags.length === 0 && (
                <p className="text-xs text-slate-600 italic py-2">
                  Sin merge tags — añade variables personalizadas como <code className="text-violet-400">empresa</code>, <code className="text-violet-400">ciudad</code>, etc.
                </p>
              )}

              {mergeTags.map((tag, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500 text-xs font-mono">{'{{'}</span>
                      <input
                        type="text"
                        placeholder="nombre_variable"
                        value={tag.tagName}
                        onChange={(e) => updateMergeTag(index, 'tagName', e.target.value.replace(/\s/g, '_').toLowerCase())}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none pl-8 pr-6 py-2.5 rounded-xl text-xs text-slate-200 transition-colors font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 text-xs font-mono">{'}}'}</span>
                    </div>
                    <select
                      value={tag.columnName}
                      onChange={(e) => updateMergeTag(index, 'columnName', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-violet-500 focus:outline-none px-3 py-2.5 rounded-xl text-xs text-slate-200 transition-colors"
                    >
                      <option value="">-- Columna --</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeMergeTag(index)} className="text-slate-600 hover:text-red-400 transition-colors w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handlePreview}
              disabled={loading || !phoneColumn}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Procesando...</> : <><i className="fas fa-eye"></i> Previsualizar Importación</>}
            </button>
          </div>
        )}

        {/* ── STEP 3: Preview ───────────────────────────────────────────────── */}
        {step === 3 && preview && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total filas', value: preview.totalRows, color: 'text-slate-300', bg: 'bg-slate-800/60' },
                { label: 'Válidos', value: preview.validRecords?.length ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Con errores', value: preview.errorLogs?.length ?? 0, color: 'text-red-400', bg: 'bg-red-500/10' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} border border-slate-800/60 rounded-2xl p-4 text-center`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Errors */}
            {preview.errorLogs?.length > 0 && (
              <div className="bg-slate-900/50 border border-red-900/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <i className="fas fa-exclamation-triangle"></i> Registros con errores
                  </h3>
                  <button
                    onClick={() => downloadErrorsCSV(preview.errorLogs)}
                    className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <i className="fas fa-download"></i> Descargar CSV
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.errorLogs.map((err, i) => (
                    <div key={i} className="text-xs text-red-300/80 bg-red-950/30 px-3 py-2 rounded-lg flex gap-3">
                      <span className="text-red-600 font-mono shrink-0">Fila {err.row}</span>
                      <span className="text-slate-500 font-mono truncate">{err.originalPhone}</span>
                      <span className="text-red-400">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample valid records */}
            {preview.validRecords?.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <i className="fas fa-check-circle"></i> Muestra de registros válidos (primeros 5)
                </h3>
                <div className="space-y-1.5">
                  {preview.validRecords.slice(0, 5).map((r, i) => (
                    <div key={i} className="text-xs bg-slate-950 px-3 py-2 rounded-lg flex gap-4 items-center">
                      <span className="font-mono text-emerald-400 shrink-0">{r.normalizedPhone}</span>
                      {r.name && <span className="text-slate-300">{r.name}</span>}
                      {Object.keys(r.mergeTags || {}).length > 0 && (
                        <span className="text-violet-400 text-[10px]">
                          {Object.entries(r.mergeTags).map(([k, v]) => `{{${k}}}=${v}`).join(' · ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl text-sm border border-slate-800 text-slate-400 hover:bg-slate-900 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i> Atrás
              </button>
              <button
                onClick={handleCommit}
                disabled={loading || !preview.validRecords?.length}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? <><i className="fas fa-circle-notch fa-spin"></i> Importando...</>
                  : <><i className="fas fa-cloud-upload-alt"></i> Confirmar e Importar {preview.validRecords?.length} contactos</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Success ───────────────────────────────────────────────── */}
        {step === 4 && importResult && (
          <div className="bg-slate-900/50 border border-emerald-900/40 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-check text-emerald-400 text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-white">¡Importación exitosa!</h2>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-2xl font-extrabold text-emerald-400">{importResult.imported}</p>
                <p className="text-slate-500">Importados</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-red-400">{importResult.rejected}</p>
                <p className="text-slate-500">Rechazados</p>
              </div>
            </div>
            {importResult.errorLogs?.length > 0 && (
              <button
                onClick={() => downloadErrorsCSV(importResult.errorLogs)}
                className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <i className="fas fa-download"></i> Descargar registro de errores
              </button>
            )}
            <button
              onClick={resetAll}
              className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl text-sm font-bold transition-all"
            >
              <i className="fas fa-plus mr-2"></i> Nueva Importación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
