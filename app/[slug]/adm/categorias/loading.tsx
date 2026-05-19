export default function CategoriasLoading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto animate-pulse">
      {/* Título + botão */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-7 bg-gray-200 rounded-lg w-44" />
        <div className="h-10 bg-gray-200 rounded-xl w-36" />
      </div>

      {/* Dica de reordenação */}
      <div className="h-9 bg-gray-100 rounded-xl mb-4 w-full" />

      {/* Lista de categorias */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-6 h-8 bg-gray-100 rounded" />
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-100 rounded w-16" />
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
