import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/dashboard'

  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
       await supabase.from('profiles').upsert({
  id: user.id,
  email: user.email,
  full_name:
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    'New Member',
  phone:
    user.user_metadata?.phone_number ||
    user.user_metadata?.phone ||
    null,
  role: 'member',
})
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'New Member',
          phone: user.user_metadata?.phone_number || user.user_metadata?.phone || null,
          role: 'member',
        })
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login', origin))
}