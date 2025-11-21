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

  // Login (usa /api/login con {correo, clave}) 
  const login = async (correo, clave) => {
    const data = await doLogin(correo, clave); // guarda token + usuario en localStorage (axiosClient)
    setIsAuth(true);
    if (data?.usuario) setUsuario(data.usuario);
    return data;
  };

  //  Logout (POST /api/logout) 
  const logout = async () => {
    await doLogout(); // borra token + usuario en localStorage
    setIsAuth(false);
    setUsuario(null);
  };

  // Registro Alumno (POST /api/singup/usuario/alumno) 
  // payload: { nombre, correo, clave, escolaridad, foto_perfil? }
  const signupAlumno = async ({ nombre, correo, clave, escolaridad, foto_perfil }) => {
    const data = await registerAlumno({ nombre, correo, clave, escolaridad, foto_perfil });
    setIsAuth(true);
    if (data?.usuario) setUsuario(data.usuario);
    return data;
  };

  //  Detectar rol por endpoints protegidos 
  // Estrategia:
  //   1) GET /api/usuario/alumno -> si 200 => /alumno
  //   2) GET /api/usuario/docente -> si 200 => /docente o /admin (si es_superusuario)
  
const detectRole = async () => {
  // 1) ¿Alumno?
  try {
    const rAlumno = await api.get("/usuario/alumno", {
      validateStatus: () => true, // <-- evita excepción en 403
    });
    if (rAlumno.status === 200) {
      return { route: "/alumno", role: "alumno", data: rAlumno.data };
    }
  } catch (_) {
    /* silencio */
  }

  // 2) ¿Docente o Super?
  try {
    const rDoc = await api.get("/usuario/docente", {
      validateStatus: () => true, // <-- evita excepción en 403
    });
    if (rDoc.status === 200) {
      const d = rDoc.data;
      const esSuper =
        truthy(d?.es_superusuario) ||
        truthy(d?.docente?.es_superusuario) ||
        truthy(d?.usuario?.docente?.es_superusuario);
      return {
        route: esSuper ? "/admin" : "/docente",
        role: esSuper ? "superusuario" : "docente",
        data: d,
      };
    }
  } catch (_) {
    /* silencio */
  }

  // 3) Fallback
  return { route: "/", role: "desconocido" };
};


  //  Redirigir según rol detectado 
const resolveRoleAndRedirect = async (navigate) => {
  const { route, role } = await detectRole();
  if (role === "desconocido") {
    return navigate("/login", { replace: true });
  }
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
