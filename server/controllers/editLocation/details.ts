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

export default class Details extends FormInitialStep {
  override middlewareSetup() {
    this.use(this.setOptions)
    super.middlewareSetup()
  }

  async setOptions(req: FormWizard.Request, res: Response, next: NextFunction) {
    const serviceTypes = await req.services.locationsService.getServiceTypes(req.session.systemToken)

    req.form.options.fields.services.items = Object.values(serviceTypes).map(({ key, description }) => ({
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
    fields.services.items = res.locals.serviceFamilyTypes

    const backLink = backUrl(req, {
      fallbackUrl: `/prison/${prisonId}`,
    })

    if (req.canAccess('edit_non_resi') && isLeafLevel && locationDetails.status !== 'ARCHIVED') {
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

    super.validateFields(req, res, async errors => {
      const { values } = req.form
      const { id: currentLocationId, localName, usedByServices, status } = locationDetails

      const sanitizedLocalName = sanitizeString(String(values.localName))

      const validationErrors: FormWizard.Errors = {}

      if (!sanitizedLocalName) {
        return callback({ ...errors, ...validationErrors })
      }

      try {
        const locationsByLocalName = await locationsService.getNonResidentialLocationByLocalName(
          req.session.systemToken,
          res.locals.user.activeCaseload.id,
          sanitizedLocalName,
        )

        const idsOfLocationsWithProposedLocalName = locationsByLocalName.map((loc: { id: string }) => loc.id)
        // display validation error if locations with the proposed localName already exist
        // and exclude the current location from this check to allow saving when localName is not changed
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
