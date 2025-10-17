# Phase 2.5 - Stabilization Complete Checklist

## 📋 Overview

This checklist ensures you've properly tested and validated Phase 2 before proceeding to Phase 3.

---

## ✅ Checklist

### 1. Database Setup

- [ ] Ran `database-migration-master.sql` successfully
- [ ] Ran `database-rls-policies.sql` successfully
- [ ] Ran `database-indexes-functions.sql` successfully
- [ ] Verified all 22 tables exist
- [ ] Confirmed pgvector extension is enabled
- [ ] Tested vector similarity search function
- [ ] Verified RLS is enabled on all tables
- [ ] Checked all indexes were created

**Verification Query:**
```sql
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
-- Should return: 22
```

---

### 2. Backend Server

- [ ] Created `.env` file with all credentials
- [ ] Installed npm dependencies (`npm install`)
- [ ] Backend starts without errors (`npm run dev`)
- [ ] Health check endpoint returns success
- [ ] No console errors on startup
- [ ] Supabase connection verified
- [ ] OpenAI API key validated
- [ ] LangFuse connection established

**Test Command:**
```bash
curl http://localhost:3001/api/health
```

---

### 3. Authentication Tests

- [ ] **Test 1:** User registration works
- [ ] **Test 2:** User login works
- [ ] **Test 3:** Get current user works
- [ ] JWT token received and valid
- [ ] User profile created automatically
- [ ] Email/password validation working

**Critical:** Save the JWT token for all subsequent tests!

---

### 4. Dashboard Tests

- [ ] **Test 4:** Submit mood check-in works
- [ ] **Test 5:** Get dashboard stats works
- [ ] Mood data stored correctly
- [ ] Stats calculated accurately
- [ ] RLS policies prevent unauthorized access

---

### 5. Chat Feature Tests

- [ ] **Test 6:** Create conversation works
- [ ] **Test 7:** Send message works
- [ ] **Test 8:** Get conversation works
- [ ] AI responses are coherent
- [ ] Luma personality is evident
- [ ] Conversation history maintained
- [ ] Crisis detection working (if applicable)
- [ ] LangFuse trace created for AI call

---

### 6. Journal Feature Tests

- [ ] **Test 9:** Create journal session works
- [ ] **Test 10:** Create journal entry works
- [ ] AI insight generated successfully
- [ ] Metadata extracted (scores, themes, tone)
- [ ] All 5 modes work (past, present-faults, present-virtues, future, free-write)
- [ ] Privacy flags respected
- [ ] LangFuse trace created

---

### 7. Goals Feature Tests

- [ ] **Test 11:** Create goal works
- [ ] Clarifying questions generated (3-5)
- [ ] Questions are relevant and personalized
- [ ] **Test 12:** Submit clarifications works
- [ ] Action plan generated
- [ ] SMART statement is clear
- [ ] Correct number of sprints (6/9/12 for 3/6/12 months)
- [ ] Weekly actions are specific
- [ ] Progress calculation works
- [ ] LangFuse traces created (2: questions + plan)

---

### 8. Tools Feature Tests

#### Empower My Brain
- [ ] **Test 13:** Create brain exercise works
- [ ] Reframe is ≤20 words
- [ ] Reframe is compassionate and realistic
- [ ] Micro-action is specific (1-2 min)
- [ ] Explanation provided
- [ ] Alternative reframes offered

#### My New Narrative
- [ ] **Test 14:** Create narrative works
- [ ] 3 chapters generated (past, present, future)
- [ ] Each chapter is 3-5 sentences
- [ ] Future choice is ≤12 words
- [ ] Tone is empowering
- [ ] Themes detected from context

#### Future Me
- [ ] **Test 15:** Create Future Me exercise works
- [ ] Visualization script ≤160 words
- [ ] 3 affirmations (≤12 words each)
- [ ] If-Then anchor is specific
- [ ] Replay suggestion provided

- [ ] LangFuse traces created for all 3 tools

---

### 9. Memory Integration Tests

#### Ingestion
- [ ] Chat messages ingested automatically
- [ ] Journal entries ingested (respecting privacy)
- [ ] Journal insights ingested
- [ ] Goals ingested
- [ ] Action plans ingested
- [ ] Tool exercises ingested (all 3 types)
- [ ] Memory blocks visible in `/api/memory/blocks`
- [ ] At least 10+ blocks created from tests

#### Search & Retrieval
- [ ] Semantic search works (`/api/memory/search`)
- [ ] Relevant blocks returned for queries
- [ ] Similarity scores make sense (>0.7 for good matches)
- [ ] Cross-feature retrieval works
- [ ] Privacy settings respected

#### Settings & Control
- [ ] Memory settings retrieved (`/api/memory/settings`)
- [ ] Settings can be updated
- [ ] Memory toggle works (enable/disable)
- [ ] Per-feature toggles work
- [ ] Block exclusion works
- [ ] Block deletion works

