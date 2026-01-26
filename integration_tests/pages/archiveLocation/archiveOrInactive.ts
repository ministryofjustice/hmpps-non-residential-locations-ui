import Page, { PageElement } from '../page'

export default class ArchiveOrInactivePage extends Page {
  constructor(localName: string, isInactive = false) {
    super(isInactive ? `Archive ${localName}` : `Archive ${localName} or make it inactive`)
  }

  static goTo = (locationId: string) => cy.visit(`/location/${locationId}/archive`)

  archiveRadio = (): PageElement => cy.get('input[name="archiveOrInactive"][value="ARCHIVE"]')

  inactiveRadio = (): PageElement => cy.get('input[name="archiveOrInactive"][value="INACTIVE"]')

  keepInactiveRadio = (): PageElement => cy.get('input[name="archiveOrInactive"][value="KEEP_INACTIVE"]')

  continueButton = (): PageElement => cy.get('button[type="submit"]')

  cancelLink = (): PageElement => cy.get('a').contains('Cancel')

  backLink = (): PageElement => cy.get('a.govuk-back-link')

  errorSummary = (): PageElement => cy.get('[data-module="govuk-error-summary"]')

  errorSummaryList = (): PageElement => cy.get('[data-module="govuk-error-summary"] ul li')

  servicesAffectedList = (): PageElement => cy.get('.govuk-radios__conditional ul.govuk-list--bullet')
}
