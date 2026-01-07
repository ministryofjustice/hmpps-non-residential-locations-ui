import { DeepPartial } from 'fishery'
import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'

import Details from './details'
import FormInitialStep from '../base/formInitialStep'
import LocationsService from '../../services/locationsService'

describe('Add Location - Details controller', () => {
  const controller = new Details({ route: '/' })

  let deepReq: DeepPartial<FormWizard.Request>
  let deepRes: DeepPartial<Response>
  let next: jest.Mock
  const mockSuperValidateFields = jest.spyOn(FormInitialStep.prototype, 'validateFields')
  const getNonResidentialLocationByLocalName = jest.fn()

  const locationsService = new LocationsService({
    locations: { getNonResidentialLocationByLocalName },
    constants: {},
  } as any)

  beforeEach(() => {
    next = jest.fn()
    jest.resetAllMocks()

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
  describe('validateFields', () => {
    const runValidateFields = async (values: FormWizard.Values = {}): Promise<FormWizard.Errors> => {
      deepReq = {
        ...deepReq,
        form: {
          values,
          options: {} as any,
        },
        services: {
          locationsService,
        },
      }

      deepRes.locals.user = {
        activeCaseload: { id: 'TST', name: 'Test Prison' },
      }

      // wrap callback-based method in a helper
      return new Promise<FormWizard.Errors>(done => {
        controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, done)
      })
    }

    it('does not call locations api when base validation has localName error', async () => {
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({ localName: { message: 'bad' } as any }))

      const errors = await runValidateFields({ localName: 'some name' })

      expect(mockSuperValidateFields).toHaveBeenCalled()
      expect(getNonResidentialLocationByLocalName).not.toHaveBeenCalled()
      expect(errors.localName).toBeDefined()
    })

    it('adds error when sanitized localName already exists', async () => {
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))

      getNonResidentialLocationByLocalName.mockResolvedValue({
        id: 'LOC-1',
        localName: 'Study room',
      })

      const errors = await runValidateFields({ localName: 'Study room ' })
      expect(getNonResidentialLocationByLocalName).toHaveBeenCalled()
      expect(errors.localName).toEqual(expect.objectContaining({ key: 'localName', type: 'uniqueNameRequired' }))
    })

    it('does not add error when localName is unique', async () => {
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))

      getNonResidentialLocationByLocalName.mockRejectedValue({ responseStatus: 404 })

      const errors = await runValidateFields({ localName: 'Study room' })

      expect(getNonResidentialLocationByLocalName).toHaveBeenCalled()
      expect(errors.localName).toBeUndefined()
    })
  })
})
