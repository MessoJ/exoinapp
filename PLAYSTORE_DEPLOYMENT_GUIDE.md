# 📱 Exoin Workspace - Google Play Store & Mobile Deployment Guide

This guide walks you through deploying **Exoin Workspace** (`com.exoinafrica.workspace`) as an official Android App on the **Google Play Store**, and using it as a mobile Progressive Web App (PWA).

---

## 🌟 1. Progressive Web App (PWA) Direct Mobile Installation

Any technician or client with an Android or iOS smartphone can immediately install and use the app directly without waiting for Play Store approval:

1. Open **Chrome** on Android or **Safari** on iOS.
2. Navigate to your domain: `https://your-domain.com`.
3. Tap the browser menu (**⋮** or Share button) and select **"Install App"** / **"Add to Home Screen"**.
4. The app installs as a standalone fullscreen application with:
   - Official Exoin Africa icon
   - Splash screen
   - Mobile bottom navigation bar
   - Offline document caching via Service Worker
   - Signature drawing with touch stabilization

---

## 🚀 2. Publishing to Google Play Store

There are two official methods to generate the production `.aab` (Android App Bundle) required by the Google Play Console:

### Method A: Google Bubblewrap / TWA (Recommended for Fast Play Store Approval)

Google's Trusted Web Activity (TWA) wraps the web application in a native Android shell backed by Chrome Custom Tabs, removing the URL address bar and passing all Google Play Developer policies:

```bash
# 1. Install Google Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize project from your live manifest
bubblewrap init --manifest="https://your-domain.com/manifest.json"

# 3. Build signed production Android App Bundle (.aab)
bubblewrap build
```

This will produce `app-release-bundle.aab`.

#### Digital Asset Links Verification:
Google requires domain ownership verification to remove the browser URL bar.
The file `public/.well-known/assetlinks.json` is already configured in the frontend:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.exoinafrica.workspace",
      "sha256_cert_fingerprints": [
        "YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

---

### Method B: Native Android Project with Capacitor

If you want a native Android Studio project with full native Android SDKs:

```bash
cd apps/frontend

# 1. Install Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize and add Android platform
npx cap add android

# 3. Sync web dist files to Android native project
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

In Android Studio:
1. Select **Build > Generate Signed Bundle / APK**.
2. Choose **Android App Bundle (.aab)**.
3. Select your Keystore, key alias, and password.
4. Select build variant **release**.
5. Click **Finish**.

---

## 📋 3. Google Play Console Submission Checklist

1. **Google Play Console Account**:
   - Go to [play.google.com/console](https://play.google.com/console) and create a developer account ($25 one-time registration).

2. **Create New App**:
   - App Name: `Exoin Workspace`
   - Default language: `English (Kenya)` or `English (United States)`
   - App or game: `App`
   - Free or paid: `Free`

3. **Store Listing Assets**:
   - **App Icon**: 512x512 PNG (generated at `apps/frontend/public/icon-512.png`)
   - **Feature Graphic**: 1024x500 PNG
   - **Phone Screenshots**: Minimum 2 phone screenshots (e.g. Service Job Card creation, Document preview, Dashboard)
   - **Short Description** (up to 80 chars):
     *Official Exoin Africa portal for Service Job Cards, Invoices, Delivery Notes & Quotations.*
   - **Full Description**:
     *Exoin Workspace empowers field technicians, delivery teams, and administrative staff to create, sign, and manage service job cards, official delivery notes, tax invoices, and quotations on mobile and desktop.*

4. **App Content Declarations**:
   - **Privacy Policy**: Link to your privacy policy URL (e.g., `https://your-domain.com/privacy`).
   - **App Access**: Provide test credentials if login is required.
   - **Target Audience**: 18 and older.

5. **Release Track**:
   - Go to **Production** (or **Closed Testing** first).
   - Create a new release and upload the `.aab` file.
   - Review and rollout release to the Google Play Store!
