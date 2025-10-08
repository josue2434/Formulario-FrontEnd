// src/router/AlumnoRouter.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import AlumnoLayout from "../alumno/alumnoLayout";
import DashboardAlumno from "../alumno/DashboardAlumno";
import AlumnoPerfil from "../alumno/alumnoPerfil";
import AlumnoCursos from "../alumno/alumnoCursos";

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