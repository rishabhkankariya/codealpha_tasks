#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=================================================="
echo "Starting AI Chatbot Platform Deployment on Ubuntu VM"
echo "=================================================="

# 1. Update packages and install dependencies
echo "Updating apt repositories..."
sudo apt-get update -y
echo "Installing Nginx, Python, Node.js and basic build tools..."
sudo apt-get install -y python3 python3-pip python3-venv nginx curl git build-essential

# Install Node.js (LTS version 20)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js LTS v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Setup folder and copy application files
echo "Preparing directories at /var/www/chatbot..."
sudo mkdir -p /var/www/chatbot
sudo chown -R $USER:www-data /var/www/chatbot

# Copy files (assumes running from repo root)
echo "Copying application code..."
cp -r backend /var/www/chatbot/
cp -r frontend /var/www/chatbot/
cp -r deployment /var/www/chatbot/

# 3. Backend Setup
echo "Creating python virtual environment..."
cd /var/www/chatbot/backend
python3 -m venv venv
source venv/bin/activate

echo "Installing backend dependencies (CPU-only PyTorch to fit in 1GB RAM limits)..."
pip install --upgrade pip
# Force CPU-only wheel installation of torch to stay within memory limits
pip install torch --no-cache-dir --index-url https://download.pytorch.org/whl/cpu
pip install --no-cache-dir -r requirements.txt

echo "Initializing database schema and seeding values..."
mkdir -p data
python -c "from app.core.seeding import seed_database; seed_database()"

# 4. Frontend Setup & Build
echo "Building Vite frontend client..."
cd /var/www/chatbot/frontend
npm install
# Set API base url for client queries
echo "VITE_API_URL=/api" > .env.production
npm run build

# Copy build folder to deployment directory
sudo mkdir -p /var/www/chatbot/dist
sudo cp -r dist/* /var/www/chatbot/dist/

# 5. System Configurations & Service Startups
echo "Configuring Systemd service..."
sudo cp /var/www/chatbot/deployment/chatbot.service /etc/systemd/system/chatbot.service
sudo systemctl daemon-reload
sudo systemctl enable chatbot.service
sudo systemctl restart chatbot.service

echo "Configuring Nginx Virtual Host proxy..."
sudo cp /var/www/chatbot/deployment/nginx.conf /etc/nginx/sites-available/chatbot
sudo ln -sf /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
# Remove default nginx site if exists
sudo rm -f /etc/nginx/sites-enabled/default || true

echo "Restarting Nginx reverse proxy..."
sudo nginx -t
sudo systemctl restart nginx

# 6. Final Permissions Setup
echo "Finalizing permission security parameters..."
sudo chown -R www-data:www-data /var/www/chatbot
sudo chmod -R 775 /var/www/chatbot/backend/data

echo "=================================================="
echo "Deployment successful! The application is online."
echo "FastAPI backend running locally at port 8000"
echo "Nginx reverse proxy serving at port 80"
echo "=================================================="
