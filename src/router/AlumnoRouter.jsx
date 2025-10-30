import { Routes, Route, Navigate } from "react-router-dom";
import AlumnoLayout from "../layouts/AlumnoLayout";

// páginas alumno
import DashboardAlumno from "../pages/alumno/DashboardAlumno";
import AlumnoPerfil from "../pages/alumno/AlumnoPerfil";
import AlumnoCursos from "../pages/alumno/AlumnoCursos";
import ListaActividadesAlumno from "../pages/alumno/ListaActividadesAlumno";
import FormularioDemoAlumno from "../pages/alumno/FormularioDemoAlumno";

export default function AlumnoRouter() {
  return (
    <Routes>
      <Route path="/" element={<AlumnoLayout />}>
        {/* Inicio */}
        <Route path="dashboard" element={<DashboardAlumno />} />
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* Perfil */}
        <Route path="perfil" element={<AlumnoPerfil />} />

        {/* Mis Cursos */}
        <Route path="misCursos" element={<AlumnoCursos />} />

        {/* Actividades disponibles */}
        <Route path="actividades" element={<ListaActividadesAlumno />} />

        {/* Resolver actividad específica */}
        <Route path="actividad/:id" element={<FormularioDemoAlumno />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
