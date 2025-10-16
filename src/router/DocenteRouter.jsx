// src/router/DocenteRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import DocenteLayout from "../layouts/DocenteLayout";

// Páginas Docente
import Dashboard from "../pages/docente/Dashboard";
import Perfil from "../pages/docente/Perfil";
import BancoPreguntas from "../pages/docente/BancoPreguntas";
import CrearActividad from "../pages/docente/CrearActividad";
import CrearPregunta  from "../pages/docente/CrearPregunta";

export default function DocenteRouter() {
  return (
    <Routes>
      <Route path="/" element={<DocenteLayout />}>
        {/* /docente */}
        <Route index element={<Dashboard />} />
        {/* /docente/dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        {/* /docente/perfil */}
        <Route path="perfil" element={<Perfil />} />
        {/* /docente/banco-preguntas */}
        <Route path="banco-preguntas" element={<BancoPreguntas />} />
        {/* /docente/crear-actividad */}
        <Route path="crear-actividad" element={<CrearActividad />} />
        {/* /docente/crear-pregunta */}
         <Route path="crear-pregunta" element={<CrearPregunta />} />
        {/* Fallback dentro de /docente */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}
