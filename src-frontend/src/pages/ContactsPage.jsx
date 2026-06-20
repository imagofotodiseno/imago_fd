import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    var1: '',
    var2: ''
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await apiCall('GET', '/api/contacts');
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleCreateContact = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newContact.phone.trim()) {
      setFormError('El teléfono es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      await apiCall('POST', '/api/contacts', {
        name: newContact.name,
        phone: newContact.phone,
        var1: newContact.var1,
        var2: newContact.var2
      });

      setNewContact({ name: '', phone: '', var1: '', var2: '' });
      setShowCreateForm(false);
      await loadContacts();
    } catch (err) {
      setFormError(err.message || 'No se pudo crear el contacto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Contactos</h1>
        <button
          type="button"
          onClick={() => {
            setFormError('');
            setShowCreateForm((prev) => !prev);
          }}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancelar' : 'Crear contacto'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateContact} className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre"
              value={newContact.name}
              onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Teléfono *"
              value={newContact.phone}
              onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Var1 (opcional)"
              value={newContact.var1}
              onChange={(e) => setNewContact((prev) => ({ ...prev, var1: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Var2 (opcional)"
              value={newContact.var2}
              onChange={(e) => setNewContact((prev) => ({ ...prev, var2: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar contacto'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No hay contactos</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold">Teléfono</th>
                <th className="px-6 py-3 text-left font-semibold">Origen</th>
                <th className="px-6 py-3 text-left font-semibold">Creado</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{contact.name || '-'}</td>
                  <td className="px-6 py-3">{contact.phone}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{contact.source || '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(contact.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
