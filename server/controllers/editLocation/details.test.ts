import { DeepPartial } from 'fishery'
import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'

import Details from './details'
import FormInitialStep from '../base/formInitialStep'
import LocationsService from '../../services/locationsService'

describe('Edit Location - Details controller', () => {
  const controller = new Details({ route: '/' })

  let deepReq: DeepPartial<FormWizard.Request>
  let deepRes: DeepPartial<Response>
  let next: jest.Mock
  let callback: jest.Mock

  const mockSuperValidateFields = jest.spyOn(FormInitialStep.prototype, 'validateFields')
  const locationsService = new LocationsService(null) as jest.Mocked<LocationsService>

  beforeEach(() => {
    next = jest.fn()
    callback = jest.fn()
    jest.resetAllMocks()

    deepReq = {
      session: {
        systemToken: 'token-123',
        referrerUrl: undefined as unknown as string,
      },
      services: {
        locationsService,
      },
      canAccess: jest.fn().mockReturnValue(true),
      form: {
        options: {
          fields: {
            localName: {
              id: 'localName',
              name: 'localName',
              value: '',
            },
            services: {
              id: 'services',
              name: 'services',
              items: [],
              value: [],
            },
            locationStatus: {
              id: 'locationStatus',
              name: 'locationStatus',
              value: '',
            },
          },
        },
        values: {
          localName: 'New Name',
          services: ['VISITS'],
          locationStatus: 'ACTIVE',
        },
      },
    }

    deepRes = {
      locals: {
        errorlist: [],
        options: deepReq.form!.options!,
        values: {},
        serviceFamilyTypes: [
          { text: 'Visits', value: 'VISITS' },
          { text: 'Education', value: 'EDU' },
        ],
        user: {
          activeCaseload: { id: 'TST', name: 'Test Prison' },
        },
        locationDetails: {
          id: 'loc-123',
          prisonId: 'TST',
          localName: 'Old Name',
          status: 'ACTIVE',
          usedByServices: ['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'],
        },
      },
    }

    locationsService.getServiceTypes = jest.fn().mockResolvedValue({
      typeA: { key: 'A', description: 'Alpha' },
      typeB: { key: 'B', description: 'Bravo' },
    })
    locationsService.getNonResidentialLocationByLocalName = jest.fn().mockRejectedValue({ responseStatus: 404 })
  })

  describe('setOptions', () => {
    it('populates service options and calls next', async () => {
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
    it('returns edit page locals and injects field values from form', () => {
      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect(locals.backLink).toEqual('/prison/TST')
      expect(locals.cancelLink).toEqual('/prison/TST/')
      expect(locals.title).toEqual('Change Old Name')
      expect(locals.titleCaption).toEqual('Old Name')
      expect(locals.buttonText).toEqual('Continue')
      expect((locals.fields as FormWizard.Fields).services.items).toEqual(deepRes.locals!.serviceFamilyTypes)
      expect((locals.fields as FormWizard.Fields).services.value).toEqual(['VISITS'])
      expect((locals.fields as FormWizard.Fields).localName.value).toEqual('New Name')
      expect((locals.fields as FormWizard.Fields).locationStatus.value).toEqual('ACTIVE')
      expect(deepReq.canAccess).toHaveBeenCalledWith('edit_non_resi')
    })

    it('uses location details as defaults when form values are missing', () => {
      deepReq.form!.values = {}

      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect((locals.fields as FormWizard.Fields).services.value).toEqual(['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'])
      expect((locals.fields as FormWizard.Fields).localName.value).toEqual('Old Name')
      expect((locals.fields as FormWizard.Fields).locationStatus.value).toEqual('ACTIVE')
    })
  })

  describe('validateFields', () => {
    it('returns upstream errors when local-name lookup returns 404', async () => {
      const existingError = controller.formError('services', 'required')
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({ services: existingError }))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockRejectedValue({ responseStatus: 404 })

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).toHaveBeenCalledWith('token-123', 'TST', 'New Name')
      expect(callback).toHaveBeenCalledWith({ services: existingError })
    })

    it('passes validation if not changing local name', async () => {
      deepReq.form!.values = {
        localName: 'Old Name',
        services: ['VISITS'],
        locationStatus: 'ACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest
        .fn()
        .mockResolvedValue([{ id: 'loc-123', localName: 'Old Name' }] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith({})
    })

    it('passes validation if only changing the case of local name, not the name', async () => {
      deepReq.form!.values = {
        localName: 'OLD NAME',
        services: ['VISITS'],
        locationStatus: 'ACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest
        .fn()
        .mockResolvedValue([{ id: 'loc-123', localName: 'Old Name' }] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith({})
    })

    it('passes validation if new local name is different to any existing local names', async () => {
      deepReq.form!.values = {
        localName: 'Quiet Room',
        services: ['APPOINTMENT'],
        locationStatus: 'INACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith({})
    })

    it('fails validation if localName is empty', async () => {
      deepReq.form!.values.localName = '    '
      const existingError = controller.formError('services', 'required')
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({ services: existingError }))

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith({ services: existingError })
    })

    it('fails validation if new localName already exists', async () => {
      deepReq.form!.values.localName = 'Existing Room'
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest
        .fn()
        .mockResolvedValue([{ id: 'loc-777', localName: 'Existing Room' }] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          localName: controller.formError('localName', 'uniqueNameRequired'),
        }),
      )
    })

    it('returns noChange when all values are unchanged', async () => {
      deepReq.form!.values = {
        localName: 'Old Name',
        services: ['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'],
        locationStatus: 'ACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          localName: controller.formError('', 'noChange'),
        }),
      )
    })

    it('returns empty errors for changed values and empty lookup result', async () => {
      deepReq.form!.values = {
        localName: 'Renamed room',
        services: ['APPOINTMENT'],
        locationStatus: 'INACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith({})
    })
  })
})
