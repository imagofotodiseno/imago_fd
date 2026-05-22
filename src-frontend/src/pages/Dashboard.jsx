import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">CRM IMAGO - Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/import" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">📥 Importar Contactos</h2>
            <p className="text-gray-600">Importa contactos desde Excel o CSV</p>
          </Link>

          <Link to="/meta" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">⚙️ Meta Config</h2>
            <p className="text-gray-600">Configura tu integración con Meta</p>
          </Link>

          <Link to="/campaigns" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">📧 Campañas</h2>
            <p className="text-gray-600">Crea y gestiona campañas de WhatsApp</p>
          </Link>

          <Link to="/appointments" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">📅 Citas</h2>
            <p className="text-gray-600">Agenda y gestiona citas</p>
          </Link>

          <Link to="/contacts" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-2xl font-bold mb-2">👥 Contactos</h2>
            <p className="text-gray-600">Visualiza y gestiona tus contactos</p>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">📊 Analytics</h2>
            <p className="text-gray-600">Estadísticas y reportes (próximamente)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
