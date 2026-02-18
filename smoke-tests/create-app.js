#!/usr/bin/env node

/**
 * Create and deploy app with no extensions
 */

const { createAndDeployApp } = require('./utils');

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
