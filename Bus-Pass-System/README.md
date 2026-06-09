# Cloud-Based Bus Pass System

A comprehensive public transit pass and ticket management system, designed with a modern React interface and a robust FastAPI backend. It features user registration, pass purchasing, digital pass generation, real-time notification alerts, and full admin analytics dashboard control.

## Features
- **User Registration/Login**: Secure JWT-based authentication for users and admins.
- **Bus Pass Booking & Digital Pass Generation**: Purchase daily/monthly/annual passes for various demographics (students, seniors, divyang, etc.) with automated QR code generation.
- **Interactive Ticket Booking**: Book single-ride bus tickets for specific routes and schedules.
- **Admin Dashboard**: Comprehensive analytics for tickets, passes, users, and route performance.
- **Docker Ready**: Easy containerized deployment using Docker Compose.

## Technologies Used
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Axios, Lucide React icons.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy, Alembic (migrations), Celery, WebSockets.
- **Database**: SQLite (local) and PostgreSQL (production).
- **Deployment & Infra**: Docker, Docker Compose, Terraform, Azure.

## Screenshots
Screenshots of the application can be added to the `screenshots/` directory.

## Run Locally

### Option 1: Using Docker Compose (Recommended)
1. Ensure you have **Docker Desktop** installed.
2. From the `Bus-Pass-System` folder, create the `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
3. Build and launch all services:
   ```bash
   docker-compose up -d --build
   ```
4. Access the applications:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Running Services Separately

#### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

#### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the npm packages:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local URL (typically [http://localhost:3000](http://localhost:3000)).
