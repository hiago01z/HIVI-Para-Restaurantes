export default async function QrConfirmPage({
  params,
}: {
  params: Promise<{ slug: string; sessionId: string }>
}) {
  const { sessionId } = await params

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Confirmar Pedido</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Sessão: {sessionId}
      </p>
      <button className="w-full max-w-sm py-3 bg-primary text-primary-foreground rounded-md font-medium">
        Confirmar Pedido
      </button>
    </main>
  )
}
