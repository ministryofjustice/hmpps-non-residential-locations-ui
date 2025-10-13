import nock from 'nock'
// import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
// import { createClient } from 'redis'
// import LocationsApiClient from './locationsApiClient'
// import { redisClient } from './redisClient'

describe('LocationsApiClient', () => {
  // let locationsApiClient: LocationsApiClient
  // let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    // mockAuthenticationClient = {
    //   getToken: jest.fn().mockResolvedValue('test-system-token'),
    // } as unknown as jest.Mocked<AuthenticationClient>
    // locationsApiClient = new LocationsApiClient(
    //   redisClient as unknown as ReturnType<typeof createClient>,
    //   mockAuthenticationClient,
    // )
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it.skip('should test something', () => {})
})
