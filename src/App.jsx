// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

// Páginas base
import Login from "./pages/Login";

// Routers
import AlumnoRouter from "./router/AlumnoRouter";
import DocenteRouter from "./router/DocenteRouter";
import AdminRouter from "./router/AdminRouter";

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

          {/* Admin con subrutas */}
          <Route path="/admin/*" element={<AdminRouter />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
