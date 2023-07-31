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

const chalk = require('chalk').default

/**
 * Checks whether environment variables are present.
 *
 * @param {Array<string>} vars an array of environment variables to check for
 */
function checkEnv (vars) {
  const missing = []
  vars.forEach(v => {
    if (!process.env[v]) missing.push(v)
  })
  if (missing.length > 0) throw new Error(`Missing env var(s): ${chalk.bold(missing.toString())}`)
}

/**
 * Logs environment variables to stdout, and mask specified variables (hidden)
 *
 * @param {Array<string>} vars an array of environment variables to log
 * @param {Array<string>} toHide an array of environment variables to mask from the log
 */
function logEnv (vars, toHide) {
  const toHideSet = new Set(toHide)
  vars.forEach(v => {
    const str = toHideSet.has(v) ? '<hidden>' : process.env[v]
    console.log(`${v}=${str}`)
  })
}

/**
 * The values of the envMap will be set as environment variables.
 * The value of the environment variable is set to the value of the environment variable at the key.
 *
 * @param {object} envMap the env mapping
 */
function mapEnvVariables (envMap) {
  if (envMap) {
    Object.keys(envMap).forEach(k => {
      process.env[envMap[k]] = process.env[k]
    })
  }
}

module.exports = {
  checkEnv,
  logEnv,
  mapEnvVariables
}
