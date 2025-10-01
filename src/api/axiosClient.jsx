// src/api/axiosClient.js
import axios from "axios";

// Configuración principal de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Defínelo en tu .env (ej. http://localhost:8000/api)
  withCredentials: false, // importante si usas Laravel Sanctum
});

// Interceptor: agrega token en headers si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================== LOGIN ==================
// Llama a POST /login con {correo, clave}
export async function doLogin(correo, clave) {
  const { data } = await api.post("/login", { correo, clave });

  // Guarda token y usuario en localStorage
  if (data?.token) localStorage.setItem("token", data.token);
  if (data?.usuario) localStorage.setItem("usuario", JSON.stringify(data.usuario));

  return data;
}

// ================== LOGOUT ==================
// Llama a POST /logout y limpia almacenamiento
export async function doLogout() {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("Error en logout:", error);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

// ================== REGISTRO ALUMNO ==================
// Llama a POST /singup/usuario/alumno
// payload = { nombre, correo, clave, escolaridad, foto_perfil? }
export async function registerAlumno(payload) {
  const form = new FormData();
  form.append("nombre", payload.nombre);
  form.append("correo", payload.correo);
  form.append("clave", payload.clave);
  form.append("escolaridad", payload.escolaridad);

  if (payload.foto_perfil) {
    form.append("foto_perfil", payload.foto_perfil);
  }

  const { data } = await api.post("/singup/usuario/alumno", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Guarda token y usuario
  if (data?.token) localStorage.setItem("token", data.token);
  if (data?.usuario) localStorage.setItem("usuario", JSON.stringify(data.usuario));

  return data;
}

export default api;
