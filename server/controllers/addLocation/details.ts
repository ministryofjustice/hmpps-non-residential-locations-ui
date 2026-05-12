import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'
import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import { TypedLocals } from '../../@types/express'
import { sanitizeString } from '../../utils/utils'

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

    req.form.options.fields.services.items = visibleServiceTypes.map(
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
    fields.services.items = req.canAccess('edit_bvl')
      ? res.locals.serviceFamilyTypes
      : (res.locals.serviceFamilyTypes || []).filter(
          (family: { key: string }) => family.key !== BVL_SERVICE_FAMILY_TYPE,
        )
    const backLink = backUrl(req, {
      fallbackUrl: `/`,
    })

    locals.title = 'Add a non-residential location'

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
          if (location.length > 0) {
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
