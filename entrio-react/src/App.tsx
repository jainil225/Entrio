import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import NewEvent from './pages/admin/NewEvent';
import EventDetail from './pages/admin/EventDetail';
import Home from './pages/store/Home';
import EventPage from './pages/store/EventPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#0f172a', color: '#fff', fontSize: 13, fontFamily: 'Inter,sans-serif', fontWeight: 600, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Store */}
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/events/new" element={<NewEvent />} />
        <Route path="/admin/events/:id" element={<EventDetail />} />

        {/* Legacy HTML paths — redirect to React routes */}
        <Route path="/admin/login.html" element={<Navigate to="/admin/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
