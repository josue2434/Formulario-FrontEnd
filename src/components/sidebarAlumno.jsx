// src/components/SidebarAlumno.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  BookOpen,
  ClipboardList,
  LogOut,
} from "lucide-react";

export default function SidebarAlumno() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    {
      path: "/alumno/dashboard",
      icon: LayoutDashboard,
      label: "Inicio",
      end: false,
    },
    {
      path: "/alumno/perfil",
      icon: User,
      label: "Perfil",
    },
    {
      path: "/alumno/misCursos",
      icon: BookOpen,
      label: "Mis Cursos",
    },
    {
      path: "/alumno/actividades", // 👈 NUEVO
      icon: ClipboardList,
      label: "Actividades",
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <span className="font-semibold text-gray-800 leading-tight">
            Alumno
          </span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Cerrar sesión */}
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
  );
}
