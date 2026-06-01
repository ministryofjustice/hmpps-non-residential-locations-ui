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
        isLeafLevel: true,
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
        isLeafLevel: true,
      },
    ],
    pageable: { pageSize: 100, pageNumber: 0 },
    totalElements: 2,
    totalPages: 1,
  },
}

const mockServiceFamilyTypes: Array<{ key: string; description: string; values: never[] }> = [
  {
    key: 'ACTIVITIES_APPOINTMENTS',
    description: 'Activities and appointments',
    values: [],
  },
  {
    key: 'ADJUDICATIONS',
    description: 'Adjudications',
    values: [],
  },
]

beforeEach(() => {
  // Default mock for location counts - can be overridden in specific tests
  locationsService.getNonResidentialLocationCount.mockResolvedValue(10)
  locationsService.getServiceFamilyTypes.mockResolvedValue(mockServiceFamilyTypes)
})

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
          expect(res.text).toContain('<title>View non-residential locations - Non-residential locations</title>')
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

  describe('status filter', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: () => false,
      })
    })

    it('should call service with default statuses (ACTIVE, INACTIVE) when no status provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            'localName,asc',
            [],
            null,
            35,
          )
        })
    })

    it('should call service with specified statuses when filter provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?status=ARCHIVED')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ARCHIVED'],
            'localName,asc',
            [],
            null,
            35,
          )
        })
    })

    it('should call service with multiple statuses when multiple filters provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?status=ACTIVE&status=ARCHIVED')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'ARCHIVED'],
            'localName,asc',
            [],
            null,
            35,
          )
        })
    })

    it('should render status filter checkboxes with counts', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)
      locationsService.getNonResidentialLocationCount.mockImplementation((token, prisonId, status) => {
        if (status[0] === 'ACTIVE') return Promise.resolve(89)
        if (status[0] === 'INACTIVE') return Promise.resolve(16)
        if (status[0] === 'ARCHIVED') return Promise.resolve(10)
        return Promise.resolve(0)
      })

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Location status')
          expect(res.text).toContain('value="ACTIVE"')
          expect(res.text).toContain('value="INACTIVE"')
          expect(res.text).toContain('value="ARCHIVED"')
          expect(res.text).toContain('Active (89)')
          expect(res.text).toContain('Inactive (16)')
          expect(res.text).toContain('Archived (10)')
        })
    })

    it('should have ACTIVE and INACTIVE checked by default', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          // Check ACTIVE checkbox is checked
          expect(res.text).toMatch(/value="ACTIVE"[^>]*checked/)
          // Check INACTIVE checkbox is checked
          expect(res.text).toMatch(/value="INACTIVE"[^>]*checked/)
          // Check ARCHIVED checkbox is NOT checked (no 'checked' attribute near ARCHIVED value)
          expect(res.text).not.toMatch(/value="ARCHIVED"[^>]*checked/)
        })
    })

    it('should preserve status filter in pagination links', () => {
      auditService.logPageView.mockResolvedValue(null)
      const multiPageResponse = {
        ...mockLocationsResponse,
        locations: {
          ...mockLocationsResponse.locations,
          totalPages: 3,
          totalElements: 100,
        },
      }
      locationsService.getNonResidentialLocations.mockResolvedValue(multiPageResponse)

      return request(app)
        .get('/prison/TST?status=ACTIVE&status=ARCHIVED')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('status=ACTIVE')
          expect(res.text).toContain('status=ARCHIVED')
        })
    })
  })

  describe('service family filter', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: () => false,
      })
    })

    it('should pass no service family filter to API when not provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            'localName,asc',
            [],
            null,
            35,
          )
        })
    })

    it('should pass single service family type when one provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?serviceFamilyType=ACTIVITIES_APPOINTMENTS')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            'localName,asc',
            ['ACTIVITIES_APPOINTMENTS'],
            null,
            35,
          )
        })
    })

    it('should pass multiple service family types when more than one provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?serviceFamilyType=ACTIVITIES_APPOINTMENTS&serviceFamilyType=ADJUDICATIONS')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            'localName,asc',
            ['ACTIVITIES_APPOINTMENTS', 'ADJUDICATIONS'],
            null,
            35,
          )
        })
    })

    it('should render service family checkboxes with counts', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)
      locationsService.getNonResidentialLocationCount.mockImplementation((token, prisonId, status, families) => {
        if (families && families[0] === 'ACTIVITIES_APPOINTMENTS') return Promise.resolve(15)
        if (families && families[0] === 'ADJUDICATIONS') return Promise.resolve(42)
        return Promise.resolve(0)
      })

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Services that use non-residential locations')
          expect(res.text).toContain('value="ACTIVITIES_APPOINTMENTS"')
          expect(res.text).toContain('value="ADJUDICATIONS"')
          expect(res.text).toContain('Activities and appointments (15)')
          expect(res.text).toContain('Adjudications (42)')
        })
    })

    it('should mark the selected service family checkboxes as checked', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?serviceFamilyType=ADJUDICATIONS')
        .expect(200)
        .expect(res => {
          expect(res.text).toMatch(/value="ADJUDICATIONS"[^>]*checked/)
          expect(res.text).not.toMatch(/value="ACTIVITIES_APPOINTMENTS"[^>]*checked/)
        })
    })

    it('should preserve service family filter in pagination links', () => {
      auditService.logPageView.mockResolvedValue(null)
      const multiPageResponse = {
        ...mockLocationsResponse,
        locations: {
          ...mockLocationsResponse.locations,
          totalPages: 3,
          totalElements: 100,
        },
      }
      locationsService.getNonResidentialLocations.mockResolvedValue(multiPageResponse)

      return request(app)
        .get('/prison/TST?serviceFamilyType=ACTIVITIES_APPOINTMENTS')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('serviceFamilyType=ACTIVITIES_APPOINTMENTS')
        })
    })
  })

  describe('selected filter chips', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: () => false,
      })
    })

    it('should render selected filter chips for selected statuses and services', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?status=ACTIVE&serviceFamilyType=ACTIVITIES_APPOINTMENTS')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Selected filters')
          expect(res.text).toContain('data-qa="selected-status-chips"')
          expect(res.text).toContain('data-qa="selected-service-chips"')
          expect(res.text).toContain('Active')
          expect(res.text).toContain('Activities and appointments')
          expect(res.text).toContain('data-qa="clear-filters-link"')
        })
    })

    it('should not render the selected filters panel when no filters are applied', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?status=NONE')
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain('Selected filters')
        })
    })

    it('clear filters link should remove all status and service filters', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?status=ACTIVE&serviceFamilyType=ADJUDICATIONS')
        .expect(200)
        .expect(res => {
          // Clear all should produce status=NONE and no serviceFamilyType
          const match = res.text.match(/href="([^"]+)"[^>]*data-qa="clear-filters-link"/)
          expect(match).toBeTruthy()
          expect(match[1]).toContain('status=NONE')
          expect(match[1]).not.toContain('serviceFamilyType=')
        })
    })
  })

  describe('sorting', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: () => false,
      })
    })

    it('should use default sort (localName,asc) when no sort param provided', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            'localName,asc',
            [],
            null,
            35,
          )
        })
    })

    it('should pass through valid sort param with secondary sort by localName when sorting by status', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=status,desc')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            ['status,desc', 'localName,asc'],
            [],
            null,
            35,
          )
        })
    })

    it('should add secondary sort by localName when sorting by status ascending', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=status,asc')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            ['status,asc', 'localName,asc'],
            [],
            null,
            35,
          )
        })
    })

    it('should fall back to default sort key for invalid sort key', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=invalidKey,asc')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            'localName,asc',
            [],
            null,
            35,
          )
        })
    })

    it('should fall back to asc for invalid sort direction', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=status,invalid')
        .expect(200)
        .expect(() => {
          expect(locationsService.getNonResidentialLocations).toHaveBeenCalledWith(
            undefined,
            'TST',
            undefined,
            ['ACTIVE', 'INACTIVE'],
            ['status,asc', 'localName,asc'],
            [],
            null,
            35,
          )
        })
    })

    it('should preserve sort in pagination href template', () => {
      auditService.logPageView.mockResolvedValue(null)
      const multiPageResponse = {
        ...mockLocationsResponse,
        locations: {
          ...mockLocationsResponse.locations,
          totalPages: 3,
          totalElements: 100,
        },
      }
      locationsService.getNonResidentialLocations.mockResolvedValue(multiPageResponse)

      return request(app)
        .get('/prison/TST?sort=status,desc')
        .expect(200)
        .expect(res => {
          // The href template should contain the primary sort only (status,desc)
          // The secondary sort is added programmatically by the API
          expect(res.text).toContain('sort=status,desc')
        })
    })

    it('should include sortHrefTemplate in rendered page', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?status=ACTIVE')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('data-sort-href-template')
          expect(res.text).toContain('sort={sortKey},{sortDirection}')
        })
    })

    it('should render table with moj-sortable-table data-module', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('data-module="moj-sortable-table"')
        })
    })

    it('should render Location column with aria-sort ascending when sorted by localName,asc', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=localName,asc')
        .expect(200)
        .expect(res => {
          expect(res.text).toMatch(/aria-sort="ascending" data-sort-key="localName"/)
        })
    })

    it('should render Status column with aria-sort descending when sorted by status,desc', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=status,desc')
        .expect(200)
        .expect(res => {
          expect(res.text).toMatch(/aria-sort="descending" data-sort-key="status"/)
        })
    })

    it('should render unsorted columns with aria-sort none', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST?sort=localName,asc')
        .expect(200)
        .expect(res => {
          expect(res.text).toMatch(/aria-sort="none" data-sort-key="status"/)
        })
    })
  })

  describe('"View all results" link', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
        canAccess: () => false,
      })
    })

    it('should render the link with size=<totalElements> when there is more than one page', () => {
      auditService.logPageView.mockResolvedValue(null)
      const multiPageResponse = {
        ...mockLocationsResponse,
        locations: {
          ...mockLocationsResponse.locations,
          totalPages: 2,
          totalElements: 70,
        },
      }
      locationsService.getNonResidentialLocations.mockResolvedValue(multiPageResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).toMatch(/href="[^"]*size=70[^"]*"[^>]*data-qa="view-all-results-link"/)
          expect(res.text).toContain('View all results')
        })
    })

    it('should not render the link when only one page of results', () => {
      auditService.logPageView.mockResolvedValue(null)
      locationsService.getNonResidentialLocations.mockResolvedValue(mockLocationsResponse)

      return request(app)
        .get('/prison/TST')
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain('data-qa="view-all-results-link"')
        })
    })

    it('should not render the link when viewing all results on a single page (size matches total)', () => {
      auditService.logPageView.mockResolvedValue(null)
      const singlePageAllResponse = {
        ...mockLocationsResponse,
        locations: {
          ...mockLocationsResponse.locations,
          pageable: { pageSize: 70, pageNumber: 0 },
          totalPages: 1,
          totalElements: 70,
        },
      }
      locationsService.getNonResidentialLocations.mockResolvedValue(singlePageAllResponse)

      return request(app)
        .get('/prison/TST?size=70')
        .expect(200)
        .expect(res => {
          expect(res.text).not.toContain('data-qa="view-all-results-link"')
        })
    })

    it('should preserve filters and sort in the view-all link', () => {
      auditService.logPageView.mockResolvedValue(null)
      const multiPageResponse = {
        ...mockLocationsResponse,
        locations: {
          ...mockLocationsResponse.locations,
          totalPages: 2,
          totalElements: 70,
        },
      }
      locationsService.getNonResidentialLocations.mockResolvedValue(multiPageResponse)

      return request(app)
        .get('/prison/TST?status=ACTIVE&serviceFamilyType=ADJUDICATIONS&sort=status,desc')
        .expect(200)
        .expect(res => {
          const match = res.text.match(/href="([^"]+)"[^>]*data-qa="view-all-results-link"/)
          expect(match).toBeTruthy()
          expect(match[1]).toContain('status=ACTIVE')
          expect(match[1]).toContain('serviceFamilyType=ADJUDICATIONS')
          expect(match[1]).toContain('sort=status,desc')
          expect(match[1]).toContain('size=70')
          expect(match[1]).not.toContain('page=')
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
          expect(res.text).toContain('<title>Edit non-residential locations - Non-residential locations</title>')
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

  describe('caseload validation', () => {
    it('should return error when user does not have prison in caseloads', () => {
      const userWithoutCaseload = {
        ...user,
        caseloads: [{ id: 'OTHER', name: 'Other Prison (HMP)' }],
      }
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => userWithoutCaseload,
      })

      return request(app).get('/prison/TST').expect(500)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      app = appWithAllRoutes({
        services: { auditService, locationsService },
        userSupplier: () => user,
      })
      auditService.logPageView.mockResolvedValue(null)
    })

    it('renders the generic error page when getNonResidentialLocations rejects', () => {
      locationsService.getNonResidentialLocations.mockRejectedValue(new Error('Some problem calling external api!'))

      return request(app)
        .get('/prison/TST')
        .expect('Content-Type', /html/)
        .expect(500)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with this service')
          expect(res.text).toContain('Return to Non-residential locations')
        })
    })

    it('renders the generic error page when serviceFamilyType filter triggers an API error', () => {
      locationsService.getNonResidentialLocations.mockRejectedValue(new Error('Bad request'))

      return request(app)
        .get('/prison/TST?serviceFamilyType=xxx')
        .expect('Content-Type', /html/)
        .expect(500)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with this service')
        })
    })

    it('renders the generic error page when getNonResidentialLocationCount rejects', () => {
      locationsService.getNonResidentialLocationCount.mockRejectedValue(new Error('Counts API failure'))

      return request(app)
        .get('/prison/TST')
        .expect('Content-Type', /html/)
        .expect(500)
        .expect(res => {
          expect(res.text).toContain('Sorry, there is a problem with this service')
        })
    })
  })
})
