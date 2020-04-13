/*
Copyright 2019 Adobe. All rights reserved.
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
const FormData = require('form-data')

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

async function getJWTToken (options) {
  let {
    clientId,
    technicalAccountId,
    orgId,
    clientSecret,
    privateKey,
    passphrase = '',
    metaScopes = [
      'https://ims-na1.adobelogin.com/s/ent_campaign_sdk',
      'https://ims-na1.adobelogin.com/s/ent_marketing_sdk'],
    ims = 'https://ims-na1.adobelogin.com'
  } = options

  const errors = []
  if (!clientId) errors.push('clientId')
  if (!technicalAccountId) errors.push('technicalAccountId')
  if (!orgId) errors.push('orgId')
  if (!clientSecret) errors.push('clientSecret')
  if (!privateKey)errors.push('privateKey')
  if (!metaScopes || metaScopes.length === 0) errors.push('metaScopes')
  if (errors.length > 0) {
    throw new Error(`Required parameter(s) ${errors.join(', ')} are missing`)
  }

  if (metaScopes.constructor !== Array) {
    metaScopes = metaScopes.split(',')
  }

  const jwtPayload = {
    exp: Math.round(300 + Date.now() / 1000),
    iss: orgId,
    sub: technicalAccountId,
    aud: `${ims}/c/${clientId}`
  }

  for (let i = 0; i < metaScopes.length; i++) {
    if (metaScopes[i].indexOf('https') > -1) {
      jwtPayload[metaScopes[i]] = true
    } else {
      jwtPayload[`${ims}/s/${metaScopes[i]}`] = true
    }
  }

  const token = jwt.sign(
    jwtPayload,
    { key: privateKey, passphrase },
    { algorithm: 'RS256' }
  )

  const form = new FormData()
  form.append('client_id', clientId)
  form.append('client_secret', clientSecret)
  form.append('jwt_token', token)

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
  getJWTToken: getJWTToken,
  getOauthToken: getOauthToken
}
