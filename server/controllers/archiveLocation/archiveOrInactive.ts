import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'

import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import capFirst from '../../formatters/capFirst'
import getServicesAffected from '../../utils/getServicesAffected'
import { TypedLocals } from '../../@types/express'

export default class ArchiveOrInactive extends FormInitialStep {
  override middlewareSetup() {
    this.use(this.setOptions)
    super.middlewareSetup()
  }

  async setOptions(req: FormWizard.Request, res: Response, next: NextFunction) {
    const serviceTypes = await req.services.locationsService.getServiceFamilyTypes(req.session.systemToken)

    res.locals.serviceFamilyTypes = serviceTypes
    next()
  }

  override locals(req: FormWizard.Request, res: Response): TypedLocals {
    const locals = super.locals(req, res)
    const { locationDetails, serviceFamilyTypes } = res.locals
    const { prisonId, localName } = locationDetails

    const backLink = backUrl(req, {
      fallbackUrl: `/prison/${prisonId}`,
    })

    const locationNameSentenceCase = capFirst(localName)

    res.locals.title = `Archive ${locationNameSentenceCase} or make it inactive`

    // Get the services that will be affected
    const servicesAffected = getServicesAffected(locationDetails.usedByGroupedServices, serviceFamilyTypes)

    // Set services affected on res.locals for the template
    res.locals.servicesAffected = servicesAffected

    return {
      ...locals,
      backLink,
      cancelLink: `/prison/${prisonId}/`,
      title: `Archive ${locationNameSentenceCase} or make it inactive`,
      buttonText: 'Continue',
    }
  }
}
