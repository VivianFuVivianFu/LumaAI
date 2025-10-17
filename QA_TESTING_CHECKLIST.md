# Luma Manual QA Testing Checklist

**Environment:** [ ] Local  [ ] Staging  [ ] Production
**Date:** _____________
**Tester:** _____________
**Browser:** _____________
**Device:** _____________

---

## 🔐 Authentication & Authorization (12 Tests)

### Registration Flow
- [ ] User can access registration page
- [ ] Email validation works (invalid email shows error)
- [ ] Password validation works (min 8 chars, special char)
- [ ] Name validation works (required field)
- [ ] Registration succeeds with valid data
- [ ] User receives success message
- [ ] User is redirected to dashboard after registration
- [ ] Duplicate email shows appropriate error

### Login Flow
- [ ] User can access login page
- [ ] Login succeeds with correct credentials
- [ ] Login fails with incorrect password
- [ ] Login fails with non-existent email
- [ ] "Forgot password" link present (if implemented)
- [ ] User redirected to dashboard after login
- [ ] Session persists after page refresh
- [ ] Rate limiting prevents brute force (5 attempts max)

### Logout Flow
- [ ] Logout button accessible
- [ ] Logout clears session
- [ ] User redirected to login after logout
- [ ] Cannot access protected routes after logout

---

## 🎯 Onboarding Experience (8 Tests)

### First-Time User Flow
- [ ] Onboarding screens show for new users
- [ ] Onboarding screen 1 displays correctly
- [ ] Onboarding screen 2 displays correctly
- [ ] Onboarding screen 3 displays correctly
- [ ] "Next" button navigation works
- [ ] "Get Started" button works
- [ ] Skip onboarding option (if present)
- [ ] Onboarding only shows once (is_new_user flag)

---

## 💬 Chat Feature (18 Tests)

### Chat Interface
- [ ] Chat screen loads successfully
- [ ] Chat history displays (if exists)
- [ ] Input field is accessible
- [ ] Send button is visible
- [ ] Message can be typed
- [ ] Message can be sent
- [ ] User message appears immediately
- [ ] AI response appears after sending
- [ ] Loading indicator shows while waiting
- [ ] Error handling for failed messages

### Chat Functionality
- [ ] Multi-line messages supported
- [ ] Empty messages prevented
- [ ] Long messages handle correctly
- [ ] Conversation history persists
- [ ] New conversation button works
- [ ] Scroll to bottom on new message
- [ ] Timestamps display correctly
- [ ] Avatar/icons display correctly

### AI Responses
- [ ] AI responses are relevant
- [ ] AI responses are empathetic
- [ ] Mental health disclaimers present
- [ ] Crisis resources accessible
- [ ] Response time < 10 seconds
- [ ] Streaming response (if implemented)

---

## 📔 Journal Feature (15 Tests)

### Journal Interface
- [ ] Journal screen loads successfully
- [ ] Journal entry list displays
- [ ] "New Entry" button visible
- [ ] Date selector works
- [ ] Mood selector works (if present)
- [ ] Entry form accessible

### Journal Entry Creation
- [ ] Can type journal entry
- [ ] Entry can be saved
- [ ] Success message after save
- [ ] Entry appears in list
- [ ] Character count displays (if present)
- [ ] Auto-save works (if implemented)

### Journal Entry Management
- [ ] Can view existing entries
- [ ] Can edit existing entries
- [ ] Can delete entries (with confirmation)
- [ ] Search/filter works (if present)
- [ ] Sort by date works
- [ ] Pagination works (if applicable)

### Journal Analytics
- [ ] Mood tracking chart displays (if present)
- [ ] Entry count statistics visible
- [ ] Streak tracking shows (if present)

---

## 🎯 Goals Feature (12 Tests)

### Goals Interface
- [ ] Goals screen loads successfully
- [ ] Goals list displays
- [ ] "Add Goal" button visible
- [ ] Goal categories available
- [ ] Progress indicators display

