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
        urlPath: `/locations-api/locations/non-residential/summary/${prisonId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          prisonId,
          locations: {
            totalElements: 0,
            totalPages: 0,
            size: 0,
            content: [
              {
                id: '2475f250-434a-4257-afe7-b911f1773a4d',
                prisonId: 'MDI',
                localName: 'Gym',
                code: '001',
                pathHierarchy: 'A-1-001',
                locationType: 'ADJUDICATION_ROOM',
                permanentlyInactive: false,
                permanentlyInactiveReason: 'Demolished',
                usedByGroupedServices: ['ACTIVITIES_APPOINTMENTS'],
                usedByServices: ['APPOINTMENT'],
                status: 'ACTIVE',
                deactivatedDate: '2023-01-23T12:23:00',
                deactivatedReason: 'DAMAGED',
                deactivationReasonDescription: 'Window damage',
                deactivatedBy: 'string',
                level: 1,
                parentId: '57718979-573c-433a-9e51-2d83f887c11c',
              },
            ],
            number: 0,
            first: true,
            last: true,
            sort: {
              empty: true,
              sorted: true,
              unsorted: true,
            },
            numberOfElements: 0,
            pageable: {
              offset: 0,
              sort: {
                empty: true,
                sorted: true,
                unsorted: true,
              },
              pageSize: 0,
              paged: true,
              pageNumber: 0,
              unpaged: true,
            },
            empty: true,
          },
        },
      },
    }),

  stubLocationsConstantsNonResidentialUsageType: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/locations-api/constants/non-residential-usage-type',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          nonResidentialUsageTypes: [{ key: 'TEST_TYPE', description: 'Test type' }],
        },
      },
    }),

  stubLocationsConstantsServiceTypes: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/locations-api/constants/service-types',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          nonResidentialServiceTypes: [{ key: 'TEST_TYPE', description: 'Test type' }],
        },
      },
    }),

  stubLocationsConstantsServiceFamilyTypes: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/locations-api/constants/service-family-types',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          serviceFamilyTypes: [
            {
              key: 'TEST_TYPE',
              description: 'Test type',
              values: [
                { key: 'TEST_TYPE', description: 'Test type', additionalInformation: 'Additional info for test type' },
              ],
            },
          ],
        },
      },
    }),
}
