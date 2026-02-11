import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import InactiveConfirm from './inactiveConfirm'

describe('InactiveConfirm controller', () => {
  const controller = new InactiveConfirm({ route: '/inactive-confirm' })

  let req: Partial<FormWizard.Request>
  let res: Partial<Response>
  let next: jest.Mock

  const updateNonResidentialLocationDetails = jest.fn()

  beforeEach(() => {
    next = jest.fn()

    req = {
      session: {
        systemToken: 'token-123',
      },
      services: {
        locationsService: {
          updateNonResidentialLocationDetails,
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
          localName: 'Gymnasium',
          status: 'ACTIVE',
          usedByServices: ['APPOINTMENT', 'ACTIVITY'],
        },
      },
      redirect: jest.fn(),
    } as any

    jest.clearAllMocks()
    updateNonResidentialLocationDetails.mockResolvedValue({})
  })

  describe('locals()', () => {
    it('returns correct page locals', () => {
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.title).toBe('Confirm changes to this location')
      expect(locals.backLink).toBe('/location/loc-123/archive/archive-or-inactive')
      expect(locals.cancelLink).toBe('/prison/MDI/')
      expect(locals.buttonText).toBe('Confirm and save')
      expect(locals.locationId).toBe('loc-123')
    })

    it('returns changedFields with status change from Active to Inactive', () => {
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.changedFields).toEqual([
        {
          question: 'Is this location currently active?',
          changedFrom: 'Yes',
          changedTo: 'No',
          changeLink: '/location/loc-123/archive/archive-or-inactive',
        },
      ])
    })

    it('formats INACTIVE status as No', () => {
      res.locals!.locationDetails.status = 'INACTIVE'

      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals.changedFields).toEqual([
        {
          question: 'Is this location currently active?',
          changedFrom: 'No',
          changedTo: 'No',
          changeLink: '/location/loc-123/archive/archive-or-inactive',
        },
      ])
    })

    it('sets title on res.locals', () => {
      controller.locals(req as FormWizard.Request, res as Response)

      expect(res.locals!.title).toBe('Confirm changes to this location')
    })
  })

  describe('saveValues()', () => {
    it('calls updateNonResidentialLocationDetails with active=false and continues', async () => {
      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(updateNonResidentialLocationDetails).toHaveBeenCalledWith(
        'token-123',
        'loc-123',
        'Gymnasium',
        ['APPOINTMENT', 'ACTIVITY'],
        false,
      )
      expect(next).toHaveBeenCalled()
    })

    it('passes error to next on failure', async () => {
      const error = new Error('API failure')
      updateNonResidentialLocationDetails.mockRejectedValue(error)

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
        title: 'Gymnasium inactive',
        variant: 'success',
        dismissible: true,
      })

      expect(res.redirect).toHaveBeenCalledWith('/prison/MDI')
    })
  })
})
