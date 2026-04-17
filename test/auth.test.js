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
  getAccessTokenByClientCredentials
} = require('../src/auth')
const fetch = require('node-fetch')

jest.mock('node-fetch', () => jest.fn())

/** @private */
function createResponsePromise ({ ok = true, status = 200, jsonReturnValue = {}, textReturnValue = '' }) {
  return Promise.resolve({
    ok,
    status,
    json: () => jsonReturnValue,
    text: () => textReturnValue
  })
}

test('exports', () => {
  expect(typeof getAccessTokenByClientCredentials).toEqual('function')
})

describe('getAccessTokenByClientCredentials', () => {
  const defaultArgs = [
    'prod',
    'some-client-id',
    'some-client-secret',
    'some-org-id',
    'scopes,a,b,c'
  ]

  test('bad env', async () => {
    const args = [...defaultArgs]
    args[0] = 'bad env'
    return expect(getAccessTokenByClientCredentials(...args)).rejects.toThrow('IMS_ENV must be one of "stage,prod"')
  })

  test('set all valid parameters', async () => {
    const json = {
      access_token: 'xyz123456'
    }
    fetch.mockImplementation(() => createResponsePromise({ jsonReturnValue: json }))
    return expect(await getAccessTokenByClientCredentials(...defaultArgs)).toEqual(json)
  })

  test('IMS 4xx', async () => {
    fetch.mockImplementation(() => createResponsePromise({ textReturnValue: 'fake error', ok: false, status: 403 }))
    await expect(getAccessTokenByClientCredentials(...defaultArgs)).rejects.toThrow('error response from IMS with status: 403 and body: fake error')
  })

  test('fetch throws', async () => {
    fetch.mockImplementation(() => { throw new Error('abc') })
    await expect(getAccessTokenByClientCredentials(...defaultArgs)).rejects.toThrow('cannot send request to IMS: abc')
  })
})
