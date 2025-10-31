import LocationsApiClient from '../data/locationsApiClient'

export default class LocationsService {
  constructor(private readonly locationsApiClient: LocationsApiClient) {}

  async getNonResidentialLocations(token: string, prisonId: string) {
    return this.locationsApiClient.locations.getNonResidentialSummary(token, { prisonId })
  }
}
