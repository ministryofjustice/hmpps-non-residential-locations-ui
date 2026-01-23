import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import ArchiveOrInactive from './archiveOrInactive'

describe('ArchiveOrInactive controller', () => {
  const controller = new ArchiveOrInactive({ route: '/archive-or-inactive' })

  let req: Partial<FormWizard.Request>
  let res: Partial<Response>
  let next: jest.Mock

  const mockServiceFamilyTypes = [
    {
      key: 'ACTIVITIES_APPOINTMENTS',
      description: 'Activities and appointments',
      values: [
        { key: 'APPOINTMENT', description: 'Appointments' },
        { key: 'ACTIVITY', description: 'Activities' },
      ],
    },
    {
      key: 'EDUCATION',
      description: 'Education',
      values: [{ key: 'EDU', description: 'Education' }],
    },
  ]

  const getServiceFamilyTypes = jest.fn()

  beforeEach(() => {
    next = jest.fn()

    req = {
      session: {
        systemToken: 'token-123',
      },
      services: {
        locationsService: {
          getServiceFamilyTypes,
        },
      },
    } as any

    res = {
      locals: {
        locationDetails: {
          id: 'loc-123',
          prisonId: 'MDI',
          localName: 'gymnasium',
          usedByGroupedServices: ['ACTIVITIES_APPOINTMENTS'],
        },
        serviceFamilyTypes: mockServiceFamilyTypes,
      },
    } as any

    jest.clearAllMocks()
    getServiceFamilyTypes.mockResolvedValue(mockServiceFamilyTypes)
  })

  describe('setOptions()', () => {
    it('fetches service family types and sets them on res.locals', async () => {
      await controller.setOptions(req as FormWizard.Request, res as Response, next)

      expect(getServiceFamilyTypes).toHaveBeenCalledWith('token-123')
      expect(res.locals!.serviceFamilyTypes).toEqual(mockServiceFamilyTypes)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('locals()', () => {
    it('returns correct page locals with capitalized location name when active', () => {
      res.locals!.locationDetails.status = 'ACTIVE'
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.title).toBe('Archive Gymnasium or make it inactive')
      expect(locals.backLink).toBe('/prison/MDI')
      expect(locals.cancelLink).toBe('/prison/MDI/')
      expect(locals.buttonText).toBe('Continue')
    })

    it('returns correct title when location is inactive', () => {
      res.locals!.locationDetails.status = 'INACTIVE'
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.title).toBe('Archive Gymnasium')
    })

    it('sets isInactive to true on res.locals when location is inactive', () => {
      res.locals!.locationDetails.status = 'INACTIVE'
      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.isInactive).toBe(true)
    })

    it('sets isInactive to false on res.locals when location is active', () => {
      res.locals!.locationDetails.status = 'ACTIVE'
      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.isInactive).toBe(false)
    })

    it('sets servicesAffected on res.locals', () => {
      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.servicesAffected).toEqual(['Activities and appointments'])
    })

    it('returns empty services array when no grouped services', () => {
      res.locals!.locationDetails.usedByGroupedServices = []

      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.servicesAffected).toEqual([])
    })

    it('returns empty services array when usedByGroupedServices is undefined', () => {
      res.locals!.locationDetails.usedByGroupedServices = undefined

      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.servicesAffected).toEqual([])
    })

    it('maps multiple service families correctly', () => {
      res.locals!.locationDetails.usedByGroupedServices = ['ACTIVITIES_APPOINTMENTS', 'USE_OF_FORCE']
      res.locals!.serviceFamilyTypes = [
        ...mockServiceFamilyTypes,
        {
          key: 'USE_OF_FORCE',
          description: 'Use of force',
          values: [{ key: 'UOF', description: 'Use of force' }],
        },
      ]

      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.servicesAffected).toEqual(['Activities and appointments', 'Use of force'])
    })
  })
})
