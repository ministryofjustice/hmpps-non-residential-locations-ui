import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'

import CheckYourAnswers from './checkYourAnswers'

describe('EditLocation CheckYourAnswers controller', () => {
  const controller = new CheckYourAnswers({ route: '/check-your-answers' })

  let req: Partial<FormWizard.Request>
  let res: Partial<Response>
  let next: jest.Mock
  let sessionData: {
    localName?: string
    services?: string[]
    locationStatus?: string
  }
  let sessionModelState: Record<string, unknown>

  const updateNonResidentialLocationDetails = jest.fn()

  beforeEach(() => {
    next = jest.fn()
    sessionData = {
      localName: 'New name',
      services: ['VISITS', 'LIBRARY'],
      locationStatus: 'INACTIVE',
    }
    sessionModelState = {}

    req = {
      session: {
        systemToken: 'token-123',
      },
      services: {
        locationsService: {
          updateNonResidentialLocationDetails,
        },
      },
      sessionModel: {
        toJSON: jest.fn(() => sessionData),
        get: jest.fn((key: string) => sessionModelState[key]),
        set: jest.fn((key: string, value: unknown) => {
          sessionModelState[key] = value
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
        locationDetails: {
          id: 'loc-123',
          prisonId: 'MDI',
          localName: 'Old name',
          status: 'ACTIVE',
          usedByServices: ['VISITS', 'EDU'],
        },
        serviceFamilyTypes: [
          {
            key: 'appointments',
            description: 'Appointments',
            values: [
              { key: 'VISITS', description: 'Visits' },
              { key: 'EDU', description: 'Education' },
            ],
          },
          {
            key: 'activities',
            description: 'Activities',
            values: [{ key: 'LIBRARY', description: 'Library' }],
          },
        ],
      },
      redirect: jest.fn(),
    } as any

    jest.clearAllMocks()
    updateNonResidentialLocationDetails.mockResolvedValue({})
  })

  describe('locals()', () => {
    it('returns page locals with changed fields for name, services and status', () => {
      const locals = controller.locals(req as FormWizard.Request, res as Response)

      expect(locals).toMatchObject({
        backLink: '/location/loc-123/edit/details',
        cancelLink: '/prison/MDI/',
        title: 'Confirm changes to this location',
        buttonText: 'Confirm and save',
        locationId: 'loc-123',
      })
      expect(locals.changedFields).toEqual([
        {
          question: 'What is the location name?',
          changedFrom: 'Old name',
          changedTo: 'New name',
          changeLink: '/location/loc-123/edit/details',
        },
        {
          question: 'What services must be able to use this location?',
          changedFrom: ['Visits', 'Education'],
          changedTo: ['Visits', 'Library'],
          changeLink: '/location/loc-123/edit/details',
        },
        {
          question: 'Is this location currently active?',
          changedFrom: 'Yes',
          changedTo: 'No',
          changeLink: '/location/loc-123/edit/details',
        },
      ])
      expect(req.sessionModel!.set).toHaveBeenNthCalledWith(1, 'localNameHasChanged', false)
      expect(req.sessionModel!.set).toHaveBeenNthCalledWith(2, 'localNameHasChanged', true)
      expect(res.locals!.title).toBe('Confirm changes to this location')
    })
  })

  describe('saveValues()', () => {
    it('sanitizes and saves a changed name with active=true', async () => {
      sessionData = {
        localName: '  <b>New name</b>  ',
        services: ['VISITS', 'LIBRARY'],
        locationStatus: 'ACTIVE',
      }
      sessionModelState.localNameHasChanged = true

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(updateNonResidentialLocationDetails).toHaveBeenCalledWith(
        'token-123',
        'loc-123',
        'New name',
        ['VISITS', 'LIBRARY'],
        true,
      )
      expect(next).toHaveBeenCalledWith()
    })

    it.each([false, null, undefined])(
      'passes null for localName when localNameHasChanged is %s',
      async localNameHasChanged => {
        sessionData = {
          localName: '  <b>New name</b>  ',
          services: ['VISITS', 'LIBRARY'],
          locationStatus: 'ACTIVE',
        }
        sessionModelState.localNameHasChanged = localNameHasChanged

        await controller.saveValues(req as FormWizard.Request, res as Response, next)

        expect(updateNonResidentialLocationDetails).toHaveBeenCalledWith(
          'token-123',
          'loc-123',
          null,
          ['VISITS', 'LIBRARY'],
          true,
        )
        expect(next).toHaveBeenCalledWith()
      },
    )

    it('passes null for an unchanged name and active=false for INACTIVE status', async () => {
      sessionData = {
        localName: 'Old name',
        services: ['VISITS'],
        locationStatus: 'INACTIVE',
      }

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(updateNonResidentialLocationDetails).toHaveBeenCalledWith('token-123', 'loc-123', null, ['VISITS'], false)
      expect(next).toHaveBeenCalledWith()
    })

    it('passes undefined when no status is supplied', async () => {
      sessionData = {
        localName: 'Old name',
        services: ['VISITS'],
      }

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(updateNonResidentialLocationDetails).toHaveBeenCalledWith(
        'token-123',
        'loc-123',
        null,
        ['VISITS'],
        undefined,
      )
      expect(next).toHaveBeenCalledWith()
    })

    it('passes errors to next when the update fails', async () => {
      const error = new Error('API failure')
      updateNonResidentialLocationDetails.mockRejectedValue(error)

      await controller.saveValues(req as FormWizard.Request, res as Response, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('successHandler()', () => {
    it('resets models, flashes success, and redirects to the prison page', () => {
      controller.successHandler(req as FormWizard.Request, res as Response, next)

      expect(req.journeyModel!.reset).toHaveBeenCalled()
      expect(req.sessionModel!.reset).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith('successMojFlash', {
        title: 'New name changed',
        variant: 'success',
        dismissible: true,
      })
      expect(res.redirect).toHaveBeenCalledWith('/prison/MDI')
    })
  })
})
