export default function ConfiguracoesLoading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      {/* Título */}
      <div className="h-7 bg-gray-200 rounded-lg w-44" />

      {/* Seções */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded-xl w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
