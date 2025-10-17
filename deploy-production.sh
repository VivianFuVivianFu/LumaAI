#!/bin/bash

# Luma Production Deployment Script
# This script deploys both frontend and backend to production

set -e # Exit on error

echo "🚀 Starting Luma Production Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Confirmation prompt
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_warning "PRODUCTION DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will deploy Luma to PRODUCTION."
echo ""
echo "Checklist:"
echo "  ✓ All tests passing"
echo "  ✓ Staging QA complete"
echo "  ✓ Performance tests passed"
echo "  ✓ Database migrations applied"
echo "  ✓ Environment variables configured"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI not found"
    echo "Installing Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# Step 1: Deploy Backend to Production
echo ""
print_info "Step 1/5: Deploying Backend to Production..."
cd backend

# Copy production environment
cp .env.production .env
print_success "Environment configured for production"

# Build backend
print_info "Building backend..."
npm run build
print_success "Backend built successfully"

# Deploy to Vercel (production)
print_info "Deploying to Vercel..."
vercel --prod --yes
BACKEND_URL=$(vercel inspect --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
print_success "Backend deployed to: $BACKEND_URL"

# Step 2: Deploy Frontend to Production
cd ..
echo ""
print_info "Step 2/5: Deploying Frontend to Production..."

# Copy production environment
cp .env.production .env

# Update API URL with deployed backend (if needed)
if [ ! -z "$BACKEND_URL" ]; then
    print_info "Backend URL: https://$BACKEND_URL/api/v1"
    # Uncomment if you want to auto-update
    # sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$BACKEND_URL/api/v1|g" .env
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

# Check build size
BUILD_SIZE=$(du -sh build | cut -f1)
print_info "Build size: $BUILD_SIZE"

# Deploy to Vercel (production)
print_info "Deploying to Vercel..."
vercel --prod --yes
FRONTEND_URL=$(vercel inspect --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
print_success "Frontend deployed to: $FRONTEND_URL"

# Step 3: Health Check
echo ""
print_info "Step 3/5: Running Health Checks..."

# Wait a bit for deployment to settle
sleep 5

# Check backend health
print_info "Checking backend health..."
BACKEND_HEALTH=$(curl -s "https://$BACKEND_URL/api/v1/health" || echo "failed")
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    print_success "Backend is healthy"
    echo "Response: $BACKEND_HEALTH"
else
    print_error "Backend health check failed"
    echo "Response: $BACKEND_HEALTH"
    exit 1
fi

# Check frontend
print_info "Checking frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_URL" || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend is accessible (HTTP 200)"
else
    print_error "Frontend check failed (HTTP $FRONTEND_STATUS)"
    exit 1
fi

# Step 4: Smoke Tests
echo ""
print_info "Step 4/5: Running Smoke Tests..."

# Test API endpoints
print_info "Testing API endpoints..."

# Health check
curl -s "https://$BACKEND_URL/api/v1/health" > /dev/null && print_success "Health endpoint OK" || print_error "Health endpoint failed"

# Test CORS (should have proper headers)
CORS_HEADERS=$(curl -s -I "https://$BACKEND_URL/api/v1/health" | grep -i "access-control")
if [ ! -z "$CORS_HEADERS" ]; then
    print_success "CORS headers present"
else
    print_warning "CORS headers not found"
fi

# Step 5: Summary & Next Steps
echo ""
print_info "Step 5/5: Deployment Summary"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_success "Production Deployment Complete! 🎉"
echo ""
echo "📱 Frontend: https://$FRONTEND_URL"
echo "🔧 Backend:  https://$BACKEND_URL"
echo "💚 Health:   https://$BACKEND_URL/api/v1/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Post-Deployment Tasks:"
echo "  1. Monitor error rates in Sentry"
echo "  2. Check Langfuse for AI traces"
echo "  3. Monitor uptime (UptimeRobot)"
echo "  4. Test user flows manually"
echo "  5. Check analytics dashboards"
echo ""
print_warning "Important:"
echo "  • Monitor logs for first 30 minutes"
echo "  • Have rollback plan ready"
echo "  • Update DNS if using custom domain"
echo ""
print_success "Congratulations on launching Luma! 🎊"
echo ""
