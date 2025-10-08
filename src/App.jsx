import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./auth/AuthContext"
import Login from "./pages/Login"
import DashboardAlumno from "./pages/DashboardAlumno"
import DashboardDocente from "./pages/DashboardDocente"
import DashboardSuper from "./pages/DashboardSuper"

import DocenteLayout from "./layouts/DocenteLayout"
import Dashboard from "./pages/docente/Dashboard"
import Perfil from "./pages/docente/Perfil"
import BancoPreguntas from "./pages/docente/BancoPreguntas"
import CrearActividad from "./pages/docente/CrearActividad"

function Home() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <h1 className="text-2xl font-bold">Home</h1>
      <a className="mt-4 underline" href="/login">
        Ir a Login
      </a>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/alumno" element={<DashboardAlumno />} />




<Route path="/docente" element={<DocenteLayout />}>
  <Route index element={<Dashboard />} /> {/* este ya es el dashboard unificado */}
  <Route path="dashboard" element={<Dashboard />} /> {/* opcional, apunta al mismo */}
  <Route path="perfil" element={<Perfil />} />
  <Route path="banco-preguntas" element={<BancoPreguntas />} />
  <Route path="crear-actividad" element={<CrearActividad />} />
</Route>







          {/* <Route path="/docente" element={<DocenteLayout />}>
            <Route index element={<DashboardDocente />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="banco-preguntas" element={<BancoPreguntas />} />
            <Route path="crear-actividad" element={<CrearActividad />} />
          </Route> */}

          <Route path="/admin" element={<DashboardSuper />} />
          <Route index element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
