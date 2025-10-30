import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService from '../services/auditService'
import LocationsService from '../services/locationsService'

jest.mock('../services/auditService')
jest.mock('../services/locationsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const locationsService = new LocationsService(null) as jest.Mocked<LocationsService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      auditService,
      locationsService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should redirect to view for current caseload', () => {
    auditService.logPageView.mockResolvedValue(null)
    locationsService.getNonResidentialLocations.mockResolvedValue([])

    return request(app)
      .get('/')
      .expect('Content-Type', /text\/plain; charset=utf-8/)
      .expect(302)
      .expect('location', /prison\/TST/)
  })
})

describe('GET /prison/TST', () => {
  it('should render list locations page', () => {
    auditService.logPageView.mockResolvedValue(null)
    locationsService.getNonResidentialLocations.mockResolvedValue([])

    return request(app)
      .get('/prison/TST')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        expect(locationsService.getNonResidentialLocations).toHaveBeenCalled()
      })
  })

  it('service errors are handled', () => {
    auditService.logPageView.mockResolvedValue(null)
    locationsService.getNonResidentialLocations.mockRejectedValue(new Error('Some problem calling external api!'))

    return request(app)
      .get('/prison/TST')
      .expect('Content-Type', /html/)
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Some problem calling external api!')
      })
  })
})
