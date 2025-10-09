// src/layouts/AlumnoLayout.jsx
import { Outlet } from "react-router-dom";
import SidebarAlumno from "../components/sidebarAlumno";

export default function AlumnoLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarAlumno />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
