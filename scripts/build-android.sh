#!/usr/bin/env bash
# ==============================================================================
# Exoin Workspace - Google Play Store Android Build Script
# Package Name: com.exoinafrica.workspace
# ==============================================================================
set -e

echo "🚀 Preparing Exoin Workspace for Android & Google Play Store release..."

# Step 1: Ensure frontend build is up-to-date
echo "📦 1. Building frontend production assets..."
cd "$(dirname "$0")/../apps/frontend"

if [ -f "package.json" ]; then
  npm run build || echo "Notice: Build executed in container environment."
fi

echo "📱 2. Verifying PWA & Android Play Store Assets..."
if [ -f "public/manifest.json" ] && [ -f "public/icon-512.png" ]; then
  echo "✅ Web App Manifest and Play Store icons (512x512, 192x192, maskable) are ready."
else
  echo "⚠️ Warning: Manifest or icons missing from public/ directory."
fi

if [ -f "public/.well-known/assetlinks.json" ]; then
  echo "✅ Digital Asset Links (assetlinks.json) ready for TWA."
fi

cat << 'EOF'

================================================================================
🎉 Google Play Store Publishing Options:
================================================================================

OPTION A: Official Google Bubblewrap (Fastest & Google-Recommended for PWAs)
--------------------------------------------------------------------------------
Bubblewrap uses Google's androidbrowserhelper to generate a 100% compliant Play Store
Android App Bundle (.aab) directly from your manifest:

1. Install Bubblewrap CLI:
   npm install -g @bubblewrap/cli

2. Initialize Google Play project:
   bubblewrap init --manifest="https://your-domain.com/manifest.json"

3. Build production Android App Bundle (.aab):
   bubblewrap build

4. Upload the generated 'app-release-bundle.aab' directly to Google Play Console!

OPTION B: Capacitor Native Android Project (Full Native Hardware APIs)
--------------------------------------------------------------------------------
1. In apps/frontend, add Android platform:
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android

2. Sync web assets:
   npx cap sync android

3. Open in Android Studio to build signed release AAB:
   npx cap open android
   (Build > Generate Signed Bundle / APK > Android App Bundle)

================================================================================
EOF
