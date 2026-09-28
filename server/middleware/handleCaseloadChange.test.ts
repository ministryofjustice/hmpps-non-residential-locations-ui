import handleCaseloadChange from './handleCaseloadChange'

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

  it('does nothing without the marker', () => {
    handleCaseloadChange()(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('leaves other query parameters alone without the marker', () => {
    req.query = { status: 'ACTIVE', page: '3' }
    req.originalUrl = '/prison/BFI?status=ACTIVE&page=3'

    handleCaseloadChange()(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  describe('when the caseload has changed', () => {
    beforeEach(() => {
      req.query = { caseloadChanged: 'true' }
      req.originalUrl = '/prison/BFI?caseloadChanged=true'
      res.locals.user.activeCaseload = { id: 'CFI' }
    })

    it('redirects to the new caseload', () => {
      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/CFI')
      expect(next).not.toHaveBeenCalled()
    })

    it('drops the query string describing the prison being left', () => {
      req.query = { caseloadChanged: 'true', status: 'INACTIVE', page: '3' }
      req.originalUrl = '/prison/BFI?status=INACTIVE&page=3&caseloadChanged=true'

      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/CFI')
    })

    it('updates the sticky prison used by the add-location journey', () => {
      req.session.prisonId = 'BFI'

      handleCaseloadChange()(req, res, next)

      expect(req.session.prisonId).toEqual('CFI')
    })
  })

  describe('when the url already matches the active caseload', () => {
    beforeEach(() => {
      req.query = { caseloadChanged: 'true' }
      req.originalUrl = '/prison/BFI?caseloadChanged=true'
    })

    it('redirects to strip the marker only', () => {
      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/BFI')
      expect(next).not.toHaveBeenCalled()
    })

    it('keeps the other query parameters', () => {
      req.query = { caseloadChanged: 'true', status: 'INACTIVE' }
      req.originalUrl = '/prison/BFI?status=INACTIVE&caseloadChanged=true'

      handleCaseloadChange()(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/prison/BFI?status=INACTIVE')
    })

    it('leaves the sticky prison alone', () => {
      req.session.prisonId = 'BFI'

      handleCaseloadChange()(req, res, next)

      expect(req.session.prisonId).toEqual('BFI')
    })
  })

  it('strips the marker without a path rewrite when there is no active caseload', () => {
    req.query = { caseloadChanged: 'true' }
    req.originalUrl = '/prison/BFI?caseloadChanged=true'
    res.locals.user = {}

    handleCaseloadChange()(req, res, next)

    expect(res.redirect).toHaveBeenCalledWith('/prison/BFI')
  })
})
