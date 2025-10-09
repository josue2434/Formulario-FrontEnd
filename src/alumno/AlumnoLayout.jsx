// src/alumno/AlumnoLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import useAlumnoGuard from "./useAlumnoGuard";
import { LayoutDashboard, User, BookOpen, LogOut } from "lucide-react";

export default function AlumnoLayout() {
  const { logout } = useAuth();
  const ready = useAlumnoGuard();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Verificando acceso…
      </div>
    );
  }

  const menuItems = [
    {
      path: "/alumno",
      label: "Inicio",
      icon: LayoutDashboard,
      // Para que NavLink lo tome como "end" en la ruta base:
      end: true,
    },
    {
      path: "/alumno/perfil",
      label: "Perfil",
      icon: User,
    },
    {
      path: "/alumno/cursos",
      label: "Mis cursos",
      icon: BookOpen,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout(); // limpia tu contexto / token si lo manejas aquí
    } finally {
      // por si tu logout no hace redirect, garantizamos la salida
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* SIDEBAR con el diseño estilo Docente */}
      <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
        {/* Header del sidebar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="font-semibold text-gray-800">Alumno</span>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map(({ path, label, icon: Icon, end }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="font-medium">Cerrar sesión</span>
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
