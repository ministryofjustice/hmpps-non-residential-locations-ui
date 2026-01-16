import FormWizard from 'hmpo-form-wizard'
import Details from '../../controllers/addLocation/details'
import CheckYourAnswers from '../../controllers/addLocation/checkYourAnswers'

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
    template: 'checkYourAnswers',
    controller: CheckYourAnswers,
    next: '/',
  },
}

export default steps
