# Technical Context: CollabCanvas

## Technologies Used

### Frontend Stack

- **React 19.1.1**: Modern React with hooks and context
- **Vite 7.1.7**: Fast build tool and development server
- **Konva.js 10.0.2**: High-performance 2D canvas library
- **React-Konva 19.0.10**: React bindings for Konva
- **Tailwind CSS 4.1.14**: Utility-first CSS framework
- **Vitest 3.2.4**: Testing framework with jsdom

### Backend & Real-time

- **Firebase 12.4.0**: Backend-as-a-Service platform
  - **Firestore**: Real-time database for canvas objects
  - **Realtime Database**: Presence tracking with onDisconnect
  - **Authentication**: Google Sign-In provider
  - **Firebase Admin SDK (Python)**: Server-side Firestore writes for AI agent
- **FastAPI**: Python web framework for AI agent backend
- **OpenAI Python SDK**: LLM integration with tool calling
- **Python 3.11+**: Backend language for AI agent
- **Uvicorn**: ASGI server for FastAPI development
- **Tenacity**: Retry library for exponential backoff
- **python-dotenv**: Environment variable management
- **Netlify**: Static site hosting with continuous deployment

### Development Tools

- **ESLint**: Code linting with React-specific rules
- **PostCSS**: CSS processing with Tailwind
- **Testing Library**: React component testing utilities
- **jsdom**: DOM simulation for testing

## Development Setup

### Environment Variables

**Frontend (VITE\_ prefix for client-side access):**
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

**Backend (FastAPI - .env file):**
```env
OPENAI_API_KEY=sk-...
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
DEFAULT_MODEL=gpt-4-turbo
ENABLE_RETRY=true
MAX_RETRIES=3
LOG_LEVEL=INFO
```

**Note**: Tool definitions are cached in `app/agent/tools.py` (PR #3 complete). All 5 tools (rectangle, square, circle, text, line) are implemented with enhanced properties (boxShadow, cornerRadius, metadata, etc.).

### Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18 (configured in netlify.toml)
- **SPA Routing**: `public/_redirects` with `/* /index.html 200`

### Testing Setup

- **Test Runner**: Vitest with jsdom environment
- **Test Files**: `*.test.js` and `*.test.jsx`
- **Setup File**: `src/test/setup.js` with jest-dom matchers
- **Mock Strategy**: Firebase functions mocked in tests

## Technical Constraints

### Performance Requirements

- **Minimum FPS**: 30 FPS during all interactions
- **Object Limit**: Support 200+ objects without degradation
- **User Limit**: Support 3+ concurrent users
- **Latency**: <50ms perceived cursor latency, <100ms object sync

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Canvas Support**: Requires HTML5 Canvas support
- **Firebase**: Requires modern JavaScript features

### Firebase Limitations

- **Security Rules**: Must be configured in Firebase Console
- **Rate Limits**: Firestore has read/write limits
- **Connection Limits**: Realtime Database has connection limits
- **Cost**: Pay-per-operation pricing model

## Dependencies

### Production Dependencies

```json
{
  "firebase": "^12.4.0",
  "konva": "^10.0.2",
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-konva": "^19.0.10"
}
```

### Development Dependencies

```json
{
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/user-event": "^14.6.1",
  "tailwindcss": "^4.1.14",
  "vitest": "^3.2.4",
  "jsdom": "^27.0.0"
}
```

### Backend Dependencies (Python - FastAPI)

```python
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
openai>=1.54.0
firebase-admin>=6.5.0
python-dotenv>=1.0.0
tenacity>=9.0.0
```

Note: FastAPI includes Pydantic internally for request/response validation, but we use plain Python classes for configuration management.

## Deployment Configuration

### Netlify Configuration

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **Redirects**: SPA routing support
- **Environment Variables**: All VITE\_ prefixed variables

### Firebase Configuration

- **Security Rules**: Configured for authenticated users only
- **Authorized Domains**: Must include Netlify domain
- **Database Rules**: Firestore and Realtime Database configured

## Development Workflow

### Local Development

**Frontend:**
1. `npm install` - Install dependencies
2. Create `.env.local` with Firebase credentials
3. `npm run dev` - Start development server
4. `npm test` - Run tests
5. `npm run build` - Test production build

**Backend (FastAPI):**
1. `python -m venv venv` - Create virtual environment
2. `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
3. `pip install -r requirements.txt` - Install Python dependencies
4. Create `.env` with OpenAI API key and Firebase credentials path
5. `python run_local.py` or `uvicorn app.main:app --reload` - Start FastAPI server
6. Test health check: `curl http://localhost:8000/api/health`
7. Test tool definitions: `python test_tools.py` (validates all 5 tools)

### Deployment Process

1. Push changes to GitHub repository
2. Netlify automatically builds and deploys
3. Test deployed application
4. Verify Firebase configuration for production domain

### Testing Strategy

- **Unit Tests**: Individual functions and hooks
- **Integration Tests**: Component interactions
- **Manual Testing**: Multi-browser collaboration testing
- **Performance Testing**: FPS monitoring and latency measurement
