# Smart Bus Pass & Ticket Booking System

A cloud-native, production-grade transport management platform built on Azure infrastructure with FastAPI backend and React frontend.

## Features

- 🎫 **Digital Ticket Booking** - Real-time seat selection and booking
- 🎟️ **Smart Bus Passes** - Digital passes with QR code verification
- 🤖 **AI Chatbot** - Intelligent conversational assistant for support
- 📊 **Admin Dashboard** - Comprehensive management and analytics
- 🔔 **Real-time Notifications** - WebSocket-based instant updates
- 🔒 **Enterprise Security** - JWT authentication, encryption, audit logging
- ☁️ **Cloud-Native** - Scalable Azure infrastructure with auto-scaling
- 📱 **Responsive Design** - Modern UI with glassmorphism effects

## Technology Stack

### Backend
- **FastAPI** - High-performance async Python framework
- **PostgreSQL 15** - Relational database with advanced features
- **Redis** - Caching and message queue
- **Celery** - Asynchronous task processing
- **WebSockets** - Real-time bidirectional communication

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **Socket.IO** - WebSocket client

### AI/ML
- **OpenAI GPT-4** - Conversational AI
- **Sentence Transformers** - Semantic embeddings
- **FAISS** - Vector similarity search

### Cloud (Azure)
- **App Service** - Application hosting
- **Database for PostgreSQL** - Managed database
- **Blob Storage** - File storage
- **Key Vault** - Secrets management
- **Monitor** - Logging and metrics

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)
- Azure CLI (for cloud deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-bus-pass-system.git
   cd smart-bus-pass-system
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Celery Flower: http://localhost:5555

### Database Setup

The database schema is automatically initialized when you start the PostgreSQL container. To manually run migrations:

```bash
docker-compose exec backend alembic upgrade head
```

## Project Structure

```
smart-bus-pass-system/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # Application entry point
│   ├── database/           # Database schema and migrations
│   ├── tests/              # Backend tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── App.tsx         # Main app component
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── infrastructure/         # Infrastructure as Code
│   └── terraform/          # Terraform configurations
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docker-compose.yml      # Local development setup
└── README.md
```

## Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Running Tests

**Backend tests:**
```bash
cd backend
pytest tests/ -v --cov=app
```

**Frontend tests:**
```bash
cd frontend
npm test
```

### Code Quality

**Backend linting:**
```bash
cd backend
flake8 app
black app
mypy app
```

**Frontend linting:**
```bash
cd frontend
npm run lint
npm run type-check
```

## Deployment

### Azure Deployment

1. **Set up Azure infrastructure**
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform plan -var="environment=prod"
   terraform apply -var="environment=prod"
   ```

2. **Configure GitHub Secrets**
   - `AZURE_CREDENTIALS` - Azure service principal credentials
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_PASSWORD` - Docker Hub password

3. **Deploy via GitHub Actions**
   - Push to `main` branch for production deployment
   - Push to `develop` branch for staging deployment

### Manual Deployment

```bash
# Build and push Docker images
docker build -t smartbuspass/backend:latest ./backend
docker build -t smartbuspass/frontend:latest ./frontend
docker push smartbuspass/backend:latest
docker push smartbuspass/frontend:latest

# Deploy to Azure App Service
az webapp config container set --name smart-bus-pass-prod-api \
  --resource-group smart-bus-pass-prod-rg \
  --docker-custom-image-name smartbuspass/backend:latest
```

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Monitoring

- **Application Insights**: Real-time application monitoring
- **Log Analytics**: Centralized log aggregation
- **Azure Monitor**: Metrics and alerts
- **Flower**: Celery task monitoring at http://localhost:5555

## Security

- TLS 1.2+ encryption for all connections
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 requests/minute per IP)
- Input validation and sanitization
- CORS policy enforcement
- Audit logging for all critical operations

## Auto-scaling

The system automatically scales based on CPU utilization:
- **Scale Out**: CPU > 70% for 5 minutes → add instance
- **Scale In**: CPU < 30% for 10 minutes → remove instance
- **Min Instances**: 2 (high availability)
- **Max Instances**: 10 (production)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@smartbuspass.com or open an issue on GitHub.

## Acknowledgments

- FastAPI for the excellent async framework
- React team for the powerful UI library
- Azure for reliable cloud infrastructure
- OpenAI for conversational AI capabilities
