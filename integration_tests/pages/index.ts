import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor(title: string = 'View non-residential locations') {
    super(title)
  }

  static forViewUser(): IndexPage {
    return new IndexPage('View non-residential locations')
  }

  static forEditUser(): IndexPage {
    return new IndexPage('Edit non-residential locations')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  heading = (): PageElement => cy.get('h1')

  breadcrumbs = (): PageElement => cy.get('.govuk-breadcrumbs')

  locationsTable = (): PageElement => cy.get('[data-qa=locations-table]')

  actionsColumn = (): PageElement => cy.get('[data-qa=locations-table] th').contains('Actions')

  changeLinks = (): PageElement => cy.get('[data-qa=locations-table] a').contains('Change')
}
