/**
 * Comprehensive Test Runner
 *
 * Runs all integration tests in sequence and generates a summary report
 */

const { spawn } = require('child_process');
const path = require('path');

// Test files to run in order
const testFiles = [
  'auth-integration.test.js',
  'chat-integration.test.js',
  'journal-integration.test.js',
  'goals-integration.test.js',
  'tools-integration.test.js',
  'phase3-integration.test.js',
  'phase4-langfuse-integration.test.js'
];

// Track results
const results = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  suites: []
};

// Run a single test file
function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${testFile}`);
    console.log('='.repeat(60));

    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ file: testFile, status: 'passed' });
      } else {
        resolve({ file: testFile, status: 'failed', code });
      }
    });

    child.on('error', (error) => {
      reject({ file: testFile, error: error.message });
    });
  });
}

// Main test runner
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║        LUMA COMPREHENSIVE INTEGRATION TEST SUITE           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Check if backend is running
  console.log('⚙️  Checking if backend server is running...');
  try {
    const response = await fetch('http://localhost:4000/health');
    if (response.ok) {
      console.log('✅ Backend server is running\n');
    } else {
      throw new Error('Backend health check failed');
    }
  } catch (error) {
    console.error('❌ ERROR: Backend server is not running!');
    console.error('   Please start the backend server first:');
    console.error('   cd backend && npm run dev\n');
    process.exit(1);
  }

  // Run all tests
  for (const testFile of testFiles) {
    try {
      const result = await runTest(testFile);
      results.suites.push(result);

      if (result.status === 'passed') {
        results.passedTests++;
      } else {
        results.failedTests++;
      }
      results.totalTests++;

    } catch (error) {
      console.error(`\n❌ Critical error running ${testFile}:`, error);
      results.suites.push({ file: testFile, status: 'error', error: error.error });
      results.failedTests++;
      results.totalTests++;
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print final summary
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║                    FINAL TEST SUMMARY                      ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Test Suites:');
  results.suites.forEach((suite) => {
    const icon = suite.status === 'passed' ? '✅' : '❌';
    const status = suite.status.toUpperCase();
    console.log(`  ${icon} ${suite.file.padEnd(40)} ${status}`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`Total Test Suites:    ${results.totalTests}`);
  console.log(`Passed Test Suites:   ${results.passedTests} ✅`);
  console.log(`Failed Test Suites:   ${results.failedTests} ❌`);
  console.log(`Success Rate:         ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Duration:       ${duration}s`);
  console.log('─'.repeat(60) + '\n');

  if (results.failedTests === 0) {
    console.log('🎉 ALL TEST SUITES PASSED! 🎉\n');
    console.log('✨ Your Luma application is production-ready! ✨\n');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TEST SUITES FAILED\n');
    console.log('Please review the errors above and fix the issues.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ CRITICAL ERROR:', error);
  process.exit(1);
});
