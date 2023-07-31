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
  checkEnv,
  logEnv,
  mapEnvVariables
} = require('../src/utils')

const ORIGINAL_ENV = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...ORIGINAL_ENV }
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

test('exports', () => {
  expect(typeof checkEnv).toEqual('function')
  expect(typeof logEnv).toEqual('function')
  expect(typeof mapEnvVariables).toEqual('function')
})

describe('checkEnv', () => {
  test('all env variables exist', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc', bar: '123' }

    expect(() => checkEnv(['foo', 'bar'])).not.toThrow()
  })

  test('some env variables missing', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc' }

    expect(() => checkEnv(['foo', 'bar'])).toThrow('Missing env var(s)')
  })
})

describe('logEnv', () => {
  test('log with nothing to hide (defaults)', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc' }
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})

    logEnv(['foo'])
    expect(log).toHaveBeenCalledWith('foo=abc')
    log.mockReset()
  })

  test('log, bad logger', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc' }
    const logger = {}

    expect(() => logEnv(['foo'], [], logger)).toThrow('logger is undefined or logger.log is not a function')
  })

  test('log with some env vars to hide', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc', bar: 'secret thing' }
    const logger = {
      log: jest.fn()
    }

    logEnv(['foo', 'bar'], ['bar'], logger)
    expect(logger.log).toHaveBeenCalledWith('foo=abc')
    expect(logger.log).toHaveBeenCalledWith('bar=<hidden>')
  })
})

describe('mapEnvVariables', () => {
  test('no envMap', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc', bar: 'secret thing' }
    const beforeLen = Object.keys(process.env).length

    mapEnvVariables()
    const afterLen = Object.keys(process.env).length

    expect(beforeLen).toEqual(afterLen)
  })

  test('set an envMap', () => {
    process.env = { ...ORIGINAL_ENV, foo: 'abc', bar: 'secret thing' }
    const beforeLen = Object.keys(process.env).length

    const envMap = {
      foo: 'baz'
    }

    mapEnvVariables(envMap)
    const afterLen = Object.keys(process.env).length

    expect(beforeLen + 1).toEqual(afterLen) // increased by 1
    expect(process.env.baz).toEqual(process.env.foo)
  })
})
