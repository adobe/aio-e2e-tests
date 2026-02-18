#!/usr/bin/env node

/**
 * Create and deploy app with extension
 */

const { createAndDeployApp } = require('./utils');

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
