#!/usr/bin/env node

/**
 * Pack app into a zip file
 */

const { runCommand, verifyOutput } = require('./utils');

const appDir = 'ffapp';
const binPath = '../bin/run';

try {
  console.log('=== Packing app ===');
  process.chdir(appDir);
  runCommand(`${binPath} app:pack 2>&1 > consoleoutput.txt`);
  verifyOutput('consoleoutput.txt', ['Packaging done.']);
  console.log('\nApp packing successful!');
} catch (error) {
  console.error('\nScript failed:', error.message);
  throw error;
}
