import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'
import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import { TypedLocals } from '../../@types/express'

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
}
