import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import BaseApiClient from './baseApiClient'
import { RedisClient } from './redisClient'
import { NonResidentialSummary } from '../@types/locationsApi/locationsApiTypes'

export default class LocationsApiClient extends BaseApiClient {
  constructor(redisClient: RedisClient, authenticationClient: AuthenticationClient) {
    super('LocationsApiClient', redisClient, config.apis.locationsApi, authenticationClient)
  }

  locations = {
    getNonResidentialSummary: this.apiCall<NonResidentialSummary, { prisonId: string; page?: string }>({
      path: '/locations/non-residential/summary/:prisonId',
      requestType: 'get',
      queryParams: ['page'],
    }),
  }
}
