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

    it('should display "Location status" legend', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=status-filter-form] legend').should('contain.text', 'Location status')
    })

    it('should have only Active checked by default, Inactive and Archived unchecked', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.statusFilterCheckbox('ACTIVE').should('be.checked')
      indexPage.statusFilterCheckbox('INACTIVE').should('not.be.checked')
      indexPage.statusFilterCheckbox('ARCHIVED').should('not.be.checked')
    })

    it('should display checkboxes with counts', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.statusFilterForm().should('contain.text', 'Active (')
      indexPage.statusFilterForm().should('contain.text', 'Inactive (')
      indexPage.statusFilterForm().should('contain.text', 'Archived (')
    })

    it('should display Apply filters button and Reset filters link', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=apply-filter-button]').should('exist').and('contain.text', 'Apply filters')
      cy.get('[data-qa=reset-filters-link]').should('exist').and('contain.text', 'Reset filters')
    })

    it('should submit filter when Apply filters button is clicked', () => {
      cy.signIn()
      IndexPage.forViewUser()

      // Check Archived checkbox
      cy.get('[data-qa=status-filter-form] input[value="ARCHIVED"]').click()

      // Click Apply filters button
      cy.get('[data-qa=apply-filter-button]').click()

      // URL should contain the checked statuses
      cy.url().should('include', 'status=ACTIVE')
      cy.url().should('include', 'status=ARCHIVED')
      cy.url().should('not.include', 'status=INACTIVE')
    })

    it('should return to the active-only default when Reset filters is clicked', () => {
      cy.signIn()
      IndexPage.forViewUser()

      // Apply a non-default filter first
      cy.get('[data-qa=status-filter-form] input[value="ARCHIVED"]').click()
      cy.get('[data-qa=apply-filter-button]').click()
      cy.url().should('include', 'status=ARCHIVED')

      // Reset returns to active only, not an empty list
      cy.get('[data-qa=reset-filters-link]').click()
      cy.url().should('include', 'status=ACTIVE')
      cy.url().should('not.include', 'status=NONE')
      cy.url().should('not.include', 'status=ARCHIVED')

      // Only Active is checked, and the table is shown (not the empty state)
      cy.get('[data-qa=status-filter-form] input[value="ACTIVE"]').should('be.checked')
      cy.get('[data-qa=status-filter-form] input[value="ARCHIVED"]').should('not.be.checked')
      cy.get('[data-qa=locations-table]').should('exist')
      cy.get('[data-qa=no-results-heading]').should('not.exist')
    })

    it('should show empty state message when all checkboxes are unchecked and Apply is clicked', () => {
      cy.signIn()
      IndexPage.forViewUser()

      // Uncheck Active, the only status checked by default
      cy.get('[data-qa=status-filter-form] input[value="ACTIVE"]').uncheck()

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

  context('Service type filter', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocationWithStatuses', {
        prisonId: 'TST',
        locations: [{ id: 'loc-1', localName: 'Hearing Room', status: 'ACTIVE' }],
      })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
      cy.task('stubGetPrisonConfiguration')
    })

    it('shows a checkbox per service type, not per family', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=service-filter-checkboxes] input[name="serviceType"][value="TEST_TYPE"]').should('exist')
      cy.get('[data-qa=service-filter-checkboxes]').should('contain.text', 'Test type')
    })

    it('applies a service type as a serviceType query param and shows a chip', () => {
      cy.signIn()
      IndexPage.forViewUser()

      cy.get('[data-qa=service-filter-checkboxes] input[value="TEST_TYPE"]').check()
      cy.get('[data-qa=apply-filter-button]').click()

      cy.url().should('include', 'serviceType=TEST_TYPE')
      cy.get('[data-qa=selected-service-chips]').should('contain.text', 'Test type')
    })
  })

  context('Filter memory', () => {
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

    it('should restore the filters and sort when returning to the list', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()

      // Apply a filter and a sort
      indexPage.statusFilterCheckbox('ARCHIVED').check()
      cy.get('[data-qa=apply-filter-button]').click()
      indexPage.sortableColumnButton('status').click()
      cy.url().should('include', 'sort=status')

      // Leave the list and come back to it with no query string, as Cancel and Back do
      cy.visit('/prison/TST')

      indexPage.statusFilterCheckbox('ACTIVE').should('be.checked')
      indexPage.statusFilterCheckbox('ARCHIVED').should('be.checked')
      indexPage.statusFilterCheckbox('INACTIVE').should('not.be.checked')
      indexPage.sortableColumnHeader('status').should('have.attr', 'aria-sort', 'ascending')
    })

    it('should restore a cleared (empty) filter rather than falling back to the default', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()

      // Clear every status (unchecking the default Active) so the list is empty
      cy.get('[data-qa=status-filter-form] input[value="ACTIVE"]').uncheck()
      cy.get('[data-qa=apply-filter-button]').click()
      cy.get('[data-qa=no-results-heading]').should('exist')

      cy.visit('/prison/TST')

      indexPage.statusFilterCheckbox('ACTIVE').should('not.be.checked')
      cy.get('[data-qa=no-results-heading]').should('exist')
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

  context('View all results link', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: ['VIEW_INTERNAL_LOCATION'] })
      cy.task('stubManageUsersMe')
      cy.task('stubManageUsersMeCaseloads')
      cy.task('stubNonResidentialLocationMultiPage', { prisonId: 'TST', totalElements: 200 })
      cy.task('stubLocationsConstantsNonResidentialUsageType')
      cy.task('stubLocationsConstantsServiceTypes')
      cy.task('stubLocationsConstantsServiceFamilyTypes')
      cy.task('stubComponents')
      cy.task('stubGetPrisonConfiguration')
    })

    it('should display the link when there is more than one page', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=view-all-results-link]').should('exist').and('contain.text', 'View all results')
      cy.get('[data-qa=view-all-results-link]').should('have.attr', 'href').and('include', 'size=200')
    })

    it('should hide pagination and the link after navigating to view all', () => {
      cy.signIn()
      IndexPage.forViewUser()
      cy.get('[data-qa=view-all-results-link]').click()
      cy.url().should('include', 'size=200')
      cy.get('[data-qa=view-all-results-link]').should('not.exist')
      cy.get('.moj-pagination__list').should('not.exist')
    })

    it('should restore pagination and the link when returning to the default page', () => {
      cy.signIn()
      cy.visit('/prison/TST?size=200')
      cy.get('[data-qa=view-all-results-link]').should('not.exist')
      cy.visit('/prison/TST')
      cy.get('[data-qa=view-all-results-link]').should('exist')
    })
  })

  context('Parent and hierarchy display', () => {
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

    it('shows an expandable reveal with the parent hierarchy for child locations', () => {
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.locationHierarchy().should('exist').and('contain.text', 'Show location details')

      // Path is revealed only after expanding the details
      indexPage.locationHierarchy().find('summary').click()
      indexPage.locationHierarchy().should('contain.text', 'Part of').and('contain.text', 'Houseblock 1')
      indexPage.locationPath().should('contain.text', 'Houseblock 1 › Gym')
    })

    it('shows a Parent tag for parent (non-leaf) locations', () => {
      cy.task('stubNonResidentialLocation', { prisonId: 'TST', isLeafLevel: false })
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.parentTag().should('exist').and('contain.text', 'Parent')
    })

    it('shows no hierarchy or Parent tag for standalone top-level locations', () => {
      cy.task('stubNonResidentialLocationWithStatuses', {
        prisonId: 'TST',
        locations: [{ id: 'loc-1', localName: 'Solo Room', status: 'ACTIVE' }],
      })
      cy.signIn()
      const indexPage = IndexPage.forViewUser()
      indexPage.locationsTable().should('contain.text', 'Solo Room')
      indexPage.locationHierarchy().should('not.exist')
      indexPage.parentTag().should('not.exist')
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

    it('should display Archive link for active child locations', () => {
      cy.signIn()
      IndexPage.forEditUser()
      cy.get('[data-qa=locations-table]').contains('tr', 'Gym').should('contain.text', 'Archive')
    })

    it('should not display Archive link for a parent still used by a service', () => {
      cy.task('stubNonResidentialLocation', { prisonId: 'TST', includeArchived: true, isLeafLevel: false })

      cy.signIn()
      IndexPage.forEditUser()
      cy.get('[data-qa=locations-table]').contains('tr', 'Gym').should('not.contain.text', 'Archive')
    })

    it('should display Archive link for a parent that can be hidden from the list', () => {
      cy.task('stubNonResidentialLocation', {
        prisonId: 'TST',
        includeArchived: true,
        isLeafLevel: false,
        canBeHiddenFromList: true,
      })

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
