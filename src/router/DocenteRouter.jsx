// src/router/DocenteRouter.jsx
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import DocenteLayout from "../layouts/DocenteLayout";

// Páginas Docente
import Dashboard from "../pages/docente/Dashboard";
import Perfil from "../pages/docente/Perfil";
import BancoPreguntas from "../pages/docente/BancoPreguntas";
import CrearActividad from "../pages/docente/CrearActividad";
import CrearPregunta from "../pages/docente/CrearPregunta";
import SeleccionarPreguntas from "../pages/docente/SeleccionarPreguntas";
import VistaPreviaActividades from "../pages/docente/VistaPreviaActividades";
import VisualizarActividad from "../pages/docente/VisualizarActividad";
import EditarActividad from "../pages/docente/EditarActividad";

/**
 * Guard sencillo para validar el parámetro :tipo de la ruta visualizar/:tipo/:id
 * Acepta solo "examen" o "practica". En otro caso redirige a /docente/actividades.
 */
function VisualizarActividadGuard() {
  const { tipo } = useParams();
  const valido = tipo === "examen" || tipo === "practica";
  if (!valido) return <Navigate to="/docente/actividades" replace />;
  return <VisualizarActividad />;
}

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
        <Route
          path="banco-preguntas/seleccionar"
          element={<SeleccionarPreguntas />}
        />

        {/* /docente/crear-actividad */}
        <Route path="crear-actividad" element={<CrearActividad />} />

        {/* /docente/actividades */}
        <Route path="actividades" element={<VistaPreviaActividades />} />

        {/* NUEVA: /docente/editar-actividad/:tipo/:id */}
        <Route
          path="editar-actividad/:tipo/:id"
          element={<EditarActividad />}
        />

        {/* /docente/crear-pregunta */}
        <Route path="crear-pregunta" element={<CrearPregunta />} />

        {/* /docente/visualizar/:tipo/:id */}
        <Route
          path="visualizar/:tipo/:id"
          element={<VisualizarActividadGuard />}
        />

        {/* Fallback dentro de /docente */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>

      {/* Fallback global */}
      <Route path="*" element={<Navigate to="/docente" replace />} />
    </Routes>
  );
}
