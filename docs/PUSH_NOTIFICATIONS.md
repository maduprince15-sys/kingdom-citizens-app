# Android Push Notifications

Supabase remains the Kingdom Citizens backend for auth, members, roles, app notifications, messages, and device token records. Firebase is used only for Firebase Cloud Messaging delivery to Android devices.

The Android package name from `capacitor.config.ts` is:

```text
com.kingdomcitizens.app
```

Kingdom Citizens uses:

```text
@capacitor/push-notifications
```

for Android APK push registration.

## Implemented

- `PushNotificationManager` is mounted on `/dashboard`.
- It detects the Capacitor native app.
- It checks notification permission.
- It shows an `Enable notifications` button.
- It requests permission only after user action.
- It does not repeatedly request after denial.
- It registers with Capacitor Push Notifications when permission is granted.
- It sends the device token to `/api/notifications/register-device`.
- The API stores the token for the authenticated Supabase user only.
- `lib/firebase-admin-push.ts` sends pushes server-side through Firebase Admin when configured.
- Private message sends trigger privacy-safe FCM pushes after encrypted message storage succeeds.
- `app/api/notifications/send-push` supports role-checked announcement pushes.

## Firebase Cloud Messaging Setup

Create/configure a Firebase project for the Android app package:

```text
com.kingdomcitizens.app
```

Download `google-services.json` and place it at:

```text
android/app/google-services.json
```

Do not commit real Firebase config unless the project intentionally treats it as public app config. The repo ignores:

```text
android/app/google-services.json
```

After adding the file, run:

```powershell
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

The Android Gradle project already includes the Google Services plugin and applies it when `android/app/google-services.json` exists.

## Vercel Environment Variables

Configure one of these options for server-side Firebase Admin:

Option A:

```text
FIREBASE_SERVICE_ACCOUNT_JSON={...}
```

Option B:

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

For `FIREBASE_PRIVATE_KEY`, escaped newlines are supported.

## Supabase Token Table

Review and apply:

```text
supabase/push-notifications.sql
```

It creates:

```text
public.user_push_tokens
```

with RLS so authenticated users can manage only their own tokens.

## Notification Privacy Rule

Private message pushes must not reveal encrypted message text. Use:

```text
New encrypted message
```

Announcement pushes may use safe announcement titles if that is the intended member/public notification behavior.

## Sending Pushes

Token registration is wired now. Push sending is wired in code through Firebase Admin, but it only sends when Firebase Admin environment variables are configured.

Private message push:

```text
Title: Kingdom Citizens
Body: New encrypted message
```

Data payload:

```json
{
  "type": "private_message",
  "href": "/messages"
}
```

Announcement push can be sent by allowed roles through `/api/notifications/send-push`. Automatic announcement broadcast on every announcement create is not enabled yet.

Do not claim pushes are delivered on a device until `google-services.json`, Supabase SQL, Vercel Firebase Admin env vars, and a real phone test are complete.
