import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import MetaConfigPage from './pages/MetaConfigPage';
import CampaignsPage from './pages/CampaignsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ContactsPage from './pages/ContactsPage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/meta" element={<MetaConfigPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
