import { headers } from 'next/headers'
import { PrecosClient } from './_precos-client'

// Países europeus que devem ver preços em EUR
const EU_COUNTRIES = new Set([
  'AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR',
  'HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK',
  // Fora da UE mas mercado relevante
  'GB','CH','NO','IS','LI','AL','BA','ME','MK','RS','UA','AM','AZ','GE',
])

export default async function PrecosPage() {
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country') ?? ''
  const initialLocale = EU_COUNTRIES.has(country) ? 'PT' : 'BR'

  return <PrecosClient initialLocale={initialLocale} />
}
