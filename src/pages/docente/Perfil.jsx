import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Edit, Trash2, Upload, User, Mail, Briefcase, Save, X } from "lucide-react";

import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Edit, Trash2, Upload, User, Mail, Briefcase, Save, X } from "lucide-react";

export default function Perfil() {
  const { usuario } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    correo: usuario?.correo || "",
    titulo_profesional: usuario?.titulo_profesional || "",
  });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(usuario?.foto_perfil || "https://cdn-icons-png.flaticon.com/512/3135/3135755.png");

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

  const handleSave = () => {
    // Lógica para guardar en el backend
    console.log("Guardando perfil del docente:", { ...formData, foto });
    setIsEditing(false);
    alert("Perfil actualizado con éxito.");
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Resetear cambios
    setFormData({
      nombre: usuario?.nombre || "",
      correo: usuario?.correo || "",
      titulo_profesional: usuario?.titulo_profesional || "",
    });
    setPreview(usuario?.foto_perfil || "https://cdn-icons-png.flaticon.com/512/3135/3135755.png");
    setFoto(null);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.")) {
      alert("Eliminando cuenta del docente...");
    }
  };

  const { usuario } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || "",
    correo: usuario?.correo || "",
    titulo_profesional: usuario?.titulo_profesional || "",
  });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(usuario?.foto_perfil || "https://cdn-icons-png.flaticon.com/512/3135/3135755.png");

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

  const handleSave = () => {
    // Lógica para guardar en el backend
    console.log("Guardando:", { ...formData, foto });
    alert("Funcionalidad para guardar perfil del docente.");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Resetear cambios
    setFormData({
      nombre: usuario?.nombre || "",
      correo: usuario?.correo || "",
      titulo_profesional: usuario?.titulo_profesional || "",
    });
    setPreview(usuario?.foto_perfil || "https://cdn-icons-png.flaticon.com/512/3135/3135755.png");
    setFoto(null);
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.")) {
      alert("Eliminando cuenta del docente...");
    }
  };

  return (
    <div className="space-y-8">
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
      <section className="bg-white rounded-2xl shadow border border-gray-100 p-8 flex flex-col md:flex-row gap-8 max-w-4xl">
        {/* Foto de perfil y acciones */}
        <div className="flex flex-col items-center md:w-1/3">
          <img
            src={preview}
            alt="Foto del docente"
            className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-md object-cover mb-4"
          />
          {isEditing && (
            <label className="cursor-pointer flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800">
              <Upload className="w-4 h-4" /> Cambiar foto
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
          <h2 className="text-xl font-semibold text-gray-800 mt-4">{formData.nombre}</h2>
          <p className="text-gray-500 text-sm">Docente</p>

          <div className="flex gap-3 mt-6">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                  <Save className="w-4 h-4" /> Guardar
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Datos */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 text-gray-700">
            <User className="w-5 h-5 text-purple-600" />
            {isEditing ? (
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" />
            ) : (
              <span><strong>Nombre:</strong> {formData.nombre}</span>
            )}
      <section className="bg-white rounded-2xl shadow border border-gray-100 p-8 flex flex-col md:flex-row gap-8 max-w-4xl">
        {/* Foto de perfil y acciones */}
        <div className="flex flex-col items-center md:w-1/3">
          <img
            src={preview}
            alt="Foto del docente"
            className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-md object-cover mb-4"
          />
          {isEditing && (
            <label className="cursor-pointer flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800">
              <Upload className="w-4 h-4" /> Cambiar foto
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
          <h2 className="text-xl font-semibold text-gray-800 mt-4">{formData.nombre}</h2>
          <p className="text-gray-500 text-sm">Docente</p>

          <div className="flex gap-3 mt-6">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                  <Save className="w-4 h-4" /> Guardar
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Datos */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 text-gray-700">
            <User className="w-5 h-5 text-purple-600" />
            {isEditing ? (
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" />
            ) : (
              <span><strong>Nombre:</strong> {formData.nombre}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-purple-600" />
            {isEditing ? (
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" />
            ) : (
              <span><strong>Correo:</strong> {formData.correo}</span>
            )}
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-purple-600" />
            {isEditing ? (
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" />
            ) : (
              <span><strong>Correo:</strong> {formData.correo}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Briefcase className="w-5 h-5 text-purple-600" />
            {isEditing ? (
              <input type="text" name="titulo_profesional" value={formData.titulo_profesional} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" placeholder="Ej: Ing. en Sistemas" />
            ) : (
              <span><strong>Título:</strong> {formData.titulo_profesional || "No especificado"}</span>
            )}
          <div className="flex items-center gap-3 text-gray-700">
            <Briefcase className="w-5 h-5 text-purple-600" />
            {isEditing ? (
              <input type="text" name="titulo_profesional" value={formData.titulo_profesional} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" placeholder="Ej: Ing. en Sistemas" />
            ) : (
              <span><strong>Título:</strong> {formData.titulo_profesional || "No especificado"}</span>
            )}
          </div>
        </div>
      </section>
      </section>
    </div>
  )
}
