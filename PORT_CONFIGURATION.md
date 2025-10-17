# Port Configuration - PERMANENT SETUP

## Overview
This project uses **fixed ports** to prevent conflicts and ensure consistent API communication between frontend and backend.

---

## Port Assignments

### Backend Server
- **Port**: `4000`
- **URL**: `http://localhost:4000`
- **API Base**: `http://localhost:4000/api/v1`
- **Health Check**: `http://localhost:4000/api/v1/health`

### Frontend Server
- **Port**: `3000`
- **URL**: `http://localhost:3000`
- **Strict Mode**: Enabled (will fail if port is taken instead of auto-switching)

---

## Configuration Files

### 1. Backend: `backend/.env`
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend: `.env` (root directory)
```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Luma
```

### 3. Frontend: `vite.config.ts`
```typescript
server: {
  port: 3000,
  strictPort: true, // CRITICAL: Prevents auto-switching to 3001, 3002, etc.
  open: true,
}
```

### 4. API Client: `src/lib/api.ts`
```typescript
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api/v1';
```

---

## Why These Ports?

- **Port 4000 (Backend)**: Common for Node.js APIs, avoids conflicts with common services
- **Port 3000 (Frontend)**: Standard React/Vite development port
- **Separation**: Different ports allow CORS configuration and clear service boundaries

---

## Troubleshooting Port Conflicts

### If Backend Port 4000 is Already in Use:

**Windows:**
```powershell
# Find process using port 4000
netstat -ano | findstr ":4000"

# Kill the process (replace PID with actual process ID)
powershell.exe -Command "Stop-Process -Id <PID> -Force"
```

**Mac/Linux:**
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### If Frontend Port 3000 is Already in Use:

Because `strictPort: true` is enabled in `vite.config.ts`, the frontend will **fail to start** instead of auto-switching. This is intentional to prevent API connection issues.

**Solution:**
```bash
# Find and kill the process using port 3000
netstat -ano | findstr ":3000"  # Windows
lsof -i :3000                    # Mac/Linux

# Kill it
powershell.exe -Command "Stop-Process -Id <PID> -Force"  # Windows
kill -9 <PID>                                             # Mac/Linux
```

---

## Starting the Servers (Correct Order)

### Option 1: Separate Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Wait for: `🚀 Luma Backend Server Started` on Port 4000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Wait for: `VITE ready` on Port 3000

### Option 2: Single Command (if using concurrently)
```bash
npm run dev:all  # If configured in package.json
```

---

## Testing the Connection

### 1. Backend Health Check
```bash
curl http://localhost:4000/api/v1/health
```
Expected: `{"status":"ok"}`

### 2. Frontend Access
Open browser: `http://localhost:3000`

### 3. Verify API Connection
Open browser console on `http://localhost:3000` and check:
- No CORS errors
- API calls go to `http://localhost:4000/api/v1/*`

---

## API Test Configuration

### Postman Collection: `backend/tests/API_Testing_Collection.postman.json`
```json
"variable": [
  {
    "key": "base_url",
    "value": "http://localhost:4000/api/v1"
  }
]
```

### Test Runner: `backend/tests/test-api.js`
```javascript
const BASE_URL = 'http://localhost:4000/api/v1';
```

---

## Common Mistakes to Avoid

❌ **DON'T** change `PORT` in `backend/.env` to anything other than `4000`
❌ **DON'T** remove `strictPort: true` from `vite.config.ts`
❌ **DON'T** hardcode `localhost:3001` or other ports in frontend code
❌ **DON'T** run multiple instances of the same server

✅ **DO** use environment variables for API URLs
✅ **DO** kill existing processes before starting servers
✅ **DO** verify both servers are running on correct ports before testing
✅ **DO** update Postman/test files if you must change ports

---

## Emergency Port Change Procedure

If you **absolutely must** change ports (not recommended):

### 1. Update Backend Port
- `backend/.env`: Change `PORT=4000` to new port
- `backend/tests/test-api.js`: Update `BASE_URL`
- `backend/tests/API_Testing_Collection.postman.json`: Update `base_url`

### 2. Update Frontend Port
- `vite.config.ts`: Change `port: 3000` to new port
- `backend/.env`: Update `FRONTEND_URL`

### 3. Update Frontend API URL
- `.env`: Change `VITE_API_URL` to match new backend port

### 4. Test Everything
```bash
# Backend
cd backend && npm run dev

# Frontend
npm run dev

# API Tests
cd backend/tests && node test-api.js
```

---

## Current Status (Last Verified)

✅ **Backend**: Running on Port 4000
✅ **Frontend**: Running on Port 3000
✅ **API Connection**: Working (`VITE_API_URL` correctly configured)
✅ **Tests**: All endpoints accessible
✅ **No Port Conflicts**: `strictPort: true` prevents auto-switching

**Last Updated**: 2025-10-12
**Verified By**: Claude Code AI Assistant

---

## Quick Reference Card

```
╔════════════════════════════════════════╗
║     PORT CONFIGURATION QUICK REF      ║
╠════════════════════════════════════════╣
║  Backend:   http://localhost:4000     ║
║  Frontend:  http://localhost:3000     ║
║  API Base:  /api/v1                   ║
╠════════════════════════════════════════╣
║  Config Files to Check:               ║
║  • backend/.env (PORT=4000)           ║
║  • .env (VITE_API_URL)                ║
║  • vite.config.ts (port: 3000)        ║
╚════════════════════════════════════════╝
```

Keep this file in the root directory and refer to it whenever you encounter port-related issues!
