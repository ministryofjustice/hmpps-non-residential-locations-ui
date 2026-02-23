import IndexPage from '../pages/index'

context('Locations List', () => {
  context('Sorting', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocationWithStatuses', {
        prisonId: 'TST',
        locations: [
          { id: 'loc-1', localName: 'Alpha Gym', status: 'ACTIVE' },
          { id: 'loc-2', localName: 'Beta Chapel', status: 'INACTIVE' },
          { id: 'loc-3', localName: 'Gamma Library', status: 'ACTIVE' },
        ],
      })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
      cy.task('stubGetPrisonConfiguration')
    })

    it('should render sortable column headers as buttons', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.sortableColumnButton('localName').should('exist')
      indexPage.sortableColumnButton('status').should('exist')
    })

    it('should have aria-sort attribute on sortable columns', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.sortableColumnHeader('localName').should('have.attr', 'aria-sort')
      indexPage.sortableColumnHeader('status').should('have.attr', 'aria-sort')
    })

    it('should default to sorting by localName ascending', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.sortableColumnHeader('localName').should('have.attr', 'aria-sort', 'ascending')
      indexPage.sortableColumnHeader('status').should('have.attr', 'aria-sort', 'none')
    })

    it('should navigate to sorted URL when clicking sort button', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()

      // Click the Location column (currently ascending) - should switch to descending
      indexPage.sortableColumnButton('localName').click()
      cy.url().should('include', 'sort=localName,desc')
    })

    it('should navigate to sort by status when clicking Status column', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()

      // Click the Status column (currently none) - should sort ascending
      indexPage.sortableColumnButton('status').click()
      cy.url().should('include', 'sort=status,asc')
    })

    it('should show correct aria-sort after navigating to sorted URL', () => {
      cy.signIn()
      cy.visit('/prison/TST?sort=status,desc')
      const indexPage = IndexPage.forViewUser()

      indexPage.sortableColumnHeader('status').should('have.attr', 'aria-sort', 'descending')
      indexPage.sortableColumnHeader('localName').should('have.attr', 'aria-sort', 'none')
    })

    it('should preserve sort in pagination links', () => {
      cy.signIn()
      cy.visit('/prison/TST?sort=status,desc')
      IndexPage.forViewUser()

      // Check that the table's sort href template contains the current sort
      cy.get('[data-qa=locations-table]').should('have.attr', 'data-sort-href-template').and('include', 'sort=')
    })

    it('should have data-module attribute for MOJ sortable table', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=locations-table]').should('have.attr', 'data-module', 'moj-sortable-table')
    })
  })

  context('Status filter', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocationWithStatuses', {
        prisonId: 'TST',
        locations: [
          { id: 'loc-1', localName: 'Active Gym', status: 'ACTIVE' },
          { id: 'loc-2', localName: 'Inactive Chapel', status: 'INACTIVE' },
          { id: 'loc-3', localName: 'Archived Library', status: 'ARCHIVED' },
        ],
      })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
      cy.task('stubGetPrisonConfiguration')
    })

    it('should display the status filter with proper styling', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.statusFilterForm().should('exist')
      indexPage.statusFilterForm().should('have.class', 'status-filter')
    })

    it('should display "Filter by location status" legend', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=status-filter-form] legend').should('contain.text', 'Filter by location status')
    })

    it('should have Active and Inactive checked by default, Archived unchecked', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.statusFilterCheckbox('ACTIVE').should('be.checked')
      indexPage.statusFilterCheckbox('INACTIVE').should('be.checked')
      indexPage.statusFilterCheckbox('ARCHIVED').should('not.be.checked')
    })

    it('should display checkboxes with counts', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.statusFilterForm().should('contain.text', 'Active (')
      indexPage.statusFilterForm().should('contain.text', 'Inactive (')
      indexPage.statusFilterForm().should('contain.text', 'Archived (')
    })

    it('should display Apply filters button and Clear link', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=apply-filter-button]').should('exist').and('contain.text', 'Apply filters')
      cy.get('[data-qa=clear-filter-link]').should('exist').and('contain.text', 'Clear')
    })

    it('should submit filter when Apply filters button is clicked', () => {
      cy.signIn()
      IndexPage.forViewUser()

      // Check Archived checkbox
      cy.get('[data-qa=status-filter-form] input[value="ARCHIVED"]').click()

      // Click Apply filters button
      cy.get('[data-qa=apply-filter-button]').click()

      // URL should contain all status parameters
      cy.url().should('include', 'status=ACTIVE')
      cy.url().should('include', 'status=INACTIVE')
      cy.url().should('include', 'status=ARCHIVED')
    })

    it('should show empty state message when Clear is clicked', () => {
      cy.signIn()
      IndexPage.forViewUser()

      // Click Clear link
      cy.get('[data-qa=clear-filter-link]').click()

      // URL should contain status=NONE
      cy.url().should('include', 'status=NONE')

      // No checkboxes should be checked
      cy.get('[data-qa=status-filter-form] input[type="checkbox"]:checked').should('have.length', 0)

      // Should display empty state message
      cy.get('[data-qa=no-results-heading]').should('contain.text', 'There are no matching results.')
      cy.get('[data-qa=no-results-message]').should(
        'contain.text',
        'Improve your results by applying or removing filters.',
      )

      // Locations table should not be present
      cy.get('[data-qa=locations-table]').should('not.exist')
    })

    it('should show empty state message when all checkboxes are unchecked and Apply is clicked', () => {
      cy.signIn()
      IndexPage.forViewUser()

      // Uncheck Active and Inactive
      cy.get('[data-qa=status-filter-form] input[value="ACTIVE"]').uncheck()
      cy.get('[data-qa=status-filter-form] input[value="INACTIVE"]').uncheck()

      // Click Apply filters button
      cy.get('[data-qa=apply-filter-button]').click()

      // URL should contain status=NONE
      cy.url().should('include', 'status=NONE')

      // Should display empty state message
      cy.get('[data-qa=no-results-heading]').should('contain.text', 'There are no matching results.')
      cy.get('[data-qa=no-results-message]').should(
        'contain.text',
        'Improve your results by applying or removing filters.',
      )
    })
  })

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
      cy.task('stubGetPrisonConfiguration')
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
      cy.task('stubGetPrisonConfiguration')
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

  context('Archive link visibility', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION', 'NONRESI__MAINTAIN_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocation', { prisonId: 'TST', includeArchived: true })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
      cy.task('stubGetPrisonConfiguration')
    })

    it('should display Archive link for active locations', () => {
      cy.signIn()
      IndexPage.forEditUser()
      cy.get('[data-qa=locations-table]').contains('tr', 'Gym').should('contain.text', 'Archive')
    })

    it('should display "No available actions" for archived locations', () => {
      cy.signIn()
      IndexPage.forEditUser()
      cy.get('[data-qa=locations-table]').contains('tr', 'Old Chapel').should('contain.text', 'No available actions')
    })

    it('should not display any action links for archived locations', () => {
      cy.signIn()
      IndexPage.forEditUser()
      cy.get('[data-qa=locations-table]').contains('tr', 'Old Chapel').find('a').should('not.exist')
    })
  })
})
