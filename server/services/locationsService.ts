import LocationsApiClient from '../data/locationsApiClient'

export default class LocationsService {
  constructor(private readonly locationsApiClient: LocationsApiClient) {}

  getCurrentTime() {
    return this.locationsApiClient.getCurrentTime()
  }
}
