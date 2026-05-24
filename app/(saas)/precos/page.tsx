import { cookies, headers } from 'next/headers'
import { PrecosClient } from './_precos-client'

export const dynamic = 'force-dynamic'

const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
  'GB','CH','NO','IS','LI','AL','BA','ME','MK','RS','UA','AM','AZ','GE',
])

export default async function PrecosPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  // 1. Override por URL: /precos?locale=PT  (útil para testes)
  const sp = await searchParams
  if (sp.locale === 'PT') return <PrecosClient initialLocale="PT" />
  if (sp.locale === 'BR') return <PrecosClient initialLocale="BR" />

  // 2. Cookie definido pelo middleware via request.geo (IP real)
  const cookieStore = await cookies()
  const geo = cookieStore.get('hivi_locale')?.value
  if (geo === 'PT' || geo === 'BR') {
    return <PrecosClient initialLocale={geo} />
  }

  // 3. Fallback: header direto
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''
  const initialLocale = EU_COUNTRIES.has(country) ? 'PT' : 'BR'

  return <PrecosClient initialLocale={initialLocale} />
}
