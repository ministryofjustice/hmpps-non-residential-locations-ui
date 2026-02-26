import ArchiveOrInactivePage from '../../pages/archiveLocation/archiveOrInactive'
import ArchiveConfirmPage from '../../pages/archiveLocation/archiveConfirm'
import InactiveConfirmPage from '../../pages/archiveLocation/inactiveConfirm'

const TEST_LOCATION_ID = '2475f250-434a-4257-afe7-b911f1773a4d'
const TEST_LOCATION_NAME = 'Gym'

context('Archive Location Journey', () => {
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
      status: 'ACTIVE',
    })
    cy.task('stubLocationsConstantsNonResidentialUsageType')
    cy.task('stubLocationsConstantsServiceTypes')
    cy.task('stubLocationsConstantsServiceFamilyTypes')
    cy.task('stubComponents')
    cy.task('stubGetPrisonConfiguration')
  })

  describe('Archive or Inactive Page', () => {
    it('should display the correct H1 heading with location name', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      cy.get('h1').should('contain.text', `Archive ${TEST_LOCATION_NAME} or make it inactive`)
    })

    it('should display the correct page title in browser tab', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      cy.title().should('contain', `Archive ${TEST_LOCATION_NAME} or make it inactive`)
    })

    it('should show error when no option is selected', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      page.continueButton().click()
      page.errorSummary().should('exist')
    })

    it('should navigate to archive confirm when Archive is selected', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      page.archiveRadio().click()
      page.continueButton().click()
      cy.get('h1').should('contain.text', `Are you sure you want to archive ${TEST_LOCATION_NAME}?`)
    })

    it('should navigate to inactive confirm when Make inactive is selected', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      page.inactiveRadio().click()
      page.continueButton().click()
      cy.get('h1').should('contain.text', 'Confirm changes to this location')
    })

    it('should return to locations list when clicking Cancel', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      page.cancelLink().click()
      cy.url().should('include', '/prison/TST')
    })
  })

  describe('Archive Confirm Page', () => {
    beforeEach(() => {
      cy.task('stubArchiveNonResidentialLocation', { locationId: TEST_LOCATION_ID })
    })

    it('should display the MOJ interruption card', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.archiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new ArchiveConfirmPage(TEST_LOCATION_NAME)
      confirmPage.interruptionCard().should('exist')
    })

    it('should display services affected list', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.archiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new ArchiveConfirmPage(TEST_LOCATION_NAME)
      confirmPage.servicesAffectedList().should('exist')
      confirmPage.servicesAffectedList().should('contain.text', 'Activities and appointments')
    })

    it('should return to archive-or-inactive page when clicking Go back', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.archiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new ArchiveConfirmPage(TEST_LOCATION_NAME)
      confirmPage.goBackLink().click()
      cy.get('h1').should('contain.text', `Archive ${TEST_LOCATION_NAME} or make it inactive`)
    })

    it('should archive location and show success banner when clicking Archive location', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.archiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new ArchiveConfirmPage(TEST_LOCATION_NAME)
      confirmPage.archiveButton().click()
      cy.url().should('include', '/prison/TST')
      cy.get('.moj-alert__content').should('exist')
      cy.get('.moj-alert__content').should('contain.text', 'Gym archived')
    })
  })

  describe('Inactive Confirm Page', () => {
    beforeEach(() => {
      cy.task('stubUpdateNonResidentialLocation', { locationId: TEST_LOCATION_ID })
    })

    it('should display the check your answers table with status change', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.inactiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new InactiveConfirmPage()
      confirmPage.changesTable().should('exist')
      confirmPage.changesTable().should('contain.text', 'Is this location currently active?')
      confirmPage.changesTable().should('contain.text', 'Yes')
      confirmPage.changesTable().should('contain.text', 'No')
    })

    it('should return to archive-or-inactive page when clicking Change link', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.inactiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new InactiveConfirmPage()
      confirmPage.changeLinks().first().click()
      cy.get('h1').should('contain.text', `Archive ${TEST_LOCATION_NAME} or make it inactive`)
    })

    it('should return to locations list when clicking Cancel', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.inactiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new InactiveConfirmPage()
      confirmPage.cancelLink().click()
      cy.url().should('include', '/prison/TST')
    })

    it('should make location inactive and show success banner when clicking Confirm and save', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const archiveOrInactivePage = new ArchiveOrInactivePage(TEST_LOCATION_NAME)
      archiveOrInactivePage.inactiveRadio().click()
      archiveOrInactivePage.continueButton().click()

      const confirmPage = new InactiveConfirmPage()
      confirmPage.confirmButton().click()
      cy.url().should('include', '/prison/TST')
      cy.get('.moj-alert__content').should('exist')
      cy.get('.moj-alert__content').should('contain.text', `${TEST_LOCATION_NAME} made inactive`)
    })
  })

  describe('Archive or Inactive Page - Inactive Location Variant', () => {
    beforeEach(() => {
      cy.task('stubNonResidentialLocationById', {
        locationId: TEST_LOCATION_ID,
        localName: TEST_LOCATION_NAME,
        prisonId: 'TST',
        status: 'INACTIVE',
      })
    })

    it('should display the correct H1 heading with "or keep it inactive"', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      cy.get('h1').should('contain.text', `Archive ${TEST_LOCATION_NAME} or keep it inactive`)
    })

    it('should show Keep inactive radio option instead of Make inactive', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME, true)
      page.keepInactiveRadio().should('exist')
      page.inactiveRadio().should('not.exist')
    })

    it('should show error when no option is selected', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME, true)
      page.continueButton().click()
      page.errorSummary().should('exist')
    })

    it('should navigate to archive confirm when Archive is selected', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME, true)
      page.archiveRadio().click()
      page.continueButton().click()
      cy.get('h1').should('contain.text', `Are you sure you want to archive ${TEST_LOCATION_NAME}?`)
    })

    it('should redirect to locations list with success message when Keep inactive is selected', () => {
      cy.signIn()
      ArchiveOrInactivePage.goTo(TEST_LOCATION_ID)
      const page = new ArchiveOrInactivePage(TEST_LOCATION_NAME, true)
      page.keepInactiveRadio().click()
      page.continueButton().click()
      cy.url().should('include', '/prison/TST')
      cy.get('.moj-alert__content').should('exist')
      cy.get('.moj-alert__content').should('contain.text', `${TEST_LOCATION_NAME} kept inactive`)
    })
  })
})
