import Page, { PageElement } from '../page'

export default class IndexPage extends Page {
  constructor() {
    super('Add a non-residential location')
  }

  static goTo = () => cy.visit('/add-location')

  errorSummary = (): PageElement => cy.get('[data-module="govuk-error-summary"]')

  errorSummaryList = (): PageElement => cy.get('[data-module="govuk-error-summary"] ul li')

  locationNameInput = (): PageElement => cy.get('[data-qa="location-name"]')

  serviceCheckbox = (value: string): PageElement => cy.get(`input[name="services"][value="${value}"]`)

  locationStatusRadios = (): PageElement => cy.get('[data-qa="location-status"]')

  helptext = (): PageElement => cy.get('[data-qa="helptext"]')

  continueButton = (): PageElement => cy.get('button[type="submit"]')
}
