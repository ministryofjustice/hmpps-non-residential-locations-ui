import Page, { PageElement } from '../page'

export default class CheckYourAnswersPage extends Page {
  constructor() {
    super('Confirm changes to this location')
  }

  changesTable = (): PageElement => cy.get('[data-qa="changes-table"]')

  changesTableRowAndColumn = (row: number, col: number): PageElement =>
    cy.get('[data-qa="changes-table"] tr').eq(row).find('td').eq(col)

  confirmButton = (): PageElement => cy.get('button[type="submit"]')

  cancelLink = (): PageElement => cy.get('a').contains('Cancel')

  changeLinks = (): PageElement => cy.get('[data-qa="changes-table"] a').contains('Change')
}
