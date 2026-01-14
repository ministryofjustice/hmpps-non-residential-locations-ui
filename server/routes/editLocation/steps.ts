import FormWizard from 'hmpo-form-wizard'
import Details from '../../controllers/editLocation/details'
import CheckYourAnswers from '../../controllers/editLocation/checkYourAnswers'

const steps: FormWizard.Steps = {
  '/': {
    entryPoint: true,
    reset: true,
    resetJourney: true,
    skip: true,
    next: 'details',
  },
  '/details': {
    fields: ['localName', 'services', 'locationStatus'],
    controller: Details,
    template: '../../partials/formStep',
    next: 'check-your-answers',
  },
  '/check-your-answers': {
    controller: CheckYourAnswers,
    template: 'checkYourAnswers',
    pageTitle: 'Confirm changes to this location',
  },
}

export default steps
