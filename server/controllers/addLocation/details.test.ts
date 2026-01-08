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
  const locationsService = new LocationsService(null) as jest.Mocked<LocationsService>

  beforeEach(() => {
    next = jest.fn()
    jest.resetAllMocks()

    deepReq = {
      session: {
        systemToken: 'token-123',
        referrerUrl: undefined as unknown as string,
      },
      services: {
        locationsService,
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
        user: {
          activeCaseload: { id: 'TST', name: 'Test Prison' },
        },
      },
    }

    locationsService.getServiceTypes = jest.fn().mockResolvedValue({
      typeA: { key: 'A', description: 'Alpha' },
      typeB: { key: 'B', description: 'Bravo' },
    })
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
    const callback = jest.fn()
    it('does not call locations api if base validation identifies localName error', async () => {
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({ localName: expectedError }))
      const expectedError = controller.formError('localName', 'taken')
      locationsService.getNonResidentialLocationByLocalName = jest.fn()
      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(mockSuperValidateFields).toHaveBeenCalled()
      expect(locationsService.getNonResidentialLocationByLocalName).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith({ localName: expectedError })
    })

    it('adding existing localName causes error', async () => {
      deepReq.form.values.localName = 'Study room'
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      const expectedError = controller.formError('localName', 'uniqueNameRequired')
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue({
        id: 'Loc 1',
        localName: 'Study room',
      })
      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).toHaveBeenCalledWith(
        'token-123',
        'TST',
        'Study room',
      )
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ localName: expectedError }))
    })

    it('adding a unique localName does not cause error', async () => {
      deepReq.form.values.localName = 'gym'
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockRejectedValue({ responseStatus: 404 })
      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({}))
    })

    it('updates form values correctly when no errors', async () => {
      deepReq.form.values = { localName: 'Study room', services: ['APPOINTMENT'], locationStatus: 'ACTIVE' }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockRejectedValue({ responseStatus: 404 })
      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).toHaveBeenCalled()
      expect(callback).toHaveBeenLastCalledWith()
      expect(deepReq.form.values).toStrictEqual({
        localName: 'Study room',
        services: ['APPOINTMENT'],
        locationStatus: 'ACTIVE',
      })
    })
  })
})
