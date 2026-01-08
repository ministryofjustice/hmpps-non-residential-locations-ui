import nock from 'nock'
import { createClient } from 'redis'
import config from '../config'
import LocationsApiClient from './locationsApiClient'

describe('LocationsApiClient', () => {
  const token = { access_token: 'token-1', expires_in: 300 }
  const redisClient = {
    cache: {} as { [key: string]: string },
    async get(key: string) {
      return Promise.resolve(redisClient.cache[key])
    },
    async set(key: string, value: string) {
      redisClient.cache[key] = value
      return Promise.resolve(true)
    },
    async del(key: string) {
      delete redisClient.cache[key]
      return Promise.resolve(true)
    },
  }

  let fakeApi: nock.Scope
  let locationsApiClient: LocationsApiClient

  beforeEach(() => {
    fakeApi = nock(config.apis.locationsApi.url)
    locationsApiClient = new LocationsApiClient(redisClient as unknown as ReturnType<typeof createClient>, null)
    redisClient.cache = {}
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getNonResidentialLocationByLocalName', () => {
    it('should return data from api', async () => {
      const response = { id: 'LOC-1', localName: 'Gym' }

      fakeApi
        .get('/locations/non-residential/prison/MDI/local-name/Gym')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await locationsApiClient.locations.getNonResidentialLocationByLocalName(token.access_token, {
        prisonId: 'MDI',
        localName: 'Gym',
      })
      expect(output).toEqual(response)
    })

    it('should reject with an error when API returns 404', async () => {
      const errorBody = { status: 404, errorCode: 'DATA_NOT_FOUND', userMessage: 'Location not found' }

      fakeApi
        .get('/locations/non-residential/prison/MDI/local-name/Missing')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(404, errorBody)

      const call = locationsApiClient.locations.getNonResidentialLocationByLocalName(token.access_token, {
        prisonId: 'MDI',
        localName: 'Missing',
      })

      await expect(call).rejects.toThrow()
    })
  })
})
