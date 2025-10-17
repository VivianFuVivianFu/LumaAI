# Frontend Quick Start Guide 🚀

Quick reference for running the Luma frontend with all new features enabled.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Set up environment
cp .env.development .env

# 3. Start development server
npm run dev

# App will open at http://localhost:3000
```

---

## 🎯 New Features Overview

### ✅ Error Handling
- **Error Boundary** wraps entire app
- Catches and displays errors gracefully
- Shows stack trace in dev mode
- Ready for Sentry integration

### ✅ Offline Support
- **Offline Indicator** banner shows connection status
- Red banner when offline
- Green toast when reconnected
- Works automatically

### ✅ Loading States
- **LoadingSpinner** component available
- **useApiCall** hook for API calls
- Skeleton loaders for content
- Better UX during data fetching

### ✅ PWA (Progressive Web App)
- **Service Worker** caches assets
- Works offline after first visit
- Can be installed as app
- Automatic updates

### ✅ SEO Optimized
- Complete meta tags
- Open Graph for sharing
- Twitter Cards
- Security headers

### ✅ Advanced Caching
- API response caching (5 min)
- User data caching (1 hour)
- Request deduplication
- Faster page loads

### ✅ Error Tracking (Sentry)
- Ready for production monitoring
- Just needs npm install + setup
- Automatic error capture
- User context tracking

---

## 📁 Important Files

### Environment
- `.env.development` - Dev configuration ✅
- `.env.production` - Prod configuration ✅

### Components
- `src/components/ErrorBoundary.tsx` - Error handling
- `src/components/OfflineIndicator.tsx` - Connection status
- `src/components/LoadingSpinner.tsx` - Loading states

### Hooks
- `src/hooks/useOnlineStatus.ts` - Online/offline detection
- `src/hooks/useApiCall.ts` - API call management

### Libraries
- `src/lib/cache.ts` - Caching utilities
- `src/lib/sentry.ts` - Error tracking
- `src/lib/serviceWorkerRegistration.ts` - PWA support

### PWA
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service worker
- `public/offline.html` - Offline page

---

## 🧪 Testing New Features

### Test Error Boundary
```tsx
// Add to any component to test error boundary
<button onClick={() => { throw new Error('Test error!'); }}>
  Trigger Error
</button>
```

### Test Offline Mode
1. Open Chrome DevTools
2. Go to Network tab
3. Change "Online" to "Offline"
4. See red banner appear
5. Navigate app (still works!)

### Test Loading States
```tsx
import { useApiCall } from '../hooks/useApiCall';
import { LoadingSpinner } from '../components/LoadingSpinner';

function MyComponent() {
  const { data, loading, error } = useApiCall(fetchData);

  if (loading) return <LoadingSpinner text="Loading..." />;
  if (error) return <div>Error: {error}</div>;
  return <div>{data}</div>;
}
```

### Test PWA Installation
1. Build: `npm run build`
2. Serve: `npx serve -s build`
3. Open Chrome
4. Click install icon in address bar
5. App opens as standalone window

### Test Caching
```tsx
import { apiCache } from '../lib/cache';

// Cache API response
apiCache.set('user-profile', userData, 60000); // 1 minute

// Retrieve from cache
const cached = apiCache.get('user-profile');
```

---

## 🔧 Configuration

### Enable/Disable Features

Edit `.env`:
```bash
# Enable service worker (offline mode + PWA)
VITE_ENABLE_SERVICE_WORKER=true

# Enable error tracking (requires Sentry setup)
VITE_ENABLE_ERROR_TRACKING=false

# Enable debug logging
VITE_ENABLE_DEBUG_LOGGING=true
```

---

## 🚀 Production Build

```bash
# 1. Copy production env
cp .env.production .env

# 2. Update API URL in .env
VITE_API_URL=https://your-production-api.com/api/v1

# 3. Build
npm run build

# 4. Test production build locally
npx serve -s build

# 5. Deploy build/ folder to hosting
```

---

## 📊 Check Cache Stats

```typescript
import { getCacheStats, clearAllCaches } from './lib/cache';

// View cache statistics
console.log(getCacheStats());

// Clear all caches
clearAllCaches();
```

---

## 🐛 Common Issues

### Issue: Service Worker not working
**Solution:** Set `VITE_ENABLE_SERVICE_WORKER=true` and use HTTPS

### Issue: Offline mode not working
**Solution:** Visit app once online first, then go offline

### Issue: PWA won't install
**Solution:** Must use HTTPS (use ngrok or deploy)

### Issue: Loading spinners not showing
**Solution:** Use `useApiCall` hook or `LoadingSpinner` component

---

## 📚 Usage Examples

### API Call with Loading
```tsx
import { useApiCall } from '../hooks/useApiCall';

const { data, loading, execute } = useApiCall(async (userId) => {
  const res = await fetch(`/api/users/${userId}`);
  return res.json();
});

useEffect(() => {
  execute(userId);
}, [userId]);
```

### Check Online Status
```tsx
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const isOnline = useOnlineStatus();
if (!isOnline) {
  return <div>You're offline!</div>;
}
```

### Cache API Response
```tsx
import { apiCache } from '../lib/cache';

const data = await apiCache.getOrSet(
  'user-data',
  async () => {
    const res = await fetch('/api/user');
    return res.json();
  },
  300000 // 5 minutes
);
```

### Wrap Component with Error Boundary
```tsx
import { withErrorBoundary } from '../components/ErrorBoundary';

const SafeComponent = withErrorBoundary(RiskyComponent);
```

---

## ✅ Pre-Deployment Checklist

- [ ] Update `VITE_API_URL` in `.env.production`
- [ ] Test offline mode
- [ ] Test PWA installation
- [ ] Run `npm run build` successfully
- [ ] Test production build locally
- [ ] Verify all features work
- [ ] Deploy to hosting platform

---

## 🎉 All Features Implemented!

Your Luma frontend now has:
- ✅ Error handling (Error Boundary)
- ✅ Offline support (Service Worker)
- ✅ Loading states (Spinners & Skeletons)
- ✅ PWA capabilities (Installable app)
- ✅ SEO optimization (Meta tags)
- ✅ Advanced caching (Fast performance)
- ✅ Error tracking ready (Sentry)

**Ready for production! 🚀**

For detailed documentation, see: `FRONTEND_CRITICAL_FIXES_COMPLETE.md`
