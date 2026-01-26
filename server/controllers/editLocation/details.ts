import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Request, Response } from 'express'
import { isEqual, sortBy } from 'lodash'

import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import { sanitizeString } from '../../utils/utils'
import { TypedLocals } from '../../@types/express'
import capFirst from '../../formatters/capFirst'
import addAction from '../../middleware/addAction'

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

  override locals(req: FormWizard.Request, res: Response): TypedLocals {
    const locals = super.locals(req, res)
    const { locationDetails } = res.locals
    const { prisonId, localName } = locationDetails

    const fields = { ...(locals.fields as FormWizard.Fields) }
    fields.services.items = res.locals.serviceFamilyTypes
    fields.services.value = (req.form.values.services as string[]) || locationDetails.usedByServices
    fields.localName.value = (req.form.values.localName as string) || locationDetails.localName
    fields.locationStatus.value = (req.form.values.locationStatus as string) || locationDetails.status

    const backLink = backUrl(req, {
      fallbackUrl: `/prison/${prisonId}`,
    })

    if (req.canAccess('edit_non_resi') && locationDetails.status !== 'ARCHIVED') {
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
    super.validateFields(req, res, async errors => {
      const { values } = req.form
      const { locationDetails } = res.locals
      const { localName, usedByServices, status } = locationDetails

      const sanitizedLocalName = sanitizeString(String(values.localName))

      const validationErrors: FormWizard.Errors = {}

      if (!sanitizedLocalName) {
        return callback({ ...errors, ...validationErrors })
      }

      try {
        const noChange =
          localName === values.localName &&
          isEqual(sortBy(req.form.values.services as string[]), sortBy(usedByServices)) &&
          status === values.locationStatus

        if (noChange) {
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
