import IndexPage from '../../pages/addLocation/index'
import CheckYourAnswersPage from '../../pages/addLocation/checkYourAnswers'
import Page from '../../pages/page'

context('Start journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION', 'NONRESI__MAINTAIN_LOCATION'] })
    cy.task('stubManageUsersMe')
    cy.task('stubManageUsersMeCaseloads')
    cy.task('stubNonResidentialLocation', { prisonId: 'TST' })
    cy.task('stubLocationsConstantsNonResidentialUsageType')
    cy.task('stubLocationsConstantsServiceTypes')
    cy.task('stubLocationsConstantsServiceFamilyTypes')
    cy.task('stubNonResidentialLocationByPrisonAndLocalName', {
      prisonId: 'TST',
      localName: 'Loc A',
      reponseStatus: 404,
    })
    cy.task('stubNonResidentialLocationByPrisonAndLocalName', {
      prisonId: 'TST',
      localName: 'Gym',
      reponseStatus: 200,
      responseBody: { id: 1 },
    })

    cy.task('stubAddNonResidentialLocation', { prisonId: 'TST' })
  })

  it('Should display error messages correctly', () => {
    cy.signIn({ failOnStatusCode: false })
    IndexPage.goTo()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.errorSummary().should('not.exist')
    indexPage.continueButton().click()
    indexPage.errorSummary().should('exist')
    indexPage.errorSummaryList().should('have.length', 3)
    indexPage.errorSummaryList().eq(0).should('contain.text', 'Enter a location name')
    indexPage.errorSummaryList().eq(1).should('contain.text', 'Select at least one service')
    indexPage
      .errorSummaryList()
      .eq(2)
      .should('contain.text', 'Select \u2018yes\u2019 if the location is already active')

    indexPage.locationNameInput().type('Gym') // ensure existing location can't be added again
    indexPage.continueButton().click()
    indexPage.errorSummaryList().should('have.length', 3)
    indexPage.errorSummaryList().eq(0).should('contain.text', 'Location already exists. Enter a unique location name')

    indexPage.locationNameInput().clear()
    indexPage.locationNameInput().type('Loc A')
    indexPage.locationStatusRadios().find('input[value="ACTIVE"]').click()

    indexPage.errorSummary().should('exist')
    indexPage.errorSummaryList().eq(1).should('contain.text', 'Select at least one service')
    indexPage.serviceCheckbox('TEST_TYPE').click()
    indexPage.continueButton().click()
    indexPage.errorSummaryList().should('not.exist')

    // continue to check your answers page if no errors
    const checkYourAnswersPagePage = Page.verifyOnPage(CheckYourAnswersPage)
    checkYourAnswersPagePage.summaryListRow(0, 0).should('include.text', 'What is the location name?')
    checkYourAnswersPagePage.summaryListRow(0, 1).should('include.text', 'Loc A')
    checkYourAnswersPagePage.summaryListRow(0, 2).should('include.text', 'Change')

    checkYourAnswersPagePage
      .summaryListRow(1, 0)
      .should('include.text', 'What services must be able to use this location?')
    checkYourAnswersPagePage.summaryListRow(1, 1).should('include.text', 'Test type')
    checkYourAnswersPagePage.summaryListRow(1, 2).should('include.text', 'Change')

    checkYourAnswersPagePage.summaryListRow(2, 0).should('include.text', 'Is this location currently active?')
    checkYourAnswersPagePage.summaryListRow(2, 1).should('include.text', 'Yes')
    checkYourAnswersPagePage.summaryListRow(2, 2).should('include.text', 'Change')

    checkYourAnswersPagePage.changeLink().should('exist').and('have.attr', 'href', '/add-location/details')
    checkYourAnswersPagePage.cancelLink().should('exist').and('have.attr', 'href', '/prison/TST')
    checkYourAnswersPagePage.continueButton().should('exist')

    checkYourAnswersPagePage.continueButton().click()

    // return to home page and check success banner
    cy.url().should('include', '/prison/TST')
    cy.get('.moj-alert__content').should('exist')
    cy.get('.moj-alert__content').should('contain.text', 'Loc A added')
  })
})
