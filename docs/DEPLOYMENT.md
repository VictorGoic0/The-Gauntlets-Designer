# Netlify Deployment Checklist

This document provides a quick checklist for deploying CollabCanvas to Netlify.

## Pre-Deployment Checklist

- [ ] All code changes committed and pushed to GitHub
- [ ] Firebase project created and configured
- [ ] Google Sign-In provider enabled in Firebase Authentication
- [ ] Firestore database enabled with security rules configured
- [ ] Local build tested successfully (`npm run build`)
- [ ] All tests passing (`npm test`)

## Files Required for Netlify

✅ `netlify.toml` - Build configuration
✅ `public/_redirects` - SPA routing configuration  
✅ `.env.local` - Local environment variables (NOT committed to Git)

## Netlify Setup Steps

### 1. Create Netlify Account

- Go to https://app.netlify.com/
- Sign up or log in

### 2. Import Project

- Click "Add new site" → "Import an existing project"
- Choose GitHub as your Git provider
- Authorize Netlify to access your repositories
- Select your CollabCanvas repository

### 3. Configure Build Settings

The `netlify.toml` file will auto-configure these settings:

```toml
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 4. Add Environment Variables

Go to **Site settings** → **Build & deploy** → **Environment variables**

Add the following variables (get values from Firebase Console):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

**Important**: All variables must start with `VITE_` prefix to be accessible in the app.

### 5. Configure Firebase for Production

1. Go to Firebase Console → Authentication → Settings
2. Click on "Authorized domains" tab
3. Add your Netlify domain (e.g., `your-app.netlify.app`)
4. Save changes

### 6. Deploy

- Click "Deploy site" in Netlify dashboard
- Monitor the build logs for any errors
- Wait for deployment to complete (typically 1-2 minutes)

### 7. Verify Deployment

Test the following on the live site:

- [ ] Site loads without errors
- [ ] Google Sign-In works
- [ ] Multiple users can see each other's cursors
- [ ] Canvas pan and zoom work correctly
- [ ] State persists after page reload
- [ ] No console errors in browser DevTools

## Continuous Deployment

Once configured, Netlify automatically deploys on every push to main:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

## Monitoring and Debugging

### Build Logs

- View in Netlify dashboard under "Deploys" → Select a deploy → "Deploy log"

### Runtime Errors

- Check browser console (F12 → Console tab)
- Check Network tab for failed requests
- Verify environment variables are set correctly

### Common Issues

**Issue**: Build fails with "Module not found"

- **Solution**: Ensure all dependencies are in `package.json` and run `npm install`

**Issue**: Authentication doesn't work

- **Solution**: Add Netlify domain to Firebase authorized domains

**Issue**: Blank page after deployment

- **Solution**: Check that `_redirects` file exists in `public/` folder

**Issue**: "Firebase config is undefined"

- **Solution**: Verify all `VITE_FIREBASE_*` environment variables are set in Netlify

## Rolling Back

If a deployment has issues:

1. Go to Netlify dashboard → "Deploys"
2. Find a previous working deploy
3. Click "Publish deploy" to rollback

## Custom Domain (Optional)

To use a custom domain:

1. Go to Netlify → "Domain settings"
2. Click "Add custom domain"
3. Follow the DNS configuration instructions
4. Add custom domain to Firebase authorized domains

## Performance Optimization

For production, consider:

- [ ] Enable gzip compression (automatic on Netlify)
- [ ] Implement code splitting for larger apps
- [ ] Optimize Firestore queries with indexes
- [ ] Monitor Firebase usage in Firebase Console

## Security Checklist

- [ ] Firestore security rules properly configured
- [ ] Only authenticated users can read/write
- [ ] Environment variables never committed to Git
- [ ] Firebase API keys properly restricted in Firebase Console

## Support

If you encounter issues:

- Check Netlify build logs
- Review Firebase Console logs
- Check browser console for errors
- Refer to [Netlify documentation](https://docs.netlify.com/)
- Refer to [Firebase documentation](https://firebase.google.com/docs)
