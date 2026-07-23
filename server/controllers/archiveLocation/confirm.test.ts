import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import Confirm from './confirm'

describe('Confirm (Archive) controller', () => {
  const controller = new Confirm({ route: '/confirm' })

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

  const archiveNonResidentialLocation = jest.fn()
  const hideNonResidentialLocation = jest.fn()
  const getServiceFamilyTypes = jest.fn()

  beforeEach(() => {
    next = jest.fn()

    req = {
      session: {
        systemToken: 'token-123',
      },
      services: {
        locationsService: {
          archiveNonResidentialLocation,
          hideNonResidentialLocation,
          getServiceFamilyTypes,
        },
      },
      journeyModel: {
        reset: jest.fn(),
      },
      sessionModel: {
        reset: jest.fn(),
      },
      flash: jest.fn(),
    } as any

    res = {
      locals: {
        locationDetails: {
          id: 'loc-123',
          prisonId: 'MDI',
          localName: 'gymnasium',
          isLeafLevel: true,
          usedByGroupedServices: ['ACTIVITIES_APPOINTMENTS'],
        },
        serviceFamilyTypes: mockServiceFamilyTypes,
      },
      redirect: jest.fn(),
    } as any

    jest.clearAllMocks()
    getServiceFamilyTypes.mockResolvedValue(mockServiceFamilyTypes)
    archiveNonResidentialLocation.mockResolvedValue({})
    hideNonResidentialLocation.mockResolvedValue({})
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
    it('returns correct page locals with heading including services warning', () => {
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.heading).toBe(
        'Are you sure you want to archive Gymnasium?<br><br>These services will not have access:',
      )
      expect(locals.backLink).toBe('/location/loc-123/archive/archive-or-inactive')
      expect(locals.goBackLink).toBe('/location/loc-123/archive/archive-or-inactive')
      expect(locals.buttonText).toBe('Archive location')
      expect(locals.servicesAffected).toEqual(['Activities and appointments'])
    })

    it('returns heading without services warning when no services affected', () => {
      res.locals!.locationDetails.usedByGroupedServices = []

      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.heading).toBe('Are you sure you want to archive Gymnasium?')
      expect(locals.servicesAffected).toEqual([])
    })

    it('sets title on res.locals', () => {
      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.title).toBe('Are you sure you want to archive Gymnasium?')
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

      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.servicesAffected).toEqual(['Activities and appointments', 'Use of force'])
    })

    describe('for a parent location', () => {
      beforeEach(() => {
        res.locals!.locationDetails.isLeafLevel = false
        res.locals!.locationDetails.canBeHiddenFromList = true
      })

      it('uses parent wording and lists no affected services', () => {
        const locals = controller.locals(req as FormWizard.Request, res as Response)

        expect(locals.heading).toBe('Are you sure you want to archive Gymnasium?')
        expect(locals.hint).toContain('removed from your list')
        expect(locals.hint).toContain('locations inside it will not be affected')
        expect(locals.servicesAffected).toEqual([])
      })

      it('sends Back and Go back to the list, not the archive-or-inactive step', () => {
        const locals = controller.locals(req as FormWizard.Request, res as Response)

        expect(locals.backLink).toBe('/prison/MDI')
        expect(locals.goBackLink).toBe('/prison/MDI')
      })
    })
  })

  describe('saveValues()', () => {
    it('archives a leaf location and continues', async () => {
      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(archiveNonResidentialLocation).toHaveBeenCalledWith('token-123', 'loc-123')
      expect(hideNonResidentialLocation).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('hides a parent location from the list instead of archiving it', async () => {
      res.locals!.locationDetails.isLeafLevel = false
      res.locals!.locationDetails.canBeHiddenFromList = true

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(hideNonResidentialLocation).toHaveBeenCalledWith('token-123', 'loc-123')
      expect(archiveNonResidentialLocation).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('fails closed when a parent that cannot be hidden reaches confirmation', async () => {
      res.locals!.locationDetails.isLeafLevel = false
      res.locals!.locationDetails.canBeHiddenFromList = false

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(hideNonResidentialLocation).not.toHaveBeenCalled()
      expect(archiveNonResidentialLocation).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(expect.any(Error))
    })

    it('passes error to next on failure', async () => {
      const error = new Error('API failure')
      archiveNonResidentialLocation.mockRejectedValue(error)

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('successHandler()', () => {
    it('resets models, flashes success message and redirects', () => {
      controller.successHandler(req as FormWizard.Request, res as Response, next)

      expect(req.journeyModel!.reset).toHaveBeenCalled()
      expect(req.sessionModel!.reset).toHaveBeenCalled()

      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: 'gymnasium archived',
        variant: 'success',
        dismissible: true,
      })

      expect(res.redirect).toHaveBeenCalledWith('/prison/MDI')
    })
  })
})
