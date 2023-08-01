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
  const oauthAccessToken = {
    access_token: 'oauth-access-token'
  }
  const oauthRepos = {
    'an-oauth-repo': {
      repository: 'https://github.com/adobe/an-oauth-repo',
      branch: 'main',
      requiredEnv: ['A', 'B', 'C'],
      requiredAuth: 'oauth',
      mapEnv: undefined, // for coverage
      doNotLog: ['B']
    }
  }

  const jwtAccessToken = {
    access_token: 'jwt-access-token'
  }
  const jwtRepos = {
    'a-jwt-repo': {
      repository: 'https://github.com/adobe/a-jwt-repo',
      branch: 'main',
      requiredEnv: ['D', 'E', 'F'],
      requiredAuth: 'jwt',
      mapEnv: {},
      doNotLog: ['F']
    }
  }

  const disabledRepos = {
    'a-disabled-repo': {
      repository: 'https://github.com/adobe/a-disabled-repo',
      disabled: true,
      branch: 'main',
      requiredEnv: ['Q', 'E', 'D'],
      requiredAuth: 'jwt',
      doNotLog: ['Q']
    }
  }

  test('oauth repos', async () => {
    auth.getOauthToken.mockResolvedValue(oauthAccessToken)
    await expect(runAll(oauthRepos)).resolves.not.toThrow()
    expect(process.env.OAUTH_TOKEN).toEqual(oauthAccessToken.access_token)
  })

  test('jwt repos', async () => {
    auth.getJWTToken.mockResolvedValue(jwtAccessToken)
    await expect(runAll(jwtRepos)).resolves.not.toThrow()
    expect(process.env.JWT_TOKEN).toEqual(jwtAccessToken.access_token)
    expect(process.env.JWT_PRIVATE_KEY).toBeUndefined()
  })

  test('jwt repos (read private key from file)', async () => {
    const privateKey = 'a-private-key'

    auth.getJWTToken.mockResolvedValue(jwtAccessToken)
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue(privateKey)

    await expect(runAll(jwtRepos)).resolves.not.toThrow()
    expect(process.env.JWT_TOKEN).toEqual(jwtAccessToken.access_token)
    expect(process.env.JWT_PRIVATE_KEY).toEqual(privateKey)
  })

  test('jwt repos (use process.env.JWT_PRIVATE_KEY)', async () => {
    const privateKey = 'a-private-key-2'

    auth.getJWTToken.mockResolvedValue(jwtAccessToken)
    process.env.JWT_PRIVATE_KEY = privateKey

    await expect(runAll(jwtRepos)).resolves.not.toThrow()
    expect(process.env.JWT_TOKEN).toEqual(jwtAccessToken.access_token)
    expect(process.env.JWT_PRIVATE_KEY).toEqual(privateKey)
  })

  test('skip disabled repos', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})

    await expect(runAll(disabledRepos)).resolves.not.toThrow()
    expect(log).toHaveBeenCalledWith(`skipping e2e test for ${Object.keys(disabledRepos)[0]} (disabled)`)
    log.mockReset()
  })

  test('failed run', async () => {
    // we simulate a failure by throwing an error for execa.sync when runOne is called
    execa.sync.mockImplementation(() => {
      throw new Error('some error')
    })
    auth.getJWTToken.mockResolvedValue(jwtAccessToken)

    await expect(runAll(jwtRepos)).resolves.not.toThrow() // the exception is eaten
    expect(process.exit).toHaveBeenCalledWith(1)
  })
})
