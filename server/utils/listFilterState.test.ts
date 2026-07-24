import resolveFilterState, { apiSortParam, buildQueryString, DEFAULT_PAGE_SIZE } from './listFilterState'

describe('listFilterState', () => {
  describe('buildQueryString', () => {
    const state = {
      statuses: ['ACTIVE'],
      serviceTypes: [] as string[],
      sort: 'localName,asc',
      size: DEFAULT_PAGE_SIZE,
      localName: null as string | null,
    }

    it('builds a query string from the filter state', () => {
      expect(buildQueryString(state)).toEqual('?status=ACTIVE&sort=localName,asc&size=35')
    })

    it('repeats the status parameter for each selected status', () => {
      expect(buildQueryString({ ...state, statuses: ['ACTIVE', 'ARCHIVED'] })).toContain(
        'status=ACTIVE&status=ARCHIVED',
      )
    })

    it('uses status=NONE when every status has been cleared', () => {
      expect(buildQueryString({ ...state, statuses: [] })).toContain('status=NONE')
    })

    it('includes the service filter and name search when set', () => {
      const result = buildQueryString({ ...state, serviceTypes: ['ADJUDICATIONS'], localName: 'Wing A' })

      expect(result).toContain('serviceType=ADJUDICATIONS')
      expect(result).toContain('localName=Wing%20A')
    })

    it('appends the page when one is given', () => {
      expect(buildQueryString(state, { page: 3 })).toContain('&page=3')
    })
  })

  describe('apiSortParam', () => {
    it('adds a secondary sort by local name when sorting by status', () => {
      expect(apiSortParam('status,desc')).toEqual(['status,desc', 'localName,asc'])
    })

    it('leaves any other sort alone', () => {
      expect(apiSortParam('localName,asc')).toEqual('localName,asc')
    })
  })

  describe('resolveFilterState', () => {
    let req: any

    beforeEach(() => {
      req = { query: {}, session: {} }
    })

    it('defaults to active locations only when nothing is remembered', () => {
      const state = resolveFilterState(req, 'TST')

      expect(state).toEqual({
        statuses: ['ACTIVE'],
        serviceTypes: [],
        sort: 'localName,asc',
        size: DEFAULT_PAGE_SIZE,
        localName: null,
      })
    })

    it('parses the filters from the query string', () => {
      req.query = {
        status: ['ACTIVE', 'ARCHIVED'],
        serviceType: 'ADJUDICATIONS',
        sort: 'status,desc',
        size: '100',
        localName: 'Gym',
      }

      expect(resolveFilterState(req, 'TST')).toEqual({
        statuses: ['ACTIVE', 'ARCHIVED'],
        serviceTypes: ['ADJUDICATIONS'],
        sort: 'status,desc',
        size: 100,
        localName: 'Gym',
      })
    })

    it('treats status=NONE as every status cleared', () => {
      req.query = { status: 'NONE' }

      expect(resolveFilterState(req, 'TST').statuses).toEqual([])
    })

    it('falls back to the default sort key when an unknown one is requested, keeping the direction', () => {
      req.query = { sort: 'somethingElse,desc' }

      expect(resolveFilterState(req, 'TST').sort).toEqual('localName,desc')
    })

    it('remembers the filters and sort against the prison', () => {
      req.query = { status: 'ARCHIVED', serviceType: 'ADJUDICATIONS', sort: 'status,desc', size: '100' }

      resolveFilterState(req, 'TST')

      expect(req.session.nonResidentialListFilters).toEqual({
        TST: {
          statuses: ['ARCHIVED'],
          serviceTypes: ['ADJUDICATIONS'],
          sort: 'status,desc',
          localName: null,
        },
      })
    })

    it('restores the remembered filters when the user returns with no query parameters', () => {
      req.session.nonResidentialListFilters = {
        TST: {
          statuses: ['ARCHIVED'],
          serviceTypes: ['ADJUDICATIONS'],
          sort: 'status,desc',
          localName: 'Gym',
        },
      }

      expect(resolveFilterState(req, 'TST')).toEqual({
        statuses: ['ARCHIVED'],
        serviceTypes: ['ADJUDICATIONS'],
        sort: 'status,desc',
        size: DEFAULT_PAGE_SIZE,
        localName: 'Gym',
      })
    })

    it('resets the page size when restoring, so "view all results" is not remembered', () => {
      req.query = { status: 'ACTIVE', size: '500' }
      resolveFilterState(req, 'TST')

      req.query = {}

      expect(resolveFilterState(req, 'TST').size).toEqual(DEFAULT_PAGE_SIZE)
    })

    it('remembers a cleared filter, because clearing carries query parameters', () => {
      req.query = { status: 'NONE' }
      resolveFilterState(req, 'TST')

      req.query = {}

      expect(resolveFilterState(req, 'TST').statuses).toEqual([])
    })

    it('does not carry one prison’s filters over to another', () => {
      req.session.nonResidentialListFilters = {
        TST: { statuses: ['ARCHIVED'], serviceTypes: [], sort: 'localName,asc', localName: null },
      }

      expect(resolveFilterState(req, 'MDI').statuses).toEqual(['ACTIVE'])
    })

    it('lets a request with query parameters override what is remembered', () => {
      req.session.nonResidentialListFilters = {
        TST: { statuses: ['ARCHIVED'], serviceTypes: [], sort: 'localName,asc', localName: null },
      }
      req.query = { status: 'INACTIVE' }

      expect(resolveFilterState(req, 'TST').statuses).toEqual(['INACTIVE'])
      expect(req.session.nonResidentialListFilters.TST.statuses).toEqual(['INACTIVE'])
    })
  })
})
