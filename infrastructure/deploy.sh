#!/bin/bash
# Exoin App Deployment Script for DigitalOcean Droplet
# Usage: ./deploy.sh [environment]
# Environments: staging, production

set -e

ENVIRONMENT=${1:-production}
DEPLOY_DIR="/opt/exoinapp"
REPO_URL="https://github.com/MessoJ/exoinapp.git"

echo "🚀 Deploying Exoin App to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Installing...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create deploy directory if it doesn't exist
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}Creating deployment directory...${NC}"
    sudo mkdir -p $DEPLOY_DIR
    sudo chown -R $USER:$USER $DEPLOY_DIR
fi

# Clone or pull the repository
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    cd $DEPLOY_DIR
    git fetch origin
    git reset --hard origin/main
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

# Navigate to infrastructure directory
cd $DEPLOY_DIR/infrastructure

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and fill in your production values:${NC}"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Build and deploy
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 30

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy || true

# Check service status
echo -e "${YELLOW}Checking service status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Cleanup old images
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker image prune -f

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Frontend: https://app.exoinafrica.com${NC}"
echo -e "${GREEN}API: https://app.exoinafrica.com/api${NC}"
