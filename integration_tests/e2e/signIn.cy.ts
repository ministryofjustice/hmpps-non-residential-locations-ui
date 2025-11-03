import IndexPage from '../pages/index'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthManageDetailsPage from '../pages/authManageDetails'

context('Sign In', () => {
  context('Without the VIEW_INTERNAL_LOCATION role', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: [] })
    })

    it('Unauthenticated user directed to auth', () => {
      cy.visit('/')
      Page.verifyOnPage(AuthSignInPage)
    })

    it('Unauthenticated user navigating to sign in page directed to auth', () => {
      cy.visit('/sign-in')
      Page.verifyOnPage(AuthSignInPage)
    })

    it('Error header is visible', () => {
      cy.signIn({ failOnStatusCode: false })
      cy.get('h1').contains('Authorisation Error')
    })
  })

  context('With the VIEW_INTERNAL_LOCATION role', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocation', { prisonId: 'TST' })
    })

    it('Unauthenticated user directed to auth', () => {
      cy.visit('/')
      Page.verifyOnPage(AuthSignInPage)
    })

    it('Unauthenticated user navigating to sign in page directed to auth', () => {
      cy.visit('/sign-in')
      Page.verifyOnPage(AuthSignInPage)
    })

    it('User name visible in header', () => {
      cy.signIn({ failOnStatusCode: false })
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.headerUserName().should('contain.text', 'J. Smith')
    })

    it('Phase banner visible in header', () => {
      cy.signIn({ failOnStatusCode: false })
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.headerPhaseBanner().should('contain.text', 'TEST')
    })

    it('User can sign out', () => {
      cy.signIn({ failOnStatusCode: false })
      const indexPage = Page.verifyOnPage(IndexPage)
      indexPage.signOut().click()
      Page.verifyOnPage(AuthSignInPage)
    })

    it('User can manage their details', () => {
      cy.signIn({ failOnStatusCode: false })
      cy.task('stubAuthManageDetails')
      const indexPage = Page.verifyOnPage(IndexPage)

      indexPage.manageDetails().get('a').invoke('removeAttr', 'target')
      indexPage.manageDetails().click()
      Page.verifyOnPage(AuthManageDetailsPage)
    })

    it('Token verification failure takes user to sign in page', () => {
      cy.signIn({ failOnStatusCode: false })
      Page.verifyOnPage(IndexPage)
      cy.task('stubVerifyToken', false)

      // can't do a visit here as cypress requires only one domain
      cy.request('/').its('body').should('contain', 'Sign in')
    })

    it('Token verification failure clears user session', () => {
      cy.signIn({ failOnStatusCode: false })
      const indexPage = Page.verifyOnPage(IndexPage)
      cy.task('stubVerifyToken', false)

      cy.visit('/')
      Page.verifyOnPage(AuthSignInPage)

      cy.task('stubVerifyToken', true)
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'], name: 'bobby brown' })
      cy.signIn()
      indexPage.headerUserName().contains('B. Brown')
    })
  })
})
