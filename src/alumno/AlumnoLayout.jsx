// src/alumno/AlumnoLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import useAlumnoGuard from "./useAlumnoGuard";

const linkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-50";
const active = "bg-indigo-100 text-indigo-800";
const idle = "text-gray-700";

export default function AlumnoLayout() {
  const { logout } = useAuth();
  const ready = useAlumnoGuard();

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Verificando acceso…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r shadow-sm p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold">🎓 Alumno</h2>
          <p className="text-xs text-gray-500">Navegación</p>
        </div>

        <nav className="space-y-2">
          <NavLink to="/alumno" end className={({isActive}) => `${linkBase} ${isActive?active:idle}`}>
            🏠 Inicio
          </NavLink>
          <NavLink to="/alumno/perfil" className={({isActive}) => `${linkBase} ${isActive?active:idle}`}>
            👤 Perfil
          </NavLink>
          <NavLink to="/alumno/cursos" className={({isActive}) => `${linkBase} ${isActive?active:idle}`}>
            📚 Mis cursos
          </NavLink>
        </nav>

        <div className="mt-8">
          <button
            onClick={async () => { await logout(); window.location.href = "/login"; }}
            className="w-full rounded-lg bg-red-500 px-3 py-2 text-white font-semibold hover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
