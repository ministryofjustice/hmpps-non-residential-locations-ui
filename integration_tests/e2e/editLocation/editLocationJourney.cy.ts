import EditDetailsPage from '../../pages/editLocation/details'

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
  })
})
