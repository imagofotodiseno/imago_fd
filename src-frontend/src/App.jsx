import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import MetaConfigPage from './pages/MetaConfigPage';
import CampaignsPage from './pages/CampaignsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ContactsPage from './pages/ContactsPage';
import StrategicAgent from './pages/StrategicAgent';
import ChatbotExperto from './pages/ChatbotExperto';
import MetaAdsCopywriter from './pages/MetaAdsCopywriter';
import InboxPage from './pages/InboxPage';
import CRMPage from './pages/CRMPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">

        {/* Sidebar (colapsable en móvil) */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Contenido principal */}
        <div className="flex-grow flex flex-col overflow-hidden min-w-0">

          {/* Topbar móvil — solo visible en pantallas < lg */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Abrir menú"
            >
              <i className="fas fa-bars" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-rocket text-white text-xs" />
              </div>
              <span className="font-bold text-sm text-white tracking-wide">IMAGO CRM</span>
            </div>
          </header>

          {/* Área de rutas */}
          <main className="flex-grow overflow-y-auto relative flex flex-col bg-slate-950">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/meta" element={<MetaConfigPage />} />
              <Route path="/campaigns" element={<CampaignsPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/strategy" element={<StrategicAgent />} />
              <Route path="/chat" element={<ChatbotExperto />} />
              <Route path="/ads" element={<MetaAdsCopywriter />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/crm-kanban" element={<CRMPage />} />
            </Routes>
          </main>
        </div>

      </div>
    </Router>
  );
}

export default App;
