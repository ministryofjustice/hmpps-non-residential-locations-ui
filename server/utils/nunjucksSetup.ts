import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { isFunction } from 'lodash'
import { initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'
import locationStatusTagLabel from '../formatters/locationStatusTagLabel'
import locationStatusTagClass from '../formatters/locationStatusTagClass'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  const { locals } = app
  locals.asset_path = '/assets/'
  locals.applicationName = 'Non-residential locations'
  locals.environmentName = config.environmentName
  locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  function callAsMacro(name: string) {
    const macro = this.ctx[name]

    if (!isFunction(macro)) {
      // eslint-disable-next-line no-console
      console.log(`'${name}' macro does not exist`)
      return () => ''
    }

    return macro
  }

  njkEnv.addGlobal('callAsMacro', callAsMacro)
  njkEnv.addGlobal('applicationInsightsConnectionString', process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  njkEnv.addGlobal('applicationInsightsRoleName', 'hmpps-non-residential-locations-ui')

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('locationStatusTagClass', locationStatusTagClass)
  njkEnv.addFilter('locationStatusTagLabel', locationStatusTagLabel)

  njkEnv.addFilter('formatText', function formatText(str) {
    if (!str) return ''
    const cleaned = str.replace(/_/g, ' ').toLowerCase()
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  })

  njkEnv.addFilter('toYesNo', function toYesNo(str, yesVal) {
    if (!str) return ''
    return str === yesVal ? 'Yes' : 'No'
  })
}
