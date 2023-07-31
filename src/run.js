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
const repositories = require('../repositories.json')
const fs = require('fs-extra')
const auth = require('./auth')
const path = require('path')
const { checkEnv, logEnv, mapEnvVariables } = require('./utils')

const RES_DIR = '.repos'

/**
 * Run one e2e test.
 *
 * @param {string} name the name of the repo (key in repositories.json)
 * @param {object} params the parameters for the e2e run
 */
function runOne (name, params) {
  console.log(chalk.blue(`> e2e tests for ${chalk.bold(name)}, repo: ${chalk.bold(params.repository)}, branch: ${chalk.bold(params.branch)}`))

  if (params.mapEnv) {
    console.log(chalk.dim(`    - mapping env vars: ${chalk.bold(Object.entries(params.mapEnv).map(([k, v]) => k + '->' + v).toString())}`))
    mapEnvVariables(params.mapEnv)
  }

  console.log(chalk.dim(`    - checking existance of env vars: ${chalk.bold(params.requiredEnv.toString())}`))
  checkEnv(params.requiredEnv)

  logEnv(params.requiredEnv, params.doNotLog)

  console.log(chalk.dim(`    - cloning repo ${chalk.bold(params.repository)}..`))
  execa.sync('git', ['clone', params.repository, name], { stderr: 'inherit' })
  process.chdir(name)
  console.log(chalk.dim(`    - checking out branch ${chalk.bold(params.branch)}..`))
  execa.sync('git', ['checkout', params.branch], { stderr: 'inherit' })
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
 * @param {string} [artifactsDir=.repos] the folder to create all run artifacts in
 */
async function runAll (artifactsDir = RES_DIR) {
  console.log(chalk.blue.bold(`-- e2e testing for ${Object.keys(repositories).toString()} --`))
  console.log()

  const failed = []
  const startDir = process.cwd()
  fs.emptyDirSync(artifactsDir)
  process.chdir(artifactsDir)

  const testsWithJwt = Object.entries(repositories).filter(([k, v]) => !v.disabled && v.requiredAuth === 'jwt').map(([k, v]) => k)
  if (testsWithJwt.length > 0) {
    const jwtVars = ['JWT_CLIENTID', 'JWT_CLIENT_SECRET', 'JWT_PRIVATE_KEY', 'JWT_ORG_ID', 'JWT_TECH_ACC_ID']

    console.log(chalk.dim(`tests '${testsWithJwt}' require jwt authentication`))
    if (!process.env.JWT_PRIVATE_KEY) {
      console.log('no private key set in env as JWT_PRIVATE_KEY')
      const privateKeyFile = path.join(startDir, 'env.key')
      if (fs.existsSync(privateKeyFile)) {
        // file may exist in CI env
        console.log(`found key file ${privateKeyFile}`)
        const pKey = fs.readFileSync(privateKeyFile)
        process.env.JWT_PRIVATE_KEY = pKey
      } else {
        console.log(`no key file ${privateKeyFile} found`)
      }
    }
    checkEnv(jwtVars)
    const options = {
      clientId: process.env.JWT_CLIENTID,
      technicalAccountId: process.env.JWT_TECH_ACC_ID,
      orgId: process.env.JWT_ORG_ID,
      clientSecret: process.env.JWT_CLIENT_SECRET,
      privateKey: process.env.JWT_PRIVATE_KEY
    }
    const signedJwt = await auth.getSignedJwt(options)
    process.env.JWT_SIGNED = signedJwt
    const jwtToken = await auth.getJWTToken(options, signedJwt)
    process.env.JWT_TOKEN = jwtToken.access_token
  }
  const testsWithOauth = Object.entries(repositories).filter(([k, v]) => !v.disabled && v.requiredAuth === 'oauth').map(([k, v]) => k)
  if (testsWithOauth.length > 0) {
    console.log(chalk.dim(`tests '${testsWithOauth}' require OAuth`))
    checkEnv(['OAUTH_TOKEN_ACTION_URL', 'OAUTH_CLIENTID'])
    const oauthToken = await auth.getOauthToken(process.env.OAUTH_TOKEN_ACTION_URL)
    process.env.OAUTH_TOKEN = oauthToken.access_token
  }

  Object.keys(repositories).forEach(k => {
    try {
      const params = repositories[k]
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
  if (failed.length === 0) console.log(chalk.green.bold('-- all e2e tests ran successfully --'))
  else {
    console.log(chalk.red(`-- some test(s) failed: ${chalk.bold(failed.toString())} --`))
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
}

module.exports = {
  runOne,
  runAll
}
