import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Login from "./pages/Login";
import DashboardAlumno from "./pages/DashboardAlumno";
import DashboardDocente from "./pages/DashboardDocente";
import DashboardSuper from "./pages/DashboardSuper";

function Home() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <h1 className="text-2xl font-bold">Home</h1>
      <a className="mt-4 underline" href="/login">Ir a Login</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/alumno" element={<DashboardAlumno />} />
          <Route path="/docente" element={<DashboardDocente />} />
          <Route path="/admin"   element={<DashboardSuper />} />
          <Route index element={<Home />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
