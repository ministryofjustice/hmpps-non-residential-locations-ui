import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'
import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import { TypedLocals } from '../../@types/express'
import { sanitizeString } from '../../utils/utils'

export default class Details extends FormInitialStep {
  override middlewareSetup() {
    this.use(this.setOptions)
    super.middlewareSetup()
  }

  async setOptions(req: FormWizard.Request, res: Response, next: NextFunction) {
    const serviceTypes = await req.services.locationsService.getServiceTypes(req.session.systemToken)

    req.form.options.fields.services.items = Object.values(serviceTypes).map(
      (serviceType: { key: string; description: string }) => ({
        text: serviceType.description,
        value: serviceType.key,
      }),
    )

    next()
  }

  override locals(req: FormWizard.Request, res: Response): TypedLocals {
    const locals = super.locals(req, res)
    const fields = { ...(locals.fields as FormWizard.Fields) }
    fields.services.items = res.locals.serviceFamilyTypes
    const backLink = backUrl(req, {
      fallbackUrl: `/`,
    })

    return {
      ...locals,
      backLink,
      cancelLink: '/',
      buttonText: 'Continue',
    }
  }

  override async validateFields(req: FormWizard.Request, res: Response, callback: (errors: FormWizard.Errors) => void) {
    const { localName } = req.form.values
    const { locationsService } = req.services
    const sanitizedLocalName = sanitizeString(String(localName))

    super.validateFields(req, res, async errors => {
      const validationErrors: FormWizard.Errors = {}

      if (!errors.localName) {
        let location
        try {
          location = await locationsService.getNonResidentialLocationByLocalName(
            req.session.systemToken,
            res.locals.user.activeCaseload.id,
            sanitizedLocalName,
          )
          if (location) {
            validationErrors.localName = this.formError('localName', 'uniqueNameRequired')
          }
        } catch (error) {
          if (error.responseStatus === 404) {
            return callback(errors)
          }
          throw error
        }
      }

      return callback({ ...errors, ...validationErrors })
    })
  }
}
