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
        error: authenticatedUserError,
      } = await supabase.auth.getUser()

      // A code exchange alone does not prove that an authenticated member
      // session is available. Never redirect to the dashboard on a failed
      // user lookup or silently skip the required profile setup.
      if (authenticatedUserError || !user) {
        return NextResponse.json({ error: 'Could not verify member sign-in.' }, { status: 503 })
      }

      const { data: existingProfile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id, role, phone, birthday_month, birthday_day, show_birthday')
        .eq('id', user.id)
        .maybeSingle()

      // A failed RLS/network lookup is not evidence that a profile is absent.
      // Never try to recreate or overwrite an existing staff profile.
      if (profileLookupError) {
        return NextResponse.json({ error: 'Member profile temporarily unavailable.' }, { status: 503 })
      }

      const birthdayMonth =
        user.user_metadata?.birthday_month !== undefined &&
        user.user_metadata?.birthday_month !== null
          ? Number(user.user_metadata.birthday_month)
          : existingProfile?.birthday_month ?? null

      const birthdayDay =
        user.user_metadata?.birthday_day !== undefined &&
        user.user_metadata?.birthday_day !== null
          ? Number(user.user_metadata.birthday_day)
          : existingProfile?.birthday_day ?? null

      const showBirthday =
        user.user_metadata?.show_birthday !== undefined &&
        user.user_metadata?.show_birthday !== null
          ? Boolean(user.user_metadata.show_birthday)
          : existingProfile?.show_birthday ?? true

      // Existing staff roles are managed through trusted administrative paths.
      // OAuth must never rewrite a role or overwrite existing profile details.
      if (!existingProfile) {
        const { error: profileInsertError } = await supabase.from('profiles').insert({
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
          birthday_month: birthdayMonth,
          birthday_day: birthdayDay,
          show_birthday: showBirthday,
          role: 'member',
        })

        if (profileInsertError) {
          // Do not report successful onboarding when the profile was not saved.
          return NextResponse.json({ error: 'Could not finish member profile setup.' }, { status: 503 })
        }
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login', origin))
}