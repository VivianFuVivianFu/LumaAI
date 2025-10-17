#!/bin/bash

# Luma API Testing Script
# Run this script to test all major API endpoints

BASE_URL="http://localhost:3001/api/v1"
ACCESS_TOKEN=""
USER_ID=""
CONVERSATION_ID=""
SESSION_ID=""
GOAL_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

echo "================================================"
echo "      LUMA API TESTING - Phase 2.5"
echo "================================================"
echo ""

# Function to test endpoint
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local auth="$5"

  echo -n "Testing: $name... "

  if [ "$auth" = "true" ]; then
    if [ -z "$ACCESS_TOKEN" ]; then
      echo -e "${RED}SKIP${NC} (No auth token)"
      return
    fi
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "$data" \
      "$BASE_URL$endpoint")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "$BODY"
  else
    echo -e "${RED}FAIL${NC} (HTTP $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo "$BODY"
  fi
  echo ""
}

# 1. HEALTH CHECK
echo -e "${BLUE}=== 1. Health Check ===${NC}"
test_endpoint "Health Check" "GET" "/health" "" "false"

# 2. AUTHENTICATION
echo -e "${BLUE}=== 2. Authentication ===${NC}"

# Generate unique email
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"

# Register
echo "Registering user: $TEST_EMAIL"
REGISTER_DATA="{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"TestPassword123!\"}"
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA" \
  "$BASE_URL/auth/register")

echo "$REGISTER_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)

if [ -n "$ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo "Access Token: ${ACCESS_TOKEN:0:20}..."
  echo "User ID: $USER_ID"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ Registration failed${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  exit 1
fi
echo ""

# Get Current User
test_endpoint "Get Current User" "GET" "/auth/me" "" "true"

# 3. DASHBOARD
echo -e "${BLUE}=== 3. Dashboard ===${NC}"
MOOD_DATA='{"mood_value":4,"notes":"Feeling good today!"}'
test_endpoint "Submit Mood Check-in" "POST" "/dashboard/mood-checkin" "$MOOD_DATA" "true"
test_endpoint "Get Dashboard Stats" "GET" "/dashboard/stats" "" "true"
test_endpoint "Get Mood History" "GET" "/dashboard/mood-history?days=30" "" "true"

# 4. CHAT
echo -e "${BLUE}=== 4. Chat ===${NC}"
CONV_DATA='{"title":"My First Chat"}'
CONV_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$CONV_DATA" \
  "$BASE_URL/chat")
echo "$CONV_RESPONSE"

CONVERSATION_ID=$(echo "$CONV_RESPONSE" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
if [ -n "$CONVERSATION_ID" ]; then
  echo -e "${GREEN}✓ Conversation created: $CONVERSATION_ID${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ Conversation creation failed${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

if [ -n "$CONVERSATION_ID" ]; then
  MSG_DATA='{"message":"Hello Luma, how are you today?"}'
  test_endpoint "Send Message" "POST" "/chat/$CONVERSATION_ID/messages" "$MSG_DATA" "true"
  test_endpoint "Get Conversation" "GET" "/chat/$CONVERSATION_ID" "" "true"
fi

test_endpoint "Get All Conversations" "GET" "/chat" "" "true"

# 5. JOURNAL
echo -e "${BLUE}=== 5. Journal ===${NC}"
JOURNAL_DATA='{"mode":"present-virtues","title":"Reflecting on my strengths"}'
JOURNAL_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$JOURNAL_DATA" \
  "$BASE_URL/journal")
echo "$JOURNAL_RESPONSE"

SESSION_ID=$(echo "$JOURNAL_RESPONSE" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
if [ -n "$SESSION_ID" ]; then
  echo -e "${GREEN}✓ Journal session created: $SESSION_ID${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ Journal session creation failed${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

if [ -n "$SESSION_ID" ]; then
  ENTRY_DATA='{"content":"Today I realize I am really good at problem-solving. When challenges come up, I stay calm and think through solutions methodically."}'
  test_endpoint "Create Journal Entry" "POST" "/journal/$SESSION_ID/entries" "$ENTRY_DATA" "true"
  test_endpoint "Get Session" "GET" "/journal/$SESSION_ID" "" "true"
fi

test_endpoint "Get All Sessions" "GET" "/journal" "" "true"

# 6. GOALS
echo -e "${BLUE}=== 6. Goals ===${NC}"
GOAL_DATA='{"title":"Learn Spanish","description":"I want to become conversational in Spanish","category":"personal-growth","timeframe":"6-months"}'
GOAL_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$GOAL_DATA" \
  "$BASE_URL/goals")
echo "$GOAL_RESPONSE"

GOAL_ID=$(echo "$GOAL_RESPONSE" | grep -o '"id":"[^"]*' | grep -o '[^"]*$' | head -1)
if [ -n "$GOAL_ID" ]; then
  echo -e "${GREEN}✓ Goal created: $GOAL_ID${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}✗ Goal creation failed${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

test_endpoint "Get All Goals" "GET" "/goals" "" "true"
if [ -n "$GOAL_ID" ]; then
  test_endpoint "Get Single Goal" "GET" "/goals/$GOAL_ID" "" "true"
fi

# 7. TOOLS
echo -e "${BLUE}=== 7. Tools ===${NC}"
BRAIN_DATA='{"context_description":"I keep thinking I am not good enough","original_thought":"I am a fraud"}'
test_endpoint "Create Brain Exercise" "POST" "/tools/brain" "$BRAIN_DATA" "true"

NARRATIVE_DATA='{"context_description":"I have been feeling stuck since losing my job"}'
test_endpoint "Create Narrative" "POST" "/tools/narrative" "$NARRATIVE_DATA" "true"

FUTURE_DATA='{"goal_or_theme":"I want to feel confident speaking up in meetings"}'
test_endpoint "Create Future Me Exercise" "POST" "/tools/future-me" "$FUTURE_DATA" "true"

test_endpoint "Get Brain Exercises" "GET" "/tools/brain" "" "true"

# 8. MEMORY
echo -e "${BLUE}=== 8. Memory ===${NC}"
test_endpoint "Get Memory Settings" "GET" "/memory/settings" "" "true"
test_endpoint "Get Memory Blocks" "GET" "/memory/blocks" "" "true"

SEARCH_DATA='{"query":"confidence and self-worth","limit":5}'
test_endpoint "Search Memory" "POST" "/memory/search" "$SEARCH_DATA" "true"

test_endpoint "Get Memory Insights" "GET" "/memory/insights" "" "true"

# SUMMARY
echo ""
echo "================================================"
echo "              TEST SUMMARY"
echo "================================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed!${NC}"
  exit 1
fi
