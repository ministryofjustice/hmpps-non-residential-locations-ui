import AccessibilityStatementPage from '../pages/accessibilityStatement'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'

context('Accessibility Statement', () => {
  context('Unauthenticated user', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: [] })
    })

    it('Unauthenticated user directed to auth', () => {
      cy.visit('/accessibility-statement')
      Page.verifyOnPage(AuthSignInPage)
    })
  })

  context('View accessibility statement', () => {
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
      cy.task('stubGetPrisonConfiguration')
    })

    it('Displays the accessibility statement page', () => {
      cy.signIn()
      cy.visit('/accessibility-statement')
      Page.verifyOnPage(AccessibilityStatementPage)
    })
  })
})
