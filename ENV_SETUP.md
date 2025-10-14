# Environment Variables Setup Guide

## Local Development Setup

### 1. Create `.env.local` file

In the project root, create a file named `.env.local` with the following content:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → **Project settings**
4. Scroll down to "Your apps" section
5. Select your web app (or click "Add app" if none exists)
6. Copy the config values into your `.env.local` file

### 3. Enable Firebase Services

#### Authentication

1. Go to **Build** → **Authentication**
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable **Google** sign-in provider
5. Add your email and save

#### Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (or production mode with rules)
4. Select a region close to your users
5. Click "Enable"

#### Security Rules

1. In Firestore, go to **Rules** tab
2. Add the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/shared-canvas/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

## Production Setup (Netlify)

### 1. Add Environment Variables to Netlify

After deploying to Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Environment variables**
4. Click "Add a variable" for each of the following:

| Variable Name                       | Example Value                  | Description              |
| ----------------------------------- | ------------------------------ | ------------------------ |
| `VITE_FIREBASE_API_KEY`             | `AIza...`                      | Your Firebase API key    |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `your-project.firebaseapp.com` | Firebase auth domain     |
| `VITE_FIREBASE_PROJECT_ID`          | `your-project-id`              | Firebase project ID      |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `your-project.appspot.com`     | Firebase storage bucket  |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789`                    | Messaging sender ID      |
| `VITE_FIREBASE_APP_ID`              | `1:123456789:web:abc123`       | Firebase app ID          |
| `VITE_FIREBASE_MEASUREMENT_ID`      | `G-ABC123XYZ`                  | Analytics measurement ID |

### 2. Configure Firebase for Production Domain

1. Go to Firebase Console → **Authentication** → **Settings**
2. Click the **Authorized domains** tab
3. Click "Add domain"
4. Enter your Netlify domain (e.g., `your-app.netlify.app`)
5. Save

### 3. Trigger Redeploy

After adding environment variables, trigger a redeploy:

1. In Netlify dashboard, go to **Deploys**
2. Click "Trigger deploy" → "Deploy site"

## Important Notes

### ⚠️ Security

- **Never commit** `.env.local` to Git
- The `.gitignore` already excludes all `.env*` files
- Environment variables are public in frontend apps - Firebase API keys are safe to expose
- Use Firebase Security Rules to protect your data

### 🔄 Vite Environment Variables

- All environment variables **must** start with `VITE_` to be accessible in the app
- Variables are embedded at build time, not runtime
- After changing variables locally, restart the dev server
- After changing variables in Netlify, redeploy the site

### 🧪 Testing Configuration

To verify your environment variables are loaded:

```javascript
// In browser console
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

This should output your project ID if configured correctly.

## Troubleshooting

### "Firebase config is undefined"

- Check that all variables start with `VITE_` prefix
- Restart dev server after adding variables
- In Netlify, verify variables are set and redeploy

### "API key not valid"

- Verify you copied the entire API key from Firebase Console
- Check for extra spaces or quotes
- Regenerate API key in Firebase if needed

### Authentication not working in production

- Add Netlify domain to Firebase authorized domains
- Wait a few minutes for Firebase to update
- Check browser console for specific error messages

### Build fails on Netlify

- Check build logs for missing variables
- Verify all required `VITE_*` variables are set
- Ensure no typos in variable names

## Development vs Production

| Aspect           | Development      | Production        |
| ---------------- | ---------------- | ----------------- |
| Variables file   | `.env.local`     | Netlify dashboard |
| Restart required | Yes (dev server) | Yes (redeploy)    |
| Firebase domain  | `localhost`      | Your Netlify URL  |
| Testing          | `npm run dev`    | Live site         |

## Quick Reference

### All Required Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

### Commands

```bash
# Local development
npm run dev

# Test production build
npm run build
npm run preview

# Deploy (if Netlify is configured)
git push origin main
```
