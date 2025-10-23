import { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, Edit, Trash2, Upload, X, Save, BookOpen } from "lucide-react";
import { useAuth } from "../../auth/AuthContext"; // Asegúrate que useAuth exporte 'logout'
import { getAlumnoPerfil, updateAlumnoPerfil, deleteAlumnoCuenta } from "../../api/alumno";
import { useNavigate } from "react-router-dom";

export default function AlumnoPerfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", telefono: "" });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState("https://cdn-icons-png.flaticon.com/512/3135/3135755.png");

  useEffect(() => {
    getAlumnoPerfil()
      .then(data => {
        // Se asume que la API puede devolver { usuario: {...} } o solo {...}
        const perfilData = data.usuario || data;
        if (perfilData && typeof perfilData === 'object') {
          setPerfil(perfilData);
          setFormData({ nombre: perfilData.nombre, telefono: perfilData.telefono || "" });
          if (perfilData.foto_perfil) {
            setPreview(perfilData.foto_perfil);
          }
        } else {
          console.error("La respuesta de la API no contiene datos del perfil válidos:", data);
          // Opcional: podrías mostrar un mensaje de error al usuario aquí.
        }
      })
      .catch(console.error);
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente.

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFoto(null); // Resetea la foto seleccionada si se cancela
    if (perfil) {
      setPreview(perfil.foto_perfil || "https://cdn-icons-png.flaticon.com/512/3135/3135755.png");
      setFormData({ nombre: perfil.nombre, telefono: perfil.telefono || "" });
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const payload = new FormData();
    payload.append("nombre", formData.nombre);
    payload.append("telefono", formData.telefono);
    if (foto) {
      payload.append("foto_perfil", foto);
    }

    try {
      const updatedProfile = await updateAlumnoPerfil(payload);
      setPerfil(updatedProfile.usuario);
      setPreview(updatedProfile.usuario.foto_perfil);
      setIsEditing(false);
      alert("Perfil actualizado con éxito.");
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      alert("No se pudo actualizar el perfil.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Perderás todo tu progreso.")) {
      try {
        await deleteAlumnoCuenta();
        alert("Cuenta eliminada con éxito.");
        logout();
        navigate("/login");
      } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
        alert("No se pudo eliminar la cuenta.");
      }
    }
  };

  if (!perfil) {
    return <div>Cargando perfil...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Título */}
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Perfil del Alumno</h1>
        <p className="text-gray-600">
          Visualiza tu información personal y académica registrada en el sistema.
        </p>
      </header>

      {/* Información general */}
      <section className="bg-white rounded-2xl shadow border border-gray-100 p-8 flex flex-col md:flex-row gap-8">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center md:w-1/3">
          <img
            src={preview}
            alt="Foto del alumno"
            className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-md object-cover"
          />
          {isEditing && (
            <label className="mt-4 cursor-pointer flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
              <Upload className="w-4 h-4" /> Cambiar foto
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
          <h2 className="text-xl font-semibold text-gray-800 mt-4">{perfil.nombre}</h2>
          <p className="text-gray-500 text-sm">Estudiante</p>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                  <Save className="w-4 h-4" /> Guardar
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={handleEdit} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Datos del alumno */}
        <div className="flex-1 space-y-6">
          {/* Información personal */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Información personal
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
              <li className="flex items-center gap-3 text-gray-700">
                <User className="w-5 h-5 text-indigo-600" />
                {isEditing ? (
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" />
                ) : (
                  <span><strong>Nombre:</strong> {perfil.nombre}</span>
                )}
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-indigo-600" />
                <span><strong>Correo:</strong> {perfil.correo}</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-indigo-600" />
                {isEditing ? (
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" />
                ) : (
                  <span><strong>Teléfono:</strong> {perfil.telefono || "No especificado"}</span>
                )}
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span><strong>Fecha de registro:</strong> {new Date(perfil.created_at).toLocaleDateString()}</span>
              </li>
            </ul>
          </div>

          {/* Información académica */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Información académica
            </h3>
            <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span><strong>Escolaridad:</strong> {perfil.alumno?.escolaridad || "No especificada"}</span>
                </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
