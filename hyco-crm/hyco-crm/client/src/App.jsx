import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import FollowUps from "./pages/FollowUps.jsx";
import WhatsApp from "./pages/WhatsApp.jsx";
import Users from "./pages/Users.jsx";
import MyCalls from "./pages/MyCalls.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
      <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
      <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute><MyCalls /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={["super_admin"]}><Users /></ProtectedRoute>} />
    </Routes>
  );
}
