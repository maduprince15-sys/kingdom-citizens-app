# Android Google Auth

Kingdom Citizens supports two Google OAuth paths:

- Web browser redirect: `https://kingdom-citizens-app.vercel.app/auth/callback`
- Android APK native return: `kingdomcitizens://auth/callback`

The Capacitor Android app uses Capacitor as a hosted shell for:

```text
https://kingdom-citizens-app.vercel.app
```

## Android Approach

The APK now uses Capacitor's native return flow:

1. `GoogleLoginButton` detects the Android native runtime.
2. Android starts Supabase Google OAuth with `skipBrowserRedirect: true`.
3. The OAuth URL opens in Capacitor Browser.
4. Supabase redirects to `kingdomcitizens://auth/callback`.
5. AndroidManifest routes that URL back into the APK.
6. The Capacitor App `appUrlOpen` listener extracts the auth code.
7. The in-app Supabase client calls `exchangeCodeForSession`.
8. The app verifies `supabase.auth.getSession()` returns a session.
9. `/api/auth/native-profile` verifies the access token server-side and creates/preserves the member profile.
10. The user is routed to `/dashboard`.

The app does not log OAuth codes, access tokens, refresh tokens, or sessions.

## AndroidManifest

`android/app/src/main/AndroidManifest.xml` includes:

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

## Supabase Dashboard Redirect URLs

Add both redirect URLs in Supabase Auth settings:

```text
https://kingdom-citizens-app.vercel.app/auth/callback
kingdomcitizens://auth/callback
```

The Google Cloud OAuth client must also allow the hosted web callback where applicable. Custom scheme return is handled by Supabase redirect allow-listing and Android intent routing.

## Web Behavior

Normal browser users still see `Continue with Google`.

The web path still calls:

```text
supabase.auth.signInWithOAuth({ provider: 'google' })
```

with:

```text
https://kingdom-citizens-app.vercel.app/auth/callback
```

`app/auth/callback/route.ts` still exchanges the code server-side and routes to `/dashboard`.

## APK Behavior

Android users also see `Continue with Google`.

The APK path uses:

```text
kingdomcitizens://auth/callback
```

The old temporary guard message has been removed. Email/password login still works and remains the fallback if the Supabase dashboard redirect allow-list is not updated.

## Test Steps

1. Add the two Supabase redirect URLs above.
2. Run `npm run build`.
3. Run `npx cap sync android`.
4. Run `cd android`.
5. Run `.\gradlew assembleDebug`.
6. Install the debug APK.
7. Tap `Continue with Google`.
8. Complete Google OAuth in the opened browser.
9. Confirm the URL returns to the APK.
10. Confirm the app reaches `/dashboard`.
11. Confirm the user has a `profiles` row with role `member` unless an existing role was already present.

## Limitations

This is a custom-scheme deep link, not a verified Android App Link. A future Play Store release can add domain verification with `assetlinks.json` for a stronger App Link flow.
