import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'

import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'

interface ChangedField {
  question: string
  changedFrom: string
  changedTo: string
  changeLink: string
}

export default class InactiveConfirm extends FormInitialStep {
  override locals(req: FormWizard.Request, res: Response): Record<string, unknown> {
    const locals = super.locals(req, res)
    const { locationDetails } = res.locals
    const { prisonId, id: locationId, status: originalStatus } = locationDetails

    const backLink = backUrl(req, {
      fallbackUrl: `/location/${locationId}/archive/archive-or-inactive`,
    })

    const changedFields: ChangedField[] = [
      {
        question: 'Is this location currently active?',
        changedFrom: this.formatStatus(originalStatus),
        changedTo: this.formatStatus('INACTIVE'),
        changeLink: `/location/${locationId}/archive/archive-or-inactive`,
      },
    ]

    res.locals.title = 'Confirm changes to this location'

    return {
      ...locals,
      backLink,
      cancelLink: `/prison/${prisonId}/`,
      title: 'Confirm changes to this location',
      buttonText: 'Confirm and save',
      changedFields,
      locationId,
    }
  }

  private formatStatus(status: string): string {
    return status === 'ACTIVE' ? 'Yes' : 'No'
  }

  override async saveValues(req: FormWizard.Request, res: Response, next: NextFunction) {
    try {
      const { systemToken } = req.session
      const { locationDetails } = res.locals
      const { locationsService } = req.services

      const { localName, usedByServices } = locationDetails

      await locationsService.updateNonResidentialLocationDetails(
        systemToken,
        locationDetails.id,
        localName,
        usedByServices,
        false, // active: false = make inactive
      )

      next()
    } catch (error) {
      next(error)
    }
  }

  override successHandler(req: FormWizard.Request, res: Response, _next: NextFunction) {
    const { prisonId } = res.locals.locationDetails
    req.journeyModel.reset()
    req.sessionModel.reset()
    req.flash('successMojFlash', {
      title: '<strong>Location made inactive</strong>',
      variant: 'success',
      dismissible: true,
    })
    res.redirect(`/prison/${prisonId}`)
  }
}
