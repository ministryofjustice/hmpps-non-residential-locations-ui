import FormWizard from 'hmpo-form-wizard'
import ArchiveOrInactive from '../../controllers/archiveLocation/archiveOrInactive'
import Confirm from '../../controllers/archiveLocation/confirm'
import InactiveConfirm from '../../controllers/archiveLocation/inactiveConfirm'
import KeepInactive from '../../controllers/archiveLocation/keepInactive'

const steps: FormWizard.Steps = {
  '/': {
    entryPoint: true,
    reset: true,
    resetJourney: true,
    skip: true,
    next: 'archive-or-inactive',
  },
  '/archive-or-inactive': {
    fields: ['archiveOrInactive'],
    controller: ArchiveOrInactive,
    template: 'archiveOrInactive',
    next: [
      { field: 'archiveOrInactive', value: 'ARCHIVE', next: 'confirm' },
      { field: 'archiveOrInactive', value: 'INACTIVE', next: 'inactive-confirm' },
      { field: 'archiveOrInactive', value: 'KEEP_INACTIVE', next: 'keep-inactive' },
    ],
  },
  '/confirm': {
    controller: Confirm,
    template: 'confirm',
    pageTitle: 'Are you sure you want to archive this location?',
  },
  '/inactive-confirm': {
    controller: InactiveConfirm,
    template: '../editLocation/checkYourAnswers',
    pageTitle: 'Confirm changes to this location',
  },
  '/keep-inactive': {
    controller: KeepInactive,
  },
}

export default steps
