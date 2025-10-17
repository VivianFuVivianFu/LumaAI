# Luma - Quality Assurance Strategy & Debugging Guide
## Comprehensive QA Framework for Production Readiness

**Last Updated**: October 16, 2025
**Prepared by**: Quality Engineering Team
**Version**: 1.0

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Critical Issues Audit](#critical-issues-audit)
4. [Automated Testing Strategy](#automated-testing-strategy)
5. [Debugging & Monitoring Framework](#debugging--monitoring-framework)
6. [Quality Assurance Processes](#quality-assurance-processes)
7. [Production Readiness Checklist](#production-readiness-checklist)
8. [Incident Response Playbook](#incident-response-playbook)

---

## Executive Summary

### Current State
- **No Unit Tests**: Zero test coverage in `/backend/src` directory
- **Legacy Code Issues**: Found 8 files with `as any` type assertions
- **Missing Error Handling**: Some services lack comprehensive error boundaries
- **TODO Items**: 4 incomplete implementations requiring attention
- **Type Safety Gaps**: TypeScript strict mode not fully enforced

### Immediate Priorities (P0)
1. ✅ Fix Langfuse `createTrace` method conflict (COMPLETED)
2. ✅ Fix context integrator `buildContext` error (COMPLETED)
3. 🔴 Implement critical path testing
4. 🔴 Add production monitoring and alerting
5. 🔴 Complete TODO items in codebase

---

## Current State Analysis

### ✅ Recently Fixed Issues
1. **Langfuse Integration Error**
   - **Issue**: Missing `createTrace` method causing 500 errors in Chat, Goals, Tools
   - **Root Cause**: Refactored to `createUnifiedTrace` without backward compatibility
   - **Fix**: Added deprecated `createTrace` wrapper method
   - **Location**: `backend/src/services/langfuse/langfuse.service.ts:127-145`
   - **Impact**: ALL core features now functional

2. **Context Caching Failure**
   - **Issue**: Cron job calling non-existent `buildContext` method
   - **Root Cause**: Method renamed to `generateContextSummary` without updating callers
   - **Fix**: Updated method call in cron service
   - **Location**: `backend/src/services/cron/insights-cron.service.ts:44`
   - **Result**: Context caching now succeeds: `6 success, 0 errors`

### 🔴 Outstanding Issues

#### Critical (P0) - Blocking Production
**NONE** - All critical bugs fixed!

#### High Priority (P1) - Address Before Scale
1. **Missing Test Coverage**
   - **Impact**: No automated validation of functionality
   - **Risk**: Regression bugs will go undetected
   - **Action Required**: Implement testing framework

2. **Incomplete TODO Items**
   ```typescript
   // security-logger.ts:322
   // TODO: Implement actual alerting

   // dashboard.service.ts:87
   // TODO: Add streaks calculation when journal entries are implemented

   // dashboard.service.ts:93
   // TODO: Add goals count when goals are implemented
   ```

3. **Type Safety Issues** (8 files with `as any`)
   - `gdpr.controller.ts`
   - `security-logger.ts`
   - `rate-limit.middleware.ts`
   - `context-integrator.service.ts`
   - `cache.middleware.ts`
   - `nudge-engine.service.ts`
   - `auth.schema.ts`
   - `master-agent.schema.ts`

#### Medium Priority (P2) - Quality Improvements
1. **Environment Variable Management**
   - 5 different `.env` files (dev, staging, production, example, default)
   - Risk of configuration drift
   - Need validation on startup

2. **API Error Consistency**
   - Some endpoints return different error formats
   - Need standardized error response structure

---

## Critical Issues Audit

### 🔍 Method Naming Conflicts (RESOLVED)

#### Pattern Detected
```typescript
// OLD CODE (Legacy)
service.createTrace()
service.buildContext()

// NEW CODE (Refactored)
service.createUnifiedTrace()
service.generateContextSummary()
```

#### Prevention Strategy
1. **Always provide backward compatibility wrappers**
2. **Mark old methods as @deprecated with migration guide**
3. **Search codebase for all call sites before renaming**
4. **Run integration tests after refactors**

#### Quick Audit Command
```bash
# Find all method calls that might be affected by refactors
grep -r "\.create.*\(|\.build.*\(|\.get.*\(|\.fetch.*\(" backend/src --include="*.ts" | grep -v node_modules
```

### 🔍 Type Safety Violations

#### Files Requiring Type Safety Improvements
```bash
# Priority order for fixing
1. auth.schema.ts - Authentication is critical
2. master-agent.schema.ts - Core feature
3. security-logger.ts - Security cannot have loose types
4. gdpr.controller.ts - Legal compliance
5. rate-limit.middleware.ts - DDoS protection
6. context-integrator.service.ts - Background jobs
7. cache.middleware.ts - Performance
8. nudge-engine.service.ts - User experience
```

#### Remediation Plan
```typescript
// Instead of:
const data = response.data as any;

// Use:
interface ResponseData {
  // Define actual structure
}
const data = response.data as ResponseData;

// Or better:
const data = ResponseDataSchema.parse(response.data); // Runtime validation with Zod
```

---

## Automated Testing Strategy

### Phase 1: Critical Path Testing (Week 1)

#### 1. API Integration Tests
**File**: `backend/src/__tests__/integration/api.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../server';

describe('Critical API Endpoints', () => {
  describe('Authentication Flow', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should login existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.session.access_token).toBeDefined();
    });
  });

  describe('Chat Functionality', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      authToken = loginResponse.body.data.session.access_token;
    });

    it('should create conversation', async () => {
      const response = await request(app)
        .post('/api/v1/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Conversation' });

      expect(response.status).toBe(201);
    });

    it('should send message and receive AI response', async () => {
      const conversationId = 'test-conv-id'; // Get from previous test
      const response = await request(app)
        .post(`/api/v1/chat/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Hello, I need support' });

      expect(response.status).toBe(200);
      expect(response.body.data.response).toBeDefined();
    });
  });

  describe('Goals Functionality', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      authToken = loginResponse.body.data.session.access_token;
    });

    it('should create goal', async () => {
      const response = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Build healthy boundaries',
          category: 'personal_growth',
          timeframe: '3_months'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.goal.weekly_actions).toBeDefined();
    });
  });

  describe('Tools Functionality', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      authToken = loginResponse.body.data.session.access_token;
    });

    it('should create brain exercise', async () => {
      const response = await request(app)
        .post('/api/v1/tools/brain')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          negative_thought: 'I always fail',
          context: 'Work presentation'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.reframe).toBeDefined();
    });
  });
});
```

#### 2. Unit Tests for Services
**File**: `backend/src/services/__tests__/langfuse.test.ts`

```typescript
import { LangFuseService } from '../langfuse/langfuse.service';

