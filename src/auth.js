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

/* eslint-disable camelcase */

const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')

const JWT_EXPIRY_SECONDS = 1200 // 20 minutes

/**
 * Create a jwt payload.
 *
 * @param {object} options see getSignedJwt
 * @param {Date} nowDate the current Date
 * @returns {object} the payload
 */
function createJwtPayload (options, nowDate) {
  let m = options.metaScopes
  if (!Array.isArray(m)) {
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

/**
 * Gets an OAuth token.
 *
 * @param {string} actionURL the url to fetch the token from
 * @returns {object} the token data
 */
async function getOauthToken (actionURL) {
  const postOptions = {
    method: 'POST'
  }

  const res = await fetch(actionURL, postOptions)
  const json = await res.json()
  const { access_token, error, error_description } = json
  if (!access_token) {
    if (error && error_description) {
      throw new Error(`${error}: ${error_description}`)
    } else {
      throw new Error(`An unknown error occurred fetching oauth token. The response is as follows: ${JSON.stringify(json)}`)
    }
  }
  return json
}

/**
 * Gets a signed JWT.
 *
 * @param {object} options all the options for generating the JWT
 * @param {string} options.clientId the jwt client id
 * @param {string} options.technicalAccountId the technical account id of the credential
 * @param {string} options.orgId the org id of the credential
 * @param {string} options.clientSecret the jwt client secret
 * @param {string} options.privateKey the jwt private key
 * @param {string} [options.passphrase=''] the passphrase for private key, if set
 * @param {Array<string>} options.metaScopes all the metascopes for the services tied to the credential
 * @param {string} [options.ims='https://ims-na1.adobelogin.com'] the IMS endpoint
 * @returns {string} the signed jwt
 */
async function getSignedJwt (options) {
  const {
    clientId,
    technicalAccountId,
    orgId,
    clientSecret,
    privateKey,
    passphrase = '',
    metaScopes = [
      'https://ims-na1.adobelogin.com/s/ent_analytics_bulk_ingest_sdk',
      'https://ims-na1.adobelogin.com/s/ent_marketing_sdk',
      'https://ims-na1.adobelogin.com/s/ent_campaign_sdk',
      'https://ims-na1.adobelogin.com/s/ent_adobeio_sdk',
      'https://ims-na1.adobelogin.com/s/ent_audiencemanagerplatform_sdk'
    ],
    ims = 'https://ims-na1.adobelogin.com'
  } = options

  const errors = []
  if (!clientId) { errors.push('clientId') }
  if (!technicalAccountId) { errors.push('technicalAccountId') }
  if (!orgId) { errors.push('orgId') }
  if (!clientSecret) { errors.push('clientSecret') }
  if (!privateKey) { errors.push('privateKey') }
  if (!metaScopes || metaScopes.length === 0) { errors.push('metaScopes') }
  if (!ims) { errors.push('ims') }
  if (errors.length > 0) {
    throw new Error(`Required parameter(s) ${errors.join(', ')} are missing`)
  }

  const jwtPayload = createJwtPayload({ // potentially add the defaults, to options
    ...options,
    passphrase,
    metaScopes,
    ims
  }, new Date(Date.now()))

  const token = jwt.sign(
    jwtPayload,
    { key: privateKey, passphrase },
    { algorithm: 'RS256' }
  )

  return token
}

/**
 * Gets an OAuth token by exchanging a JWT.
 *
 * @param {object} options the parameters to send to the jwt exchange endpoint
 * @param {string} options.clientId the jwt client id
 * @param {string} options.clientSecret the jwt client secret
 * @param {string} [options.ims='https://ims-na1.adobelogin.com'] the IMS endpoint
 * @param {string} signedJwt the signed JWT
 * @returns {object} the access token
 */
async function getJWTToken (options, signedJwt) {
  const {
    clientId,
    clientSecret,
    ims = 'https://ims-na1.adobelogin.com'
  } = options

  if (!signedJwt) {
    signedJwt = await getSignedJwt(options)
  }

  const form = new FormData()
  form.append('client_id', clientId)
  form.append('client_secret', clientSecret)
  form.append('jwt_token', signedJwt)

  const postOptions = {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  }

  const res = await fetch(`${ims}/ims/exchange/jwt/`, postOptions)
  const json = await res.json()
  const { access_token, error, error_description } = json
  if (!access_token) {
    if (error && error_description) {
      throw new Error(`${error}: ${error_description}`)
    } else {
      throw new Error(`An unknown error occurred while swapping jwt. The response is as follows: ${JSON.stringify(json)}`)
    }
  }
  return json
}

module.exports = {
  JWT_EXPIRY_SECONDS,
  createJwtPayload,
  getSignedJwt,
  getJWTToken,
  getOauthToken
}