### Goal Creation
- [ ] Goal creation form accessible
- [ ] Goal title can be entered
- [ ] Goal description can be entered
- [ ] Goal deadline can be set
- [ ] Goal category can be selected
- [ ] Goal can be saved
- [ ] Success message after creation

### Goal Management
- [ ] Can view goal details
- [ ] Can edit existing goals
- [ ] Can delete goals (with confirmation)
- [ ] Can mark goal as complete
- [ ] Progress can be updated
- [ ] Goals sorted by deadline/priority
- [ ] Filter by status works (active/completed)

### Goal Progress
- [ ] Progress bar displays correctly
- [ ] Completion percentage accurate
- [ ] Milestones visible (if present)
- [ ] Celebration animation on completion

---

## 🛠️ Tools Feature (10 Tests)

### Tools Interface
- [ ] Tools screen loads successfully
- [ ] All tools display in grid/list
- [ ] Tool cards clickable
- [ ] Tool descriptions visible
- [ ] Tool icons/images display

### Individual Tools
- [ ] Breathing exercise works
- [ ] Meditation timer functions
- [ ] Mood tracker accessible
- [ ] Affirmations display
- [ ] Grounding exercise works
- [ ] Crisis resources accessible
- [ ] Tool usage tracked (if implemented)

### Tool Functionality
- [ ] Audio plays correctly (if present)
- [ ] Timers count down accurately
- [ ] Animations smooth
- [ ] Exit tool returns to tools screen

---

## 👤 Profile & Settings (8 Tests)

### Profile Screen
- [ ] Profile screen accessible
- [ ] User name displays correctly
- [ ] Email displays correctly
- [ ] Profile picture displays (if present)
- [ ] Edit profile button works

### Profile Editing
- [ ] Can update name
- [ ] Can update profile picture (if present)
- [ ] Changes save successfully
- [ ] Success message after update

### Settings
- [ ] Settings screen accessible (if separate)
- [ ] Notification preferences (if present)
- [ ] Privacy settings accessible
- [ ] Theme toggle works (if present)

---

## 📊 Dashboard (10 Tests)

### Dashboard Display
- [ ] Dashboard loads successfully
- [ ] Welcome message with user name
- [ ] Today's date displays
- [ ] Quick stats display correctly
- [ ] Recent activity shown

### Dashboard Navigation
- [ ] Chat button navigates correctly
- [ ] Journal button navigates correctly
- [ ] Goals button navigates correctly
- [ ] Tools button navigates correctly
- [ ] Profile button navigates correctly

### Dashboard Data
- [ ] Mood history chart (if present)
- [ ] Goal progress summary
- [ ] Journal entry count
- [ ] Streak information (if present)
- [ ] AI nudges/recommendations

---

## 🔒 Privacy & GDPR (8 Tests)

### Privacy Features
- [ ] Privacy Policy accessible
- [ ] Terms of Service accessible
- [ ] Cookie consent banner shows (first visit)
- [ ] Cookie preferences can be set
- [ ] Data export available
- [ ] Account deletion available

### GDPR Endpoints
- [ ] Data summary endpoint works
- [ ] Data export downloads correctly
- [ ] Export includes all user data
- [ ] Account deletion works (with confirmation)
- [ ] Deletion confirmation required
- [ ] All data removed after deletion

---

## 🌐 PWA & Offline (12 Tests)

### PWA Installation
- [ ] Install prompt appears (desktop)
- [ ] Install prompt appears (mobile)
- [ ] App can be installed
- [ ] Installed app opens standalone
- [ ] App icon displays correctly
- [ ] Splash screen shows (mobile)

### Offline Functionality
- [ ] Service worker registers
- [ ] Offline banner shows when offline
- [ ] App works offline (UI navigation)
- [ ] Cached data accessible offline
- [ ] Offline page displays for new pages
- [ ] Online banner shows when reconnected

### PWA Features
- [ ] App shortcuts work (if present)
- [ ] Push notifications (if implemented)
- [ ] Background sync (if implemented)
- [ ] Share functionality (if present)