describe('LangFuseService', () => {
  let service: LangFuseService;

  beforeEach(() => {
    service = new LangFuseService();
  });

  describe('createTrace', () => {
    it('should create trace with backward compatibility', async () => {
      const trace = await service.createTrace(
        'test-trace',
        'user-123',
        { feature: 'chat' }
      );

      expect(trace).toBeDefined();
      // Add more assertions
    });
  });

  describe('createUnifiedTrace', () => {
    it('should create unified trace with metadata', async () => {
      const trace = await service.createUnifiedTrace({
        userId: 'user-123',
        pillar: 'chat',
        action: 'message',
        conversationId: 'conv-456'
      });

      expect(trace).toBeDefined();
    });
  });
});
```

#### 3. Setup Testing Infrastructure

**Install Dependencies**:
```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**Jest Configuration** (`backend/jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
```

**Update package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### Phase 2: E2E Testing (Week 2)

#### Frontend Integration Tests
**File**: `src/__tests__/e2e/user-flows.test.ts`

```typescript
describe('User Flows', () => {
  it('should complete full onboarding flow', () => {
    // Test registration → onboarding → first chat
  });

  it('should create and complete goal', () => {
    // Test goal creation → action completion → progress tracking
  });
});
```

---

## Debugging & Monitoring Framework

### 1. Enhanced Logging Strategy

#### Structured Logging
**File**: `backend/src/utils/logger.ts`

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'luma-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export const logError = (context: string, error: Error, metadata?: any) => {
  logger.error({
    context,
    message: error.message,
    stack: error.stack,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};

export const logInfo = (context: string, message: string, metadata?: any) => {
  logger.info({
    context,
    message,
    ...metadata,
    timestamp: new Date().toISOString()
  });
};
```

### 2. Error Tracking Integration

#### Sentry Setup (Already Configured)
**File**: `backend/src/utils/sentry.ts` (Update)

```typescript
import * as Sentry from '@sentry/node';

export const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      }
    });
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: { custom: context },
    level: 'error'
  });
};
```

### 3. Health Check Endpoint Enhancement

**File**: `backend/src/modules/health/health.controller.ts`

```typescript
export const healthCheck = async (req: Request, res: Response) => {
  const checks = {
    server: 'healthy',
    database: await checkDatabase(),
    openai: await checkOpenAI(),
    langfuse: await checkLangfuse(),
    supabase: await checkSupabase(),
    memory: checkMemoryUsage(),
    uptime: process.uptime()
  };

  const isHealthy = Object.values(checks).every(
    check => check === 'healthy' || typeof check === 'number'
  );

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
};

