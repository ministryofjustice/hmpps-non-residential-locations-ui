import Page, { PageElement } from '../page'

export default class ArchiveConfirmPage extends Page {
  constructor(localName: string) {
    super(`Are you sure you want to archive ${localName}?`)
  }

  interruptionCard = (): PageElement => cy.get('.moj-interruption-card')

  archiveButton = (): PageElement => cy.get('button[type="submit"]').contains('Archive location')

  goBackLink = (): PageElement => cy.get('a').contains('Go back')

  servicesAffectedList = (): PageElement => cy.get('.moj-interruption-card ul.govuk-list--bullet')
}
