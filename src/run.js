/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const execa = require('execa')
const chalk = require('chalk').default
const fs = require('fs-extra')
const auth = require('./auth')

const { checkEnv, logEnv, mapEnvVariables } = require('./utils')

const RES_DIR = '.repos'

/**
 * Run one e2e test.
 *
 * @param {string} name the name of the repo (key in repositories.json)
 * @param {object} params the parameters for the e2e run
 * @param {object} [params.mapEnv] the parameters to map
 * @param {Array<string>} params.requiredEnv the required env variables to check for
 * @param {Array<string>} params.doNotLog the env variables not to log values for
 * @param {string} params.repository the git repository (url) to clone
 * @param {string} params.branch the branch of the git repository to clone
 */
function runOne (name, params) {
  const {
    mapEnv,
    requiredEnv,
    doNotLog = [],
    repository,
    branch
  } = params
  console.log(chalk.blue(`> e2e tests for ${chalk.bold(name)}, repo: ${chalk.bold(repository)}, branch: ${chalk.bold(branch)}`))

  if (mapEnv) {
    console.log(chalk.dim(`    - mapping env vars: ${chalk.bold(Object.entries(mapEnv).map(([k, v]) => k + '->' + v).toString())}`))
    mapEnvVariables(mapEnv)
  }

  console.log(chalk.dim(`    - checking existance of env vars: ${chalk.bold(requiredEnv.toString())}`))
  checkEnv(requiredEnv)

  logEnv(requiredEnv, doNotLog)

  console.log(chalk.dim(`    - cloning repo ${chalk.bold(repository)}..`))
  execa.sync('git', ['clone', repository, name], { stderr: 'inherit' })
  process.chdir(name)
  console.log(chalk.dim(`    - checking out branch ${chalk.bold(branch)}..`))
  execa.sync('git', ['checkout', branch], { stderr: 'inherit' })
  console.log(chalk.dim('    - installing npm packages..'))
  execa.sync('npm', ['install'], { stderr: 'inherit' })
  console.log(chalk.bold('    - running tests..'))
  execa.sync('npm', ['run', 'e2e'], { stderr: 'inherit' })
  process.chdir('..')
  console.log(chalk.green(`    - done for ${chalk.bold(name)}`))
}

/**
 * Run all the e2e tests.
 *
 * @param {object} repositoriesJson the data on all the repositories to run the tests on
 * @param {string} [artifactsDir] the folder to create all run artifacts in
 */
async function runAll (repositoriesJson, artifactsDir = RES_DIR) {
  console.log(chalk.blue.bold(`-- e2e testing for ${Object.keys(repositoriesJson).toString()} --`))
  console.log()

  const failed = []
  const startDir = process.cwd()
  fs.emptyDirSync(artifactsDir)
  process.chdir(artifactsDir)

  const testWithOauthS2s = Object.entries(repositoriesJson).filter(([k, v]) => !v.disabled && v.requiredAuth === 'oauth_s2s').map(([k, v]) => k)
  if (testWithOauthS2s.length > 0) {
    const s2sVars = ['IMS_CLIENT_ID', 'IMS_CLIENT_SECRET', 'IMS_ORG_ID', 'IMS_SCOPES']

    console.log(chalk.dim(`tests '${testWithOauthS2s}' require oauth s2s credentials`))

    checkEnv(s2sVars)
    const res = await auth.getAccessTokenByClientCredentials(
      process.env.IMS_ENV || 'prod',
      process.env.IMS_CLIENT_ID,
      process.env.IMS_CLIENT_SECRET,
      process.env.IMS_ORG_ID,
      process.env.IMS_SCOPES
    )
    process.env.IMS_TOKEN = res.access_token
  }

  Object.keys(repositoriesJson).forEach(k => {
    try {
      const params = repositoriesJson[k]
      if (params.disabled) {
        console.log(`skipping e2e test for ${k} (disabled)`)
      } else {
        runOne(k, params)
      }
    } catch (e) {
      console.error(e)
      console.error(chalk.red(`!! e2e tests for ${chalk.bold(k)} failed !!`))
      failed.push(k)
    }
  })
  process.chdir(startDir)

  // success
  console.log()
  if (failed.length === 0) {
    console.log(chalk.green.bold('-- all e2e tests ran successfully --'))
  } else {
    console.log(chalk.red(`-- some test(s) failed: ${chalk.bold(failed.toString())} --`))
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
}

module.exports = {
  runOne,
  runAll
}
