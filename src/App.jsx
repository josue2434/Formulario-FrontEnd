// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import api from "./api/axiosClient";

// Páginas
import Login from "./pages/Login";

// Alumno
import AlumnoLayout from "./alumno/alumnoLayout";
import DashboardAlumno from "./alumno/DashboardAlumno";
import AlumnoPerfil from "./alumno/alumnoPerfil";
import AlumnoCursos from "./alumno/alumnoCursos";

// Docente / Admin
import DashboardDocente from "./pages/DashboardDocente";
import DashboardSuper from "./pages/DashboardSuper";

/* ======================= Guards ======================= */
function ProtectedRoute() {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}

const truthy = (v) => v === 1 || v === "1" || v === true || String(v).toLowerCase() === "true";

function AlumnoRoute() {
  const [state, setState] = useState({ ready: false, allow: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await api.get("/usuario/alumno"); // 200 si es alumno
        if (alive) setState({ ready: true, allow: true });
      } catch {
        if (alive) setState({ ready: true, allow: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!state.ready) return <div className="min-h-screen grid place-items-center text-gray-500">Verificando acceso…</div>;
  if (!state.allow) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function DocenteRoute() {
  const [state, setState] = useState({ ready: false, allow: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await api.get("/usuario/docente"); // 200 si es docente/super
        if (alive) setState({ ready: true, allow: true });
      } catch {
        if (alive) setState({ ready: true, allow: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!state.ready) return <div className="min-h-screen grid place-items-center text-gray-500">Verificando acceso…</div>;
  if (!state.allow) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminRoute() {
  const [state, setState] = useState({ ready: false, allow: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/usuario/docente"); // docente o super
        const esSuper =
          truthy(data?.es_superusuario) ||
          truthy(data?.docente?.es_superusuario) ||
          truthy(data?.usuario?.docente?.es_superusuario);
        if (alive) setState({ ready: true, allow: !!esSuper });
      } catch {
        if (alive) setState({ ready: true, allow: false });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!state.ready) return <div className="min-h-screen grid place-items-center text-gray-500">Verificando acceso…</div>;
  if (!state.allow) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/* ======================= Home ======================= */
function Home() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Home</h1>
        <a className="underline" href="/login">Ir a Login</a>
      </div>
    </div>
  );
}

/* ======================= App ======================= */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* ALUMNO: layout con sidebar + hijas */}
            <Route element={<AlumnoRoute />}>
              <Route path="/alumno" element={<AlumnoLayout />}>
                <Route index element={<DashboardAlumno />} />
                <Route path="perfil" element={<AlumnoPerfil />} />
                <Route path="cursos" element={<AlumnoCursos />} />
              </Route>
            </Route>

            {/* DOCENTE */}
            <Route element={<DocenteRoute />}>
              <Route path="/docente" element={<DashboardDocente />} />
            </Route>

            {/* ADMIN (superusuario) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<DashboardSuper />} />
            </Route>
          </Route>

          {/* Home */}
          <Route index element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
