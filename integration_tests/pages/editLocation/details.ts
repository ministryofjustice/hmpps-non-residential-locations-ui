import Page, { PageElement } from '../page'

export default class EditDetailsPage extends Page {
  constructor(localName: string) {
    super(`Change ${localName}`)
  }

  static goTo = (locationId: string) => cy.visit(`/location/${locationId}/edit`)

  locationNameInput = (): PageElement => cy.get('[data-qa="location-name"]')

  characterCountInfo = (): PageElement => cy.get('#localName-info')

  serviceCheckbox = (value: string): PageElement => cy.get(`input[name="services"][value="${value}"]`)

  locationStatusRadios = (): PageElement => cy.get('[data-qa="location-status"]')

  continueButton = (): PageElement => cy.get('button[type="submit"]')

  cancelLink = (): PageElement => cy.get('a').contains('Cancel')

  errorSummary = (): PageElement => cy.get('[data-module="govuk-error-summary"]')

  errorSummaryList = (): PageElement => cy.get('[data-module="govuk-error-summary"] ul li')
}
