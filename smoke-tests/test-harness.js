#!/usr/bin/env node

/**
 * Test harness for validating scripts locally
 * This allows testing the scripts without needing GitHub Actions or Adobe secrets
 */

const fs = require('fs');
const path = require('path');
const { verifyOutput } = require('./utils');

// Path to test fixtures
const fixturesDir = path.join(__dirname, 'tests', 'fixtures');

/**
 * Test verification functions
 */
function testVerifications() {
  console.log('=== Testing Verification Functions ===\n');

  const tests = [
    {
      name: 'App initialization',
      file: path.join(fixturesDir, 'init-output.txt'),
      expected: ['App initialization finished']
    },
    {
      name: 'App deployment (standalone)',
      file: path.join(fixturesDir, 'deploy-standalone.txt'),
      expected: [
        'Your deployed actions:',
        'api/v1/web/ffapp/generic',
        '/api/v1/web/ffapp/publish-events',
        '.adobeio-static.net/index.html',
        'Successful deployment'
      ]
    },
    {
      name: 'App deployment (with extension)',
      file: path.join(fixturesDir, 'deploy-extension.txt'),
      expected: [
        'Your deployed actions:',
        'api/v1/web/dx-excshell-1/generic',
        '.adobeio-static.net/index.html',
        'Successful deployment'
      ]
    },
    {
      name: 'App packing',
      file: path.join(fixturesDir, 'pack-output.txt'),
      expected: ['Packaging done.']
    },
    {
      name: 'App installation',
      file: path.join(fixturesDir, 'install-output.txt'),
      expected: ['Install done.']
    },
    {
      name: 'Asset Compute smoke test',
      file: path.join(fixturesDir, 'asset-compute-output.txt'),
      expected: [
        'App initialization finished!',
        '/test/asset-compute/worker',
        'All tests were successful.'
      ]
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      verifyOutput(test.file, test.expected);
      console.log('PASSED\n');
      passed++;
    } catch (error) {
      console.error(`FAILED: ${error.message}\n`);
      failed++;
    }
  }

  console.log('=== Test Summary ===');
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);

  return failed === 0;
}

/**
 * Test with missing strings (should fail)
 */
function testNegativeCases() {
  console.log('\n=== Testing Negative Cases (Expected to Fail) ===\n');
  
  try {
    console.log('Testing: Missing expected string');
    verifyOutput(path.join(fixturesDir, 'init-output.txt'), ['This string does not exist']);
    console.log('UNEXPECTED: Test should have failed\n');
    return false;
  } catch (error) {
    console.log('EXPECTED: Test failed as expected\n');
    return true;
  }
}

/**
 * Main test runner
 */
function main() {
  console.log('Running Test Harness\n');
  console.log('This tests the verification logic without needing actual CLI execution\n');

  const positiveTestsPassed = testVerifications();
  const negativeTestsPassed = testNegativeCases();

  if (positiveTestsPassed && negativeTestsPassed) {
    console.log('\nAll tests passed!');
    console.log('\nNext steps:');
    console.log('1. Review the fixture files in smoke-tests/tests/fixtures/');
    console.log('2. Test with actual CLI once you have Adobe credentials');
  } else {
    console.error('\nSome tests failed');
    throw new Error('Test harness failed');
  }
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { testVerifications, testNegativeCases };
