// src/router/AlumnoRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AlumnoLayout from "../layouts/AlumnoLayout";
import DashboardAlumno from "../pages/alumno/DashboardAlumno";
import AlumnoPerfil from "../pages/alumno/AlumnoPerfil";
import AlumnoCursos from "../pages/alumno/AlumnoCursos";

export default function AlumnoRouter() {
  return (
    <Routes>
      <Route path="/" element={<AlumnoLayout />}>
        {/* /alumno/dashboard será la página principal */}
        <Route path="dashboard" element={<DashboardAlumno />} />
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* /alumno/perfil */}
        <Route path="perfil" element={<AlumnoPerfil />} />

        {/* /alumno/Cursos */}
        <Route path="misCursos" element={<AlumnoCursos />} />

        {/* fallback dentro de /alumno */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}

