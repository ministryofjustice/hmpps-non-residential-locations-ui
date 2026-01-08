import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import BaseApiClient from './baseApiClient'
import { RedisClient } from './redisClient'
import { Location, NonResidentialSummary, Constant, CompoundConstant } from '../@types/locationsApi/locationsApiTypes'

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

    getNonResidentialLocationByLocalName: this.apiCall<Location, { prisonId: string; localName: string }>({
      path: '/locations/non-residential/prison/:prisonId/local-name/:localName',
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
    getNonResidentialUsageTypes: this.apiCall<{ nonResidentialUsageTypes: Constant[] }, null>({
      path: '/constants/non-residential-usage-type',
      requestType: 'get',
      options: { cacheDuration: 86_400 },
    }),
    getServiceTypes: this.apiCall<{ nonResidentialServiceTypes: Constant[] }, null>({
      path: '/constants/service-types',
      requestType: 'get',
      options: { cacheDuration: 86_400 },
    }),
    getServiceFamilyTypes: this.apiCall<{ serviceFamilyTypes: CompoundConstant[] }, null>({
      path: '/constants/service-family-types',
      requestType: 'get',
      options: { cacheDuration: 86_400 },
    }),
  }
}
