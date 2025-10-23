import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubLocationsHealthPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/locations-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),

  stubNonResidentialLocation: ({ prisonId }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/locations-api/locations/prison/${prisonId}/non-residential`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            prisonId,
            localName: 'Wing A',
            usage: [
              {
                usageType: 'ADJUDICATION_HEARING',
                capacity: 0,
                sequence: 0,
              },
            ],
            status: 'ACTIVE',
          },
        ],
      },
    }),
}