#### Explainability
- [ ] Explain endpoint works (`/api/memory/blocks/:id/explain`)
- [ ] "Why remembered" explanation clear
- [ ] "Why retrieved" explanation provided
- [ ] Retrieval history shown

---

### 10. LangFuse Verification

- [ ] Traces appear in LangFuse dashboard
- [ ] Traces include user ID
- [ ] Input/output captured correctly
- [ ] Token usage recorded (input, output, total)
- [ ] Costs calculated (if enabled)
- [ ] Traces for all features visible:
  - [ ] Chat traces
  - [ ] Journal traces
  - [ ] Goals traces (clarification + planning)
  - [ ] Tools traces (3 tools)
  - [ ] Memory enrichment traces

**Check:** https://cloud.langfuse.com → Your Project → Traces

---

### 11. Error Handling

- [ ] Invalid JWT returns 401 Unauthorized
- [ ] Missing required fields returns 400 Bad Request
- [ ] Non-existent resources return 404 Not Found
- [ ] OpenAI API errors handled gracefully
- [ ] Database errors don't crash server
- [ ] Error messages are clear and helpful

---

### 12. Performance

- [ ] API responses < 2 seconds (excluding AI calls)
- [ ] AI responses < 30 seconds
- [ ] Vector search < 1 second
- [ ] No N+1 query issues
- [ ] Memory ingestion doesn't block main response

---

### 13. Data Quality

- [ ] Created test data for all features
- [ ] At least 3 test users
- [ ] 10+ chat messages
- [ ] 5+ journal entries
- [ ] 3+ goals with action plans
- [ ] 5+ tool exercises
- [ ] 20+ memory blocks
- [ ] Test data covers edge cases

---

### 14. Documentation

- [ ] Read [PHASE2_IMPLEMENTATION_COMPLETE.md](PHASE2_IMPLEMENTATION_COMPLETE.md)
- [ ] Read [PHASE2.5_TESTING_GUIDE.md](PHASE2.5_TESTING_GUIDE.md)
- [ ] Read [DATABASE_MIGRATION_QUICKSTART.md](DATABASE_MIGRATION_QUICKSTART.md)
- [ ] Understand all API endpoints
- [ ] Know where to find logs (Supabase, LangFuse, console)

---

## 🐛 Known Issues Log

**Track any bugs found during testing:**

| Issue | Severity | Description | Status | Fix |
|-------|----------|-------------|--------|-----|
| Example | High | Memory blocks not created | Fixed | Added await to ingestBlock call |
|       |      |             |        |     |
|       |      |             |        |     |

---

## 📊 Test Results Summary

**Fill this out after completing all tests:**

### Success Rate
- **Total Tests:** 15 core API tests
- **Passed:** __ / 15
- **Failed:** __ / 15
- **Pass Rate:** __%

### Feature Status
- **Chat:** ✅ / ❌
- **Journal:** ✅ / ❌
- **Goals:** ✅ / ❌
- **Tools:** ✅ / ❌
- **Memory:** ✅ / ❌

### Critical Issues
List any blockers that prevent moving to Phase 3:
1.
2.
3.

### Performance Metrics
- **Average API Response Time:** __ ms
- **Average AI Response Time:** __ s
- **Vector Search Time:** __ ms
- **Memory Ingestion Time:** __ ms

---

## ✅ Phase 2.5 Complete Criteria

**Phase 2.5 is COMPLETE when:**

- [ ] All 22 tables created and verified
- [ ] All RLS policies enabled
- [ ] Backend server starts without errors
- [ ] **At least 12/15 core API tests pass** (80% pass rate)
- [ ] Memory ingestion works for all features
- [ ] Semantic search returns relevant results
- [ ] LangFuse traces appear correctly
- [ ] No critical bugs blocking usage
- [ ] Test data created and diverse
- [ ] Known issues documented
- [ ] Performance acceptable (<2s API, <30s AI)

**If all criteria met → Proceed to Phase 3 (Enhanced Observability)**

**If criteria not met → Fix issues before proceeding**

---

## 🚀 Next Steps After Phase 2.5

Once Phase 2.5 is complete, you're ready for:

**Phase 3: Enhanced Observability & Evaluation**
- User feedback collection (thumbs up/down)
- Response quality scoring
- Prompt versioning
- A/B testing
- Analytics dashboard

**DO NOT proceed until Phase 2.5 checklist is 100% complete!**

---

## 📞 Support Resources

**If you're stuck:**
1. Check console logs (backend terminal)
2. Check Supabase logs (Dashboard → Logs)
3. Check LangFuse traces for AI errors
4. Review [PHASE2.5_TESTING_GUIDE.md](PHASE2.5_TESTING_GUIDE.md) troubleshooting section
5. Verify all environment variables are set correctly

**Good luck! 🎉**
