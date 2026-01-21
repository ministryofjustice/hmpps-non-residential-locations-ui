const fields = {
  archiveOrInactive: {
    component: 'govukRadios',
    validate: ['required'],
    errorMessages: {
      required: 'You must archive the location, make it inactive or select cancel',
    },
    id: 'archiveOrInactive',
    name: 'archiveOrInactive',
    fieldset: {
      legend: {
        text: 'Do you want to archive this location or make it inactive?',
        classes: 'govuk-fieldset__legend--m',
      },
    },
    items: [
      {
        text: 'Archive this location',
        value: 'ARCHIVE',
        hint: {
          text: 'Permanently remove this location. Services currently using it will no longer have access to it.',
        },
      },
      {
        text: 'Make this location inactive',
        value: 'INACTIVE',
        hint: {
          text: 'Keep the location in the list but temporarily remove access for services until you make it active again.',
        },
      },
    ],
    attributes: { 'data-qa': 'archive-or-inactive' },
  },
}

export default fields
