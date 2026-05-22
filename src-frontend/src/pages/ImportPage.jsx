import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: preview, 4: confirm

  const handleUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', f);
    
    try {
      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setFile(data);
      setHeaders(data.headers);
      setStep(2);
    } catch (error) {
      alert('Error uploading file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (field, value) => {
    setMapping(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const response = await apiCall('POST', '/api/import/preview', {
        filePath: file.filePath,
        mapping,
        defaultCountry: '+57'
      });
      setPreview(response);
      setStep(3);
    } catch (error) {
      alert('Error previewing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setLoading(true);
    try {
      const response = await apiCall('POST', '/api/import/commit', {
        filePath: file.filePath,
        mapping,
        defaultCountry: '+57'
      });
      alert(`Importados: ${response.imported}, Rechazados: ${response.rejected}`);
      setStep(1);
      setFile(null);
      setHeaders([]);
      setMapping({});
      setPreview(null);
    } catch (error) {
      alert('Error committing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Importar Contactos</h1>

      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2">Selecciona archivo (xlsx o csv)</span>
            <input type="file" accept=".xlsx,.csv" onChange={handleUpload} className="block w-full mt-2" />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Mapear Columnas</h2>
          <div className="space-y-4">
            {['phone', 'name', 'var1', 'var2'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <select
                  value={mapping[field] || ''}
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Selecciona --</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button
            onClick={handlePreview}
            disabled={loading || !mapping.phone}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Procesando...' : 'Previsualizar'}
          </button>
        </div>
      )}

      {step === 3 && preview && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Previsualización</h2>
          <div className="mb-4 text-sm">
            <p><strong>Total:</strong> {preview.totalRows}</p>
            <p><strong>Válidos:</strong> {preview.preview.filter(p => p.valid && !p.duplicate).length}</p>
            <p><strong>Errores:</strong> {preview.errors.length}</p>
          </div>
          {preview.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Errores detectados:</h3>
              <div className="bg-red-50 border border-red-200 rounded p-4 max-h-48 overflow-y-auto">
                {preview.errors.map((err, i) => (
                  <div key={i} className="text-sm text-red-800">
                    Fila {err.row}: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={handleCommit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 mr-2"
          >
            {loading ? 'Importando...' : 'Confirmar Importación'}
          </button>
          <button
            onClick={() => setStep(2)}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Atrás
          </button>
        </div>
      )}
    </div>
  );
}
