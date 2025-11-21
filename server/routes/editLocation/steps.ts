import FormWizard from 'hmpo-form-wizard'
import Details from '../../controllers/editLocation/details'

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
  },
}

export default steps
