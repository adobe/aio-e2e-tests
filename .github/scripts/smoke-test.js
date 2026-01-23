#!/usr/bin/env node

/**
 * Unified smoke test script for AIO workflows
 * Replaces multiple individual scripts with a single CLI
 */

const { createAndDeployApp, runCommand, verifyOutput } = require('./utils');

const commands = {
  /**
   * Create app with no extensions
   */
  'create-app': () => {
    createAndDeployApp({
      installDeps: true,
      cleanFirst: false,
      initCommand: 'app:init . -y --no-login --standalone-app',
      deployCommand: 'app:deploy',
      verifyStrings: [
        'Your deployed actions:',
        'api/v1/web/ffapp/generic',
        '/api/v1/web/ffapp/publish-events',
        '.adobeio-static.net/index.html',
        'Successful deployment'
      ],
      successMessage: 'App creation and deployment successful!'
    });
  },

  /**
   * Create app with extension
   */
  'create-app-extension': () => {
    createAndDeployApp({
      installDeps: false,
      cleanFirst: true,
      initCommand: 'app:init . -y --no-login --extension dx/excshell/1',
      deployCommand: 'app:deploy --no-publish',
      verifyStrings: [
        'Your deployed actions:',
        'api/v1/web/dx-excshell-1/generic',
        '.adobeio-static.net/index.html',
        'Successful deployment'
      ],
      successMessage: 'App with extension creation and deployment successful!'
    });
  },

  /**
   * Pack app
   */
  'pack': () => {
    const appDir = 'ffapp';
    const binPath = '../bin/run';

    try {
      console.log('=== Packing app ===');
      process.chdir(appDir);
      runCommand(`${binPath} app:pack 2>&1 > consoleoutput.txt`);
      verifyOutput('consoleoutput.txt', ['Packaging done.']);
      console.log('\n✅ App packing successful!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    }
  },

  /**
   * Install app
   */
  'install': () => {
    const appDir = 'ffapp';
    const binPath = '../bin/run';

    try {
      console.log('=== Installing app ===');
      process.chdir(appDir);
      runCommand(`${binPath} app:install dist/app.zip --output install-folder 2>&1 > consoleoutput.txt`);
      verifyOutput('consoleoutput.txt', ['Install done.']);
      console.log('\n✅ App installation successful!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    }
  },

  /**
   * Asset Compute smoke test
   */
  'asset-compute': () => {
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

      console.log('\n✅ Asset Compute smoke test passed!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Script failed:', error.message);
      process.exit(1);
    }
  }
};

/**
 * Show usage information
 */
function showUsage() {
  console.log(`
Usage: node smoke-test.js <command>

Commands:
  create-app           Create and deploy app with no extensions
  create-app-extension Create and deploy app with extension
  pack                 Pack the app into a zip
  install              Install app from zip
  asset-compute        Run Asset Compute smoke test

Examples:
  node smoke-test.js create-app
  node smoke-test.js pack
  node smoke-test.js asset-compute
  `);
  process.exit(1);
}

/**
 * Main entry point
 */
function main() {
  const command = process.argv[2];

  if (!command || !commands[command]) {
    console.error(`Error: Unknown command "${command || ''}"\n`);
    showUsage();
  }

  commands[command]();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { commands, main };

