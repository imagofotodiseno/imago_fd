import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Contactos</h1>

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
