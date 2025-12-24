import { NextFunction, Request, Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import logger from '../../logger'

type LocationLocals = 'locationDetails'

type PopulateLocationParams = {
  id?: string
  localName?: LocationLocals
}

export default function populateLocation({ id, localName }: PopulateLocationParams = {}) {
  return async (req: Request | FormWizard.Request, res: Response, next: NextFunction): Promise<void> => {
    const { locationsService } = req.services
    let locationDetails = res.locals[localName || 'locationDetails']

    try {
      const { systemToken } = req.session

      if (!locationDetails) {
        locationDetails = await locationsService.getNonResidentialLocationDetails(
          systemToken,
          id || req.params.locationId || res.locals.locationId,
        )
      }

      res.locals[localName || 'locationDetails'] = locationDetails
      return next()
    } catch (error) {
      logger.error(
        error,
        `Failed to populate location for: prisonId: ${locationDetails?.prisonId}, locationId: ${locationDetails?.id}`,
      )
      next(error)
    }

    return next()
  }
}
