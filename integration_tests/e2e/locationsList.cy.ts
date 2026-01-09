import IndexPage from '../pages/index'

context('Locations List', () => {
  context('View-only user (VIEW_INTERNAL_LOCATION role)', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocation', { prisonId: 'TST' })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
    })

    it('should display "View non-residential locations" as the page heading', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.heading().should('contain.text', 'View non-residential locations')
    })

    it('should not display Actions column in the table', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=locations-table] th').should('not.contain.text', 'Actions')
    })

    it('should not display Change links in the table', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=locations-table]').should('exist')
      cy.get('[data-qa=locations-table]').should('not.contain.text', 'Change')
    })

    it('should display breadcrumb with "View non-residential locations"', () => {
      cy.signIn()
      IndexPage.forViewUser()
      // The breadcrumb should contain all 3 items: Digital Prison Services > Locations > View...
      cy.get('.govuk-breadcrumbs__list').should('contain.text', 'View non-residential locations')
    })
  })

  context('Edit user (NONRESI__MAINTAIN_LOCATION role)', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION', 'NONRESI__MAINTAIN_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocation', { prisonId: 'TST' })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
    })

    it('should display "Edit non-residential locations" as the page heading', () => {
      cy.signIn()
      const indexPage = IndexPage.forEditUser()
      indexPage.heading().should('contain.text', 'Edit non-residential locations')
    })

    it('should display Actions column in the table', () => {
      cy.signIn()
      const indexPage = IndexPage.forEditUser()
      indexPage.actionsColumn().should('exist')
    })

    it('should display Change links for each location', () => {
      cy.signIn()
      const indexPage = IndexPage.forEditUser()
      indexPage.changeLinks().should('exist')
    })

    it('should display breadcrumb with "Edit the list of non-residential locations"', () => {
      cy.signIn()
      IndexPage.forEditUser()
      // The breadcrumb should contain all 3 items: Digital Prison Services > Locations > Edit the list...
      cy.get('.govuk-breadcrumbs__list').should('contain.text', 'Edit the list of non-residential locations')
    })
  })
})
