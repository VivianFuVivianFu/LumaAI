#!/bin/bash

# Luma Backend - Quick Debugging Helper Script
# Usage: ./debug-helper.sh [command]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Luma Debug Helper                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Function to check health
check_health() {
    echo -e "${YELLOW}Checking backend health...${NC}"
    curl -s http://localhost:4000/api/v1/health | jq '.'
}

# Function to check for common issues
check_issues() {
    echo -e "${YELLOW}Scanning for common issues...${NC}"
    echo ""

    echo -e "${YELLOW}1. Checking for deprecated methods...${NC}"
    grep -r "@deprecated" src --include="*.ts" | head -5

    echo ""
    echo -e "${YELLOW}2. Checking for TODO items...${NC}"
    grep -rn "TODO\|FIXME" src --include="*.ts" | head -10

    echo ""
    echo -e "${YELLOW}3. Checking for type safety issues...${NC}"
    grep -rn "as any\|@ts-ignore" src --include="*.ts" | wc -l
    echo " type safety violations found"

    echo ""
    echo -e "${YELLOW}4. Checking for missing error handling...${NC}"
    grep -rn "async.*{" src --include="*.ts" | grep -v "try\|catch" | head -5
}

# Function to test critical endpoints
test_endpoints() {
    echo -e "${YELLOW}Testing critical endpoints...${NC}"

    # Login first
    echo "Testing login..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password123"}')

    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.session.access_token')

    if [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}✓ Login successful${NC}"

        echo "Testing chat endpoints..."
        curl -s -X GET http://localhost:4000/api/v1/chat \
            -H "Authorization: Bearer $TOKEN" | jq '.success'

        echo "Testing goals endpoints..."
        curl -s -X GET http://localhost:4000/api/v1/goals \
            -H "Authorization: Bearer $TOKEN" | jq '.success'
    else
        echo -e "${RED}✗ Login failed${NC}"
    fi
}

# Function to check logs
check_logs() {
    echo -e "${YELLOW}Recent error logs:${NC}"
    if [ -f "logs/error.log" ]; then
        tail -20 logs/error.log
    else
        echo "No error log found"
    fi
}

# Function to check ports
check_ports() {
    echo -e "${YELLOW}Checking port status...${NC}"

    if command -v lsof &> /dev/null; then
        echo "Port 4000 (Backend):"
        lsof -i :4000 || echo "Not in use"

        echo ""
        echo "Port 3000 (Frontend):"
        lsof -i :3000 || echo "Not in use"
    else
        echo "lsof not available, using netstat..."
        netstat -an | grep -E ':4000|:3000'
    fi
}

# Function to verify environment
check_env() {
    echo -e "${YELLOW}Checking environment configuration...${NC}"

    if [ -f ".env.development" ]; then
        echo -e "${GREEN}✓ .env.development exists${NC}"

        # Check critical variables
        source .env.development

        [ -n "$OPENAI_API_KEY" ] && echo -e "${GREEN}✓ OPENAI_API_KEY set${NC}" || echo -e "${RED}✗ OPENAI_API_KEY missing${NC}"
        [ -n "$SUPABASE_URL" ] && echo -e "${GREEN}✓ SUPABASE_URL set${NC}" || echo -e "${RED}✗ SUPABASE_URL missing${NC}"
        [ -n "$LANGFUSE_SECRET_KEY" ] && echo -e "${GREEN}✓ LANGFUSE_SECRET_KEY set${NC}" || echo -e "${RED}✗ LANGFUSE_SECRET_KEY missing${NC}"
    else
        echo -e "${RED}✗ .env.development not found${NC}"
    fi
}

# Function to run quick tests
quick_test() {
    echo -e "${YELLOW}Running quick validation tests...${NC}"

    # Test TypeScript compilation
    echo "1. Testing TypeScript compilation..."
    npm run build && echo -e "${GREEN}✓ Build successful${NC}" || echo -e "${RED}✗ Build failed${NC}"

    # Test imports
    echo ""
    echo "2. Checking for circular dependencies..."
    # Add madge or similar tool here

    # Test database connection
    echo ""
    echo "3. Testing database connection..."
    node -e "require('dotenv').config(); const { supabaseAdmin } = require('./dist/config/supabase.config'); supabaseAdmin.from('users').select('id').limit(1).then(() => console.log('✓ Database connected')).catch(e => console.error('✗ Database error:', e.message));"
}

# Main menu
case "$1" in
    health)
        check_health
        ;;
    issues)
        check_issues
        ;;
    test)
        test_endpoints
        ;;
    logs)
        check_logs
        ;;
    ports)
        check_ports
        ;;
    env)
        check_env
        ;;
    quick)
        quick_test
        ;;
    all)
        check_health
        echo ""
        check_issues
        echo ""
        check_env
        echo ""
        check_ports
        ;;
    *)
        echo "Usage: $0 {health|issues|test|logs|ports|env|quick|all}"
        echo ""
        echo "Commands:"
        echo "  health  - Check backend health endpoint"
        echo "  issues  - Scan for code issues"
        echo "  test    - Test critical API endpoints"
        echo "  logs    - Show recent error logs"
        echo "  ports   - Check port usage"
        echo "  env     - Verify environment variables"
        echo "  quick   - Run quick validation tests"
        echo "  all     - Run all checks"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
