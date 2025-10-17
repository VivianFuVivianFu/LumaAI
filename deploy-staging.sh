#!/bin/bash

# Luma Staging Deployment Script
# This script deploys both frontend and backend to staging environment

set -e # Exit on error

echo "🚀 Starting Luma Staging Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI not found"
    echo "Installing Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# Step 1: Deploy Backend to Staging
echo ""
print_info "Step 1/4: Deploying Backend to Staging..."
cd backend

# Copy staging environment
cp .env.staging .env
print_success "Environment configured for staging"

# Build backend
print_info "Building backend..."
npm run build
print_success "Backend built successfully"

# Deploy to Vercel (staging)
print_info "Deploying to Vercel..."
vercel --prod --yes --env NODE_ENV=staging
BACKEND_URL=$(vercel inspect --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
print_success "Backend deployed to: $BACKEND_URL"

# Step 2: Deploy Frontend to Staging
cd ..
echo ""
print_info "Step 2/4: Deploying Frontend to Staging..."

# Copy staging environment
cp .env.staging .env

# Update API URL with deployed backend
if [ ! -z "$BACKEND_URL" ]; then
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$BACKEND_URL/api/v1|g" .env
    print_success "API URL updated to: https://$BACKEND_URL/api/v1"
fi

# Install dependencies (if needed)
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Build frontend
print_info "Building frontend..."
npm run build
print_success "Frontend built successfully"

# Deploy to Vercel (staging)
print_info "Deploying to Vercel..."
vercel --prod --yes
FRONTEND_URL=$(vercel inspect --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
print_success "Frontend deployed to: $FRONTEND_URL"

# Step 3: Health Check
echo ""
print_info "Step 3/4: Running Health Checks..."

# Check backend health
print_info "Checking backend health..."
BACKEND_HEALTH=$(curl -s "https://$BACKEND_URL/api/v1/health" || echo "failed")
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
    echo "Response: $BACKEND_HEALTH"
fi

# Check frontend
print_info "Checking frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_URL" || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend is accessible"
else
    print_error "Frontend check failed (HTTP $FRONTEND_STATUS)"
fi

# Step 4: Summary
echo ""
print_info "Step 4/4: Deployment Summary"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Staging Deployment Complete!"
echo ""
echo "📱 Frontend: https://$FRONTEND_URL"
echo "🔧 Backend:  https://$BACKEND_URL"
echo "💚 Health:   https://$BACKEND_URL/api/v1/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Next Steps:"
echo "  1. Test the staging environment"
echo "  2. Run integration tests"
echo "  3. Perform manual QA"
echo "  4. Run: ./run-tests.sh staging"
echo ""
print_info "To deploy to production, run: ./deploy-production.sh"
echo ""
