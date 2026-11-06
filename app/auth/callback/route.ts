import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { safeNextPath } from '../../../lib/auth/safe-next'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // The Auth signup trigger already creates the user's profile.
        // UPDATE only the signed-in account, never UPSERT a client-supplied role.
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, full_name, phone, birthday_month, birthday_day, show_birthday')
          .eq('id', user.id)
          .maybeSingle()

        if (existingProfile) {
          const month = user.user_metadata?.birthday_month
          const day = user.user_metadata?.birthday_day
          const show = user.user_metadata?.show_birthday
          await supabase.from('profiles').update({
            email: user.email ?? null,
            full_name: existingProfile.full_name && existingProfile.full_name !== 'New Member'
              ? existingProfile.full_name
              : (user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.display_name || 'New Member'),
            phone: existingProfile.phone || user.user_metadata?.phone_number || user.user_metadata?.phone || null,
            birthday_month: month == null ? existingProfile.birthday_month : Number(month),
            birthday_day: day == null ? existingProfile.birthday_day : Number(day),
            show_birthday: show == null ? existingProfile.show_birthday : Boolean(show),
          }).eq('id', user.id)
        }
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login', origin))
}