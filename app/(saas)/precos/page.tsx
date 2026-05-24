import { cookies, headers } from 'next/headers'
import { PrecosClient } from './_precos-client'

export const dynamic = 'force-dynamic'

const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
  'GB','CH','NO','IS','LI','AL','BA','ME','MK','RS','UA','AM','AZ','GE',
])

export default async function PrecosPage() {
  const cookieStore = await cookies()

  // 1. Preferência manual do usuário (toggle clicado)
  const manual = cookieStore.get('hivi_locale_manual')?.value
  if (manual === 'PT' || manual === 'BR') {
    return <PrecosClient initialLocale={manual} />
  }

  // 2. Cookie definido pelo middleware via request.geo
  const geo = cookieStore.get('hivi_locale')?.value
  if (geo === 'PT' || geo === 'BR') {
    return <PrecosClient initialLocale={geo} />
  }

  // 3. Fallback: ler header diretamente
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''
  const initialLocale = EU_COUNTRIES.has(country) ? 'PT' : 'BR'

  return <PrecosClient initialLocale={initialLocale} />
}
