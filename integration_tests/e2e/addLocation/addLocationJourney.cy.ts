import IndexPage from '../../pages/addLocation/index'
import CheckYourAnswersPage from '../../pages/addLocation/checkYourAnswers'
import Page from '../../pages/page'

context('Start journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
    cy.task('stubManageUsersMe')
    cy.task('stubManageUsersMeCaseloads')
    cy.task('stubNonResidentialLocation', { prisonId: 'TST' })
    cy.task('stubLocationsConstantsNonResidentialUsageType')
    cy.task('stubLocationsConstantsServiceTypes')
    cy.task('stubLocationsConstantsServiceFamilyTypes')
  })

  it('Should display error messages correctly', () => {
    cy.signIn({ failOnStatusCode: false })
    IndexPage.goTo()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.errorSummary().should('not.exist')
    indexPage.continueButton().click()
    indexPage.errorSummary().should('exist')
    indexPage.errorSummaryList().should('have.length', 3)
    indexPage.errorSummaryList().eq(0).should('contain.text', 'Enter a local name')
    indexPage.errorSummaryList().eq(1).should('contain.text', 'Select at least one service')
    indexPage
      .errorSummaryList()
      .eq(2)
      .should('contain.text', 'Select \u2018yes\u2019 if the location is already active')

    indexPage.localNameInput().type('Loc A')
    indexPage.locationStatusRadios().find('input[value="ACTIVE"]').click()
    indexPage.continueButton().click()
    indexPage.errorSummary().should('exist')
    indexPage.errorSummaryList().should('have.length', 1)
    indexPage.errorSummaryList().eq(0).should('contain.text', 'Select at least one service')

    indexPage.serviceCheckbox('TEST_TYPE').click()
    indexPage.continueButton().click()
    indexPage.errorSummaryList().should('not.exist')

    // continue to check your answers page if no errors
    Page.verifyOnPage(CheckYourAnswersPage)
  })
})
