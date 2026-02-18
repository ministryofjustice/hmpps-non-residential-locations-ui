import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import CheckYourAnswers from './checkYourAnswers'
import logger from '../../../logger'
import { HmppsUser } from '../../interfaces/hmppsUser'

jest.mock('../../../logger')

describe('CheckYourAnswers controller', () => {
  const controller = new CheckYourAnswers({ route: '/check-your-answers' })

  let req: Partial<FormWizard.Request>
  let res: Partial<Response>
  let next: jest.Mock

  const addNonResidentialLocation = jest.fn()

  beforeEach(() => {
    next = jest.fn()

    req = {
      session: {
        systemToken: 'token-123',
      },
      services: {
        locationsService: {
          addNonResidentialLocation,
        },
      },
      sessionModel: {
        toJSON: jest.fn().mockReturnValue({
          localName: 'Room A',
          services: ['EDU'],
          locationStatus: 'ACTIVE',
        }),
        get: jest.fn().mockImplementation(key => {
          if (key === 'services') return ['EDU']
          return undefined
        }),
        reset: jest.fn(),
      },
      journeyModel: {
        reset: jest.fn(),
      },
      flash: jest.fn(),
    } as any

    res = {
      locals: {
        user: {
          activeCaseload: {
            name: 'Moorland',
            id: 'MDI',
          },
        } as HmppsUser,
        serviceTypes: [
          { key: 'EDU', description: 'Education' },
          { key: 'GYM', description: 'Gym' },
        ],
        values: {
          services: ['EDU'],
        },
      },
      redirect: jest.fn(),
    }

    jest.clearAllMocks()
  })

  describe('locals()', () => {
    it('returns correct page locals and sets serviceTypeDescriptions', () => {
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals).toEqual({
        title: 'Check your answers',
        cancelLink: '/prison/MDI',
        buttonText: 'Confirm and save',
      })
      expect(res.locals.values).toEqual({
        services: ['EDU'],
        serviceTypeDescriptions: ['Education'],
      })
    })
  })

  describe('successHandler()', () => {
    it('successfully adds a new active location', async () => {
      req.services.locationsService.addNonResidentialLocation = jest.fn().mockResolvedValue(undefined)

      await controller.successHandler(req as FormWizard.Request, res as Response, next)
      expect(req.services.locationsService.addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'MDI', {
        localName: 'Room A',
        servicesUsingLocation: ['EDU'],
        active: true,
      })

      expect(logger.info).toHaveBeenCalledWith('Successfully created location Room A at MDI')

      expect(req.journeyModel.reset).toHaveBeenCalled()
      expect(req.sessionModel.reset).toHaveBeenCalled()

      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: 'Room A added',
        variant: 'success',
        dismissible: true,
      })

      expect(res.redirect).toHaveBeenCalledWith('/prison/MDI')
    })

    it('successfully adds a new active location using preferred prison rather than caseload', async () => {
      req.services.locationsService.addNonResidentialLocation = jest.fn().mockResolvedValue(undefined)
      req.session.prisonId = 'ABC'

      await controller.successHandler(req as FormWizard.Request, res as Response, next)
      expect(req.services.locationsService.addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'ABC', {
        localName: 'Room A',
        servicesUsingLocation: ['EDU'],
        active: true,
      })

      expect(logger.info).toHaveBeenCalledWith('Successfully created location Room A at ABC')

      expect(req.journeyModel.reset).toHaveBeenCalled()
      expect(req.sessionModel.reset).toHaveBeenCalled()

      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: 'Room A added',
        variant: 'success',
        dismissible: true,
      })

      expect(res.redirect).toHaveBeenCalledWith('/prison/ABC')
    })

    it('handles inactive locationStatus', async () => {
      req.sessionModel.toJSON = jest.fn().mockReturnValue({
        localName: 'Room B',
        services: ['GYM'],
        locationStatus: 'INACTIVE',
      })

      await controller.successHandler(req as FormWizard.Request, res as Response, next)

      expect(req.services.locationsService.addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'MDI', {
        localName: 'Room B',
        servicesUsingLocation: ['GYM'],
        active: false,
      })
      expect(logger.info).toHaveBeenCalledWith('Successfully created location Room B at MDI')
      expect(req.journeyModel.reset).toHaveBeenCalled()
      expect(req.sessionModel.reset).toHaveBeenCalled()

      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: 'Room B added',
        variant: 'success',
        dismissible: true,
      })
      expect(res.redirect).toHaveBeenCalledWith('/prison/MDI')
    })

    it('logs error and calls next on failure', async () => {
      const error = new Error('API failure')
      req.sessionModel.toJSON = jest.fn().mockReturnValue({
        localName: 'Room A',
        services: ['EDU'],
        locationStatus: 'ACTIVE',
      })
      req.services.locationsService.addNonResidentialLocation = jest.fn().mockRejectedValue(error)
      req.form = { values: { services: ['EDU'] } } as any
      res.locals.values = { services: ['EDU'] }

      await controller.successHandler(req as FormWizard.Request, res as Response, next)

      expect(req.services.locationsService.addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'MDI', {
        localName: 'Room A',
        servicesUsingLocation: ['EDU'],
        active: true,
      })

      expect(logger.error).toHaveBeenCalledWith('Failed to create location Room A at MDI', error)

      expect(req.flash).not.toHaveBeenCalled()

      expect(next).toHaveBeenCalledWith(error)
    })
  })
})
