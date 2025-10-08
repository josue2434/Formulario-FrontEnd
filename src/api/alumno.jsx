import api from "./axiosClient";

/** PERFIL **/
export async function getAlumnoPerfil() {
  const { data } = await api.get("/usuario/alumno");
  return data; // objeto con datos del alumno/perfil
}

export async function updateAlumnoPerfil(payload) {
  // Ajusta 'payload' a lo que reciba tu updateMe en el backend
  const { data } = await api.post("/usuario/alumno", payload);
  return data; // { message: "...", ... }
}

export async function deleteAlumnoCuenta() {
  const { data } = await api.delete("/usuario/alumno");
  return data; // { message: "...", ... }
}

/** CURSOS **/
export async function getMisCursos() {
  const { data } = await api.get("/usuario/alumno/cursos");
  return data; // array de cursos
}

export async function inscribirCurso(idCurso) {
  const { data } = await api.post(`/usuario/alumno/curso/${idCurso}`);
  return data; // { message: "...", ... }
}
