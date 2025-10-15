# CollabCanvas

A real-time collaborative canvas application built with React, Konva, and Firebase. Create and manipulate shapes with multiple users simultaneously, featuring live cursor tracking and presence indicators.

## 🚀 Live Demo

**Deployed URL**: [Your Netlify URL will appear here after deployment]

> After deploying to Netlify, update this section with your live URL.

## Features

- 🎨 Real-time collaborative canvas (5,000 x 5,000 pixels)
- 🖱️ Multi-user cursor tracking with <50ms perceived latency
- 👥 Live presence system showing online users
- 🔒 Google Sign-In authentication
- 📦 Shape creation (rectangles, circles, text)
- 🔄 Real-time synchronization across all connected users
- 🎯 Pan and zoom controls
- 💾 State persistence across sessions

## Tech Stack

- **Frontend**: React + Vite
- **Canvas**: Konva.js + React-Konva
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd collabcanvas
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Realtime Database (for presence tracking)
   - Enable Firebase Authentication (Google Sign-In provider)
   - Copy your Firebase configuration

4. **Configure environment variables**

   Create a `.env.local` file in the project root with your Firebase credentials:

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

5. **Run the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

## Deployment to Netlify

### Prerequisites

1. A GitHub repository with this project
2. A Netlify account (free tier works fine)
3. Firebase project with credentials

### Deployment Steps

1. **Prepare your repository**

   Ensure all changes are committed and pushed to GitHub:

   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**

   - Go to [Netlify](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" and authorize Netlify to access your repository
   - Select your repository

3. **Configure build settings**

   Netlify should auto-detect the settings from `netlify.toml`, but verify:

   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18

4. **Add environment variables**

   In Netlify dashboard, go to **Site settings** → **Environment variables** and add:

   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_FIREBASE_DATABASE_URL=your_database_url
   ```

5. **Configure Firebase for production**

   - In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
   - Add your Netlify domain (e.g., `your-app.netlify.app`)

6. **Deploy**

   - Click "Deploy site" in Netlify
   - Wait for the build to complete (usually 1-2 minutes)
   - Your site will be live at `https://your-app.netlify.app`

7. **Test the deployment**

   - Open the deployed URL
   - Test Google Sign-In authentication
   - Open the app in 2 different browsers/devices
   - Verify multiplayer cursor tracking works
   - Test creating and moving shapes
   - Verify state persists across page reloads

### Continuous Deployment

Once set up, Netlify automatically deploys whenever you push to your main branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Troubleshooting

**Build fails:**

- Check the build logs in Netlify dashboard
- Ensure all environment variables are set correctly
- Verify `npm run build` works locally

**Authentication doesn't work:**

- Verify Firebase authorized domains includes your Netlify domain
- Check that all Firebase environment variables are set in Netlify

**Blank page after deployment:**

- Check browser console for errors
- Verify the `_redirects` file exists in the `public` folder
- Ensure environment variables start with `VITE_` prefix

## Environment Variables

The following environment variables are required:

| Variable                            | Description                        |
| ----------------------------------- | ---------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key                   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain               |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID                |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID       |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID                    |
| `VITE_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID (optional) |
| `VITE_FIREBASE_DATABASE_URL`        | Firebase Realtime Database URL     |

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── canvas/        # Canvas and shape components
│   └── ui/            # UI components (header, toolbar, etc.)
├── contexts/          # React contexts (Auth, Canvas)
├── hooks/             # Custom React hooks
├── lib/
│   └── firebase.js    # Firebase configuration
├── utils/             # Utility functions
├── App.jsx            # Main app component
└── main.jsx           # App entry point
```

## Firebase Security Rules

Make sure to configure Firestore security rules in the Firebase Console:

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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
