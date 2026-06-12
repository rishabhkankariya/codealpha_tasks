# CodeAlpha Tasks

This repository contains my completed CodeAlpha Internship Tasks.

## Tasks Completed

### Task 1: Cloud-Based Bus Pass System
A comprehensive public transit pass and ticket management system, featuring a React frontend and a FastAPI backend with integrated payment validation, PDF generation, and automated email dispatch.

* **Folder**: `Bus-Pass-System`
* **Live Demo Link**: [https://smart-bus-pass-system.pages.dev/](https://smart-bus-pass-system.pages.dev/)
* **What I Did & How**:
  - **Razorpay Checkout Integration**: Injected the Razorpay SDK into the frontend, enabling a modal checkout flow for pass/ticket bookings.
  - **Backend Payment Verification**: Configured a Python endpoint (`POST /payments/verify`) that verifies and captures transactions directly via Razorpay APIs on the server side to prevent tamper attempts.
  - **PDF Receipt Service**: Used `ReportLab` to dynamically generate official transit receipts containing transaction metadata, base64-encoded QR codes, and digital signatures.
  - **SMTP Email Dispatcher**: Integrated an email delivery service that sends booking confirmations and PDF receipts to passengers immediately upon successful verification.

---

### Task 2: AI Chatbot
A production-ready ChatGPT-style chatbot platform featuring a hybrid AI query resolution model and full Progressive Web App (PWA) support.

* **Folder**: `AI-Chatbot`
* **Live Demo Link**: [https://ai-chatbot-system-by-rishabh-kankariya.pages.dev/](https://ai-chatbot-system-by-rishabh-kankariya.pages.dev/)
* **What I Did & How**:
  - **Hybrid AI Architecture**: Combines intent classification (via Cosine Similarity using the `all-MiniLM-L6-v2` transformer model) and semantic FAQ retrieval (via a FAISS vector store).
  - **PWA Offline Mode**: Implemented service worker caching and offline fallback capabilities, permitting installations onto mobile/desktop home screens.
  - **Admin & Knowledge Ingestion**: Included an admin control dashboard to upload FAQ documents, parse context sentences, automatically update embeddings, and display system usage analytics.

---

## Author
Rishabh Kankariya
