// src/components/sidebarAlumno.jsx
import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, User, BookOpen, LogOut } from "lucide-react"

export default function SidebarAlumno() {
  const navigate = useNavigate()

  // 🔹 Función para cerrar sesión
  const handleLogout = () => {
    // Limpia el token o datos guardados del usuario
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Redirige al login
    navigate("/login")
  }

  // 🔹 Menú de navegación del alumno
  const menuItems = [
    {
      path: "/alumno",
      icon: LayoutDashboard,
      label: "Inicio",
      end: true,
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
  ]

  return (
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
          {menuItems.map((item) => {
            const Icon = item.icon
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
            )
          })}
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
  )
}
