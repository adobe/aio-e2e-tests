#!/usr/bin/env node

/**
 * Asset Compute smoke test
 */

const { runCommand, verifyOutput } = require('./utils');

const outputFile = 'consoleoutput.txt';

try {
  console.log('=== Step 1: Install dependencies ===');
  runCommand('npm i');

  console.log('\n=== Step 2: Run Asset Compute tests ===');
  runCommand('./node_modules/mocha/bin/mocha test/index.test.js > consoleoutput.txt');

  console.log('\n=== Step 3: Verify test results ===');
  verifyOutput(outputFile, [
    'App initialization finished!',
    '/test/asset-compute/worker',
    'All tests were successful.'
  ]);

  console.log('\nAsset Compute smoke test passed!');
} catch (error) {
  console.error('\nScript failed:', error.message);
  throw error;
}
