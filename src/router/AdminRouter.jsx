// src/router/AdminRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Perfil from "../pages/admin/Perfil";
import Alumnos from "../pages/admin/Alumnos";
import Docentes from "../pages/admin/Docentes";

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* /admin */}
        <Route index element={<Dashboard />} />
        {/* /admin/dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        {/* /admin/perfil */}
        <Route path="perfil" element={<Perfil />} />
        {/* /admin/alumnos */}
        <Route path="alumnos" element={<Alumnos />} />
        {/* /admin/docentes */}
        <Route path="docentes" element={<Docentes />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
