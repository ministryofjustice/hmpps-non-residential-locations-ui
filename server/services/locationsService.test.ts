import LocationsApiClient from '../data/locationsApiClient'
import LocationsService from './locationsService'

jest.mock('../data/locationsApiClient')

describe('LocationsService', () => {
  const locationsApiClient = new LocationsApiClient(null, null) as jest.Mocked<LocationsApiClient>
  let locationsService: LocationsService

  beforeEach(() => {
    locationsService = new LocationsService(locationsApiClient)
  })

  it('should call getCurrentTime on the api client and return its result', async () => {
    const expectedTime = '2025-01-01T12:00:00Z'

    locationsApiClient.getCurrentTime.mockResolvedValue(expectedTime)

    const result = await locationsService.getCurrentTime()

    expect(locationsApiClient.getCurrentTime).toHaveBeenCalledTimes(1)
    expect(result).toEqual(expectedTime)
  })
})
