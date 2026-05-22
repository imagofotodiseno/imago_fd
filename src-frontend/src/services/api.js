const BASE = '/api';

const request = async (path, options = {}) => {
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, {
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    method: options.method || 'GET'
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Request failed');
  }
  return res.json();
};

// Generic API call function
export const apiCall = async (method, path, body = null) => {
  const headers = {};
  if (!(body instanceof FormData) && body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, {
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    method
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Request failed');
  }
  return res.json();
};

export const uploadFile = (formData) => request(`${BASE}/import/upload`, { method: 'POST', body: formData });
export const previewImport = (body) => request(`${BASE}/import/preview`, { method: 'POST', body });
export const commitImport = (body) => request(`${BASE}/import/commit`, { method: 'POST', body });
export const getMetaConfig = () => request(`${BASE}/meta/config`);
export const saveMetaConfig = (body) => request(`${BASE}/meta/config`, { method: 'POST', body });
export const pingMeta = () => request(`${BASE}/meta/ping`, { method: 'POST' });
export const syncTemplates = () => request(`${BASE}/meta/templates/sync`, { method: 'POST' });
export const getTemplates = () => request(`${BASE}/templates`);
export const getContacts = () => request(`${BASE}/contacts`);
export const geminiGenerate = (body) => request(`${BASE}/gemini`, { method: 'POST', body });
export const getAppointments = () => request(`${BASE}/appointments`);
export const createAppointment = (body) => request(`${BASE}/appointments`, { method: 'POST', body });
export const createCampaign = (body) => request(`${BASE}/campaigns`, { method: 'POST', body });
export const scheduleCampaign = (id, body) => request(`${BASE}/campaigns/${id}/schedule`, { method: 'POST', body });
export const getCampaignStatus = (id) => request(`${BASE}/campaigns/${id}/status`);
