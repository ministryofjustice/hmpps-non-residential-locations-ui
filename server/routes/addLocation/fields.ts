import maxLength from '../../validators/maxLength'

const fields = {
  localName: {
    component: 'govukInput',
    validate: ['required', maxLength(40)],
    errorMessages: {
      required: 'Enter a location name',
      taken: 'A location with this name already exists',
      maxLength: 'Location name must be 40 characters or less',
    },
    id: 'localName',
    name: 'localName',
    classes: 'govuk-!-width-full local-name-text-input',
    label: {
      text: 'What is the location name?',
      classes: 'govuk-label--m',
    },
    hint: {
      text: "Describe the location not what happens there. For example, 'gym' rather than 'exercise'. Avoid using acronyms, unless the acronym is widely recognised.",
    },
    autocomplete: 'off',
    attributes: { 'data-qa': 'location-name' },
  },
  services: {
    component: 'groupedCheckboxes',
    multiple: true,
    validate: ['required'],
    errorMessages: { required: 'Select at least one service' },
    id: 'services',
    name: 'services',
    hint: { text: 'Select all that apply.' },
    fieldset: {
      legend: {
        text: 'What services must be able to use this location?',
        classes: 'govuk-fieldset__legend--m',
      },
    },
    items: [{ text: 'set at runtime', value: '' }],
    helptext: {
      attributes: { 'data-qa': 'helptext' },
      summaryText: 'How is this information used',
      text: 'Only the services you select will have online access to this location. They will see the location in an alphabetical drop-down list from within the service. They will only have access to the location when it is active.',
    },
  },
  locationStatus: {
    component: 'govukRadios',
    validate: ['required'],
    errorMessages: { required: 'Select ‘yes’ if the location is already active' },
    id: 'locationStatus',
    name: 'locationStatus',
    fieldset: {
      legend: {
        text: 'Is this location currently active?',
        classes: 'govuk-fieldset__legend--m',
      },
    },
    items: [
      { text: 'Yes', value: 'ACTIVE' },
      { text: 'No', value: 'INACTIVE' },
    ],
    attributes: { 'data-qa': 'location-status' },
  },
}

export default fields
