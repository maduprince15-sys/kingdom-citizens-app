# Android Google Auth

The Supabase redirect URLs are already required and expected to exist:

```text
https://kingdom-citizens-app.vercel.app/auth/callback
kingdomcitizens://auth/callback
```

## Exact Android Redirect

Inside the Capacitor Android APK, Google OAuth uses:

```text
kingdomcitizens://auth/callback
```

The web browser path still uses:

```text
https://kingdom-citizens-app.vercel.app/auth/callback
```

## Why APK Login Was Failing

The app started the correct custom-scheme OAuth flow, but the `appUrlOpen` listener lived inside `GoogleLoginButton`. If the login route unmounted or React state changed while the external browser was open, Android could return the deep link to the app without a mounted listener to exchange the code.

## Current Fix

- `app/components/GoogleLoginButton.tsx` starts Google OAuth only.
- `app/components/AndroidAuthReturnHandler.tsx` is mounted globally in `app/layout.tsx`.
- The global handler listens for Capacitor `appUrlOpen` and `App.getLaunchUrl()`.
- It handles `kingdomcitizens://auth/callback`.
- It parses query params and hash params.
- It calls `supabase.auth.exchangeCodeForSession(code)` when a code exists.
- It verifies `supabase.auth.getSession()` after exchange.
- It calls `/api/auth/native-profile` after a session exists.
- It closes Capacitor Browser after the app has a valid session.
- It redirects to `/dashboard`.

The flow never logs OAuth codes, access tokens, refresh tokens, or session objects.

## AndroidManifest

The deep-link intent filter must be inside the Capacitor `MainActivity`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="kingdomcitizens"
        android:host="auth"
        android:pathPrefix="/callback" />
</intent-filter>
```

## Safe Status Messages

Development builds may show:

- `Opening Google sign-in...`
- `Waiting for Android return...`
- `Google sign-in completed.`
- `Google sign-in did not return a session.`

These messages do not include tokens, auth codes, or session data.

## Phone Test

1. Build and install the APK.
2. Open the APK.
3. Tap `Continue with Google`.
4. Complete Google OAuth in the browser opened by Capacitor Browser.
5. Confirm Android returns to the APK.
6. Confirm the app reaches `/dashboard`.
7. Confirm the user remains signed in after closing/reopening the APK.

If the browser does not return to the APK, inspect the installed manifest/deep link. If the app returns but does not reach `/dashboard`, inspect whether Supabase returned a `code` and whether `getSession()` succeeds.
