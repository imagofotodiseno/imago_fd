import React from 'react';
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
  return (
    <Router>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        <Sidebar />
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
    </Router>
  );
}

export default App;
