// src/auth/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import api, { doLogin, doLogout, registerAlumno } from "../api/axiosClient";

const AuthContext = createContext();

// Acepta 1, "1", true, "true"
const truthy = (v) =>
  v === 1 || v === "1" || v === true || String(v).toLowerCase() === "true";

export const AuthProvider = ({ children }) => {
  // Estado inicial desde localStorage (si refrescan la página)
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  });
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));

  // ===== Login (usa /api/login con {correo, clave}) =====
  const login = async (correo, clave) => {
    const data = await doLogin(correo, clave); // guarda token + usuario en localStorage (axiosClient)
    setIsAuth(true);
    if (data?.usuario) setUsuario(data.usuario);
    return data;
  };

  // ===== Logout (POST /api/logout) =====
  const logout = async () => {
    await doLogout(); // borra token + usuario en localStorage
    setIsAuth(false);
    setUsuario(null);
  };

  // ===== Registro Alumno (POST /api/singup/usuario/alumno) =====
  // payload: { nombre, correo, clave, escolaridad, foto_perfil? }
  const signupAlumno = async ({ nombre, correo, clave, escolaridad, foto_perfil }) => {
    const data = await registerAlumno({ nombre, correo, clave, escolaridad, foto_perfil });
    setIsAuth(true);
    if (data?.usuario) setUsuario(data.usuario);
    return data;
  };

  // ===== Detectar rol por endpoints protegidos =====
  // Estrategia:
  //   1) GET /api/usuario/alumno -> si 200 => /alumno
  //   2) GET /api/usuario/docente -> si 200 => /docente o /admin (si es_superusuario)
  const detectRole = async () => {
    // ¿Alumno?
    try {
      const { data } = await api.get("/usuario/alumno");
      return { route: "/alumno", role: "alumno", data };
    } catch (_) {}

    // ¿Docente o Super?
    try {
      const { data } = await api.get("/usuario/docente");
      const esSuper =
        truthy(data?.es_superusuario) ||
        truthy(data?.docente?.es_superusuario) ||
        truthy(data?.usuario?.docente?.es_superusuario);
      return {
        route: esSuper ? "/admin" : "/docente",
        role: esSuper ? "superusuario" : "docente",
        data,
      };
    } catch (_) {}

    // Fallback
    return { route: "/", role: "desconocido" };
  };

  // ===== Redirigir según rol detectado =====
  const resolveRoleAndRedirect = async (navigate) => {
    const { route } = await detectRole();
    navigate(route, { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        usuario,
        login,
        logout,
        signupAlumno,
        resolveRoleAndRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
