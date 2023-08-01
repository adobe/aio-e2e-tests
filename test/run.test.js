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

const {
  runOne,
  runAll
} = require('../src/run')
const execa = require('execa')
const fs = require('fs-extra')
const auth = require('../src/auth')
const utils = require('../src/utils')

jest.mock('execa')
jest.mock('fs-extra')
jest.mock('../src/auth')
jest.mock('../src/utils')

const ORIGINAL_ENV = process.env

beforeEach(() => {
  process.exit = jest.fn()
  process.chdir = jest.fn()
  jest.resetModules()
  process.env = { ...ORIGINAL_ENV }
})

afterEach(() => {
  auth.getOauthToken.mockReset()
  auth.getSignedJwt.mockReset()
  auth.getJWTToken.mockReset()

  utils.checkEnv.mockReset()
  utils.logEnv.mockReset()
  utils.mapEnvVariables.mockReset()

  fs.existsSync.mockReset()
  fs.emptyDirSync.mockReset()
  fs.readFileSync.mockReset()

  process.exit.mockReset()
  process.chdir.mockReset()
  process.env = ORIGINAL_ENV
})

test('exports', () => {
  expect(typeof runOne).toEqual('function')
  expect(typeof runAll).toEqual('function')
})

test('runOne', () => {
  process.env = { ...ORIGINAL_ENV, foo: 'bar' }

  const name = 'my-repo'
  const params = {
    requiredEnv: ['foo'],
    mapEnv: { foo: 'foo-alternate' },
    repository: 'https://my-repo',
    branch: 'main'
  }
  const execaOptions = { stderr: 'inherit' }
  expect(() => runOne(name, params)).not.toThrow()
  expect(execa.sync).toHaveBeenCalledWith('git', ['clone', params.repository, name], execaOptions)
  expect(process.chdir).toHaveBeenCalledWith(name)
  expect(execa.sync).toHaveBeenCalledWith('git', ['checkout', params.branch], execaOptions)
  expect(execa.sync).toHaveBeenCalledWith('npm', ['install'], execaOptions)
  expect(execa.sync).toHaveBeenCalledWith('npm', ['run', 'e2e'], execaOptions)
  expect(process.chdir).toHaveBeenCalledWith('..')
})

describe('runAll', () => {
  test('oauth', () => {
    // mock getOauthToken
  })

  test('jwt', () => {
    // existsSync private key
    // readFileSync
    // checkEnv
    // getSignedJwt
    // getJWTToken
  })
})
