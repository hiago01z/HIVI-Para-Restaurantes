export default function PedidosLoading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto animate-pulse">
      {/* Título */}
      <div className="h-7 bg-gray-200 rounded-lg w-44 mb-5" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-9 bg-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Cards de pedido */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1.5">
                  <div className="h-5 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                  <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-36" />
              </div>
            </div>
            <div className="h-10 bg-gray-50 border-t border-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
