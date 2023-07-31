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
  getSignedJwt,
  getJWTToken,
  getOauthToken
} = require('../src/auth')
const jwt = require('jsonwebtoken')

jest.mock('jsonwebtoken')

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

  const token = 'abc123'
  const nowDate = new Date('2023-07-31T15:55:24.408Z')
  let dateNowSpy

  /** @private */
  function createJwtPayload (options, nowDate) {
    let m = options.metaScopes
    if (m.constructor !== Array) {
      m = m.split(',')
    }

    const metaScopes = {}
    m.forEach(m => {
      if (m.startsWith('https')) {
        metaScopes[m] = true
      } else {
        metaScopes[`${options.ims}/s/${m}`] = true
      }
    })

    return {
      aud: `${options.ims}/c/${options.clientId}`,
      exp: Math.round(JWT_EXPIRY_SECONDS + nowDate.valueOf() / 1000),
      ...metaScopes,
      iss: options.orgId,
      sub: options.technicalAccountId
    }
  }

  beforeEach(() => {
    jwt.sign.mockReturnValue(token)
    dateNowSpy = jest.spyOn(Date, 'now')
      .mockImplementation(() =>
        nowDate.valueOf()
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

    const jwtPayload = createJwtPayload(options, nowDate)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: ''
      },
      {
        algorithm: 'RS256'
      }
    )
  })

  test('metascopes as a csv', async () => {
    const options = {
      ...defaultOptions,
      metaScopes: 'https://ims-na1.adobelogin.com/s/ent_campaign_sdk,https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk',
      ims: 'https://ims'
    }

    const jwtPayload = createJwtPayload(options, nowDate)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: ''
      },
      {
        algorithm: 'RS256'
      }
    )
  })

  test('metascopes not https', async () => {
    const options = {
      ...defaultOptions,
      metaScopes: 'ent_campaign_sdk,ent_analytics_bulk_ingest_sdk',
      ims: 'https://ims'
    }

    const jwtPayload = createJwtPayload(options, nowDate)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: ''
      },
      {
        algorithm: 'RS256'
      }
    )
  })

  test('set all valid parameters (use defaults)', async () => {
    const options = {
      ...defaultOptions
    }

    const jwtPayload = createJwtPayload({
      ...options,
      metaScopes: [
        'https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk',
        'https://ims-na1.adobelogin.com/s/ent_marketing_sdk',
        'https://ims-na1.adobelogin.com/s/ent_campaign_sdk',
        'https://ims-na1.adobelogin.com/s/ent_adobeio_sdk',
        'https://ims-na1.adobelogin.com/s/ent_audiencemanagerplatform_sdk'
      ],
      ims: 'https://ims-na1.adobelogin.com'
    }, nowDate)

    await expect(getSignedJwt(options)).resolves.toEqual(token)
    expect(jwt.sign).toHaveBeenCalledWith(
      jwtPayload,
      {
        key: options.privateKey,
        passphrase: ''
      },
      {
        algorithm: 'RS256'
      }
    )
  })
})

// describe('getJWTToken', () => {
// })

// describe('getOauthToken', () => {
// })
