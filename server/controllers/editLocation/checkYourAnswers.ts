import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'
import { isEqual, sortBy } from 'lodash'

import FormInitialStep from '../base/formInitialStep'
import backUrl from '../../utils/backUrl'
import { sanitizeString } from '../../utils/utils'

interface ChangedField {
  question: string
  changedFrom: string | string[]
  changedTo: string | string[]
  changeLink: string
}

interface SessionData {
  localName?: string
  services?: string[]
  locationStatus?: string
}

export default class CheckYourAnswers extends FormInitialStep {
  override locals(req: FormWizard.Request, res: Response): Record<string, unknown> {
    const locals = super.locals(req, res)
    const { locationDetails, serviceFamilyTypes } = res.locals
    const { prisonId, id: locationId } = locationDetails

    const backLink = backUrl(req, {
      fallbackUrl: `/location/${locationId}/edit/details`,
    })

    const changedFields = this.getChangedFields(req, res, serviceFamilyTypes)

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

  private getChangedFields(
    req: FormWizard.Request,
    res: Response,
    serviceFamilyTypes: Array<{
      key: string
      description: string
      values: Array<{ key: string; description: string }>
    }>,
  ): ChangedField[] {
    const { locationDetails } = res.locals
    const { localName: originalName, usedByServices: originalServices, status: originalStatus } = locationDetails
    const sessionData = req.sessionModel.toJSON() as SessionData
    const { localName: newName, services: newServices, locationStatus: newStatus } = sessionData
    const locationId = locationDetails.id

    const changedFields: ChangedField[] = []

    // Check location name
    if (newName && newName !== originalName) {
      changedFields.push({
        question: 'What is the location name?',
        changedFrom: originalName,
        changedTo: newName as string,
        changeLink: `/location/${locationId}/edit/details`,
      })
    }

    // Check services
    const originalServicesSorted = sortBy(originalServices || [])
    const newServicesSorted = sortBy((newServices as string[]) || [])
    if (!isEqual(originalServicesSorted, newServicesSorted)) {
      changedFields.push({
        question: 'What services must be able to use this location?',
        changedFrom: this.formatServices(originalServices, serviceFamilyTypes),
        changedTo: this.formatServices(newServices as string[], serviceFamilyTypes),
        changeLink: `/location/${locationId}/edit/details`,
      })
    }

    // Check status
    if (newStatus && newStatus !== originalStatus) {
      changedFields.push({
        question: 'Is this location currently active?',
        changedFrom: this.formatStatus(originalStatus),
        changedTo: this.formatStatus(newStatus as string),
        changeLink: `/location/${locationId}/edit/details`,
      })
    }

    return changedFields
  }

  private formatServices(
    services: string[],
    serviceFamilyTypes: Array<{
      key: string
      description: string
      values: Array<{ key: string; description: string }>
    }>,
  ): string[] {
    if (!services || services.length === 0) return []

    return services.map(serviceKey => {
      for (const family of serviceFamilyTypes) {
        for (const service of family.values) {
          if (service.key === serviceKey) {
            return service.description
          }
        }
      }
      return serviceKey
    })
  }

  private formatStatus(status: string): string {
    return status === 'ACTIVE' ? 'Yes' : 'No'
  }

  override async saveValues(req: FormWizard.Request, res: Response, next: NextFunction) {
    try {
      const { systemToken } = req.session
      const { locationDetails } = res.locals
      const { locationsService } = req.services

      const sessionData = req.sessionModel.toJSON() as SessionData
      const { localName, services, locationStatus } = sessionData

      const sanitizedLocalName = sanitizeString(String(localName))
      // Convert status string to boolean for API: 'ACTIVE' -> true, 'INACTIVE' -> false, undefined -> undefined
      let active: boolean | undefined
      if (locationStatus === 'ACTIVE') {
        active = true
      } else if (locationStatus === 'INACTIVE') {
        active = false
      }
      await locationsService.updateNonResidentialLocationDetails(
        systemToken,
        locationDetails.id,
        sanitizedLocalName,
        services,
        active,
      )

      next()
    } catch (error) {
      next(error)
    }
  }

  override successHandler(req: FormWizard.Request, res: Response, _next: NextFunction) {
    const { prisonId } = res.locals.locationDetails
    const { localName: newLocalName } = req.sessionModel.toJSON() as SessionData

    req.journeyModel.reset()
    req.sessionModel.reset()
    req.flash('successMojFlash', {
      title: `${newLocalName} changed`,
      variant: 'success',
      dismissible: true,
    })
    res.redirect(`/prison/${prisonId}`)
  }
}
