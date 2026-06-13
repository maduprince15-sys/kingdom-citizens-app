# Kingdom Citizens Android APK Build

Kingdom Citizens remains a hosted Next.js/Supabase/Vercel app. The Android APK uses Capacitor as a native shell that opens the hosted production app:

```text
https://kingdom-citizens-app.vercel.app
```

If the production domain changes, update `capacitor.config.ts` before syncing Android.

## Prepare The Web App

```bash
npm run build
npx cap sync android
npx cap open android
```

The app uses server routes and Supabase auth, so static export is not the default APK strategy.

## Debug APK

From Windows PowerShell:

```powershell
cd android
.\gradlew assembleDebug
```

From macOS/Linux shells:

```bash
cd android
./gradlew assembleDebug
```

The debug APK is created under:

```text
android/app/build/outputs/apk/debug/
```

## Updating The Android App Icon

PWA manifest icons are not enough for the installed Android launcher icon. Use Capacitor's official asset generator so the native Android mipmap resources are regenerated from the Kingdom Citizens logo.

From Windows PowerShell:

```powershell
cd C:\Users\madup\kingdom-citizens-app
npm install -D @capacitor/assets
New-Item -ItemType Directory -Force -Path resources
# place logo at resources\icon.png
npx capacitor-assets generate --android
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

The current source icon is `resources\icon.png`, generated from `public\kingdom-citizens-logo.png` on a square brand background. The optional splash source is `resources\splash.png`.

Uninstall the previous APK from the phone before installing the rebuilt APK because Android may cache the old launcher icon.

## Release APK In Android Studio

1. Run `npx cap open android`.
2. In Android Studio, choose `Build`.
3. Choose `Generate Signed Bundle / APK`.
4. Select `APK`.
5. Create a new keystore or choose an existing keystore.
6. Select the release build variant.
7. Build the release APK.

Keep the keystore private. Losing the keystore can prevent updates to the same Android app listing.

## Notes

- The generated `android/` folder is ignored by default to avoid committing a large native project accidentally.
- Run `npx cap sync android` after changing `capacitor.config.ts`, native plugins, icons, or web assets.
- Run `npx cap sync android` after changing Android deep links, including the Google login custom scheme.
- The hosted app URL must stay HTTPS because `cleartext` is disabled.
