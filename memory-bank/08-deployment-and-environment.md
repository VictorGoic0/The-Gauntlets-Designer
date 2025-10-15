# Deployment and Environment

## Development Environment

### Local Development

- **Framework**: Vite development server
- **Port**: `http://localhost:5173` (default)
- **Hot Reload**: Enabled via Vite HMR
- **Firebase**: Direct connection to live Firebase (no emulator)

### Start Development Server

```bash
npm run dev
```

### Environment Variables (`.env.local`)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

**Important Notes:**

- `.env.local` is in `.gitignore` (never commit secrets)
- All variables must start with `VITE_` prefix (Vite requirement)
- Variables are injected at build time (not runtime)

---

## Production Environment

### Hosting Platform

**Netlify** - Serverless hosting with CDN

### Build Process

```bash
npm run build    # Creates production build in dist/
npm run preview  # Preview production build locally
```

### Build Configuration

**File**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### SPA Redirect Configuration

**File**: `public/_redirects`

```
/*  /index.html  200
```

**Purpose**: Ensures all routes serve `index.html` (required for client-side routing)

---

## Deployment Process

### Initial Setup

1. **Create Netlify Account**

   - Go to [Netlify](https://app.netlify.com/)
   - Sign up with GitHub

2. **Connect Repository**

   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Select repository

3. **Configure Build Settings**

   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

4. **Add Environment Variables**

   - Go to **Site settings** → **Environment variables**
   - Add all `VITE_FIREBASE_*` variables
   - Values must match Firebase project

5. **Configure Firebase**

   - In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
   - Add Netlify domain (e.g., `your-app.netlify.app`)

6. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (1-2 minutes)
   - Site live at `https://your-app.netlify.app`

### Continuous Deployment

Once set up, Netlify automatically deploys on push to `main` branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Netlify will:

1. Detect push to `main`
2. Run build command
3. Publish to CDN
4. Update live site (usually <2 minutes)

---

## Firebase Configuration

### Firebase Console Setup

1. **Create Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Name: CollabCanvas (or your choice)

2. **Enable Firestore**

   - Go to **Firestore Database**
   - Click "Create database"
   - Start in **production mode**
   - Choose location (e.g., us-central1)

3. **Enable Realtime Database**

   - Go to **Realtime Database**
   - Click "Create database"
   - Start in **locked mode**, then add rules (see below)

4. **Enable Google Sign-In**

   - Go to **Authentication** → **Sign-in method**
   - Enable **Google** provider
   - Configure OAuth consent screen

5. **Add Web App**

   - Go to **Project settings** → **General**
   - Click "Add app" → Web
   - Register app and copy config credentials

6. **Configure Security Rules**
   - See Firestore and Realtime Database rules below

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Single shared canvas accessible to all authenticated users
    match /projects/shared-canvas/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Deploy Rules:**

- Go to **Firestore** → **Rules** tab
- Paste rules above
- Click "Publish"

### Realtime Database Security Rules

```json
{
  "rules": {
    "cursors": {
      "shared-canvas": {
        "$userId": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    },
    "presence": {
      "shared-canvas": {
        "$userId": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

**Deploy Rules:**

- Go to **Realtime Database** → **Rules** tab
- Paste rules above
- Click "Publish"

### Authorized Domains

For production deployment, add your domain to Firebase:

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add:
   - `localhost` (for development)
   - `your-app.netlify.app` (for production)

---

## Environment-Specific Considerations

### Development

- Hot reload enabled
- Console logging enabled
- No production optimizations
- Direct Firebase connection (no caching)

### Production

- Code minified and bundled
- Console logging should be removed (future: use env flag)
- Production optimizations enabled
- CDN caching for static assets
- Firebase persistence enabled

---

## Monitoring and Debugging

### Netlify Dashboard

- **Deploys**: View build history and logs
- **Functions**: (not used in MVP)
- **Analytics**: (optional, not set up)
- **Logs**: Runtime logs (limited on free tier)

### Firebase Console

- **Authentication**: View signed-in users
- **Firestore**: View/edit documents
- **Realtime Database**: View/edit data
- **Usage**: Monitor read/write quotas

### Browser DevTools

- **Console**: Check for errors
- **Network**: Monitor Firebase requests
- **Performance**: Check FPS and rendering

---

## Troubleshooting

### Build Fails on Netlify

**Symptoms**: Build log shows errors

**Solutions:**

1. Check environment variables are set correctly
2. Run `npm run build` locally to reproduce
3. Check Node version matches (18)
4. Check dependencies are in `package.json` (not just `devDependencies` for build tools)

### Authentication Doesn't Work

**Symptoms**: Google Sign-In popup fails or redirects to error

**Solutions:**

1. Verify Firebase authorized domains includes Netlify domain
2. Check environment variables are set in Netlify
3. Verify Google Sign-In is enabled in Firebase Console
4. Check browser console for errors

### Blank Page After Deployment

**Symptoms**: App loads but shows blank page, console errors

**Solutions:**

1. Check `_redirects` file exists in `public/` folder
2. Verify environment variables start with `VITE_` prefix
3. Check browser console for errors (often Firebase config issue)
4. Verify Firebase config values are correct

### Canvas Not Syncing

**Symptoms**: Objects don't appear across browsers

**Solutions:**

1. Check Firestore rules allow read/write for authenticated users
2. Verify user is signed in (check Firebase Console → Authentication)
3. Check browser console for Firestore errors
4. Test Firestore connection (try manual write in Firebase Console)

### Cursors Not Appearing

**Symptoms**: Remote cursors don't show up

**Solutions:**

1. Check Realtime Database rules allow read/write
2. Verify `VITE_FIREBASE_DATABASE_URL` is set correctly
3. Check Realtime Database has `cursors/shared-canvas/` structure
4. Look for onDisconnect errors in console

---

## Performance Optimization (Future)

### Netlify

- [ ] Enable asset optimization (minify, compress)
- [ ] Set up custom domain with HTTPS
- [ ] Configure caching headers
- [ ] Enable CDN edge caching

### Firebase

- [ ] Set up Firebase Performance Monitoring
- [ ] Add Firestore indexes for common queries
- [ ] Enable offline persistence (already planned)
- [ ] Optimize security rules for performance

### Application

- [ ] Code splitting (lazy load components)
- [ ] Bundle size optimization (analyze with `vite build --analyze`)
- [ ] Remove console.logs in production
- [ ] Add error tracking (Sentry, LogRocket)

---

## Scaling Considerations

### Current Limits (Free Tier)

**Netlify:**

- 100 GB bandwidth/month
- 300 build minutes/month
- Unlimited sites

**Firebase:**

- 10,000 writes/day (Firestore)
- 50,000 reads/day (Firestore)
- 1 GB stored (Firestore)
- 100 simultaneous connections (Realtime Database)
- 10 GB/month download (Realtime Database)

### Reaching Limits

**If you exceed Firebase limits:**

1. Firestore write limit: Cursor throttling helps, but many users → upgrade
2. Realtime Database connections: Limit concurrent users → upgrade
3. Bandwidth: Large canvas with many users → upgrade

**Current Optimizations:**

- Cursor throttling (100ms) reduces writes significantly
- onDisconnect cleanup reduces data storage
- Server timestamps reduce client-side logic

**Future Optimizations:**

- Implement offline persistence to reduce reads
- Add pagination for large object lists
- Implement object culling (don't sync off-screen objects)
