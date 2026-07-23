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
    serviceFamilyTypes?: string[],
    localName?: string,
    pageSize: number = 35,
  ) {
    return this.locationsApiClient.locations.getNonResidentialSummary(token, {
      prisonId,
      page,
      size: pageSize.toString(),
      status: status?.length ? status.join(',') : undefined,
      localName,
      serviceFamilyType: serviceFamilyTypes?.length ? serviceFamilyTypes.join(',') : undefined,
      sort,
    })
  }

  async getNonResidentialLocationCount(
    token: string,
    prisonId: string,
    status: string[],
    serviceFamilyTypes?: string[],
  ): Promise<number> {
    const result = await this.locationsApiClient.locations.getNonResidentialSummary(token, {
      prisonId,
      size: '1',
      status: status.join(','),
      serviceFamilyType: serviceFamilyTypes?.length ? serviceFamilyTypes.join(',') : undefined,
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
    localName: string | null,
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

  // Removes a parent location from the non-residential locations list (MAPB-670). Presented to
  // users as archiving, but nothing is deactivated - the location and its children are unaffected.
  async hideNonResidentialLocation(token: string, locationId: string) {
    return this.locationsApiClient.locations.hideNonResidentialLocation(token, { locationId })
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
