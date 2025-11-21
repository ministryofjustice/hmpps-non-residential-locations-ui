import { NextFunction, Request, Response } from 'express'
import FormWizard from 'hmpo-form-wizard'

export default async function populateConstants(
  req: Request | FormWizard.Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { locationsService } = req.services
  const { systemToken } = req.session

  res.locals.nonResiUsageTypes = await locationsService.getNonResidentialUsageTypes(systemToken)
  res.locals.serviceTypes = await locationsService.getServiceTypes(systemToken)
  res.locals.serviceFamilyTypes = await locationsService.getServiceFamilyTypes(systemToken)

  return next()
}