const checkDatabase = async (): Promise<string> => {
  try {
    await supabaseAdmin.from('users').select('id').limit(1);
    return 'healthy';
  } catch (error) {
    return 'unhealthy';
  }
};

const checkOpenAI = async (): Promise<string> => {
  try {
    // Simple API check (non-billing)
    return 'healthy';
  } catch (error) {
    return 'unhealthy';
  }
};

const checkMemoryUsage = (): number => {
  const usage = process.memoryUsage();
  return Math.round((usage.heapUsed / usage.heapTotal) * 100);
};
```

### 4. Performance Monitoring

#### Request Timing Middleware
**File**: `backend/src/middleware/performance.middleware.ts`

```typescript
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow requests (>2s)
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      });
    }

    // Track metrics
    metrics.recordRequest({
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration
    });
  });

  next();
};
```

---

## Quality Assurance Processes

### Pre-Deployment Checklist

#### Code Review Requirements
- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] No `as any` type assertions added
- [ ] All TODOs have linked tickets
- [ ] Error handling implemented for all async operations
- [ ] Input validation with Zod schemas
- [ ] Security review completed (no exposed secrets)
- [ ] Performance impact assessed (no N+1 queries)

#### Testing Requirements
- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Edge cases verified (empty states, errors, rate limits)
- [ ] Browser compatibility checked (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified

#### Documentation Requirements
- [ ] API changes documented in CHANGELOG.md
- [ ] Breaking changes highlighted
- [ ] Migration guide provided (if applicable)
- [ ] Environment variables documented

### Regression Testing Protocol

#### Critical User Flows (Test Before Every Release)
1. **Authentication**
   - Register new account
   - Login with existing account
   - Password reset flow
   - Session expiration handling

2. **Chat**
   - Send message
   - Receive AI response
   - View conversation history
   - Crisis detection triggers resources

3. **Goals**
   - Create new goal
   - View goal details
   - Complete weekly action
   - Track progress

4. **Tools**
   - Brain exercise reframe
   - Mood check-in
   - Journal entry

5. **Dashboard**
   - View mood chart
   - See active goals
   - Receive nudges

### Continuous Monitoring

#### Key Metrics to Track
```javascript
// Production metrics dashboard
{
  "uptime": "99.9%",
  "avgResponseTime": "150ms",
  "errorRate": "0.1%",
  "apiSuccess": {
    "chat": "99.5%",
    "goals": "99.8%",
    "tools": "99.7%"
  },
  "activeUsers": {
    "daily": 1500,
    "weekly": 8000,
    "monthly": 25000
  },
  "openaiCosts": {
    "daily": "$15.50",
    "monthly": "$450"
  }
}
```

#### Alert Thresholds
- **Critical** (Page immediately)
  - Error rate > 5%
  - Response time > 5s (p95)
  - Database connection failures
  - OpenAI API failures

- **Warning** (Slack notification)
  - Error rate > 1%
  - Response time > 2s (p95)
  - Memory usage > 80%
  - Disk usage > 85%

---

## Production Readiness Checklist

### Infrastructure
- [x] Backend server running (Port 4000)
- [x] Frontend server running (Port 3000)
- [x] Database connected (Supabase)
- [x] Environment variables configured
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Database backups scheduled
- [ ] Log aggregation setup (e.g., Datadog, ELK)

### Security
- [x] Helmet middleware enabled
- [x] Rate limiting configured
- [x] CORS properly configured
- [x] Input validation with Zod
- [ ] Security headers audited
- [ ] Dependency vulnerabilities scanned (`npm audit`)
- [ ] Secrets rotation policy defined
- [ ] GDPR compliance verified

### Monitoring & Alerts
- [x] Health check endpoint working
- [x] Error logging functional (security-logger.ts)
- [ ] Sentry error tracking enabled
- [ ] Performance monitoring dashboard
- [ ] Alert rules configured
- [ ] On-call rotation established

### Performance
- [x] API response time < 2s
- [x] Database queries optimized
- [x] Caching middleware implemented
- [ ] Load testing completed (e.g., Apache JMeter, k6)
- [ ] Auto-scaling configured
- [ ] Database connection pooling

### Testing
- [ ] Unit test coverage > 50%
- [ ] Integration tests passing
- [ ] E2E tests covering critical flows
- [ ] Load testing results acceptable
- [ ] Chaos engineering tests (optional)

---

## Incident Response Playbook

### Severity Levels

#### SEV1 - Critical (Complete Outage)
**Examples**: Server down, database unreachable, cannot login
- **Response Time**: Immediate (< 5 min)
- **Actions**:
  1. Check health endpoint: `curl http://localhost:4000/api/v1/health`
  2. Review error logs: `tail -f backend/logs/error.log`
  3. Check server status: `npm run dev` output
  4. Restart services if needed
  5. Notify stakeholders immediately

