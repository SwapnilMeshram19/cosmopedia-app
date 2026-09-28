// Per-build-profile settings.
// - Test builds (development / preview / preview-real) get their own package name so they install
//   next to the Play Store version, and are built for 64-bit ARM only (every phone from ~2017 on)
//   to keep the APK small.
// - production keeps com.sam.cosmopedia and all CPU types; Google Play then delivers only the
//   parts each phone needs, so users download far less than the .aab size.
module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE || process.env.APP_VARIANT || 'production';
  const isProd = profile === 'production';

  const buildProps = ['expo-build-properties', {
    android: {
      // R8 minify + resource shrinking are OFF: they can strip classes that native modules
      // (AdMob banners, gesture handler, image viewer) load at runtime, which makes screens
      // like the details page crash or not open in release APKs.
      enableMinifyInReleaseBuilds: false,
      enableShrinkResourcesInReleaseBuilds: false,
      enablePngCrunchInReleaseBuilds: true,
      ...(isProd ? {} : {
        buildArchs: ['arm64-v8a'],               // test APK: one CPU type instead of four
        useLegacyPackaging: true,                // compress native libraries inside the APK
      }),
    },
  }];

  // Only add the size settings if expo-build-properties is installed (run `npm install`),
  // so a missing package can never break `expo config` / `eas build`.
  let hasBuildProps = true;
  try { require.resolve('expo-build-properties/app.plugin.js', { paths: [__dirname] }); } catch (e) { hasBuildProps = false; }
  if (!hasBuildProps) console.warn('[app.config] expo-build-properties not installed — run `npm install` to enable APK size optimizations.');
  const base = (config.plugins || []).filter((p) => (Array.isArray(p) ? p[0] : p) !== 'expo-build-properties');
  const plugins = hasBuildProps ? [...base, buildProps] : base;
  if (isProd) return { ...config, plugins };
  return {
    ...config,
    plugins,
    name: config.name + ' (Test)',
    android: { ...config.android, package: config.android.package + '.test' },
    ios: { ...config.ios, bundleIdentifier: config.ios.bundleIdentifier + '.test' },
  };
};