#!/bin/bash

# Test Brain Exercise and Goal APIs

echo "Testing Brain Exercise API..."
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwODNiOTM4Yi1iYmQ3LTQzZDMtYjAyZS0zYWNhNTYxMDk5ZjkiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3MzQwNDk0ODgsImV4cCI6MTczNDA1MzA4OH0.Y-example-token"

# Test 1: Create Brain Exercise
echo ""
echo "1. Testing Create Brain Exercise..."
curl -X POST http://localhost:4000/api/v1/tools/brain \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"context_description":"I keep thinking I am not good enough","original_thought":"I am a fraud"}' \
  -w "\nHTTP Status: %{http_code}\n" -s | head -30

echo ""
echo "2. Testing Create Goal..."
curl -X POST http://localhost:4000/api/v1/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Spanish","description":"I want to become conversational","category":"personal-growth","timeframe":"6-months"}' \
  -w "\nHTTP Status: %{http_code}\n" -s | head -30
