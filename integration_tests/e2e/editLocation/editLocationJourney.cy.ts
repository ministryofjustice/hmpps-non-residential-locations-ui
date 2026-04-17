import EditDetailsPage from '../../pages/editLocation/details'
import CheckYourAnswersPage from '../../pages/editLocation/checkYourAnswers'
import Page from '../../pages/page'

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
    cy.task('stubGetPrisonConfiguration')
    cy.task('stubNonResidentialLocationByPrisonAndLocalName', {
      prisonId: 'TST',
      localName: TEST_LOCATION_NAME,
      reponseStatus: 200,
      responseBody: [{ id: TEST_LOCATION_ID, localName: TEST_LOCATION_NAME, prisonId: 'TST', status: 'ACTIVE' }],
    })
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

    it('should show error message if new localName already exists', () => {
      cy.task('stubNonResidentialLocationByPrisonAndLocalName', {
        prisonId: 'TST',
        localName: 'Canteen',
        reponseStatus: 200,
        responseBody: [{ id: '999', localName: 'Canteen', prisonId: 'TST', status: 'ACTIVE' }],
      })

      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.locationNameInput().clear().type('Canteen')
      page.continueButton().click()
      page.errorSummary().should('exist')
      page.errorSummaryList().should('contain.text', 'Location already exists. Enter a unique location name')
    })

    it('should navigate to check your answers when changes are made', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.locationNameInput().clear().type('New Location Name')
      page.continueButton().click()
      cy.get('h1').should('contain.text', 'Confirm changes to this location')
    })

    it('should display Archive button for active leaf level locations', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-button--warning').should('exist')
      cy.get('.govuk-button--warning').should('contain.text', 'Archive')
    })

    it('should not display Archive button for parent level (i.e. non-leafLevel) locations', () => {
      cy.task('stubNonResidentialLocationById', {
        locationId: TEST_LOCATION_ID,
        localName: TEST_LOCATION_NAME,
        prisonId: 'TST',
        isLeafLevel: false,
      })
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-button--warning').should('not.exist')
    })

    it('should not display location status radio button component for parent level (i.e. non-leafLevel) locations', () => {
      cy.task('stubNonResidentialLocationById', {
        locationId: TEST_LOCATION_ID,
        localName: TEST_LOCATION_NAME,
        prisonId: 'TST',
        isLeafLevel: false,
      })
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-radios').should('not.exist')
    })

    it('should display location status radio button component for leaf level locations', () => {
      cy.task('stubNonResidentialLocationById', {
        locationId: TEST_LOCATION_ID,
        localName: TEST_LOCATION_NAME,
        prisonId: 'TST',
        isLeafLevel: true,
      })
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-radios').should('exist')
    })

    it('should display character count for location name field', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.characterCountInfo().should('exist')
      page.characterCountInfo().should('contain.text', 'characters')
    })

    it('should have character count configured with maxlength of 40', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.get('.govuk-character-count').should('have.attr', 'data-maxlength', '40')
    })

    it('should display validation message if localName exceeds character limit', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.locationNameInput().clear().type('A'.repeat(41))
      page.continueButton().click()
      page.errorSummary().should('exist')
      page.errorSummaryList().should('contain.text', 'Location name must be 40 characters or less')
    })

    it('should display correct error message for parent location if continue button selected without making a change', () => {
      cy.task('stubNonResidentialLocationById', {
        locationId: TEST_LOCATION_ID,
        localName: TEST_LOCATION_NAME,
        prisonId: 'TST',
        isLeafLevel: false,
      })
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.continueButton().click()
      page.errorSummary().should('exist')
      page.errorSummaryList().should('contain.text', 'You must change something or select ‘cancel’')
    })

    it('should display correct error message for leaf-level location if continue button selected without making a change', () => {
      cy.task('stubNonResidentialLocationById', {
        locationId: TEST_LOCATION_ID,
        localName: TEST_LOCATION_NAME,
        prisonId: 'TST',
        isLeafLevel: true,
      })
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.continueButton().click()
      page.errorSummary().should('exist')
      page
        .errorSummaryList()
        .should('contain.text', 'You must change something, archive the location or select ‘cancel’')
    })

    it('should successfully edit location even when all services checkboxes are deselected', () => {
      cy.signIn()
      EditDetailsPage.goTo(TEST_LOCATION_ID)
      cy.task('stubUpdateNonResidentialLocation', { locationId: TEST_LOCATION_ID })
      const page = new EditDetailsPage(TEST_LOCATION_NAME)
      page.serviceCheckbox('TEST_TYPE').uncheck()
      page.continueButton().click()

      page.errorSummary().should('not.exist')
      const checkYourAnswersPage = Page.verifyOnPage(CheckYourAnswersPage)
      checkYourAnswersPage.changesTable().should('exist')
      checkYourAnswersPage
        .changesTableRowAndColumn(1, 0)
        .should('contain.text', 'What services must be able to use this location?')
      checkYourAnswersPage.changesTableRowAndColumn(1, 1).should('contain.text', 'Test type')
      checkYourAnswersPage.changesTableRowAndColumn(1, 2).should('contain.text', '')
      checkYourAnswersPage.changesTableRowAndColumn(1, 3).should('contain.text', 'Change')
      checkYourAnswersPage.confirmButton().click()
      cy.url().should('include', '/prison/TST')
      cy.get('.moj-alert__content').should('exist')
      cy.get('.moj-alert__content').should('contain.text', `${TEST_LOCATION_NAME} changed`)
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
      checkYourAnswersPage.changesTableRowAndColumn(1, 0).should('contain.text', 'What is the location name?')
      checkYourAnswersPage.changesTableRowAndColumn(1, 1).should('contain.text', TEST_LOCATION_NAME)
      checkYourAnswersPage.changesTableRowAndColumn(1, 2).should('contain.text', 'New Location Name')
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
      cy.get('.moj-alert__content').should('contain.text', 'New Location Name changed')
    })
  })
})
