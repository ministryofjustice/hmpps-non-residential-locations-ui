import {
  defaultClient,
  DistributedTracingModes,
  getCorrelationContext,
  setup,
  type TelemetryClient,
} from 'applicationinsights'
import { type NextFunction, Request, type Response } from 'express'
import type { TelemetryItem } from 'applicationinsights/out/src/declarations/generated'
import type { ApplicationInfo } from '../applicationInfo'

export type ContextObject = {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  [name: string]: any
}

export function initialiseAppInsights(): void {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(
  { applicationName, buildNumber }: ApplicationInfo,
  overrideName?: string,
): TelemetryClient {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    defaultClient.context.tags['ai.cloud.role'] = overrideName || applicationName
    defaultClient.context.tags['ai.application.ver'] = buildNumber
    defaultClient.addTelemetryProcessor(addUserDataToRequests)
    defaultClient.addTelemetryProcessor(ignorePathsProcessor)

    defaultClient.addTelemetryProcessor(({ tags, data }, contextObjects) => {
      const operationNameOverride = contextObjects.correlationContext?.customProperties?.getProperty('operationName')
      if (operationNameOverride) {
        /*  eslint-disable no-param-reassign */
        tags['ai.operation.name'] = operationNameOverride
        data.baseData.name = operationNameOverride
        /*  eslint-enable no-param-reassign */
      }
      return true
    })

    return defaultClient
  }
  return null
}

export function addUserDataToRequests(envelope: TelemetryItem, contextObjects: ContextObject) {
  const isRequest = envelope.data.baseType === 'RequestData'
  if (isRequest) {
    const { username, activeCaseload } = contextObjects?.['http.ServerRequest']?.res?.locals?.user || {}
    if (username) {
      const { properties } = envelope.data.baseData
      // eslint-disable-next-line no-param-reassign
      envelope.data.baseData.properties = {
        username,
        activeCaseLoadId: activeCaseload?.id,
        ...properties,
      }
    }
  }
  return true
}

export const ignorePathsProcessor = (envelope: TelemetryItem) => {
  const prefixesToIgnore = ['GET /health', 'GET /info', 'GET /metrics', 'GET /ping']

  const isRequest = envelope.data.baseType === 'RequestData'
  if (isRequest) {
    const { name } = envelope.data.baseData
    if (name) {
      return prefixesToIgnore.every(prefix => !name.startsWith(prefix))
    }
  }
  return true
}

export function appInsightsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.prependOnceListener('finish', () => {
      const context = getCorrelationContext()
      if (context && req.route) {
        const path = req.route?.path
        const pathToReport = Array.isArray(path) ? `"${path.join('" | "')}"` : path
        context.customProperties.setProperty('operationName', `${req.method} ${pathToReport}`)
      }
    })
    next()
  }
}
