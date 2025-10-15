# Technical Stack

## Frontend Framework

- **React** 19.1.1 - UI library
- **Vite** 7.1.7 - Build tool and development server
- **JSX** - Component syntax

## Canvas & Graphics

- **Konva.js** 10.0.2 - HTML5 Canvas library
- **react-konva** 19.0.10 - React bindings for Konva

## Backend & Real-Time

- **Firebase** 12.4.0
  - **Firebase Auth** - Google Sign-In only (MVP)
  - **Firestore** - Document database for canvas objects
  - **Realtime Database** - Presence tracking with onDisconnect
  - Direct against live Firebase (no emulator for MVP)

## Styling

- **Tailwind CSS** 4.1.14 - Utility-first CSS framework
- **PostCSS** 8.5.6 - CSS processing
- **Autoprefixer** 10.4.21 - CSS vendor prefixing

## Testing

- **Vitest** 3.2.4 - Test runner
- **@testing-library/react** 16.3.0 - React testing utilities
- **@testing-library/jest-dom** 6.9.1 - DOM matchers
- **@testing-library/user-event** 14.6.1 - User interaction simulation
- **jsdom** 27.0.0 - DOM implementation for Node

## Code Quality

- **ESLint** 9.36.0 - Linting
- **eslint-plugin-react-hooks** - React hooks linting
- **eslint-plugin-react-refresh** - React Fast Refresh linting

## Deployment

- **Netlify** - Production hosting
- **GitHub** - Version control and CI/CD trigger

## Development Tools

- **Node.js** - v16 or higher required
- **npm** - Package management
- Environment variables via `.env.local`

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
