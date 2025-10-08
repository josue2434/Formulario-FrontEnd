export default function CrearActividad() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Actividad</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Información General */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Información General</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Actividad*</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Ej: Examen Final - Fundamentos de Redes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Actividad</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                  <option>Examen</option>
                  <option>Práctica</option>
                  <option>Tarea</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Descripción del propósito y contenido de esta actividad..."
                />
              </div>
            </div>
          </div>

          {/* Configuración */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">⚙️ Configuración Avanzada</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intentos Permitidos</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Crear Actividad
            </button>
            <button className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
