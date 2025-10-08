// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

// Páginas base
import Login from "./pages/Login";
import DashboardSuper from "./pages/DashboardSuper";

// Routers
import AlumnoRouter from "./router/AlumnoRouter";
import DocenteRouter from "./router/DocenteRouter";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Inicio */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Alumno con subrutas */}
          <Route path="/alumno/*" element={<AlumnoRouter />} />

          {/* Docente con subrutas */}
          <Route path="/docente/*" element={<DocenteRouter />} />

          {/* Admin (opcional) */}
          <Route path="/admin" element={<DashboardSuper />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}