# Android Google Auth

The web Google sign-in flow remains enabled for browser users through Supabase OAuth and the `/auth/callback` route.

In the Capacitor Android app, Google sign-in is intentionally guarded for now. A browser OAuth flow can complete in Chrome or a custom tab while the Capacitor WebView does not receive the Supabase session unless a native return path and deep-link handling are fully wired. That creates a broken login experience and can leave users thinking they are signed in when the app has no session.

Current Android APK behavior:

- The Google button is replaced with: `Google sign-in in the Android app needs native return setup. Use email login for now.`
- Email and password login stays available.
- No Google OAuth token is stored by the app.
- No service role key, OAuth token, or private key is printed or stored in normal client fields.

Current web behavior:

- `GoogleLoginButton` still calls `supabase.auth.signInWithOAuth`.
- The provider remains `google`.
- The redirect URL remains `${NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`.
- `app/auth/callback/route.ts` exchanges the OAuth code with `supabase.auth.exchangeCodeForSession`.

Future native Google login work should add a real Capacitor return path, Android intent filters, Supabase redirect URL allow-list entries, and a tested session handoff back into the app before enabling the button inside the APK.
