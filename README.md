# Cosmopedia (Expo / React Native)

Native port of the Cosmopedia PWA (github.com/SwapnilMeshram19/cosmopedia). Expo SDK 57.

## Run
```
npm install
npx expo start            # Expo Go: everything works, ads are simulated
```

## Build
```
npm i -g eas-cli && eas login
eas build -p android --profile preview      # APK to install on a phone
eas build -p android --profile development  # dev client with real AdMob test ads
eas build -p android --profile production   # AAB for Google Play
```

## Before publishing
- `src/ads.js` → set `ADMOB_UNITS.interstitial` (create an interstitial unit in AdMob). Dev builds use Google test IDs automatically.
- `src/CosmoApp.js` → replace `NASA_API_KEY = 'DEMO_KEY'` with your free key from https://api.nasa.gov
- `app.json` → `iosAppId` is Google's test ID; replace it if you ship on iOS.
- Package name is `com.sam.cosmopedia` (same as the TWA). To update the existing Play listing, sign with the same upload key.

## Structure
- `src/CosmoApp.js` – app state + logic (ported from the web component)
- `src/screens/` – Explore, News, Today, Quiz, Sky, More (+ sub-screens), overlays, tab bar
- `src/components/` – UI primitives, ISS map (WebView), share card
- `src/data/` – encyclopedia, quiz and translations (EN/HI/ES)
- `src/astro.js` – planet/moon math, unchanged from the web app
