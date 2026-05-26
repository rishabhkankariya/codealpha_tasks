# 🚀 Start Here - Smart Bus Pass System

## Quick Start Guide for Local Development

This guide will help you run the Smart Bus Pass System **locally on Windows without Docker**.

## 🎯 What's Available

✅ **Backend API** - FastAPI with 17 endpoints (Ready)  
✅ **Frontend Website** - React web application (Ready)  
✅ **Database** - SQLite (No installation needed)  
✅ **Documentation** - Complete API docs

---

## Prerequisites

✅ **Python 3.11+** (You have Python 3.11.9 installed)  
✅ **Node.js 18+** (Required for frontend)  
✅ **Windows PowerShell** (Built-in)  
✅ **Git** (For version control)

---

## 🚀 Quick Start Options

### Option 1: Start Full System (Backend + Frontend) - Recommended

```powershell
.\start-full-system.ps1
```

This will:
- ✓ Start Backend API on http://localhost:8000
- ✓ Start Frontend Website on http://localhost:3000
- ✓ Open two PowerShell windows (one for each server)

### Option 2: Start Backend Only

```powershell
.\start-system.ps1
```

Access at: http://localhost:8000/docs

### Option 3: Start Frontend Only

```powershell
.\start-frontend.ps1
```

Access at: http://localhost:3000  
*Note: Backend must be running for frontend to work*

---

## Access the Application

### Frontend Website (Main Application)
**URL**: http://localhost:3000

Features:
- 🏠 Landing page with features
- 🔐 Login & Registration
- 📊 User dashboard
- 🎫 Book tickets
- 🎟️ Buy passes
- 📱 View bookings & passes
- 👤 Profile management

### Backend API (For Developers)
**URL**: http://localhost:8000/docs

Features:
- 📚 Interactive API documentation (Swagger UI)
- 🧪 Test endpoints directly
- 🔍 View request/response schemas

---

## What's Running?

The system is configured for **local development**:

✅ **Backend API**: FastAPI server on port 8000  
✅ **Database**: SQLite (file-based, no installation needed)  
⚠️ **Redis**: Optional (caching disabled if not installed)  
⚠️ **Celery**: Optional (background tasks disabled)

---

## Verify Installation

### 1. Check API Health
Open in browser: http://localhost:8000/health

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. View API Documentation
Open: http://localhost:8000/docs

You'll see interactive Swagger UI with all available endpoints.

### 3. Test an Endpoint
In the Swagger UI:
1. Click on `GET /` endpoint
2. Click "Try it out"
3. Click "Execute"

---

## Test the API

### Register a User
1. Go to http://localhost:8000/docs
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "email": "test@example.com",
     "password": "Test123!@#",
     "first_name": "Test",
     "last_name": "User",
     "phone": "1234567890",
     "role": "passenger"
   }
   ```
5. Click "Execute"

### Login
1. Find `POST /api/v1/auth/login`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "username": "test@example.com",
     "password": "Test123!@#"
   }
   ```
4. Copy the `access_token` from response

### Authorize
1. Click the **"Authorize"** button at the top
2. Enter: `Bearer <your-access-token>`
3. Click "Authorize"
4. Now you can test protected endpoints!

### Test Protected Endpoints
Try these endpoints (after authorization):
- `GET /api/v1/users/me` - Get your profile
- `GET /api/v1/routes/` - List bus routes
- `POST /api/v1/bookings/` - Create a booking

---

## Common Issues & Solutions

### Issue: "Virtual environment files are locked"
**Solution**: The venv is already in use. Just run `.\start-system.ps1` - it will use the existing environment.

### Issue: "Module not found" errors
**Solution**: Install dependencies manually:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements-minimal.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: Port 8000 already in use
**Solution**: Stop the process using port 8000:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Database errors
**Solution**: Delete and recreate the database:
```powershell
cd backend
Remove-Item smart_bus_pass.db -ErrorAction SilentlyContinue
.\venv\Scripts\python.exe -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### Issue: Import errors or Python errors
**Solution**: Make sure you're in the backend directory:
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Manual Setup (If Script Fails)

If `start-system.ps1` doesn't work, follow these steps:

```powershell
# 1. Create .env file
Copy-Item .env.example .env

# 2. Navigate to backend
cd backend

# 3. Activate virtual environment (if it exists)
.\venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements-minimal.txt

# 5. Initialize database
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"

# 6. Start server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Project Structure

