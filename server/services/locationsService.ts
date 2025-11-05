import LocationsApiClient from '../data/locationsApiClient'

export default class LocationsService {
  constructor(private readonly locationsApiClient: LocationsApiClient) {}

  async getNonResidentialLocations(token: string, prisonId: string, page?: string) {
    return this.locationsApiClient.locations.getNonResidentialSummary(token, { prisonId, page, size: '35' })
  }
}
