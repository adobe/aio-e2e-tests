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
  JWT_EXPIRY_SECONDS,
  createJwtPayload,
  getSignedJwt,
  getJWTToken,
  getOauthToken
} = require('../src/auth')
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

jest.mock('jsonwebtoken')
jest.mock('node-fetch', () => jest.fn())

/** @private */
function createResponsePromise ({ ok = true, status = 200, jsonReturnValue = {} }) {
  return Promise.resolve({
    ok,
    status,
    json: () => jsonReturnValue
  })
}

test('exports', () => {
  expect(typeof getSignedJwt).toEqual('function')
  expect(typeof getJWTToken).toEqual('function')
  expect(typeof getOauthToken).toEqual('function')
  expect(JWT_EXPIRY_SECONDS).toBeGreaterThan(0)
})

describe('getSignedJwt', () => {
  const defaultOptions = {
    clientId: 'some-client-id',
    technicalAccountId: 'some-technical-account-id',
    orgId: 'some-org',
    clientSecret: 'some-secret',
    privateKey: 'my-private-key-123'
  }

  const optionDefaults = {
    metaScopes: [
      'https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk',
      'https://ims-na1.adobelogin.com/s/ent_marketing_sdk',
      'https://ims-na1.adobelogin.com/s/ent_campaign_sdk',
      'https://ims-na1.adobelogin.com/s/ent_adobeio_sdk',
      'https://ims-na1.adobelogin.com/s/ent_audiencemanagerplatform_sdk'
    ],
    ims: 'https://ims-na1.adobelogin.com',
    passphrase: ''
  }

  const token = 'abc123'
  const algorithm = 'RS256'
  const nowDateMs = new Date('2023-07-31T15:55:24.408Z').valueOf()
  let dateNowSpy

  beforeEach(() => {
    jwt.sign.mockReturnValue(token)
    dateNowSpy = jest.spyOn(Date, 'now')
      .mockImplementation(() =>
        nowDateMs
      )
  })

  afterEach(() => {
    jwt.sign.mockReset()
    dateNowSpy.mockReset()
  })

  test('required parameters missing', async () => {
    const options = {}
    return expect(getSignedJwt(options)).rejects.toThrow('Required parameter(s) clientId, technicalAccountId, orgId, clientSecret, privateKey are missing')
  })

  test('set all valid parameters', async () => {
    const options = {
      ...defaultOptions,
      metaScopes: ['https://ims-na1.adobelogin.com/s/ent_campaign_sdk'],
      ims: 'https://ims'
    }

    const jwtPayload = createJwtPayload(options, nowDateMs)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: optionDefaults.passphrase
      },
      {
        algorithm
      }
    )
  })

  test('metascopes as a csv', async () => {
    const options = {
      ...defaultOptions,
      metaScopes: 'https://ims-na1.adobelogin.com/s/ent_campaign_sdk,https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk',
      ims: 'https://ims'
    }

    const jwtPayload = createJwtPayload(options, nowDateMs)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: optionDefaults.passphrase
      },
      {
        algorithm
      }
    )
  })

  test('metascopes empty array, ims empty string', async () => {
    const options = {
      ...defaultOptions,
      metaScopes: [],
      ims: ''
    }

    await expect(getSignedJwt(options)).rejects.toThrow('Required parameter(s) metaScopes, ims are missing')
  })

  test('metascopes not https', async () => {
    const options = {
      ...defaultOptions,
      metaScopes: 'ent_campaign_sdk,ent_analytics_bulk_ingest_sdk',
      ims: 'https://ims'
    }

    const jwtPayload = createJwtPayload(options, nowDateMs)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: optionDefaults.passphrase
      },
      {
        algorithm
      }
    )
  })

  test('set all valid parameters (use defaults)', async () => {
    const jwtPayload = createJwtPayload({
      ...defaultOptions,
      ...optionDefaults
    }, nowDateMs)

    await expect(getSignedJwt(defaultOptions)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: defaultOptions.privateKey,
        passphrase: optionDefaults.passphrase
      },
      {
        algorithm
      }
    )
  })
})

describe('getJWTToken', () => {
  const jwtSignOptions = {
    clientId: 'some-client-id',
    technicalAccountId: 'some-technical-account-id',
    orgId: 'some-org',
    clientSecret: 'some-secret',
    privateKey: 'my-private-key-123'
  }
  const defaultOptions = {
    clientId: 'some-client-id',
    clientSecret: 'some-client-secret'
  }
  const signedJwtToken = 'abc123'

  beforeEach(() => {
    jwt.sign.mockReturnValue('some-token')
  })

  afterEach(() => {
    jwt.sign.mockReset()
    fetch.mockReset()
  })

  test('with signedJwt', async () => {
    const json = {
      access_token: 'xyz123456'
    }

    fetch.mockImplementation(() => createResponsePromise({ jsonReturnValue: json }))
    await expect(getJWTToken(defaultOptions, signedJwtToken)).resolves.toEqual(json)
  })

  test('without signedJwt', async () => {
    const options = {
      ...jwtSignOptions,
      ...defaultOptions
    }
    const json = {
      access_token: 'xyz123456'
    }

    fetch.mockImplementation(() => createResponsePromise({ jsonReturnValue: json }))
    await expect(getJWTToken(options)).resolves.toEqual(json)
  })

  test('exchange jwt, no access token and no error', async () => {
    const json = {}

    fetch.mockImplementation(() => createResponsePromise({ ok: false, status: 400, jsonReturnValue: json }))
    await expect(getJWTToken(defaultOptions, signedJwtToken)).rejects.toThrow(
      `An unknown error occurred while swapping jwt. The response is as follows: ${JSON.stringify(json)}`)
  })

  test('exchange jwt, no access token has error', async () => {
    const json = {
      error: 'my-error',
      error_description: 'my-error-description'
    }

    fetch.mockImplementation(() => createResponsePromise({ ok: false, status: 400, jsonReturnValue: json }))
    await expect(getJWTToken(defaultOptions, signedJwtToken)).rejects.toThrow(`${json.error}: ${json.error_description}`)
  })
})

describe('getOauthToken', () => {
  const actionUrl = 'https://some.server'
  beforeEach(() => {
  })

  afterEach(() => {
    fetch.mockReset()
  })

  test('no errors', async () => {
    const json = {
      access_token: 'xyz123456'
    }

    fetch.mockImplementation(() => createResponsePromise({ jsonReturnValue: json }))
    await expect(getOauthToken(actionUrl)).resolves.toEqual(json)
  })

  test('no access token, no error', async () => {
    const json = {}

    fetch.mockImplementation(() => createResponsePromise({ jsonReturnValue: json }))
    await expect(getOauthToken(actionUrl)).rejects.toThrow(
      `An unknown error occurred fetching oauth token. The response is as follows: ${JSON.stringify(json)}`)
  })

  test('no access token, has error', async () => {
    const json = {
      error: 'my-error',
      error_description: 'my-error-description'
    }

    fetch.mockImplementation(() => createResponsePromise({ jsonReturnValue: json }))
    await expect(getOauthToken(actionUrl)).rejects.toThrow(`${json.error}: ${json.error_description}`)
  })
})
