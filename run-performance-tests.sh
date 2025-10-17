#!/bin/bash

# Luma Performance Testing Script
# Tests performance metrics and generates reports

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Parse environment
ENV=${1:-local}
FRONTEND_URL=""
BACKEND_URL=""

case $ENV in
  local)
    FRONTEND_URL="http://localhost:3000"
    BACKEND_URL="http://localhost:4000"
    ;;
  staging)
    FRONTEND_URL="https://luma-staging.vercel.app"
    BACKEND_URL="https://luma-backend-staging.vercel.app"
    ;;
  production)
    FRONTEND_URL="https://luma.vercel.app"
    BACKEND_URL="https://luma-backend.vercel.app"
    ;;
  *)
    print_error "Invalid environment: $ENV"
    echo "Usage: ./run-performance-tests.sh [local|staging|production]"
    exit 1
    ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ Luma Performance Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Environment: $ENV"
print_info "Frontend: $FRONTEND_URL"
print_info "Backend: $BACKEND_URL"
echo ""

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v curl &> /dev/null; then
    print_error "curl not found. Please install curl."
    exit 1
fi

# Check if lighthouse is installed
LIGHTHOUSE_AVAILABLE=false
if command -v lighthouse &> /dev/null; then
    LIGHTHOUSE_AVAILABLE=true
    print_success "Lighthouse CLI found"
else
    print_warning "Lighthouse CLI not found (install with: npm install -g lighthouse)"
    print_info "Skipping Lighthouse tests"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Backend API Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test health endpoint
print_info "Testing health endpoint..."
START_TIME=$(date +%s%3N)
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/v1/health")
END_TIME=$(date +%s%3N)
HEALTH_TIME=$((END_TIME - START_TIME))

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_success "Health endpoint: ${HEALTH_TIME}ms"
    if [ $HEALTH_TIME -lt 200 ]; then
        print_success "Response time: Excellent (< 200ms)"
    elif [ $HEALTH_TIME -lt 500 ]; then
        print_success "Response time: Good (< 500ms)"
    elif [ $HEALTH_TIME -lt 1000 ]; then
        print_warning "Response time: Fair (< 1000ms)"
    else
        print_error "Response time: Poor (> 1000ms)"
    fi
else
    print_error "Health endpoint failed"
fi

echo ""

# Test multiple concurrent requests
print_info "Testing concurrent requests (10 parallel)..."
CONCURRENT_START=$(date +%s%3N)
for i in {1..10}; do
    curl -s "$BACKEND_URL/api/v1/health" > /dev/null &
done
wait
CONCURRENT_END=$(date +%s%3N)
CONCURRENT_TIME=$((CONCURRENT_END - CONCURRENT_START))
AVG_TIME=$((CONCURRENT_TIME / 10))

print_success "10 concurrent requests: ${CONCURRENT_TIME}ms total, ${AVG_TIME}ms average"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Frontend Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test frontend load time
print_info "Testing frontend load time..."
FRONTEND_START=$(date +%s%3N)
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
FRONTEND_END=$(date +%s%3N)
FRONTEND_TIME=$((FRONTEND_END - FRONTEND_START))

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend loaded: ${FRONTEND_TIME}ms (HTTP 200)"
else
    print_error "Frontend failed: HTTP $FRONTEND_STATUS"
fi

