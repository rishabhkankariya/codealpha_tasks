# Cloud-Based Bus Pass System

A comprehensive public transit pass and ticket management system. It features user registration, pass purchasing, digital pass generation, real-time notification alerts, and full admin analytics dashboard control. 

This repository has been updated to integrate a secure **Razorpay payment checkout flow**, a **ReportLab PDF receipt generator**, and an **SMTP email delivery service**.

---

## Key Features & Integrations

### 1. Razorpay Payment Gateway Checkout
* **Frontend Checkout**: Integrated Razorpay's overlay checkout script (`https://checkout.razorpay.com/v1/checkout.js`) into the booking and pass-purchase portals.
* **Server-Side Verification & Capture**: Implemented the `/api/v1/payments/verify` endpoint. Instead of capturing payments on the client (which is vulnerable to tampering), the backend verifies the transaction state with Razorpay's API and captures the payment securely using calculations computed on the server.

### 2. PDF Receipt Generation Service (`ReportLab`)
* **Dynamic PDF Creation**: Implemented a PDF generator in `backend/app/services/pdf_service.py` using `ReportLab`.
* **Embedded QR Codes**: Automatically extracts the base64-encoded QR code representing the ticket/pass validation payload from the database and draws it directly onto the PDF canvas.
* **Digital Authority Signatures**: Includes styled transaction details, status blocks, and an elegant digital authority signature ("PMPML Transit Authority").
* **Storage**: Generated PDFs are securely saved on the server in `backend/data/receipts/`.

### 3. SMTP Email Dispatcher
* **MIME Notification**: Sends a structured HTML/MIME multipart email to the user upon payment validation, attaching the generated PDF receipt.
* **Graceful Fallback**: If SMTP variables are not configured in the `.env` file, the service logs a warning and allows the transaction to complete without throwing an error. This prevents payment processes from crashing in dev environments where email configurations are absent.

---

## Technology Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Axios, Lucide React Icons, Razorpay Web SDK.
* **Backend**: FastAPI, SQLAlchemy (SQLite locally, PostgreSQL support), Alembic, Pydantic, ReportLab, HTTPX, python-dotenv.
* **Database**: SQLite (default developer database) stored in `smart_bus_pass.db`.
* **Deployment**: Docker, Docker Compose, Azure Services, Terraform.

---

## Run Locally

### Option 1: Running Services Separately (Recommended for Dev)

#### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create the `.env` file by copying the template:
   ```bash
   cp .env.example .env
   ```
5. Configure the `.env` parameters (e.g. `SECRET_KEY`, `REDIS_URL`, and any SMTP variables):
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_SENDER_EMAIL=your-email@gmail.com
   ```
6. Start the FastAPI server using Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

#### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option 2: Using Docker Compose
1. Copy the `.env.example` to `.env` in the root/project folder.
2. Build and launch services:
   ```bash
   docker-compose up -d --build
   ```
3. Access:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Verification & Automated Testing

### 1. Pytest Integration Tests
We implemented automated integration tests in [test_payments.py](file:///c:/Users/Rishabh%20Kankariya/Desktop/codealpha_tasks/Bus-Pass-System/backend/test_payments.py) that run through the entire flow:
- Auto-registers a test passenger to verify database password hashing.
- Logs in the user and obtains JWT access headers.
- Simulates a payment capture by posting to `/api/v1/payments/verify` (mocking Razorpay's API responses).
- Checks that the pass is saved to the SQLite database and that the PDF receipt is generated correctly on the disk.
- Verifies that the PDF is downloadable.
- Automatically cleans up the test databases and receipts.

To run the payment test suite, navigate to the `backend` folder with your virtual environment active and run:
```bash
.\.venv\Scripts\pytest test_payments.py
```

### 2. Frontend TypeScript Checking
To verify that all new TypeScript components are free of compilation or type errors:
1. Navigate to the `frontend` folder.
2. Run:
   ```bash
   npx tsc --noEmit
   ```
   *Result: Successfully compiles with no type-check or syntax errors.*
