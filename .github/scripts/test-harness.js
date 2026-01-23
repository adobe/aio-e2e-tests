#!/usr/bin/env node

/**
 * Test harness for validating scripts locally
 * This allows testing the scripts without needing GitHub Actions or Adobe secrets
 */

const fs = require('fs');
const path = require('path');
const { verifyOutput } = require('./utils');

/**
 * Create mock console output for testing verification logic
 */
function createMockOutputs() {
  const mockDir = path.join(__dirname, 'test-mocks');
  
  if (!fs.existsSync(mockDir)) {
    fs.mkdirSync(mockDir, { recursive: true });
  }

  // Mock output for app initialization
  const initOutput = `
Creating project from template @adobe/generator-app-excshell
? Select components to include
✔ Actions: Deploy Runtime actions
✔ Web Assets: Deploy hosted static assets
? Which Adobe I/O App features do you want to enable for this project?
✔ Actions
✔ Events
✔ Web Assets

App initialization finished!

Next steps:
  $ cd myapp
  $ aio app run
`;

  // Mock output for deployment (standalone app)
  const deployOutputStandalone = `
Building actions...
✔ Built 2 action(s) for 'ffapp'

Deploying actions...
✔ Deployed 2 action(s) for 'ffapp'

Your deployed actions:
  -> https://adobeioruntime.net/api/v1/web/ffapp/generic
  -> https://adobeioruntime.net/api/v1/web/ffapp/publish-events

Building web assets...
✔ Built web assets

Deploying web assets...
✔ Deployed web assets to https://12345-namespace.adobeio-static.net/index.html

Well done, your app is now online 🏄
Successful deployment
`;

  // Mock output for deployment (with extension)
  const deployOutputExtension = `
Building actions...
✔ Built 2 action(s) for 'dx-excshell-1'

Deploying actions...
✔ Deployed 2 action(s) for 'dx-excshell-1'

Your deployed actions:
  -> https://adobeioruntime.net/api/v1/web/dx-excshell-1/generic

Building web assets...
✔ Built web assets

Deploying web assets...
✔ Deployed web assets to https://12345-namespace.adobeio-static.net/index.html

Well done, your app is now online 🏄
Successful deployment
`;

  // Mock output for pack
  const packOutput = `
Packaging your app...
✔ Packaged app to dist/app.zip (size: 1.2 MB)
Packaging done.
`;

  // Mock output for install
  const installOutput = `
Installing app from dist/app.zip...
✔ Extracted app to install-folder
✔ Installed dependencies
Install done.
`;

  // Mock output for asset compute
  const assetComputeOutput = `
App initialization finished!

  Asset Compute Worker Tests
Running tests in /home/runner/work/asset-compute-integration-tests/test/asset-compute/worker
    ✓ should process image correctly (1234ms)
    ✓ should handle errors gracefully (567ms)
    ✓ should validate input parameters (123ms)

  3 passing (1926ms)

All tests were successful.
`;

  // Write mock files
  fs.writeFileSync(path.join(mockDir, 'init-output.txt'), initOutput);
  fs.writeFileSync(path.join(mockDir, 'deploy-standalone.txt'), initOutput + deployOutputStandalone);
  fs.writeFileSync(path.join(mockDir, 'deploy-extension.txt'), initOutput + deployOutputExtension);
  fs.writeFileSync(path.join(mockDir, 'pack-output.txt'), packOutput);
  fs.writeFileSync(path.join(mockDir, 'install-output.txt'), installOutput);
  fs.writeFileSync(path.join(mockDir, 'asset-compute-output.txt'), assetComputeOutput);

  return mockDir;
}

/**
 * Test verification functions
 */
function testVerifications() {
  console.log('=== Testing Verification Functions ===\n');

  const mockDir = createMockOutputs();
  const tests = [
    {
      name: 'App initialization',
      file: path.join(mockDir, 'init-output.txt'),
      expected: ['App initialization finished']
    },
    {
      name: 'App deployment (standalone)',
      file: path.join(mockDir, 'deploy-standalone.txt'),
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
      file: path.join(mockDir, 'deploy-extension.txt'),
      expected: [
        'Your deployed actions:',
        'api/v1/web/dx-excshell-1/generic',
        '.adobeio-static.net/index.html',
        'Successful deployment'
      ]
    },
    {
      name: 'App packing',
      file: path.join(mockDir, 'pack-output.txt'),
      expected: ['Packaging done.']
    },
    {
      name: 'App installation',
      file: path.join(mockDir, 'install-output.txt'),
      expected: ['Install done.']
    },
    {
      name: 'Asset Compute smoke test',
      file: path.join(mockDir, 'asset-compute-output.txt'),
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
      console.log('✅ PASSED\n');
      passed++;
    } catch (error) {
      console.error(`❌ FAILED: ${error.message}\n`);
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

  const mockDir = path.join(__dirname, 'test-mocks');
  
  try {
    console.log('Testing: Missing expected string');
    verifyOutput(path.join(mockDir, 'init-output.txt'), ['This string does not exist']);
    console.log('❌ UNEXPECTED: Test should have failed\n');
    return false;
  } catch (error) {
    console.log('✅ EXPECTED: Test failed as expected\n');
    return true;
  }
}

/**
 * Main test runner
 */
function main() {
  console.log('🧪 Running Test Harness\n');
  console.log('This tests the verification logic without needing actual CLI execution\n');

  const positiveTestsPassed = testVerifications();
  const negativeTestsPassed = testNegativeCases();

  if (positiveTestsPassed && negativeTestsPassed) {
    console.log('\n✅ All tests passed!');
    console.log('\nNext steps:');
    console.log('1. Review the generated mock files in .github/scripts/test-mocks/');
    console.log('2. Try running scripts with --dry-run flag (when implemented)');
    console.log('3. Test with actual CLI once you have Adobe credentials');
    process.exit(0);
  } else {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { createMockOutputs, testVerifications, testNegativeCases };

