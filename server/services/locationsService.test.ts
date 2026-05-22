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
      addNonResidentialLocation: Object.assign(jest.fn(), { clearCache: jest.fn() }),
      archiveNonResidentialLocation: Object.assign(jest.fn(), { clearCache: jest.fn() }),
      prisonConfiguration: Object.assign(jest.fn(), { clearCache: jest.fn() }),
    }
    locationsService = new LocationsService(locationsApiClient)
  })

  it('should call get non residential locations', async () => {
    await locationsService.getNonResidentialLocations('some-token', 'MDI')
    expect(locationsApiClient.locations.getNonResidentialSummary).toHaveBeenCalledWith('some-token', {
      page: undefined,
      prisonId: 'MDI',
      size: '35',
      sort: undefined,
    })
  })

  it('should pass sort param to API when provided', async () => {
    await locationsService.getNonResidentialLocations('some-token', 'MDI', '0', ['ACTIVE'], 'status,desc')
    expect(locationsApiClient.locations.getNonResidentialSummary).toHaveBeenCalledWith('some-token', {
      page: '0',
      prisonId: 'MDI',
      size: '35',
      sort: 'status,desc',
      status: 'ACTIVE',
    })
  })

  it('should get non-residential location by local name', async () => {
    await locationsService.getNonResidentialLocationByLocalName('some-token', 'MDI', 'GYM')
    expect(locationsApiClient.locations.getNonResidentialLocationByLocalName).toHaveBeenCalledWith('some-token', {
      prisonId: 'MDI',
      localName: 'GYM',
    })
  })
})
