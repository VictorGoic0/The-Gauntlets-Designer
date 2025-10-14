# CollabCanvas

A real-time collaborative canvas application built with React, Konva, and Firebase. Create and manipulate shapes with multiple users simultaneously, featuring live cursor tracking and presence indicators.

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
- `npm test` - Run tests (when implemented)

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
