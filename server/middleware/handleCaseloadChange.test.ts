import handleCaseloadChange from './handleCaseloadChange'

const SWITCHED = 'caseload-switched-from=BFI&caseload-switched-to=CFI'

describe('handleCaseloadChange', () => {
  let req: any
  let res: any
  let next: jest.Mock

  beforeEach(() => {
    req = { query: {}, originalUrl: '/prison/BFI', session: {} }
    res = {
      locals: {
        user: { activeCaseload: { id: 'BFI' } },
        prisonId: 'BFI',
      },
      redirect: jest.fn(),
    }
    next = jest.fn()
  })

  it('does nothing without the switch parameters', () => {
    handleCaseloadChange()(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('leaves other query parameters alone without the switch parameters', () => {
    req.query = { status: 'ACTIVE', page: '3' }
    req.originalUrl = '/prison/BFI?status=ACTIVE&page=3'

    handleCaseloadChange()(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('ignores the caseloadChanged flag, which DPS reads but never sends back to us', () => {
    req.query = { caseloadChanged: 'true' }
    req.originalUrl = '/prison/BFI?caseloadChanged=true'

    handleCaseloadChange()(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  describe('when the caseload has changed', () => {
    beforeEach(() => {
      req.query = { 'caseload-switched-from': 'BFI', 'caseload-switched-to': 'CFI' }
      req.originalUrl = `/prison/BFI?${SWITCHED}`
      res.locals.user.activeCaseload = { id: 'CFI' }
    })

    it('redirects to the new caseload', () => {
      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/CFI')
      expect(next).not.toHaveBeenCalled()
    })

    it('drops the query string describing the prison being left', () => {
      req.query = { status: 'INACTIVE', page: '3', 'caseload-switched-from': 'BFI', 'caseload-switched-to': 'CFI' }
      req.originalUrl = `/prison/BFI?status=INACTIVE&page=3&${SWITCHED}`

      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/CFI')
    })

    it('updates the sticky prison used by the add-location journey', () => {
      req.session.prisonId = 'BFI'

      handleCaseloadChange()(req, res, next)

      expect(req.session.prisonId).toEqual('CFI')
    })

    it('takes the prison from the active caseload, not from the parameters', () => {
      req.query = { 'caseload-switched-from': 'BFI', 'caseload-switched-to': 'XYZ' }
      req.originalUrl = '/prison/BFI?caseload-switched-from=BFI&caseload-switched-to=XYZ'

      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/CFI')
    })
  })

  describe('when the url already matches the active caseload', () => {
    beforeEach(() => {
      req.query = { 'caseload-switched-from': 'CFI', 'caseload-switched-to': 'BFI' }
      req.originalUrl = '/prison/BFI?caseload-switched-from=CFI&caseload-switched-to=BFI'
    })

    it('redirects to strip the switch parameters only', () => {
      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/BFI')
      expect(next).not.toHaveBeenCalled()
    })

    it('keeps the other query parameters', () => {
      req.query = { status: 'INACTIVE', 'caseload-switched-from': 'CFI', 'caseload-switched-to': 'BFI' }
      req.originalUrl = '/prison/BFI?status=INACTIVE&caseload-switched-from=CFI&caseload-switched-to=BFI'

      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/BFI?status=INACTIVE')
    })

    it('leaves the sticky prison alone', () => {
      req.session.prisonId = 'BFI'

      handleCaseloadChange()(req, res, next)

      expect(req.session.prisonId).toEqual('BFI')
    })
  })

  it.each(['caseload-switched-from', 'caseload-switched-to'])('strips %s when it arrives on its own', param => {
    req.query = { [param]: 'CFI' }
    req.originalUrl = `/prison/BFI?${param}=CFI`

    handleCaseloadChange()(req, res, next)

    expect(res.redirect).toHaveBeenCalledWith('/prison/BFI')
  })

  it('strips the switch parameters without a path rewrite when there is no active caseload', () => {
    req.query = { 'caseload-switched-from': 'BFI', 'caseload-switched-to': 'CFI' }
    req.originalUrl = `/prison/BFI?${SWITCHED}`
    res.locals.user = {}

    handleCaseloadChange()(req, res, next)

    expect(res.redirect).toHaveBeenCalledWith('/prison/BFI')
  })
})
