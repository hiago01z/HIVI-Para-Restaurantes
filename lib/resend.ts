import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@hivi-web.com',
    to,
    subject: 'Bem-vindo à HIVI! 🎉',
    html: `
      <h1>Olá, ${name}!</h1>
      <p>Sua conta na HIVI foi criada com sucesso.</p>
      <p>Agora você pode criar o cardápio digital do seu restaurante e começar a receber pedidos online.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/conta">Acessar minha conta</a></p>
      <br/>
      <p>Equipe HIVI</p>
    `,
  })
}

export async function sendRestaurantCreatedEmail(to: string, restaurantName: string, slug: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@hivi-web.com',
    to,
    subject: `Restaurante "${restaurantName}" criado com sucesso!`,
    html: `
      <h1>${restaurantName} está no ar! 🚀</h1>
      <p>Seu restaurante foi criado com sucesso na HIVI.</p>
      <ul>
        <li><strong>Cardápio público:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/${slug}">${process.env.NEXT_PUBLIC_APP_URL}/${slug}</a></li>
        <li><strong>Painel administrativo:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/${slug}/adm">${process.env.NEXT_PUBLIC_APP_URL}/${slug}/adm</a></li>
      </ul>
      <p>Equipe HIVI</p>
    `,
  })
}
