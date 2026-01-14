import { asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import { randomUUID } from 'crypto'
import config from '../config'
import logger from '../../logger'
import { RedisClient } from './redisClient'

export default class BaseApiClient extends RestClient {
  constructor(
    name: string,
    protected readonly redisClient: RedisClient,
    _config: typeof config.apis.locationsApi,
    authenticationClient: AuthenticationClient,
  ) {
    super(name, _config, logger, authenticationClient)
  }

  protected apiCall<
    ReturnType extends object | string,
    Parameters extends { [k: string]: string },
    Data extends Record<string, unknown> | string[] | string = undefined,
  >({
    path,
    queryParams,
    requestType,
    options,
  }: {
    path: string
    queryParams?: string[]
    requestType: 'get' | 'post' | 'put' | 'delete' | 'patch'
    options?: {
      cacheDuration: number
    }
  }) {
    const func = async (
      token: string,
      parameters: Parameters = {} as never,
      data: Data = undefined,
    ): Promise<ReturnType> => {
      const filledPath = path.replace(/:(\w+)/g, (_, name) => parameters[name])
      const query = queryParams?.length ? Object.fromEntries(queryParams.map(p => [p, parameters[p]])) : undefined

      const uuid: string = randomUUID()
      const cacheDuration = options?.cacheDuration || 0
      if (cacheDuration && this.redisClient) {
        logger.debug(`Getting ${filledPath} from redis uuid ${uuid}`)
        const cachedResult = await this.redisClient.get(filledPath)
        logger.debug(`Getting ${filledPath} from redis complete uuid ${uuid}`)
        if (cachedResult) {
          logger.debug(`Found ${filledPath} in redis, value: ${cachedResult} uuid ${uuid}`)

          if (typeof cachedResult === 'string') {
            return JSON.parse(cachedResult)
          }

          return cachedResult as ReturnType
        }
      }

      logger.debug(
        `${requestType.toUpperCase()} ${filledPath} with query ${JSON.stringify(query)} - params ${JSON.stringify(parameters)} - data ${JSON.stringify(data)} uuid ${uuid}`,
      )
      const result = await this[requestType]<ReturnType>(
        {
          path: filledPath,
          query,
          data,
        },
        asUser(token),
      )
      logger.debug(
        `${requestType.toUpperCase()} ${filledPath} with query ${JSON.stringify(query)} - params ${JSON.stringify(parameters)} - data ${JSON.stringify(data)} uuid ${uuid} complete`,
      )

      if (cacheDuration && this.redisClient) {
        logger.debug(
          `Setting ${filledPath} in redis for ${cacheDuration} seconds, value: ${JSON.stringify(result)} uuid ${uuid}`,
        )
        await this.redisClient.set(filledPath, JSON.stringify(result), { EX: cacheDuration })
        logger.debug(
          `Setting ${filledPath} in redis for ${cacheDuration} seconds, value: ${JSON.stringify(result)} uuid ${uuid} complete`,
        )
      }

      return result
    }
    func.clearCache = async (parameters: Parameters = {} as never) => {
      const filledPath = path.replace(/:(\w+)/g, (_, name) => parameters[name])
      if (this.redisClient) {
        await this.redisClient.del(filledPath)
      }
    }
    return func as typeof func & { clearCache: typeof func.clearCache }
  }
}
