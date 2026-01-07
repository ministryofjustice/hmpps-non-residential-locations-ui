import LocationsApiClient from '../data/locationsApiClient'
import LocationsService from './locationsService'

jest.mock('../data/locationsApiClient')

describe('LocationsService', () => {
  const locationsApiClient = new (LocationsApiClient as jest.Mock<LocationsApiClient>)()
  let locationsService: LocationsService

  beforeEach(() => {
    locationsApiClient.locations = {
      getNonResidentialSummary: Object.assign(jest.fn(), { clearCache: jest.fn() }),
      getNonResidentialLocation: Object.assign(jest.fn(), { clearCache: jest.fn() }),
      getNonResidentialLocationByLocalName: Object.assign(jest.fn(), { clearCache: jest.fn() }),
      updateNonResidentialLocation: Object.assign(jest.fn(), { clearCache: jest.fn() }),
    }
    locationsService = new LocationsService(locationsApiClient)
  })

  it('should call get non residential locations', async () => {
    await locationsService.getNonResidentialLocations('some-token', 'MDI')
    expect(locationsApiClient.locations.getNonResidentialSummary).toHaveBeenCalledWith('some-token', {
      page: undefined,
      prisonId: 'MDI',
      size: '35',
    })
  })

  it('should call get non-residential location by local name', async () => {
    await locationsService.getNonResidentialLocationByLocalName('some-token', 'MDI', 'GYM')
    expect(locationsApiClient.locations.getNonResidentialLocationByLocalName).toHaveBeenCalledWith('some-token', {
      prisonId: 'MDI',
      localName: 'GYM',
    })
  })

  it('should return single location', async () => {
    const apiResp = { id: 'LOC-1', localName: 'GYM' }
    ;(locationsApiClient.locations.getNonResidentialLocationByLocalName as unknown as jest.Mock).mockResolvedValue(
      apiResp,
    )

    const result = await locationsService.getNonResidentialLocationByLocalName('some-token', 'MDI', 'GYM')

    expect(result).toEqual(apiResp)
  })

  it('should return null when api responds with 404', async () => {
    ;(locationsApiClient.locations.getNonResidentialLocationByLocalName as unknown as jest.Mock).mockRejectedValue({
      responseStatus: 404,
    })

    const result = await locationsService.getNonResidentialLocationByLocalName('some-token', 'MDI', 'MISSING')

    expect(result).toEqual(null)
  })

  it('should rethrow non-404 errors for local-name lookup', async () => {
    const err = { status: 500 }
    ;(locationsApiClient.locations.getNonResidentialLocationByLocalName as unknown as jest.Mock).mockRejectedValue(err)

    await expect(locationsService.getNonResidentialLocationByLocalName('some-token', 'MDI', 'GYM')).rejects.toBe(err)
  })
})
