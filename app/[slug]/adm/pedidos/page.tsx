export default function PedidosPage() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold text-primary mb-6">Pedidos</h1>
      <div className="flex gap-4 border-b mb-6">
        <button className="pb-2 border-b-2 border-primary font-medium text-sm">Entrega</button>
        <button className="pb-2 text-sm text-muted-foreground">Pedido na mesa</button>
        <button className="pb-2 text-sm text-muted-foreground">Ler QR Code</button>
      </div>
      <p className="text-muted-foreground text-sm">Nenhum pedido por hoje.</p>
    </main>
  )
}
