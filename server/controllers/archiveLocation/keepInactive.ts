import FormWizard from 'hmpo-form-wizard'
import { Response } from 'express'

import FormInitialStep from '../base/formInitialStep'
import capFirst from '../../formatters/capFirst'

export default class KeepInactive extends FormInitialStep {
  override get(req: FormWizard.Request, res: Response) {
    const { locationDetails } = res.locals
    const { prisonId, localName } = locationDetails
    const locationNameSentenceCase = capFirst(localName)

    req.journeyModel.reset()
    req.sessionModel.reset()
    req.flash('successMojFlash', {
      title: `${locationNameSentenceCase} kept inactive`,
      variant: 'success',
      dismissible: true,
    })
    res.redirect(`/prison/${prisonId}`)
  }
}
