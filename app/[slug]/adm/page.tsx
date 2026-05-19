import { redirect } from 'next/navigation'

export default async function AdmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/${slug}/adm/pedidos`)
}