# Check resource sizes
print_info "Checking bundle size..."
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    JS_SIZE=$(du -sh build/assets/*.js 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")
    CSS_SIZE=$(du -sh build/assets/*.css 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")

    echo "  Build size: $BUILD_SIZE"
    echo "  JS size:    ${JS_SIZE}K"
    echo "  CSS size:   ${CSS_SIZE}K"

    # Bundle size recommendations
    TOTAL_SIZE=$(du -sk build | cut -f1)
    if [ $TOTAL_SIZE -lt 1024 ]; then
        print_success "Bundle size: Excellent (< 1MB)"
    elif [ $TOTAL_SIZE -lt 3072 ]; then
        print_success "Bundle size: Good (< 3MB)"
    elif [ $TOTAL_SIZE -lt 5120 ]; then
        print_warning "Bundle size: Fair (< 5MB)"
    else
        print_error "Bundle size: Large (> 5MB) - consider optimization"
    fi
else
    print_warning "Build directory not found. Run 'npm run build' first."
fi

echo ""

# Lighthouse tests (if available)
if [ "$LIGHTHOUSE_AVAILABLE" = true ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Test 3: Lighthouse Performance Audit"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    print_info "Running Lighthouse audit..."
    print_warning "This may take 1-2 minutes..."

    LIGHTHOUSE_OUTPUT="lighthouse-report-$(date +%Y%m%d-%H%M%S)"

    lighthouse "$FRONTEND_URL" \
        --only-categories=performance,accessibility,best-practices,seo,pwa \
        --output=html \
        --output=json \
        --output-path="${LIGHTHOUSE_OUTPUT}" \
        --chrome-flags="--headless --no-sandbox" \
        --quiet

    if [ -f "${LIGHTHOUSE_OUTPUT}.json" ]; then
        # Parse scores
        PERF_SCORE=$(cat "${LIGHTHOUSE_OUTPUT}.json" | grep -o '"performance":[0-9.]*' | grep -o '[0-9.]*' | head -1)
        A11Y_SCORE=$(cat "${LIGHTHOUSE_OUTPUT}.json" | grep -o '"accessibility":[0-9.]*' | grep -o '[0-9.]*' | head -1)
        BP_SCORE=$(cat "${LIGHTHOUSE_OUTPUT}.json" | grep -o '"best-practices":[0-9.]*' | grep -o '[0-9.]*' | head -1)
        SEO_SCORE=$(cat "${LIGHTHOUSE_OUTPUT}.json" | grep -o '"seo":[0-9.]*' | grep -o '[0-9.]*' | head -1)
        PWA_SCORE=$(cat "${LIGHTHOUSE_OUTPUT}.json" | grep -o '"pwa":[0-9.]*' | grep -o '[0-9.]*' | head -1)

        # Convert to percentage
        PERF_PERCENT=$(echo "$PERF_SCORE * 100" | bc | cut -d'.' -f1)
        A11Y_PERCENT=$(echo "$A11Y_SCORE * 100" | bc | cut -d'.' -f1)
        BP_PERCENT=$(echo "$BP_SCORE * 100" | bc | cut -d'.' -f1)
        SEO_PERCENT=$(echo "$SEO_SCORE * 100" | bc | cut -d'.' -f1)
        PWA_PERCENT=$(echo "$PWA_SCORE * 100" | bc | cut -d'.' -f1)

        echo ""
        echo "Lighthouse Scores:"
        echo "  Performance:     $PERF_PERCENT/100"
        echo "  Accessibility:   $A11Y_PERCENT/100"
        echo "  Best Practices:  $BP_PERCENT/100"
        echo "  SEO:             $SEO_PERCENT/100"
        echo "  PWA:             $PWA_PERCENT/100"
        echo ""

        # Check if scores meet thresholds
        ALL_PASSED=true
        if [ $PERF_PERCENT -ge 90 ]; then
            print_success "Performance: $PERF_PERCENT/100 ✓"
        else
            print_error "Performance: $PERF_PERCENT/100 (target: 90+)"
            ALL_PASSED=false
        fi

        if [ $A11Y_PERCENT -ge 90 ]; then
            print_success "Accessibility: $A11Y_PERCENT/100 ✓"
        else
            print_warning "Accessibility: $A11Y_PERCENT/100 (target: 90+)"
        fi

        if [ $BP_PERCENT -ge 90 ]; then
            print_success "Best Practices: $BP_PERCENT/100 ✓"
        else
            print_warning "Best Practices: $BP_PERCENT/100 (target: 90+)"
        fi

        if [ $SEO_PERCENT -ge 90 ]; then
            print_success "SEO: $SEO_PERCENT/100 ✓"
        else
            print_warning "SEO: $SEO_PERCENT/100 (target: 90+)"
        fi

        if [ $PWA_PERCENT -ge 80 ]; then
            print_success "PWA: $PWA_PERCENT/100 ✓"
        else
            print_warning "PWA: $PWA_PERCENT/100 (target: 80+)"
        fi

        echo ""
        print_info "Full report: ${LIGHTHOUSE_OUTPUT}.html"
    else
        print_error "Lighthouse report generation failed"
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Performance Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Performance recommendations
echo "Performance Checklist:"
echo ""

# Backend checks
if [ $HEALTH_TIME -lt 500 ]; then
    echo "  ✓ Backend response time < 500ms"
else
    echo "  ✗ Backend response time > 500ms"
fi

if [ $AVG_TIME -lt 500 ]; then
    echo "  ✓ Concurrent request handling good"
else
    echo "  ✗ Concurrent request handling needs optimization"
fi

# Frontend checks
if [ $FRONTEND_TIME -lt 3000 ]; then
    echo "  ✓ Frontend load time < 3s"
else
    echo "  ✗ Frontend load time > 3s"
fi

if [ "$LIGHTHOUSE_AVAILABLE" = true ] && [ ! -z "$PERF_PERCENT" ]; then
    if [ $PERF_PERCENT -ge 90 ]; then
        echo "  ✓ Lighthouse performance score > 90"
    else
        echo "  ✗ Lighthouse performance score < 90"
    fi

    if [ $SEO_PERCENT -ge 90 ]; then
        echo "  ✓ SEO score > 90"
    else
        echo "  ✗ SEO score < 90"
    fi

    if [ $PWA_PERCENT -ge 80 ]; then
        echo "  ✓ PWA score > 80"
    else
        echo "  ✗ PWA score < 80"
    fi
fi

echo ""

# Final verdict
if [ "$ALL_PASSED" = true ] || [ "$ALL_PASSED" = "" ]; then
    print_success "Performance tests passed! ✅"
    echo ""
    echo "Ready for production deployment."
    exit 0
else
    print_warning "Some performance metrics need improvement"
    echo ""
    echo "Consider optimizing before production deployment."
    echo ""
    echo "Optimization tips:"
    echo "  • Enable code splitting"
    echo "  • Compress images"
    echo "  • Enable gzip/brotli compression"
    echo "  • Use CDN for static assets"
    echo "  • Implement lazy loading"
    exit 1
fi
