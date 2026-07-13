import deriveLocationHierarchy from './deriveLocationHierarchy'
import { LocationSummary } from '../@types/locationsApi/locationsApiTypes'

const summary = (overrides: Partial<LocationSummary>): LocationSummary => ({
  prisonId: 'MDI',
  code: 'X',
  type: 'ROOM',
  pathHierarchy: 'X',
  level: 1,
  ...overrides,
})

describe('deriveLocationHierarchy', () => {
  it('returns empty object when there is no hierarchy', () => {
    expect(deriveLocationHierarchy(undefined)).toEqual({})
    expect(deriveLocationHierarchy([])).toEqual({})
  })

  it('returns no parent for a top-level location (single entry)', () => {
    const result = deriveLocationHierarchy([summary({ localName: 'Kitchen', level: 1 })])
    expect(result).toEqual({ localNamePath: 'Kitchen', parentLocalName: undefined })
  })

  it('builds the readable path and immediate parent for a child', () => {
    const result = deriveLocationHierarchy([
      summary({ localName: 'Houseblock 1', level: 1 }),
      summary({ localName: 'Gym', level: 2 }),
    ])
    expect(result).toEqual({ localNamePath: 'Houseblock 1 › Gym', parentLocalName: 'Houseblock 1' })
  })

  it('handles deeper trees and picks the second-to-last as the parent', () => {
    const result = deriveLocationHierarchy([
      summary({ localName: 'Houseblock 1', level: 1 }),
      summary({ localName: 'Gym', level: 2 }),
      summary({ localName: 'Gym', level: 3 }),
    ])
    expect(result).toEqual({ localNamePath: 'Houseblock 1 › Gym › Gym', parentLocalName: 'Gym' })
  })

  it('falls back to the code when a segment has no local name', () => {
    const result = deriveLocationHierarchy([
      summary({ localName: undefined, code: 'Z', level: 1 }),
      summary({ localName: 'Gym', code: '001', level: 2 }),
    ])
    expect(result).toEqual({ localNamePath: 'Z › Gym', parentLocalName: 'Z' })
  })
})
