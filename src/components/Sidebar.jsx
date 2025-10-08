import { NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, User, BookOpen, FileEdit, LogOut } from "lucide-react"

export default function Sidebar() {
  const navigate = useNavigate()

  // 🔹 Función para cerrar sesión
  const handleLogout = () => {
    // Aquí puedes limpiar el token o datos del usuario
    localStorage.removeItem("token") 
    localStorage.removeItem("user")

    // Redirige al login
    navigate("/login")
  }

  const menuItems = [
    {
      path: "/docente/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/docente/perfil",
      icon: User,
      label: "Perfil",
    },
    {
      path: "/docente/banco-preguntas",
      icon: BookOpen,
      label: "Banco de preguntas",
    },
    {
      path: "/docente/crear-actividad",
      icon: FileEdit,
      label: "Crear actividad",
    },
  ]

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header del sidebar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <span className="font-semibold text-gray-800">Docente</span>
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-purple-600 text-white"
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
