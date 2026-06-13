# Android Push Notifications

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

Token registration is wired now. Push sending is not fully wired because Firebase Admin or FCM server credentials are not configured in this repo.

Do not claim pushes are sent until a server-side FCM sender is added with credentials stored only in server environment variables.
