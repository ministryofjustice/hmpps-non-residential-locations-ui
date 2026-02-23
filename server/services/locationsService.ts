import LocationsApiClient from '../data/locationsApiClient'
import { Constant, CompoundConstant } from '../@types/locationsApi/locationsApiTypes'

export default class LocationsService {
  constructor(private readonly locationsApiClient: LocationsApiClient) {}

  async getNonResidentialLocations(
    token: string,
    prisonId: string,
    page?: string,
    status?: string[],
    sort?: string | string[],
    serviceType?: string,
    localName?: string,
  ) {
    return this.locationsApiClient.locations.getNonResidentialSummary(token, {
      prisonId,
      page,
      size: '35',
      status: status?.join(','),
      localName,
      serviceType,
      sort,
    })
  }

  async getNonResidentialLocationCount(token: string, prisonId: string, status: string[]): Promise<number> {
    const result = await this.locationsApiClient.locations.getNonResidentialSummary(token, {
      prisonId,
      size: '1',
      status: status.join(','),
    })
    return result.locations.totalElements
  }

  async getNonResidentialLocationByLocalName(token: string, prisonId: string, localName: string) {
    return this.locationsApiClient.locations.getNonResidentialLocationByLocalName(token, {
      prisonId,
      localName,
    })
  }

  async getNonResidentialLocationDetails(token: string, locationId: string) {
    return this.locationsApiClient.locations.getNonResidentialLocation(token, { locationId })
  }

  async updateNonResidentialLocationDetails(
    token: string,
    locationId: string,
    localName: string,
    servicesUsingLocation: string[],
    active?: boolean,
  ) {
    return this.locationsApiClient.locations.updateNonResidentialLocation(
      token,
      { locationId },
      { localName, servicesUsingLocation, active },
    )
  }

  async addNonResidentialLocation(
    token: string,
    prisonId: string,
    data: { localName: string; servicesUsingLocation: string[]; status: string },
  ) {
    return this.locationsApiClient.locations.addNonResidentialLocation(token, { prisonId }, data)
  }

  async archiveNonResidentialLocation(token: string, locationId: string) {
    return this.locationsApiClient.locations.archiveNonResidentialLocation(
      token,
      { locationId },
      { reason: 'Location archived' },
    )
  }

  async getPrisonConfiguration(token: string, prisonId: string) {
    return this.locationsApiClient.locations.prisonConfiguration(token, { prisonId })
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
