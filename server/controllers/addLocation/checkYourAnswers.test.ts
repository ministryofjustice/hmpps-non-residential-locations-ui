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

  describe('saveValues()', () => {
    it('calls locationsService with mapped data and continues', async () => {
      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'MDI', {
        localName: 'Room A',
        servicesUsingLocation: ['EDU'],
        active: true,
      })

      expect(next).toHaveBeenCalled()
    })

    it('calls locationsService with preferred prison rather than user caseload', async () => {
      req.session.prisonId = 'LEI'
      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'LEI', {
        localName: 'Room A',
        servicesUsingLocation: ['EDU'],
        active: true,
      })

      expect(next).toHaveBeenCalled()
    })

    it('calls locationsService with multiple services and continues', async () => {
      req.sessionModel.toJSON = jest.fn().mockReturnValue({
        localName: 'Room B',
        services: ['EDU', 'GYM'],
        locationStatus: 'ACTIVE',
      })
      req.sessionModel.get = jest.fn().mockImplementation(key => {
        if (key === 'services') return ['EDU', 'GYM']
        return undefined
      })

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(addNonResidentialLocation).toHaveBeenCalledWith('token-123', 'MDI', {
        localName: 'Room B',
        servicesUsingLocation: ['EDU', 'GYM'],
        active: true,
      })
      expect(next).toHaveBeenCalled()
    })

    it('logs error and passes error to next on failure', async () => {
      const error = new Error('API failure')
      addNonResidentialLocation.mockRejectedValue(error)

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(logger.error).toHaveBeenCalledWith('Failed to create location Room A at MDI', error)
      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('successHandler()', () => {
    it('resets models, flashes success message and redirects', () => {
      controller.successHandler(req as FormWizard.Request, res as Response, next)
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
  })
})
