// src/router/AlumnoRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AlumnoLayout from "../alumno/AlumnoLayout";
import DashboardAlumno from "../alumno/DashboardAlumno";
import AlumnoPerfil from "../alumno/AlumnoPerfil";
import AlumnoCursos from "../alumno/AlumnoCursos";

export default function AlumnoRouter() {
  return (
    <Routes>
      <Route path="/" element={<AlumnoLayout />}>
        {/* index = /alumno */}
        <Route index element={<DashboardAlumno />} />
        {/* /alumno/perfil */}
        <Route path="perfil" element={<AlumnoPerfil />} />
        {/* /alumno/cursos */}
        <Route path="cursos" element={<AlumnoCursos />} />
        {/* fallback dentro de /alumno */}
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  );
}