```
Bus Pass System/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   │           ├── auth.py      # Authentication
│   │   │           ├── users.py     # User management
│   │   │           ├── bookings.py  # Ticket bookings
│   │   │           ├── passes.py    # Bus passes
│   │   │           ├── routes.py    # Bus routes
│   │   │           └── qr_codes.py  # QR verification
│   │   ├── core/         # Configuration & database
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── security.py
│   │   │   └── redis.py
│   │   ├── models/       # Database models (19 models)
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # FastAPI application
│   ├── venv/             # Virtual environment
│   ├── requirements-minimal.txt  # Dependencies
│   └── smart_bus_pass.db # SQLite database (created on first run)
├── .env                  # Configuration
└── start-system.ps1      # Quick start script
```

---

## Available API Endpoints

### 🔐 Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user

### 👤 Users (`/api/v1/users`)
- `GET /me` - Get current user profile
- `PUT /me` - Update profile
- `GET /` - List all users (admin only)
- `GET /{user_id}` - Get user by ID (admin only)

### 🎫 Bookings (`/api/v1/bookings`)
- `POST /` - Create booking
- `GET /` - List user bookings
- `GET /{booking_id}` - Get booking details
- `PUT /{booking_id}/cancel` - Cancel booking
- `GET /route/{route_id}/availability` - Check seat availability

### 🎟️ Bus Passes (`/api/v1/passes`)
- `POST /` - Purchase bus pass
- `GET /` - List user passes
- `GET /{pass_id}` - Get pass details
- `GET /types` - List available pass types

### 🚌 Routes (`/api/v1/routes`)
- `GET /` - List all routes
- `GET /{route_id}` - Get route details
- `GET /{route_id}/schedules` - Get route schedules

### 📱 QR Codes (`/api/v1/qr`)
- `POST /verify` - Verify QR code
- `GET /booking/{booking_id}` - Get booking QR code
- `GET /pass/{pass_id}` - Get pass QR code

---

## Stop the Server

Press **Ctrl+C** in the PowerShell window where the server is running.

---

## View Logs

The server logs are displayed in the PowerShell window. Watch for:
- ✅ **INFO** - Normal operations
- ⚠️ **WARNING** - Non-critical issues (e.g., Redis not available)
- ❌ **ERROR** - Critical issues

---

## Development Tips

- **Auto-reload**: Server automatically reloads when you edit code
- **Database**: SQLite file is at `backend/smart_bus_pass.db`
- **Logs**: Watch the console for request logs and errors
- **Debug**: Set `DEBUG=True` in `.env` for detailed logs
- **API Testing**: Use Swagger UI at http://localhost:8000/docs

---

## Next Steps

1. ✅ **Start the server**: `.\start-system.ps1`
2. ✅ **Test the API**: http://localhost:8000/docs
3. ✅ **Register a user**: Use the `/auth/register` endpoint
4. ✅ **Login**: Use the `/auth/login` endpoint
5. ✅ **Explore**: Try all the endpoints!

---

## Documentation

- [README.md](README.md) - Project overview
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current status
- [PHASE1_SUMMARY.md](PHASE1_SUMMARY.md) - Infrastructure details
- [PHASE2_SUMMARY.md](PHASE2_SUMMARY.md) - Backend features
- [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md) - What's implemented

---

## System Architecture (Local Development)

```
┌─────────────────────────────────────────┐
│         Your Web Browser                │
│    http://localhost:8000/docs           │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP Requests
                  │
┌─────────────────▼───────────────────────┐
│         FastAPI Backend                 │
│    (Python + Uvicorn Server)            │
│                                         │
│  • Authentication (JWT)                 │
│  • Booking Engine                       │
│  • Pass Management                      │
│  • QR Code Generation                   │
│  • Route Management                     │
└─────────────────┬───────────────────────┘
                  │
                  │ SQL Queries
                  │
┌─────────────────▼───────────────────────┐
│         SQLite Database                 │
│    (smart_bus_pass.db file)             │
│                                         │
│  • Users, Bookings, Passes              │
│  • Routes, Schedules, Buses             │
│  • QR Codes, Payments                   │
└─────────────────────────────────────────┘
```

---

## Project Status

✅ **Phase 1 Complete**: Infrastructure & Foundation  
✅ **Phase 2 Complete**: Backend Core Services  
✅ **Local Development**: Configured for Windows without Docker  

**Total**: 17 API endpoints, 19 database models, 6 business services

---

## Need Help?

- Check the console logs for errors
- Visit http://localhost:8000/docs for API documentation
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status

---

**Ready to start? Run:** `.\start-system.ps1`

🚀 **Happy coding!**
