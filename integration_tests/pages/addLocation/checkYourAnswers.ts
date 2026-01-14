import Page, { PageElement } from '../page'

export default class IndexPage extends Page {
  constructor() {
    super('Check your answers')
  }

  static goTo = () => cy.visit('/check-your-answers')

  subtTitle = (): PageElement => cy.get('h2.govuk-heading-m')

  summaryListRow = (row: number, col: number): PageElement =>
    cy.get('dl.govuk-summary-list').find('div.govuk-summary-list__row').eq(row).children().eq(col)

  changeLink = (): PageElement => cy.get('.govuk-summary-list__actions .govuk-link')

  cancelLink = (): PageElement => cy.get('.govuk-button-group .govuk-link')

  continueButton = (): PageElement => cy.get('button[type="submit"]')
}
