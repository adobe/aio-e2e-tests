#!/usr/bin/env node

/**
 * Install app from zip file
 */

const { runCommand, verifyOutput } = require('./utils');

const appDir = 'ffapp';
const binPath = '../bin/run';

try {
  console.log('=== Installing app ===');
  process.chdir(appDir);
  runCommand(`${binPath} app:install dist/app.zip --output install-folder > consoleoutput.txt 2>&1`);
  verifyOutput('consoleoutput.txt', ['Install done.']);
  console.log('\nApp installation successful!');
} catch (error) {
  console.error('\nScript failed:', error.message);
  throw error;
}
