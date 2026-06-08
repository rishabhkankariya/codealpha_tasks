# Smart Bus Pass System - Frontend

Modern React-based web application for the Smart Bus Pass & Ticket Booking System.

## 🚀 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8000

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (default points to localhost:8000)
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── layouts/         # Layout components
│   │   ├── MainLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── pages/           # Page components
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── BookTicketPage.tsx
│   │   ├── MyBookingsPage.tsx
│   │   ├── BuyPassPage.tsx
│   │   ├── MyPassesPage.tsx
│   │   ├── RoutesPage.tsx
│   │   └── ProfilePage.tsx
│   ├── store/           # State management
│   │   └── authStore.ts
│   ├── lib/             # Utilities
│   │   ├── api.ts       # API client
│   │   └── utils.ts     # Helper functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Features

### Implemented ✅
- **Landing Page** - Hero section, features, how it works
- **Authentication** - Login & Register pages
- **Dashboard** - User dashboard with quick actions
- **Navigation** - Responsive header with mobile menu
- **Layouts** - Main layout and auth layout
- **State Management** - Zustand store for auth
- **API Integration** - Axios client with interceptors
- **Protected Routes** - Route guards for authenticated pages
- **Responsive Design** - Mobile-first approach

### Coming Soon 🚧
- Ticket booking flow
- Pass purchase flow
- Bookings list with QR codes
- Passes list with QR codes
- Routes browser
- Profile management
- Payment integration
- Real-time updates

## 🔧 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 API Integration

The frontend connects to the backend API at `http://localhost:8000` by default.

### API Endpoints Used

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/users/me` - Get current user

### Authentication Flow

1. User logs in → receives access & refresh tokens
2. Tokens stored in localStorage
3. Access token sent with every API request
4. Auto-refresh on 401 errors
5. Logout clears tokens and redirects to login

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS with custom configuration:

- **Primary Color**: Blue (customizable in `tailwind.config.js`)
- **Custom Components**: Buttons, inputs, cards
- **Responsive**: Mobile-first breakpoints
- **Dark Mode**: Ready (not enabled yet)

### Custom CSS Classes

```css
.btn              /* Base button */
.btn-primary      /* Primary button */
.btn-secondary    /* Secondary button */
.btn-outline      /* Outline button */
.input            /* Input field */
.card             /* Card container */
```

## 🔐 Authentication

### Protected Routes

Routes that require authentication:
- `/dashboard`
- `/book-ticket`
- `/my-bookings`
- `/buy-pass`
- `/my-passes`
- `/profile`

### Public Routes

Routes accessible without authentication:
- `/` - Home page
- `/routes` - Browse routes
- `/login` - Login page
- `/register` - Register page

## 📱 Responsive Design

The app is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Deploy to Netlify/Vercel

1. Connect your repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-api.com`

### Deploy with Docker

```bash
# Build image
docker build -t smartbus-frontend .

# Run container
docker run -p 3000:80 smartbus-frontend
```

## 🐛 Troubleshooting

### Port 3000 already in use

```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### API connection issues

1. Ensure backend is running on http://localhost:8000
2. Check `.env` file has correct `VITE_API_URL`
3. Check browser console for CORS errors

### Build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Development Guidelines

### Adding a New Page

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/layouts/MainLayout.tsx`

### Adding API Calls

1. Use the `api` client from `src/lib/api.ts`
2. Handle errors appropriately
3. Show loading states

### State Management

- Use Zustand for global state
- Use React hooks for local state
- Keep state close to where it's used

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of the Smart Bus Pass System.

---

**Status**: 🟢 Phase 3 - Frontend Development In Progress  
**Last Updated**: May 25, 2026
