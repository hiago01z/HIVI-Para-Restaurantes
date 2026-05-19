export default function PratosLoading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto animate-pulse">
      {/* Título + botão */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-7 bg-gray-200 rounded-lg w-40" />
        <div className="h-10 bg-gray-200 rounded-xl w-32" />
      </div>

      {/* Filtro de categorias */}
      <div className="flex gap-2 mb-4 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded-full w-24 flex-shrink-0" />
        ))}
      </div>

      {/* Lista de pratos */}
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-36" />
              <div className="h-3 bg-gray-100 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-gray-100 rounded-lg" />
              <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
