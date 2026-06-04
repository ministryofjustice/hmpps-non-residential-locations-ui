import { SuperAgentRequest, Response } from 'superagent'
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

  stubNonResidentialLocationByPrisonAndLocalName: ({
    prisonId,
    localName,
    reponseStatus,
    responseBody,
  }: {
    localName?: string
    prisonId?: string
    reponseStatus?: number
    responseBody?: Record<string, unknown>
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/locations-api/locations/non-residential/prison/${prisonId}/local-name/${localName}`,
      },
      response: {
        status: reponseStatus,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: responseBody,
      },
    }),

  stubAddNonResidentialLocation: ({ prisonId }: { prisonId: string }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPath: `/locations-api/locations/non-residential/${prisonId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {},
      },
    }),

  stubNonResidentialLocationById: ({
    locationId,
    localName = 'Gym',
    prisonId = 'TST',
    status = 'ACTIVE',
    isLeafLevel = true,
  }: {
    locationId: string
    localName?: string
    prisonId?: string
    status?: string
    isLeafLevel?: boolean
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/locations-api/locations/non-residential/${locationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          id: locationId,
          prisonId,
          localName,
          code: '001',
          pathHierarchy: 'A-1-001',
          locationType: 'ADJUDICATION_ROOM',
          permanentlyInactive: false,
          usedByGroupedServices: ['ACTIVITIES_APPOINTMENTS'],
          usedByServices: ['TEST_TYPE'],
          status,
          level: 1,
          isLeafLevel,
        },
      },
    }),

  stubUpdateNonResidentialLocation: ({ locationId }: { locationId: string }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        urlPath: `/locations-api/locations/non-residential/${locationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          id: locationId,
          prisonId: 'TST',
          localName: 'Updated Location',
          code: '001',
          status: 'ACTIVE',
        },
      },
    }),

  stubNonResidentialLocation: ({
    prisonId,
    includeArchived = false,
    isLeafLevel = true,
  }: {
    prisonId: string
    includeArchived?: boolean
    isLeafLevel?: boolean
  }): SuperAgentRequest =>
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
                isLeafLevel,
              },
              ...(includeArchived
                ? [
                    {
                      id: 'archived-location-id',
                      prisonId: 'MDI',
                      localName: 'Old Chapel',
                      code: '002',
                      pathHierarchy: 'A-1-002',
                      locationType: 'ADJUDICATION_ROOM',
                      permanentlyInactive: true,
                      usedByGroupedServices: [],
                      usedByServices: [],
                      status: 'ARCHIVED',
                      level: 1,
                    },
                  ]
                : []),
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

  stubNonResidentialLocationWithStatuses: ({
    prisonId,
    locations,
  }: {
    prisonId: string
    locations: Array<{
      id: string
      localName: string
      status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    }>
  }): SuperAgentRequest =>
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
            totalElements: locations.length,
            totalPages: 1,
            size: locations.length,
            content: locations.map(loc => ({
              id: loc.id,
              prisonId,
              localName: loc.localName,
              code: loc.id.substring(0, 3),
              pathHierarchy: `A-1-${loc.id.substring(0, 3)}`,
              locationType: 'ADJUDICATION_ROOM',
              permanentlyInactive: loc.status === 'ARCHIVED',
              usedByGroupedServices: ['ACTIVITIES_APPOINTMENTS'],
              usedByServices: ['APPOINTMENT'],
              status: loc.status,
              level: 1,
            })),
            number: 0,
            first: true,
            last: true,
            sort: {
              empty: true,
              sorted: true,
              unsorted: true,
            },
            numberOfElements: locations.length,
            pageable: {
              offset: 0,
              sort: {
                empty: true,
                sorted: true,
                unsorted: true,
              },
              pageSize: 35,
              paged: true,
              pageNumber: 0,
              unpaged: false,
            },
            empty: locations.length === 0,
          },
        },
      },
    }),

  stubNonResidentialLocationMultiPage: ({
    prisonId,
    totalElements,
    defaultPageSize = 35,
  }: {
    prisonId: string
    totalElements: number
    defaultPageSize?: number
  }): Promise<Response[]> => {
    const buildLocation = (i: number) => ({
      id: `loc-${i}`,
      prisonId,
      localName: `Location ${i}`,
      code: `0${i}`,
      pathHierarchy: `A-1-0${i}`,
      locationType: 'ADJUDICATION_ROOM',
      permanentlyInactive: false,
      usedByGroupedServices: ['ACTIVITIES_APPOINTMENTS'],
      usedByServices: ['APPOINTMENT'],
      status: 'ACTIVE',
      level: 1,
      isLeafLevel: true,
    })

    const buildPage = (pageSize: number, pageNumber: number, count: number, totalPages: number) => ({
      prisonId,
      locations: {
        totalElements,
        totalPages,
        size: pageSize,
        content: Array.from({ length: count }, (_, i) => buildLocation(pageNumber * pageSize + i + 1)),
        number: pageNumber,
        first: pageNumber === 0,
        last: pageNumber === totalPages - 1,
        sort: { empty: true, sorted: true, unsorted: true },
        numberOfElements: count,
        pageable: {
          offset: pageNumber * pageSize,
          sort: { empty: true, sorted: true, unsorted: true },
          pageSize,
          paged: true,
          pageNumber,
          unpaged: false,
        },
        empty: count === 0,
      },
    })

    const totalPages = Math.ceil(totalElements / defaultPageSize)

    return Promise.all([
      stubFor({
        priority: 1,
        request: {
          method: 'GET',
          urlPath: `/locations-api/locations/non-residential/summary/${prisonId}`,
          queryParameters: { size: { equalTo: String(totalElements) } },
        },
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          jsonBody: buildPage(totalElements, 0, totalElements, 1),
        },
      }),
      stubFor({
        priority: 5,
        request: {
          method: 'GET',
          urlPath: `/locations-api/locations/non-residential/summary/${prisonId}`,
        },
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' },
          jsonBody: buildPage(defaultPageSize, 0, defaultPageSize, totalPages),
        },
      }),
    ])
  },

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

  stubLocationsConstantsServiceTypes: (attributes = { serviceFamilyType: 'TEST_TYPE', editableInParent: true }) =>
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
          nonResidentialServiceTypes: [{ key: 'TEST_TYPE', description: 'Test type', attributes }],
        },
      },
    }),

  stubGetPrisonConfiguration: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/locations-api/prison-configuration/TST',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          prisonId: 'TST',
          nonResidentialLocationConfig: {
            allowDuplicateLocalNames: false,
          },
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
            {
              key: 'ACTIVITIES_APPOINTMENTS',
              description: 'Activities and appointments',
              values: [
                { key: 'APPOINTMENT', description: 'Appointments', additionalInformation: '' },
                { key: 'ACTIVITY', description: 'Activities', additionalInformation: '' },
              ],
            },
          ],
        },
      },
    }),

  stubArchiveNonResidentialLocation: ({ locationId }: { locationId: string }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PUT',
        urlPath: `/locations-api/locations/${locationId}/deactivate/permanent`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          id: locationId,
          prisonId: 'TST',
          localName: 'Archived Location',
          code: '001',
          status: 'ARCHIVED',
        },
      },
    }),
}
