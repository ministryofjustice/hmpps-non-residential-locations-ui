import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import AuditService from '../services/auditService'
import LocationsService from '../services/locationsService'
import type { NonResidentialSummary } from '../@types/locationsApi/locationsApiTypes'

jest.mock('../services/auditService')
jest.mock('../services/locationsService')

const auditService = new AuditService(null) as jest.Mocked<AuditService>
const locationsService = new LocationsService(null) as jest.Mocked<LocationsService>

let app: Express

const mockLocationsResponse: NonResidentialSummary = {
  prisonId: 'TST',
  locations: {
    numberOfElements: 2,
    content: [
      {
        id: '1',
        prisonId: 'TST',
        localName: 'Gym',
        code: 'GYM',
        pathHierarchy: 'GYM',
        locationType: 'APPOINTMENTS',
        status: 'ACTIVE',
        usedByGroupedServices: [],
        usedByServices: [],
        active: true,
        level: 1,
        permanentlyInactive: false,
      },
      {
        id: '2',
        prisonId: 'TST',
        localName: 'Chapel',
        code: 'CHAPEL',
        pathHierarchy: 'CHAPEL',
        locationType: 'APPOINTMENTS',
        status: 'ACTIVE',
        usedByGroupedServices: [],
        usedByServices: [],
        active: true,
        level: 1,
        permanentlyInactive: false,
      },
    ],
    pageable: { pageSize: 100, pageNumber: 0 },
    totalElements: 2,
    totalPages: 1,
  },
}

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  beforeEach(() => {
    app = appWithAllRoutes({
      services: { auditService, locationsService },
      userSupplier: () => user,
    })
  })

  it('should redirect to view for current caseload', () => {
    auditService.logPageView.mockResolvedValue(null)

    return request(app)
      .get('/')
      .expect('Content-Type', /text\/plain; charset=utf-8/)
      .expect(302)
      .expect('location', /prison\/TST/)
  })
})

describe('GET /prison/TST', () => {
  describe('for view-only user', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: () => false,
      })
    })

    it('should render page with "View non-residential locations" heading', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('View non-residential locations')
        })
    })

    it('should have correct page title for view user', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('<title>View non-residential locations')
          expect(res.text).not.toContain('<title>Edit non-residential locations')
        })
    })

    it('should not display Actions column', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).not.toMatch(/<th[^>]*>Actions<\/th>/)
        })
    })

    it('should render breadcrumb with "View non-residential locations"', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('View non-residential locations')
        })
    })

    it('should not display Add a non-residential location button', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain('Add a non-residential location')
        })
    })
  })

  describe('for edit user', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: permission => permission === 'edit_non_resi',
      })
    })

    it('should render page with "Edit non-residential locations" heading', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Edit non-residential locations')
        })
    })

    it('should have correct page title for edit user', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('<title>Edit non-residential locations')
          expect(res.text).not.toContain('<title>View non-residential locations')
        })
    })

    it('should display Actions column', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Actions')
        })
    })

    it('should display Change links', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain("href='/location/1/edit'")
          expect(res.text).toContain('Change')
        })
    })

    it('should render breadcrumb with "Edit the list of non-residential locations"', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          // Check the breadcrumb text appears in the breadcrumb element
          expect(res.text).toContain('Edit the list of non-residential locations')
          // Verify it's within a breadcrumb list item
          expect(res.text).toMatch(/govuk-breadcrumbs__list-item.*Edit the list of non-residential locations/s)
        })
    })

    it('should display Add a non-residential location button', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect('Content-Type', /html/)
        .expect(200)
        .expect(res => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalled()
          expect(res.text).toContain('Add a non-residential location')
          expect(res.text).toContain('/add-location')
        })
    })
  })

  it.skip('service errors are handled', () => {
    app = appWithAllRoutes({
      services: { auditService, locationsService },
      userSupplier: () => user,
    })
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
