import { DeepPartial } from 'fishery'
import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'

import Details from './details'

describe('Add Location - Details controller', () => {
  const controller = new Details({ route: '/' })

  let deepReq: DeepPartial<FormWizard.Request>
  let deepRes: DeepPartial<Response>
  let next: jest.Mock

  beforeEach(() => {
    next = jest.fn()

    deepReq = {
      session: {
        systemToken: 'token-123',
        referrerUrl: undefined as unknown as string,
      },
      services: {
        locationsService: {
          getServiceTypes: jest.fn().mockResolvedValue({
            typeA: { key: 'A', description: 'Alpha' },
            typeB: { key: 'B', description: 'Bravo' },
          }),
        },
      },
      form: {
        options: {
          fields: {
            services: {
              id: 'services',
              name: 'services',
              items: [],
            },
          },
        },
        values: {},
      },
    }

    deepRes = {
      locals: {
        errorlist: [],
        options: deepReq.form!.options!,
        values: {},
        serviceFamilyTypes: [
          { text: 'Education', value: 'EDU' },
          { text: 'Healthcare', value: 'HEALTH' },
        ],
      },
    }
  })

  describe('setOptions', () => {
    it('populates services items from service types and calls next', async () => {
      await controller.setOptions(deepReq as FormWizard.Request, deepRes as Response, next)

      expect(deepReq.services!.locationsService!.getServiceTypes).toHaveBeenCalledWith(deepReq.session!.systemToken)

      expect(deepReq.form!.options!.fields!.services.items).toEqual([
        { text: 'Alpha', value: 'A' },
        { text: 'Bravo', value: 'B' },
      ])

      expect(next).toHaveBeenCalled()
    })
  })

  describe('locals', () => {
    it('sets backLink to fallback (root) when nextStepUrl is not provided', () => {
      deepReq.session!.referrerUrl = '/previous/page'
      const response = controller.locals(deepReq as FormWizard.Request, deepRes as Response)
      expect(response.backLink).toEqual('/')
      expect(response.cancelLink).toEqual('/')
      expect(response.buttonText).toEqual('Continue')
    })

    it('sets backLink to root when no referrer', () => {
      const response = controller.locals(deepReq as FormWizard.Request, deepRes as Response)
      expect(response.backLink).toEqual('/')
      expect(response.cancelLink).toEqual('/')
      expect(response.buttonText).toEqual('Continue')
    })

    it('injects service family types into services field items', () => {
      const response = controller.locals(deepReq as FormWizard.Request, deepRes as Response)
      // Expect the returned locals to include a services field; items should reflect serviceFamilyTypes
      expect((response.fields as FormWizard.Fields).services.items).toEqual(deepRes.locals!.serviceFamilyTypes)
    })
  })
})
