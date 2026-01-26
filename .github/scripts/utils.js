#!/usr/bin/env node

/**
 * Utility functions for workflow scripts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Run a shell command and return the output
 * @param {string} command - The command to run
 * @param {object} options - Options for execSync
 * @returns {string} - Command output
 */
function runCommand(command, options = {}) {
  const defaultOptions = {
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe'],
    ...options
  };

  try {
    console.log(`[RUN] ${command}`);
    const output = execSync(command, defaultOptions);
    return output;
  } catch (error) {
    console.error(`[ERROR] Command failed: ${command}`);
    console.error(`Exit code: ${error.status}`);
    console.error(`Output: ${error.stdout}`);
    console.error(`Error: ${error.stderr}`);
    throw error;
  }
}

/**
 * Verify that expected strings exist in a file
 * @param {string} filePath - Path to the file to check
 * @param {string[]} expectedStrings - Array of strings that must exist in the file
 * @throws {Error} If any expected string is not found
 */
function verifyOutput(filePath, expectedStrings) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Output file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const missing = [];

  for (const expected of expectedStrings) {
    if (!content.includes(expected)) {
      missing.push(expected);
    }
  }

  if (missing.length > 0) {
    console.error(`[VERIFICATION FAILED] Missing expected strings in ${filePath}:`);
    missing.forEach(str => console.error(`  - "${str}"`));
    throw new Error(`Verification failed: ${missing.length} expected string(s) not found`);
  }

  console.log(`[VERIFICATION PASSED] All ${expectedStrings.length} expected strings found in ${filePath}`);
}

/**
 * Write environment variables to a .env file
 * @param {string} filePath - Path to the .env file
 * @param {object} vars - Object with key-value pairs
 */
function writeEnvFile(filePath, vars) {
  const lines = Object.entries(vars).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
  console.log(`[ENV] Created ${filePath} with ${Object.keys(vars).length} variables`);
}

/**
 * Ensure a directory exists
 * @param {string} dirPath - Path to the directory
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[MKDIR] Created directory: ${dirPath}`);
  }
}

/**
 * Clean up a directory (remove and recreate)
 * @param {string} dirPath - Path to the directory
 */
function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`[CLEAN] Removed directory: ${dirPath}`);
  }
  ensureDir(dirPath);
}

/**
 * Get runtime credentials from environment variables
 * @returns {{auth: string, namespace: string} | null} - Credentials object or null if not found
 */
function getRuntimeCredentials() {
  const auth = process.env.AIO_RUNTIME_AUTH || process.env.RUNTIME_AUTH;
  const namespace = process.env.AIO_RUNTIME_NAMESPACE || process.env.RUNTIME_NAMESPACE;

  if (!auth || !namespace) {
    return null;
  }

  return { auth, namespace };
}

/**
 * Setup runtime environment (.env file)
 * @param {string} envPath - Path to .env file (default: '.env')
 * @returns {boolean} - True if credentials were found and file was written
 */
function setupRuntimeEnv(envPath = '.env') {
  const credentials = getRuntimeCredentials();

  if (!credentials) {
    console.warn('[WARN] Runtime credentials not found in environment');
    console.warn('[WARN] Set AIO_RUNTIME_AUTH and AIO_RUNTIME_NAMESPACE to test deployment');
    console.log('[INFO] Skipping deployment step');
    return false;
  }

  writeEnvFile(envPath, {
    AIO_RUNTIME_AUTH: credentials.auth,
    AIO_RUNTIME_NAMESPACE: credentials.namespace
  });

  return true;
}

/**
 * Create and deploy an AIO app (generic function)
 * @param {object} options - Configuration options
 * @param {boolean} options.installDeps - Whether to run npm install first
 * @param {boolean} options.cleanFirst - Whether to clean directory first (vs ensure)
 * @param {string} options.initCommand - The app:init command arguments
 * @param {string} options.deployCommand - The app:deploy command arguments
 * @param {string[]} options.verifyStrings - Strings to verify in output
 * @param {string} options.successMessage - Success message to display
 */
function createAndDeployApp(options) {
  const {
    installDeps = false,
    cleanFirst = false,
    initCommand,
    deployCommand = 'app:deploy',
    verifyStrings,
    successMessage = 'App creation and deployment successful!'
  } = options;

  const appDir = 'ffapp';
  const binPath = '../bin/run';
  let stepNum = 1;

  try {
    // Optional: Install dependencies
    if (installDeps) {
      console.log(`=== Step ${stepNum++}: Install dependencies ===`);
      runCommand('npm i @adobe/aio-cli-plugin-app-templates');
      runCommand('npm i');
    }

    // Setup app directory
    console.log(`\n=== Step ${stepNum++}: ${cleanFirst ? 'Clean and create' : 'Create'} app directory ===`);
    if (cleanFirst) {
      cleanDir(appDir);
    } else {
      ensureDir(appDir);
    }
    process.chdir(appDir);

    // Initialize app
    console.log(`\n=== Step ${stepNum++}: Initialize app ===`);
    runCommand(`${binPath} ${initCommand} > consoleoutput.txt`);
    verifyOutput('consoleoutput.txt', ['App initialization finished']);

    // Configure environment
    console.log(`\n=== Step ${stepNum++}: Configure environment ===`);
    if (!setupRuntimeEnv('.env')) {
      process.exit(0);
    }

    // Deploy app
    console.log(`\n=== Step ${stepNum++}: Deploy app ===`);
    runCommand(`${binPath} ${deployCommand} >> consoleoutput.txt`);

    // Verify deployment
    verifyOutput('consoleoutput.txt', verifyStrings);

    console.log(`\n✅ ${successMessage}`);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  runCommand,
  verifyOutput,
  writeEnvFile,
  ensureDir,
  cleanDir,
  getRuntimeCredentials,
  setupRuntimeEnv,
  createAndDeployApp
};

