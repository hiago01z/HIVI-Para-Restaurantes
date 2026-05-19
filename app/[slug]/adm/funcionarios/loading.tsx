export default function FuncionariosLoading() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="h-7 bg-gray-200 rounded-lg w-24 mb-1" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl w-28" />
      </div>

      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-gray-200 rounded w-36" />
              <div className="h-3 bg-gray-100 rounded w-48" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
            <div className="h-6 bg-gray-100 rounded-full w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
