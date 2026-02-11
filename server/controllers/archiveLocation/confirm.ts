import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'

import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import capFirst from '../../formatters/capFirst'
import getServicesAffected from '../../utils/getServicesAffected'

export default class Confirm extends FormInitialStep {
  override middlewareSetup() {
    this.use(this.setOptions)
    super.middlewareSetup()
  }

  async setOptions(req: FormWizard.Request, res: Response, next: NextFunction) {
    const serviceTypes = await req.services.locationsService.getServiceFamilyTypes(req.session.systemToken)
    res.locals.serviceFamilyTypes = serviceTypes
    next()
  }

  override locals(req: FormWizard.Request, res: Response): Record<string, unknown> {
    const locals = super.locals(req, res)
    const { locationDetails, serviceFamilyTypes } = res.locals
    const { localName, id: locationId } = locationDetails

    const backLink = backUrl(req, {
      fallbackUrl: `/location/${locationId}/archive/archive-or-inactive`,
    })

    const locationNameSentenceCase = capFirst(localName)

    // Get the services that will be affected
    const servicesAffected = getServicesAffected(locationDetails.usedByGroupedServices, serviceFamilyTypes)

    // Build heading - include services list if any
    let heading = `Are you sure you want to archive ${locationNameSentenceCase}?`
    if (servicesAffected.length > 0) {
      heading += '<br><br>These services will not have access:'
    }

    res.locals.title = `Are you sure you want to archive ${locationNameSentenceCase}?`

    return {
      ...locals,
      backLink,
      goBackLink: `/location/${locationId}/archive/archive-or-inactive`,
      heading,
      buttonText: 'Archive location',
      servicesAffected,
    }
  }

  override async saveValues(req: FormWizard.Request, res: Response, next: NextFunction) {
    try {
      const { systemToken } = req.session
      const { locationDetails } = res.locals
      const { locationsService } = req.services

      await locationsService.archiveNonResidentialLocation(systemToken, locationDetails.id)

      next()
    } catch (error) {
      next(error)
    }
  }

  override successHandler(req: FormWizard.Request, res: Response, _next: NextFunction) {
    const { prisonId, localName } = res.locals.locationDetails
    req.journeyModel.reset()
    req.sessionModel.reset()
    req.flash('successMojFlash', {
      title: `${localName} archived`,
      variant: 'success',
      dismissible: true,
    })
    res.redirect(`/prison/${prisonId}`)
  }
}
