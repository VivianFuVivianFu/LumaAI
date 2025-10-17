#!/bin/bash

# Security Vulnerability Scan Script
# Run this locally before committing code

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              LUMA SECURITY VULNERABILITY SCAN              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "\n🔍 ${YELLOW}Running: ${name}${NC}"
    echo "────────────────────────────────────────────────────────────"

    if eval "$command"; then
        echo -e "${GREEN}✅ PASS${NC}: $name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $name"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Check 1: NPM Audit
run_check "Backend NPM Audit (High/Critical)" "npm audit --audit-level=high"

# Check 2: Outdated Packages
echo -e "\n📦 Checking for outdated packages..."
echo "────────────────────────────────────────────────────────────"
npm outdated || true

# Check 3: Check for sensitive files
echo -e "\n🔐 Checking for sensitive files..."
echo "────────────────────────────────────────────────────────────"
if [ -f ".env" ] && ! grep -q "^\.env$" .gitignore; then
    echo -e "${RED}❌ WARNING: .env file exists but not in .gitignore!${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo -e "${GREEN}✅ .env properly gitignored${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check 4: Check for hardcoded secrets
echo -e "\n🔑 Checking for potential hardcoded secrets..."
echo "────────────────────────────────────────────────────────────"
SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]*['\"]"
    "api[_-]?key\s*=\s*['\"][^'\"]*['\"]"
    "secret\s*=\s*['\"][^'\"]*['\"]"
    "token\s*=\s*['\"][^'\"]*['\"]"
)

SECRET_FOUND=false
for pattern in "${SECRET_PATTERNS[@]}"; do
    if grep -r -n -i -E "$pattern" src/ --exclude-dir=node_modules 2>/dev/null; then
        SECRET_FOUND=true
    fi
done

if [ "$SECRET_FOUND" = true ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential hardcoded secrets found. Review above results.${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo -e "${GREEN}✅ No obvious hardcoded secrets found${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check 5: TypeScript type safety
echo -e "\n🔧 Checking TypeScript compilation..."
echo "────────────────────────────────────────────────────────────"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript compiles without errors${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ TypeScript compilation errors found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     SECURITY SCAN SUMMARY                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Checks:  $TOTAL_CHECKS"
echo -e "${GREEN}Passed:        $PASSED_CHECKS${NC}"
echo -e "${RED}Failed:        $FAILED_CHECKS${NC}"
echo "Success Rate:  $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 All security checks passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some security checks failed. Please review and fix before committing.${NC}"
    exit 1
fi
