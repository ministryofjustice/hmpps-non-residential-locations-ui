import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import KeepInactive from './keepInactive'

describe('KeepInactive controller', () => {
  const controller = new KeepInactive({ route: '/keep-inactive' })

  let req: Partial<FormWizard.Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
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
          status: 'INACTIVE',
        },
      },
      redirect: jest.fn(),
    } as any
  })

  describe('get()', () => {
    it('resets journey and session models', () => {
      controller.get(req as FormWizard.Request, res as Response)

      expect(req.journeyModel!.reset).toHaveBeenCalled()
      expect(req.sessionModel!.reset).toHaveBeenCalled()
    })

    it('sets flash message with capitalised location name', () => {
      controller.get(req as FormWizard.Request, res as Response)

      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: '<strong>Gymnasium inactive</strong>',
        variant: 'success',
        dismissible: true,
      })
    })

    it('redirects to the prison locations list', () => {
      controller.get(req as FormWizard.Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('/prison/MDI')
    })

    it('capitalises location name correctly', () => {
      res.locals!.locationDetails.localName = 'chapel room'

      controller.get(req as FormWizard.Request, res as Response)

      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: '<strong>Chapel room inactive</strong>',
        variant: 'success',
        dismissible: true,
      })
    })
  })
})
