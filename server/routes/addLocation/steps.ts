import FormWizard from 'hmpo-form-wizard'
import Details from '../../controllers/addLocation/details'

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
    template: 'details',
    next: 'check-your-answers',
  },
  '/check-your-answers': {
    template: 'checkYourAnswers',
  },
}

export default steps
