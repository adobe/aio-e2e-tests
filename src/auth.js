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
const FormData = require('form-data')

/**
 * @param {string} env ims env
 * @param {string} clientId clientId
 * @param {string} clientSecret clientSecret
 * @param {string} orgId imsOrgId
 * @param {string} scopes coma separated string
 * @returns {{ access_token: string }} ims response
 */
async function getAccessTokenByClientCredentials (env, clientId, clientSecret, orgId, scopes) {
  const IMS_ENDPOINTS = {
    stage: 'https://ims-na1-stg1.adobelogin.com',
    prod: 'https://ims-na1.adobelogin.com'
  }
  const endpoint = IMS_ENDPOINTS[env]
  if (!endpoint) {
    throw new Error(`IMS_ENV must be one of "${Object.keys(IMS_ENDPOINTS)}"`)
  }

  // prepare the data with common data
  const postData = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    org_id: orgId,
    scope: scopes
  }
  const form = new FormData()
  Object.entries(postData).forEach(([k, v]) =>
    form.append(k, v)
  )

  let res
  try {
    res = await fetch(
      IMS_ENDPOINTS[env] + '/ims/token/v2',
      {
        method: 'POST',
        headers: form.getHeaders(),
        body: form
      }
    )
  } catch (e) {
    throw new Error(`cannot send request to IMS: ${e.message}`)
  }

  if (res.ok) {
    return res.json()
  }
  throw new Error(`error response from IMS with status: ${res.status} and body: ${await res.text()}`)
}

module.exports = {
  getAccessTokenByClientCredentials
}
