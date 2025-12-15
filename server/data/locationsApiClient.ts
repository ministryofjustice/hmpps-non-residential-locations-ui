import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import BaseApiClient from './baseApiClient'
import { RedisClient } from './redisClient'
import { Location, NonResidentialSummary } from '../@types/locationsApi/locationsApiTypes'

export default class LocationsApiClient extends BaseApiClient {
  constructor(redisClient: RedisClient, authenticationClient: AuthenticationClient) {
    super('LocationsApiClient', redisClient, config.apis.locationsApi, authenticationClient)
  }

  locations = {
    getNonResidentialSummary: this.apiCall<NonResidentialSummary, { prisonId: string; page?: string; size?: string }>({
      path: '/locations/non-residential/summary/:prisonId',
      requestType: 'get',
      queryParams: ['page', 'size'],
    }),

    getNonResidentialLocation: this.apiCall<Location, { locationId: string }>({
      path: '/locations/non-residential/:locationId',
      requestType: 'get',
    }),

    updateNonResidentialLocation: this.apiCall<
      Location,
      { locationId: string },
      { localName: string; servicesUsingLocation: string[]; status: string }
    >({
      path: '/locations/non-residential/:locationId',
      requestType: 'put',
    }),
  }

  constants = {
    getNonResidentialUsageTypes: this.apiCall<
      { nonResidentialUsageTypes: { key: string; description: string }[] },
      null
    >({
      path: '/constants/non-residential-usage-type',
      requestType: 'get',
      options: { cacheDuration: 86_400 },
    }),
    getServiceTypes: this.apiCall<
      { nonResidentialServiceTypes: { key: string; description: string; attributes: unknown }[] },
      null
    >({
      path: '/constants/service-types',
      requestType: 'get',
      options: { cacheDuration: 86_400 },
    }),
    getServiceFamilyTypes: this.apiCall<
      {
        serviceFamilyTypes: {
          key: string
          description: string
          values: { key: string; description: string; additionalInformation?: string }[]
        }[]
      },
      null
    >({
      path: '/constants/service-family-types',
      requestType: 'get',
      options: { cacheDuration: 86_400 },
    }),
  }
}
