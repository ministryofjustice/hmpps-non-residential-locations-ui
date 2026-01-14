import type { Request, Response, NextFunction } from 'express'
import addAction from './addAction'

describe('addAction middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = {}
    res = { locals: {} }
    next = jest.fn()
  })

  it('should add an action to res.locals.actions with default class', async () => {
    const action = { text: 'Test', href: '/test' }
    const middleware = addAction(action)
    await middleware(req as Request, res as Response, next as NextFunction)
    expect(res.locals.actions).toHaveLength(1)
    expect(res.locals.actions[0]).toMatchObject({
      text: 'Test',
      href: '/test',
      class: 'govuk-button--secondary',
    })
    expect(next).toHaveBeenCalled()
  })

  it('should merge custom class with default class', async () => {
    const action = { text: 'Test', href: '/test', class: 'custom-class' }
    const middleware = addAction(action)
    await middleware(req as Request, res as Response, next as NextFunction)
    expect(res.locals.actions[0].classes).toBe('custom-class')
  })

  it('should add preventDoubleClick if provided', async () => {
    const action = { text: 'Test', href: '/test', preventDoubleClick: true }
    const middleware = addAction(action)
    await middleware(req as Request, res as Response, next as NextFunction)
    expect(res.locals.actions[0].preventDoubleClick).toBe(true)
  })

  it('should append to existing actions array', async () => {
    res.locals.actions = [{ text: 'Existing', href: '/existing', classes: 'govuk-button--secondary' }]
    const action = { text: 'Test', href: '/test' }
    const middleware = addAction(action)
    await middleware(req as Request, res as Response, next as NextFunction)
    expect(res.locals.actions).toHaveLength(2)
    expect(res.locals.actions[1].text).toBe('Test')
  })
})
