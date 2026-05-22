import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({
    phone: '',
    name: '',
    service: '',
    starts_at: '',
    ends_at: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await apiCall('GET', '/api/appointments');
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  const handleCreateAppointment = async () => {
    if (!newAppointment.phone || !newAppointment.service || !newAppointment.starts_at) {
      alert('Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      const result = await apiCall('POST', '/api/appointments', {
        ...newAppointment,
        defaultCountry: '+57'
      });
      alert('Cita creada: ' + result.appointmentId);
      setNewAppointment({ phone: '', name: '', service: '', starts_at: '', ends_at: '' });
      loadAppointments();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Agenda de Citas</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Nueva Cita</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="tel"
                value={newAppointment.phone}
                onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                placeholder="+57..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={newAppointment.name}
                onChange={(e) => setNewAppointment({ ...newAppointment, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
            <input
              type="text"
              value={newAppointment.service}
              onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Inicio</label>
              <input
                type="datetime-local"
                value={newAppointment.starts_at}
                onChange={(e) => setNewAppointment({ ...newAppointment, starts_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fin</label>
              <input
                type="datetime-local"
                value={newAppointment.ends_at}
                onChange={(e) => setNewAppointment({ ...newAppointment, ends_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            onClick={handleCreateAppointment}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 w-full"
          >
            {loading ? 'Creando...' : 'Crear Cita'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Citas Próximas</h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No hay citas programadas</p>
        ) : (
          <div className="space-y-2">
            {appointments.map(apt => (
              <div key={apt.id} className="border-l-4 border-blue-600 pl-4 py-2">
                <p className="font-bold">{apt.contact_name}</p>
                <p className="text-sm text-gray-600">{apt.service} - {new Date(apt.starts_at).toLocaleString('es-ES')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
