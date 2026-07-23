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
    const { localName, id: locationId, isLeafLevel } = locationDetails

    const locationNameSentenceCase = capFirst(localName)
    const title = `Are you sure you want to archive ${locationNameSentenceCase}?`
    res.locals.title = title

    // A parent location is not archived in the true sense - it is hidden from the list (MAPB-670).
    // Nothing loses access and, by the time we get here, no service uses it, so the leaf wording
    // about affected services and lingering document references does not apply.
    if (!isLeafLevel) {
      const backLink = backUrl(req, {
        fallbackUrl: `/prison/${locationDetails.prisonId}`,
      })

      return {
        ...locals,
        backLink,
        goBackLink: `/prison/${locationDetails.prisonId}`,
        heading: title,
        hint: 'It will be removed from your list of non-residential locations. Any locations inside it will not be affected and will stay in the list.',
        buttonText: 'Archive location',
        servicesAffected: [] as string[],
      }
    }

    const backLink = backUrl(req, {
      fallbackUrl: `/location/${locationId}/archive/archive-or-inactive`,
    })

    // Get the services that will be affected
    const servicesAffected = getServicesAffected(locationDetails.usedByGroupedServices, serviceFamilyTypes)

    // Build heading - include services list if any
    let heading = title
    if (servicesAffected.length > 0) {
      heading += '<br><br>These services will not have access:'
    }

    return {
      ...locals,
      backLink,
      goBackLink: `/location/${locationId}/archive/archive-or-inactive`,
      heading,
      hint: 'References to the location will remain in existing documents such as use of force reports.',
      buttonText: 'Archive location',
      servicesAffected,
    }
  }

  override async saveValues(req: FormWizard.Request, res: Response, next: NextFunction) {
    try {
      const { systemToken } = req.session
      const { locationDetails } = res.locals
      const { locationsService } = req.services

      // A parent location is hidden from the list rather than genuinely archived. Fail closed if it
      // somehow reaches here without being eligible, rather than relying on the link being hidden.
      if (!locationDetails.isLeafLevel) {
        if (!locationDetails.canBeHiddenFromList) {
          throw new Error(`Location ${locationDetails.id} cannot be hidden from the list`)
        }
        await locationsService.hideNonResidentialLocation(systemToken, locationDetails.id)
      } else {
        await locationsService.archiveNonResidentialLocation(systemToken, locationDetails.id)
      }

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