---

## 🎨 UI/UX (15 Tests)

### Visual Design
- [ ] Colors consistent with brand
- [ ] Typography readable
- [ ] Icons display correctly
- [ ] Images load properly
- [ ] Animations smooth
- [ ] Loading states visible
- [ ] Error states styled correctly

### Responsive Design
- [ ] Mobile view (< 640px) works
- [ ] Tablet view (640-1024px) works
- [ ] Desktop view (> 1024px) works
- [ ] Landscape orientation works
- [ ] Text readable at all sizes
- [ ] Buttons properly sized for touch
- [ ] No horizontal scroll

### Accessibility
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Screen reader compatible (if tested)

---

## ⚡ Performance (8 Tests)

### Load Times
- [ ] Initial load < 3 seconds
- [ ] Subsequent loads < 1 second
- [ ] API responses < 500ms
- [ ] Images load progressively
- [ ] No layout shift (CLS)

### Performance Metrics
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.9s
- [ ] Total Blocking Time < 300ms

### Caching
- [ ] Static assets cached
- [ ] API responses cached
- [ ] Cache invalidation works

---

## 🐛 Error Handling (10 Tests)

### Error Boundaries
- [ ] Error boundary catches React errors
- [ ] Fallback UI displays on error
- [ ] "Try Again" button works
- [ ] Error details shown in dev mode
- [ ] Error sent to Sentry (if configured)

### API Error Handling
- [ ] 401 errors redirect to login
- [ ] 403 errors show permission denied
- [ ] 404 errors show not found
- [ ] 500 errors show server error
- [ ] Network errors handled gracefully
- [ ] Rate limit errors (429) shown clearly

### Form Validation
- [ ] Required fields validated
- [ ] Email format validated
- [ ] Password strength validated
- [ ] Error messages clear and helpful

---

## 🔐 Security (8 Tests)

### Security Headers
- [ ] CSP headers present
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] X-XSS-Protection enabled

### Data Protection
- [ ] Passwords not visible in network tab
- [ ] Tokens stored securely
- [ ] No sensitive data in console logs
- [ ] HTTPS enforced

### Rate Limiting
- [ ] Login rate limited (5 attempts)
- [ ] API endpoints rate limited
- [ ] Rate limit messages clear

---

## 📱 Cross-Browser Testing (6 Tests)

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Android Chrome

### Browser Features
- [ ] Service workers supported
- [ ] LocalStorage works
- [ ] Fetch API works
- [ ] CSS Grid/Flexbox works

---

## 🧪 Edge Cases (10 Tests)

### Data Edge Cases
- [ ] Very long text input handled
- [ ] Special characters in input
- [ ] Emoji support
- [ ] Empty states display correctly
- [ ] Large data sets handled

### Network Edge Cases
- [ ] Slow connection handled
- [ ] Connection loss during operation
- [ ] Simultaneous requests handled
- [ ] Request timeout handled

### User Edge Cases
- [ ] Multiple tabs open
- [ ] Session expiry during use
- [ ] Concurrent logins
- [ ] Browser back/forward buttons

---

## 📊 Test Summary

**Total Tests:** 170
**Tests Passed:** _____ / 170
**Tests Failed:** _____
**Tests Skipped:** _____
**Pass Rate:** _____%

---

## 🐛 Bugs Found

| # | Feature | Description | Severity | Status |
|---|---------|-------------|----------|--------|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

**Severity Levels:**
- 🔴 Critical - Blocks functionality
- 🟡 High - Major issue but workaround exists
- 🟢 Medium - Minor issue
- ⚪ Low - Cosmetic issue

---

## ✅ Sign-Off

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Bugs documented and prioritized
- [ ] Ready for production deployment

**QA Tester:** _____________
**Date:** _____________
**Signature:** _____________

---

## 📝 Notes

Use this space for additional observations, suggestions, or comments:

```
[Your notes here]
```
