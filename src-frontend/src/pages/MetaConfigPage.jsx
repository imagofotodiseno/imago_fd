import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export default function MetaConfigPage() {
  const [config, setConfig] = useState({ access_token: '', phone_number_id: '', waba_id: '' });
  const [loading, setLoading] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await apiCall('GET', '/api/meta/config');
      setConfig(data);
    } catch (err) {
      console.error('Error loading config:', err);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiCall('POST', '/api/meta/config', config);
      alert('Configuración guardada exitosamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    setLoading(true);
    setPingResult(null);
    try {
      const result = await apiCall('POST', '/api/meta/ping');
      setPingResult(result.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Configuración de Meta</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
          <input
            type="password"
            value={config.access_token}
            onChange={(e) => handleChange('access_token', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
          <input
            type="text"
            value={config.phone_number_id}
            onChange={(e) => handleChange('phone_number_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WABA ID</label>
          <input
            type="text"
            value={config.waba_id}
            onChange={(e) => handleChange('waba_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={handlePing}
            disabled={loading || !config.access_token || !config.phone_number_id}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Verificando...' : 'Verificar Conexión'}
          </button>
        </div>
      </div>

      {pingResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-6">
          <h3 className="font-bold mb-2">Conexión exitosa</h3>
          <pre className="text-sm">{JSON.stringify(pingResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
