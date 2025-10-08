'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(
  prevState: { error?: string },
  formData: FormData
) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // Vérifier les credentials avec les variables d'environnement
  const validUsername = process.env.AUTH_USERNAME || 'admin'
  const validPassword = process.env.AUTH_PASSWORD || 'admin'

  if (username === validUsername && password === validPassword) {
    // Créer une session simple (cookie)
    const cookieStore = await cookies()
    cookieStore.set('auth-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })

    redirect('/')
  } else {
    return { error: 'Identifiants incorrects' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-session')
  redirect('/login')
}

export async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get('auth-session')
  return !!session
}
