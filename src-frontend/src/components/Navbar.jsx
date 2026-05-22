import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">CRM IMAGO</Link>
        
        <div className="flex gap-6">
          <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">Dashboard</Link>
          <Link to="/import" className="hover:bg-blue-700 px-3 py-2 rounded">Importar</Link>
          <Link to="/campaigns" className="hover:bg-blue-700 px-3 py-2 rounded">Campañas</Link>
          <Link to="/appointments" className="hover:bg-blue-700 px-3 py-2 rounded">Citas</Link>
          <Link to="/meta" className="hover:bg-blue-700 px-3 py-2 rounded">Config</Link>
        </div>
      </div>
    </nav>
  );
}
