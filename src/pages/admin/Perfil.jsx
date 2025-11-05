// src/pages/admin/Perfil.jsx
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Edit, Trash2, User, Mail, Upload, Save, X } from "lucide-react";

export default function Perfil() {
  const { usuario } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({ nombre: usuario?.nombre || "", correo: usuario?.correo || "" });
  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(usuario?.foto_perfil || "https://cdn-icons-png.flaticon.com/512/149/149071.png");

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Lógica para manejar la edición y eliminación (simulada)
  const handleSave = () => {
    console.log("Guardando:", { ...formData, foto });
    setIsEditing(false);
    alert("Perfil actualizado con éxito.");
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Resetear cambios si es necesario
  };

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este perfil? Esta acción no se puede deshacer.")) {
      alert("Funcionalidad de eliminar perfil del administrador.");
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Perfil del Administrador</h1>
        <p className="text-gray-600">Gestiona tu información personal.</p>
      </header>

      <section className="bg-white rounded-2xl shadow border border-gray-100 p-8 flex flex-col md:flex-row gap-8 max-w-4xl">
        {/* Foto de perfil */}
        <div className="flex flex-col items-center md:w-1/3">
          <img
            src={preview}
            alt="Foto del admin"
            className="w-32 h-32 rounded-full border-4 border-gray-200 shadow-md object-cover"
          />
          {isEditing && (
            <label className="mt-4 cursor-pointer flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
              <Upload className="w-4 h-4" /> Cambiar foto
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
          <h2 className="text-xl font-semibold text-gray-800 mt-4">{formData.nombre || "Admin"}</h2>
          <p className="text-gray-500 text-sm">Administrador del Sistema</p>

          {/* Botones */}
          <div className="flex gap-3 mt-6">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                  <Save className="w-4 h-4" /> Guardar
                </button>
                <button onClick={handleCancel} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
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
        <div className="flex-1 space-y-6 pt-4">
          <div className="flex items-center gap-3 text-gray-700">
            <User className="w-5 h-5 text-gray-500" />
            {isEditing ? <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" /> : <span><strong>Nombre:</strong> {formData.nombre || "N/A"}</span>}
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-gray-500" />
            {isEditing ? <input type="email" name="correo" value={formData.correo} onChange={handleChange} className="w-full px-2 py-1 border rounded-md" /> : <span><strong>Correo:</strong> {formData.correo || "N/A"}</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
