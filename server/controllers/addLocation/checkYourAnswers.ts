import FormWizard from 'hmpo-form-wizard'
import { NextFunction, Response } from 'express'
import FormInitialStep from '../base/formInitialStep'
import { TypedLocals } from '../../@types/express'
import logger from '../../../logger'

export default class CheckYourAnswers extends FormInitialStep {
  override locals(req: FormWizard.Request, res: Response): TypedLocals {
    const prisonId = req.session.prisonId || res.locals.user.activeCaseload.id
    const services = res.locals.values.services as string[]
    const { serviceTypes } = res.locals
    const serviceTypeDescriptions = serviceTypes
      .filter(serviceType => services.includes(serviceType.key))
      .map(serviceType => serviceType.description)

    res.locals.values.serviceTypeDescriptions = serviceTypeDescriptions

    return {
      title: 'Check your answers',
      cancelLink: `/prison/${prisonId}`,
      buttonText: 'Confirm and save',
    }
  }

  override async saveValues(req: FormWizard.Request, res: Response, next: NextFunction) {
    const prisonId = req.session.prisonId || res.locals.user.activeCaseload.id
    const values = req.sessionModel.toJSON() as {
      localName: string
      services: string[]
      locationStatus: string
    }

    const locationData = {
      localName: values.localName,
      servicesUsingLocation: values.services,
      // eslint-disable-next-line no-unneeded-ternary
      active: values.locationStatus === 'ACTIVE' ? true : false,
    }

    try {
      await req.services.locationsService.addNonResidentialLocation(req.session.systemToken, prisonId, locationData)
    } catch (error) {
      logger.error(`Failed to create location ${values.localName} at ${prisonId}`, error)
      next(error)
    }
    next()
  }

  override successHandler(req: FormWizard.Request, res: Response, _next: NextFunction) {
    const prisonId = req.session.prisonId || res.locals.user.activeCaseload.id
    const values = req.sessionModel.toJSON() as {
      localName: string
    }
    logger.info(`Successfully created location ${values.localName} at ${prisonId}`)

    req.journeyModel.reset()
    req.sessionModel.reset()
    req.flash('successMojFlash', {
      title: `${values.localName} added`,
      variant: 'success',
      dismissible: true,
    })
    res.redirect(`/prison/${prisonId}`)
  }
}
