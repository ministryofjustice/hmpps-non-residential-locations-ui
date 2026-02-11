import EditDetailsPage from '../../pages/editLocation/details'
import CheckYourAnswersPage from '../../pages/editLocation/checkYourAnswers'

const TEST_LOCATION_ID = '2475f250-434a-4257-afe7-b911f1773a4d'
const TEST_LOCATION_NAME = 'Gym'

context('Edit Location Journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION', 'NONRESI__MAINTAIN_LOCATION'] })
    cy.task('stubManageUsersMe')
    cy.task('stubManageUsersMeCaseloads')
    cy.task('stubNonResidentialLocation', { prisonId: 'TST' })
    cy.task('stubNonResidentialLocationById', {
      locationId: TEST_LOCATION_ID,
      localName: TEST_LOCATION_NAME,
      prisonId: 'TST',
    })
    cy.task('stubLocationsConstantsNonResidentialUsageType')
    cy.task('stubLocationsConstantsServiceTypes')
    cy.task('stubLocationsConstantsServiceFamilyTypes')
    cy.task('stubComponents')
  })

  describe('Edit Details Page', () => {
    it('should display the correct H1 heading with location name', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('h1').should('contain.text', `Change ${TEST_LOCATION_NAME}`)
    })

    it('should display the correct page title in browser tab', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.title().should('contain', `Change ${TEST_LOCATION_NAME}`)
    })

    it('should pre-populate the form with existing location data', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.locationNameInput().should('have.value', TEST_LOCATION_NAME)
    })

    it('should show error when no changes are made', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.continueButton().click()
      page.errorSummary().should('exist')
      page.errorSummaryList().should('contain.text', 'You must change something')
    })

    it('should navigate to check your answers when changes are made', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.locationNameInput().clear().type('New Location Name')
      page.continueButton().click()
      cy.get('h1').should('contain.text', 'Confirm changes to this location')
    })

    it('should display Archive button for active locations', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-button--warning').should('exist')
      cy.get('.govuk-button--warning').should('contain.text', 'Archive')
    })

    it('should display character count for location name field', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.characterCountInfo().should('exist')
      page.characterCountInfo().should('contain.text', 'characters')
    })

    it('should have character count configured with maxlength of 30', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-character-count').should('have.attr', 'data-maxlength', '30')
    })
  })

  describe('Archive button visibility for archived locations', () => {
    const ARCHIVED_LOCATION_ID = 'archived-location-id'
    const ARCHIVED_LOCATION_NAME = 'Old Chapel'

    beforeEach(() => {
      cy.task('stubNonResidentialLocationById', {
        locationId: ARCHIVED_LOCATION_ID,
        localName: ARCHIVED_LOCATION_NAME,
        prisonId: 'TST',
        status: 'ARCHIVED',
      })
    })

    it('should not display Archive button for archived locations', () => {
      cy.signIn()
      EditDetailsPage.goTo(ARCHIVED_LOCATION_ID)
      cy.get('.govuk-button--warning').should('not.exist')
    })
  })

  describe('Check Your Answers Page', () => {
    beforeEach(() => {
      cy.task('stubUpdateNonResidentialLocation', { locationId: TEST_LOCATION_ID })
    })

    it('should display the correct page title in browser tab', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const detailsPage = new EditDetailsPage(TEST_LOCATION_NAME)
      detailsPage.locationNameInput().clear().type('New Location Name')
      detailsPage.continueButton().click()
      cy.title().should('contain', 'Confirm changes to this location')
    })

    it('should show only changed fields in the table', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const detailsPage = new EditDetailsPage(TEST_LOCATION_NAME)
      detailsPage.locationNameInput().clear().type('New Location Name')
      detailsPage.continueButton().click()

      const checkYourAnswersPage = new CheckYourAnswersPage()
      checkYourAnswersPage.changesTable().should('exist')
      checkYourAnswersPage.changesTable().should('contain.text', 'What is the location name?')
      checkYourAnswersPage.changesTable().should('contain.text', TEST_LOCATION_NAME)
      checkYourAnswersPage.changesTable().should('contain.text', 'New Location Name')
    })

    it('should return to details page when clicking Change link', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const detailsPage = new EditDetailsPage(TEST_LOCATION_NAME)
      detailsPage.locationNameInput().clear().type('New Location Name')
      detailsPage.continueButton().click()

      const checkYourAnswersPage = new CheckYourAnswersPage()
      checkYourAnswersPage.changeLinks().first().click()
      cy.get('h1').should('contain.text', `Change ${TEST_LOCATION_NAME}`)
    })

    it('should return to locations list without saving when clicking Cancel', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const detailsPage = new EditDetailsPage(TEST_LOCATION_NAME)
      detailsPage.locationNameInput().clear().type('New Location Name')
      detailsPage.continueButton().click()

      const checkYourAnswersPage = new CheckYourAnswersPage()
      checkYourAnswersPage.cancelLink().click()
      cy.url().should('include', '/prison/TST')
    })

    it('should save changes and show success banner when clicking Confirm and save', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const detailsPage = new EditDetailsPage(TEST_LOCATION_NAME)
      detailsPage.locationNameInput().clear().type('New Location Name')
      detailsPage.continueButton().click()

      const checkYourAnswersPage = new CheckYourAnswersPage()
      checkYourAnswersPage.confirmButton().click()
      cy.url().should('include', '/prison/TST')
      cy.get('.moj-alert__content').should('exist')
      cy.get('.moj-alert__content').should('contain.text', 'Gym changed to New Location Name')
    })
  })
})
