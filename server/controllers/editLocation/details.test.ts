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
          isLeafLevel: true,
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

    it('omits BVL service types when the user does not have edit_bvl', async () => {
      ;(deepReq.canAccess as jest.Mock).mockImplementation(p => p !== 'edit_bvl')
      locationsService.getServiceTypes = jest.fn().mockResolvedValue([
        { key: 'A', description: 'Alpha', attributes: { serviceFamilyType: 'ACTIVITIES_APPOINTMENTS' } },
        { key: 'B', description: 'Bravo', attributes: { serviceFamilyType: 'VIDEO_LINK_APPOINTMENTS' } },
      ])

      await controller.setOptions(deepReq as FormWizard.Request, deepRes as Response, next)

      expect(deepReq.form!.options!.fields!.services.items).toEqual([{ text: 'Alpha', value: 'A' }])
    })

    it('includes BVL service types when the user has edit_bvl', async () => {
      ;(deepReq.canAccess as jest.Mock).mockReturnValue(true)
      locationsService.getServiceTypes = jest.fn().mockResolvedValue([
        { key: 'A', description: 'Alpha', attributes: { serviceFamilyType: 'ACTIVITIES_APPOINTMENTS' } },
        { key: 'B', description: 'Bravo', attributes: { serviceFamilyType: 'VIDEO_LINK_APPOINTMENTS' } },
      ])

      await controller.setOptions(deepReq as FormWizard.Request, deepRes as Response, next)

      expect(deepReq.form!.options!.fields!.services.items).toEqual([
        { text: 'Alpha', value: 'A' },
        { text: 'Bravo', value: 'B' },
      ])
    })
  })

  describe('getInitialValues', () => {
    it('returns initial values from location details', () => {
      const initialValues = controller.getInitialValues(deepReq as FormWizard.Request, deepRes as Response)

      expect(initialValues).toEqual({
        localName: 'Old Name',
        services: ['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'],
        locationStatus: 'ACTIVE',
      })
    })

    it('returns undefined values when location details are missing', () => {
      deepRes.locals.locationDetails = undefined

      const initialValues = controller.getInitialValues(deepReq as FormWizard.Request, deepRes as Response)

      expect(initialValues).toEqual({
        localName: undefined,
        services: undefined,
        locationStatus: undefined,
      })
    })
  })

  describe('locals', () => {
    it('returns edit page locals and injects field values from form', () => {
      deepRes.locals.values = {
        localName: 'New Name',
        services: ['VISITS'],
        locationStatus: 'ACTIVE',
      }

      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect(locals.backLink).toEqual('/prison/TST')
      expect(locals.cancelLink).toEqual('/prison/TST/')
      expect(locals.title).toEqual('Change Old Name')
      expect(locals.titleCaption).toEqual('Old Name')
      expect(locals.buttonText).toEqual('Continue')
      expect((locals.fields as FormWizard.Fields).services.items).toEqual(deepRes.locals!.serviceFamilyTypes)
      expect(deepReq.canAccess).toHaveBeenCalledWith('edit_non_resi')
    })

    it('offers the Archive action for a leaf location', () => {
      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      const actions = (locals.actions || deepRes.locals!.actions || []) as { text: string; href: string }[]
      expect(actions.some(a => a.text === 'Archive location' && a.href === '/location/loc-123/archive')).toBe(true)
    })

    it('offers the Archive action for a parent that can be hidden from the list', () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepRes.locals.locationDetails.canBeHiddenFromList = true
      deepRes.locals.serviceTypes = []

      controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      const actions = (deepRes.locals!.actions || []) as { text: string; href: string }[]
      expect(actions.some(a => a.text === 'Archive location')).toBe(true)
    })

    it('does not offer the Archive action for a parent still used by a service', () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepRes.locals.locationDetails.canBeHiddenFromList = false
      deepRes.locals.serviceTypes = []

      controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      const actions = (deepRes.locals!.actions || []) as { text: string }[]
      expect(actions.some(a => a.text === 'Archive location')).toBe(false)
    })

    it('should not include locationStatus component for non-leaf level locations', () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepRes.locals.serviceTypes = [
        {
          attributes: {
            editableInParent: true,
            serviceFamilyType: 'VISITS',
          },
        },
      ] as any
      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)
      expect((locals.fields as FormWizard.Fields).locationStatus).toBeDefined()
    })

    it('only renders services whose serviceFamilyType has editableInParent=true for non-leaf locations', () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepRes.locals.serviceTypes = [
        {
          key: 'SERVICE_A',
          attributes: {
            serviceFamilyType: 'ACTIVITIES_APPOINTMENTS',
            editableInParent: true,
          },
        },
        {
          key: 'SERVICE_B',
          attributes: {
            serviceFamilyType: 'ACTIVITIES_APPOINTMENTS',
            editableInParent: true,
          },
        },
        {
          key: 'SERVICE_C',
          attributes: {
            serviceFamilyType: 'VIDEO_LINK_APPOINTMENTS',
            editableInParent: true,
          },
        },
        {
          key: 'SERVICE_D',
          attributes: {
            serviceFamilyType: 'USE_OF_FORCE',
            editableInParent: false,
          },
        },
      ] as any

      deepRes.locals.serviceFamilyTypes = [
        {
          key: 'ACTIVITIES_APPOINTMENTS',
          values: [
            {
              key: 'SERVICE_A',
            },
            {
              key: 'SERVICE_B',
            },
          ],
        },
        {
          key: 'VIDEO_LINK_APPOINTMENTS',
          values: [
            {
              key: 'SERVICE_C',
            },
          ],
        },
        {
          key: 'USE_OF_FORCE',
          values: [
            {
              key: 'SERVICE_D',
            },
          ],
        },
      ] as any

      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect((locals.fields as FormWizard.Fields).services.items).toEqual([
        { key: 'ACTIVITIES_APPOINTMENTS', values: [{ key: 'SERVICE_A' }, { key: 'SERVICE_B' }] },
        { key: 'VIDEO_LINK_APPOINTMENTS', values: [{ key: 'SERVICE_C' }] },
      ])
    })

    it('renders all services when location`s isLeafLevel property is true', () => {
      deepRes.locals.locationDetails.isLeafLevel = true
      deepRes.locals.serviceTypes = [
        {
          key: 'SERVICE_A',
          attributes: {
            serviceFamilyType: 'ACTIVITIES_APPOINTMENTS',
            editableInParent: true,
          },
        },
        {
          key: 'SERVICE_B',
          attributes: {
            serviceFamilyType: 'ACTIVITIES_APPOINTMENTS',
            editableInParent: true,
          },
        },
        {
          key: 'SERVICE_C',
          attributes: {
            serviceFamilyType: 'VIDEO_LINK_APPOINTMENTS',
            editableInParent: true,
          },
        },
        {
          key: 'SERVICE_D',
          attributes: {
            serviceFamilyType: 'USE_OF_FORCE',
            editableInParent: false,
          },
        },
      ] as any

      deepRes.locals.serviceFamilyTypes = [
        {
          key: 'ACTIVITIES_APPOINTMENTS',
          values: [
            {
              key: 'SERVICE_A',
            },
            {
              key: 'SERVICE_B',
            },
          ],
        },
        {
          key: 'VIDEO_LINK_APPOINTMENTS',
          values: [
            {
              key: 'SERVICE_C',
            },
          ],
        },
        {
          key: 'USE_OF_FORCE',
          values: [
            {
              key: 'SERVICE_D',
            },
          ],
        },
      ] as any

      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect((locals.fields as FormWizard.Fields).services.items).toEqual([
        { key: 'ACTIVITIES_APPOINTMENTS', values: [{ key: 'SERVICE_A' }, { key: 'SERVICE_B' }] },
        { key: 'VIDEO_LINK_APPOINTMENTS', values: [{ key: 'SERVICE_C' }] },
        { key: 'USE_OF_FORCE', values: [{ key: 'SERVICE_D' }] },
      ])
    })

    it('uses location details as defaults when form values are missing', () => {
      deepReq.form!.values = {}
      deepRes.locals.values = controller.getInitialValues(deepReq as FormWizard.Request, deepRes as Response)

      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect((locals.fields as FormWizard.Fields).services.value).toEqual(['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'])
      expect((locals.fields as FormWizard.Fields).localName.value).toEqual('Old Name')
      expect((locals.fields as FormWizard.Fields).locationStatus.value).toEqual('ACTIVE')
    })

    it('filters out the BVL service family when the user does not have edit_bvl', () => {
      ;(deepReq.canAccess as jest.Mock).mockImplementation(p => p !== 'edit_bvl')
      deepRes.locals.serviceFamilyTypes = [
        { key: 'ACTIVITIES_APPOINTMENTS', description: 'Activities', values: [] },
        { key: 'VIDEO_LINK_APPOINTMENTS', description: 'Book a video link', values: [] },
        { key: 'USE_OF_FORCE', description: 'Use of force', values: [] },
      ] as any

      const locals = controller.locals(deepReq as FormWizard.Request, deepRes as Response)

      expect((locals.fields as FormWizard.Fields).services.items).toEqual([
        { key: 'ACTIVITIES_APPOINTMENTS', description: 'Activities', values: [] },
        { key: 'USE_OF_FORCE', description: 'Use of force', values: [] },
      ])
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
      locationsService.getNonResidentialLocationByLocalName = jest.fn()

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith({})
    })

    it('passes validation if only changing the case of local name, not the name', async () => {
      deepReq.form!.values = {
        localName: 'OLD NAME',
        services: ['VISITS'],
        locationStatus: 'ACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn()

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith({})
    })

    it('passes validation for a parent location when local name is unchanged and the lookup would not return the parent itself', async () => {
      // Parents without a stored local name have their pathHierarchy substituted by the API,
      // so a local-name lookup against the displayed value would not return the parent and
      // could not be used to identify the current location.
      deepRes.locals.locationDetails.isLeafLevel = false
      deepReq.form!.values = {
        localName: 'Old Name',
        services: ['VISITS'],
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn()

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(locationsService.getNonResidentialLocationByLocalName).not.toHaveBeenCalled()
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

    it('returns a noChange error when all values are unchanged', async () => {
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

    it('returns a noChange error when values are unchanged for a parent location', async () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepReq.form!.values = {
        localName: 'Old Name',
        services: ['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'],
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

    it('returns no error when values have changed for a parent location', async () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepReq.form!.values = {
        localName: 'New Name',
        services: ['APPOINTMENT', 'PROGRAMMES_AND_ACTIVITIES'],
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([] as any)

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(callback).toHaveBeenCalledWith({})
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

    describe('BVL preservation for users without edit_bvl', () => {
      beforeEach(() => {
        deepRes.locals.serviceTypes = [
          { key: 'APPOINTMENT', attributes: { serviceFamilyType: 'ACTIVITIES_APPOINTMENTS' } },
          { key: 'PROGRAMMES_AND_ACTIVITIES', attributes: { serviceFamilyType: 'ACTIVITIES_APPOINTMENTS' } },
          { key: 'VIDEO_LINK_BOOKING', attributes: { serviceFamilyType: 'VIDEO_LINK_APPOINTMENTS' } },
        ] as any
      })

      it('re-adds existing BVL services to the submitted services so they are not stripped on save', async () => {
        ;(deepReq.canAccess as jest.Mock).mockImplementation(p => p !== 'edit_bvl')
        deepRes.locals.locationDetails.usedByServices = ['APPOINTMENT', 'VIDEO_LINK_BOOKING'] as any
        deepReq.form!.values = {
          localName: 'Renamed room',
          services: ['APPOINTMENT'],
          locationStatus: 'ACTIVE',
        }
        mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
        locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([])

        await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

        expect((deepReq.form!.values.services as string[]).sort()).toEqual(['APPOINTMENT', 'VIDEO_LINK_BOOKING'])
        expect(callback).toHaveBeenCalledWith({})
      })

      it('does not duplicate a BVL service that is already in the submission', async () => {
        ;(deepReq.canAccess as jest.Mock).mockImplementation(p => p !== 'edit_bvl')
        deepRes.locals.locationDetails.usedByServices = ['VIDEO_LINK_BOOKING'] as any
        deepReq.form!.values = {
          localName: 'Renamed room',
          services: ['VIDEO_LINK_BOOKING'],
          locationStatus: 'ACTIVE',
        }
        mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
        locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([])

        await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

        expect(deepReq.form!.values.services).toEqual(['VIDEO_LINK_BOOKING'])
      })

      it('reports noChange when the only original service was BVL and no other fields changed', async () => {
        ;(deepReq.canAccess as jest.Mock).mockImplementation(p => p !== 'edit_bvl')
        deepRes.locals.locationDetails.usedByServices = ['VIDEO_LINK_BOOKING'] as any
        deepReq.form!.values = {
          localName: 'Old Name',
          services: [],
          locationStatus: 'ACTIVE',
        }
        mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
        locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([])

        await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            localName: controller.formError('', 'noChange'),
          }),
        )
      })

      it('does not preserve BVL services for users with edit_bvl (they may intentionally untick)', async () => {
        ;(deepReq.canAccess as jest.Mock).mockReturnValue(true)
        deepRes.locals.locationDetails.usedByServices = ['APPOINTMENT', 'VIDEO_LINK_BOOKING'] as any
        deepReq.form!.values = {
          localName: 'Old Name',
          services: ['APPOINTMENT'],
          locationStatus: 'ACTIVE',
        }
        mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
        locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([])

        await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

        expect(deepReq.form!.values.services).toEqual(['APPOINTMENT'])
      })
    })

    it('Should not validate location status for non leaf-level locations', async () => {
      deepRes.locals.locationDetails.isLeafLevel = false
      deepReq.form!.values = {
        localName: 'New Name',
        services: ['VISITS'],
        locationStatus: 'INACTIVE',
      }
      mockSuperValidateFields.mockImplementation((_req, _res, cb) => cb({}))
      locationsService.getNonResidentialLocationByLocalName = jest.fn().mockResolvedValue([] as any)

      deepReq.form!.options = {
        allFields: {
          localName: {},
          services: {},
          locationStatus: {},
        },
        fields: {
          localName: {},
          services: {},
          locationStatus: {},
        },
      } as any

      await controller.validateFields(deepReq as FormWizard.Request, deepRes as Response, callback)

      expect(deepReq.form!.values.locationStatus).toEqual('INACTIVE')
      expect(deepReq.form!.options.allFields.locationStatus).toBeDefined()
      expect(deepReq.form!.options.fields.locationStatus).toBeDefined()
      expect(callback).toHaveBeenCalledWith({})
    })
  })
})
