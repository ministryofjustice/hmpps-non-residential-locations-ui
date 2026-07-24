import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Request, Response } from 'express'
import { isEqual, sortBy } from 'lodash'

import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import { sanitizeString } from '../../utils/utils'
import { TypedLocals } from '../../@types/express'
import capFirst from '../../formatters/capFirst'
import addAction from '../../middleware/addAction'
import logger from '../../../logger'

const BVL_SERVICE_FAMILY_TYPE = 'VIDEO_LINK_APPOINTMENTS'

export default class Details extends FormInitialStep {
  override middlewareSetup() {
    this.use(this.setOptions)
    super.middlewareSetup()
  }

  async setOptions(req: FormWizard.Request, res: Response, next: NextFunction) {
    const serviceTypes = await req.services.locationsService.getServiceTypes(req.session.systemToken)
    const visibleServiceTypes = req.canAccess('edit_bvl')
      ? Object.values(serviceTypes)
      : Object.values(serviceTypes).filter(
          (st: { attributes?: { serviceFamilyType?: string } }) =>
            st.attributes?.serviceFamilyType !== BVL_SERVICE_FAMILY_TYPE,
        )

    req.form.options.fields.services.items = visibleServiceTypes.map(({ key, description }) => ({
      text: description,
      value: key,
    }))

    next()
  }

  override getInitialValues(req: FormWizard.Request, res: Response) {
    const { locationDetails } = res.locals

    return {
      localName: locationDetails?.localName,
      services: locationDetails?.usedByServices,
      locationStatus: locationDetails?.status,
    }
  }

  override locals(req: FormWizard.Request, res: Response): TypedLocals {
    const locals = super.locals(req, res)
    const { locationDetails } = res.locals
    const { prisonId, localName, isLeafLevel } = locationDetails

    const fields = { ...(locals.fields as FormWizard.Fields) }
    fields.services.items = req.canAccess('edit_bvl')
      ? res.locals.serviceFamilyTypes
      : (res.locals.serviceFamilyTypes || []).filter(
          (family: { key: string }) => family.key !== BVL_SERVICE_FAMILY_TYPE,
        )

    // If not a leaf-level location, only render services that have an editableInParent property of true.
    if (!isLeafLevel) {
      // Build a lookup of serviceFamilyTypes where editableInParent is true
      const editableInParentServiceFamilyTypes = new Set(
        res.locals.serviceTypes
          .filter(type => type.attributes.editableInParent)
          .map(type => type.attributes.serviceFamilyType),
      )

      // Keep only the services whose serviceFamilyType is present in lookup
      locals.fields.services.items = locals.fields.services.items.filter((item: { key: string }) =>
        editableInParentServiceFamilyTypes.has(item.key),
      )
    }

    const backLink = backUrl(req, {
      fallbackUrl: `/prison/${prisonId}`,
    })

    // A leaf location can be archived; a childless parent can instead be hidden from the list
    // (MAPB-670), which the user also reaches through the Archive action.
    const canArchive = isLeafLevel || locationDetails.canBeHiddenFromList
    if (req.canAccess('edit_non_resi') && canArchive && locationDetails.status !== 'ARCHIVED') {
      addAction({
        text: 'Archive location',
        classes: 'govuk-button--warning',
        preventDoubleClick: true,
        href: `/location/${locationDetails.id}/archive`,
      })(req as unknown as Request, res, null)
    }

    res.locals.title = `Change ${localName}`
    return {
      ...locals,
      backLink,
      cancelLink: `/prison/${prisonId}/`,
      title: `Change ${localName}`,
      titleCaption: capFirst(locationDetails.localName),
      buttonText: 'Continue',
    }
  }

  override async validateFields(req: FormWizard.Request, res: Response, callback: (errors: FormWizard.Errors) => void) {
    const { locationsService } = req.services
    const { locationDetails } = res.locals

    const { services } = req.form.values

    if (Array.isArray(services)) {
      req.form.values.services = services.filter(service => service !== '')
    }

    super.validateFields(req, res, async errors => {
      // Re-add any BVL services from the original location for users without edit_bvl,
      // so unrelated edits do not silently strip Book a video link from the location.
      if (!req.canAccess('edit_bvl')) {
        const bvlServiceKeys = new Set(
          (res.locals.serviceTypes || [])
            .filter(
              (st: { attributes?: { serviceFamilyType?: string } }) =>
                st.attributes?.serviceFamilyType === BVL_SERVICE_FAMILY_TYPE,
            )
            .map((st: { key: string }) => st.key),
        )
        const originalBvlServices = (locationDetails.usedByServices || []).filter((key: string) =>
          bvlServiceKeys.has(key),
        )
        if (originalBvlServices.length > 0) {
          const submitted = (req.form.values.services as string[]) || []
          req.form.values.services = Array.from(new Set([...submitted, ...originalBvlServices]))
        }
      }

      const { values } = req.form
      const { id: currentLocationId, localName, usedByServices, status } = locationDetails

      const sanitizedLocalName = sanitizeString(String(values.localName))

      const validationErrors: FormWizard.Errors = {}

      if (!sanitizedLocalName) {
        return callback({ ...errors, ...validationErrors })
      }

      // Only check uniqueness when the local name is actually changing. Some non-residential
      // parent locations have no stored local name, in which case the API substitutes the path
      // hierarchy when reading and does not return the location when searching by local name —
      // so the existing exclude-self-by-id check cannot identify the current location and
      // misreports the unchanged name as a duplicate.
      const localNameChanged = sanitizedLocalName.toLowerCase() !== (localName ?? '').toLowerCase()

      if (localNameChanged) {
        try {
          const locationsByLocalName = await locationsService.getNonResidentialLocationByLocalName(
            req.session.systemToken,
            res.locals.user.activeCaseload.id,
            sanitizedLocalName,
          )

          const idsOfLocationsWithProposedLocalName = locationsByLocalName.map((loc: { id: string }) => loc.id)
          if (
            idsOfLocationsWithProposedLocalName.length > 0 &&
            !idsOfLocationsWithProposedLocalName.includes(currentLocationId)
          ) {
            validationErrors.localName = this.formError('localName', 'uniqueNameRequired')
          }
        } catch (error) {
          if (error.responseStatus === 404) {
            return callback(errors)
          }
          throw error
        }
      }

      try {
        const noChangeLocalName = localName === values.localName
        const noChangeServices = isEqual(sortBy(req.form.values.services as string[]), sortBy(usedByServices))
        const noChangeStatus = status === values.locationStatus

        const noChange = locationDetails.isLeafLevel
          ? noChangeLocalName && noChangeServices && noChangeStatus
          : noChangeLocalName && noChangeServices

        logger.info(
          `check for no change: current localName=${localName}, proposed localName=${values.localName}, usedByServices=${usedByServices}, proposed services=${req.form.values.services}, status=${status}, proposed status=${values.locationStatus}`,
        )

        if (noChange) {
          logger.info('No changes detected for location details')
          validationErrors.localName = this.formError('', 'noChange')
          return callback({ ...errors, ...validationErrors })
        }
      } catch (error) {
        if (error.data?.errorCode === 101) {
          return callback({ ...errors, ...validationErrors })
        }
      }
      return callback({ ...errors, ...validationErrors })
    })
  }
}
