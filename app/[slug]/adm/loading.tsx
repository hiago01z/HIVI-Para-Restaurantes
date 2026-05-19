export default function AdmDashboardLoading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto animate-pulse">
      {/* Saudação */}
      <div className="h-7 bg-gray-200 rounded-lg w-56 mb-1" />
      <div className="h-4 bg-gray-100 rounded w-40 mb-6" />

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-6 bg-gray-100 rounded-full w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
