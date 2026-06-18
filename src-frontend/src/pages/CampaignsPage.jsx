import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ name: '', templateId: '' });
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiCall('GET', '/api/templates');
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.templateId) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall('POST', '/api/campaigns', newCampaign);
      alert('Campaña creada: ' + result.campaignId);
      setNewCampaign({ name: '', templateId: '' });
      // Reload campaigns
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Campañas</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Crear Nueva Campaña</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla</label>
            <select
              value={newCampaign.templateId}
              onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Selecciona plantilla --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateCampaign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creando...' : 'Crear Campaña'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Campañas Recientes</h2>
        <p className="text-gray-500">No hay campañas aún</p>
      </div>
    </div>
  );
}
