import LocationsApiClient from '../data/locationsApiClient'
import { Constant, CompoundConstant } from '../@types/locationsApi/locationsApiTypes'

export default class LocationsService {
  constructor(private readonly locationsApiClient: LocationsApiClient) {}

  async getNonResidentialLocations(token: string, prisonId: string, page?: string) {
    return this.locationsApiClient.locations.getNonResidentialSummary(token, { prisonId, page, size: '35' })
  }

  async getNonResidentialLocationByLocalName(token: string, prisonId: string, localName: string) {
    try {
      const location = await this.locationsApiClient.locations.getNonResidentialLocationByLocalName(token, {
        prisonId,
        localName,
      })

      return location
    } catch (error) {
      if (error?.responseStatus === 404) {
        return null
      }
      throw error
    }
  }

  async getNonResidentialLocationDetails(token: string, locationId: string) {
    return this.locationsApiClient.locations.getNonResidentialLocation(token, { locationId })
  }

  async updateNonResidentialLocationDetails(
    token: string,
    locationId: string,
    localName?: string,
    servicesUsingLocation?: [],
    status?: string,
  ) {
    return this.locationsApiClient.locations.updateNonResidentialLocation(
      token,
      { locationId },
      { localName, servicesUsingLocation, status },
    )
  }

  async getNonResidentialUsageTypes(token: string) {
    return (await this.locationsApiClient.constants.getNonResidentialUsageTypes(token)).nonResidentialUsageTypes
  }

  async getServiceTypes(token: string) {
    return (await this.locationsApiClient.constants.getServiceTypes(token)).nonResidentialServiceTypes
  }

  async getServiceFamilyTypes(token: string) {
    return (await this.locationsApiClient.constants.getServiceFamilyTypes(token)).serviceFamilyTypes
  }

  private async getConstantDataMap(token: string, apiCallName: keyof LocationsApiClient['constants']) {
    return Object.fromEntries(
      Object.values(await this.locationsApiClient.constants[apiCallName](token))[0].map(
        (i: Constant | CompoundConstant) => [i.key, i.description],
      ),
    )
  }
}