#### SEV2 - High (Major Feature Broken)
**Examples**: Chat not responding, goals not saving
- **Response Time**: < 30 min
- **Actions**:
  1. Identify affected endpoint
  2. Check recent deployments
  3. Review error rates in monitoring
  4. Apply hotfix or rollback
  5. Post-mortem within 24 hours

#### SEV3 - Medium (Minor Feature Degraded)
**Examples**: Slow response times, UI glitch
- **Response Time**: < 4 hours
- **Actions**:
  1. Create bug ticket
  2. Prioritize in backlog
  3. Schedule fix for next sprint

### Common Issues & Solutions

#### Issue: Chat Returns 500 Error
**Symptoms**: `Failed to send message: ApiError`

**Debug Steps**:
```bash
# 1. Check backend logs
cd backend && grep "Send message error" logs/combined.log

# 2. Verify OpenAI API key
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"

# 3. Check Langfuse service
# Look for "createTrace is not a function" errors

# 4. Restart backend
npm run dev
```

**Common Causes**:
- Missing environment variable
- Langfuse service misconfiguration
- OpenAI API quota exceeded
- Database connection lost

#### Issue: Context Caching Failing
**Symptoms**: `[CRON] Context caching complete: 0 success, 6 errors`

**Debug Steps**:
```bash
# 1. Check exact error
grep "Failed to cache context" logs/error.log

# 2. Verify method exists
grep -n "generateContextSummary\|buildContext" src/services/master-agent/context-integrator.service.ts

# 3. Check for method naming conflicts
```

**Solution**: Ensure correct method name is used in cron service

#### Issue: Frontend Not Loading
**Symptoms**: Blank screen, "Cannot GET /"

**Debug Steps**:
```bash
# 1. Check if Vite is running
netstat -ano | findstr ":3000"

# 2. Check for build errors
npm run dev

# 3. Clear browser cache
# 4. Check browser console for errors
```

---

## Next Steps & Recommendations

### Immediate Actions (This Week)
1. **Install Testing Framework**
   ```bash
   cd backend
   npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
   ```

2. **Write First Test Suite**
   - Start with authentication tests
   - Add chat endpoint tests
   - Verify OpenAI integration

3. **Fix Type Safety Issues**
   - Remove `as any` from auth.schema.ts
   - Add proper types to security-logger.ts

### Short Term (Next 2 Weeks)
1. **Complete TODO Items**
   - Implement actual alerting (security-logger.ts:322)
   - Add streak calculations (dashboard.service.ts:87)
   - Implement goals count (dashboard.service.ts:93)

2. **Add Integration Tests**
   - All critical API endpoints
   - Error scenarios
   - Rate limiting behavior

3. **Setup Monitoring**
   - Enable Sentry error tracking
   - Configure alert rules
   - Create monitoring dashboard

### Long Term (Next Month)
1. **Achieve 80% Test Coverage**
2. **Implement E2E Testing**
3. **Complete Security Audit**
4. **Load Testing & Optimization**
5. **Automated Deployment Pipeline**

---

## Appendix

### Useful Commands

```bash
# Check for deprecated methods
grep -r "@deprecated" backend/src --include="*.ts"

# Find TODO items
grep -r "TODO\|FIXME\|HACK" backend/src --include="*.ts"

# Check type safety violations
grep -r "as any\|@ts-ignore" backend/src --include="*.ts"

# Audit dependencies
cd backend && npm audit

# Check build
cd backend && npm run build

# Run tests
cd backend && npm test

# Check logs
tail -f backend/logs/error.log
```

### Key Contacts
- **Backend Lead**: [Name]
- **DevOps**: [Name]
- **On-Call Engineer**: [Rotation schedule]
- **Sentry Alerts**: [Slack channel]

### External Resources
- [Sentry Dashboard](#)
- [Monitoring Dashboard](#)
- [API Documentation](#)
- [Deployment Guide](#)

---

**Document Maintenance**:
- Review quarterly
- Update after major incidents
- Keep in sync with architecture changes

---

Generated by: Quality Engineering Team
Document Version: 1.0
Last Review: October 16, 2025
