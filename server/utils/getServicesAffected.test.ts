import getServicesAffected from './getServicesAffected'

describe('getServicesAffected', () => {
  const mockServiceFamilyTypes = [
    {
      key: 'ACTIVITIES_APPOINTMENTS',
      description: 'Activities and appointments',
      values: [
        { key: 'APPOINTMENT', description: 'Appointments' },
        { key: 'ACTIVITY', description: 'Activities' },
      ],
    },
    {
      key: 'USE_OF_FORCE',
      description: 'Use of force',
      values: [{ key: 'UOF', description: 'Use of force' }],
    },
  ]

  it('returns empty array when usedByGroupedServices is undefined', () => {
    expect(getServicesAffected(undefined, mockServiceFamilyTypes)).toEqual([])
  })

  it('returns empty array when usedByGroupedServices is empty', () => {
    expect(getServicesAffected([], mockServiceFamilyTypes)).toEqual([])
  })

  it('returns matching service family descriptions', () => {
    expect(getServicesAffected(['ACTIVITIES_APPOINTMENTS'], mockServiceFamilyTypes)).toEqual([
      'Activities and appointments',
    ])
  })

  it('returns multiple matching service family descriptions', () => {
    expect(getServicesAffected(['ACTIVITIES_APPOINTMENTS', 'USE_OF_FORCE'], mockServiceFamilyTypes)).toEqual([
      'Activities and appointments',
      'Use of force',
    ])
  })

  it('ignores service keys that do not match any family', () => {
    expect(getServicesAffected(['ACTIVITIES_APPOINTMENTS', 'UNKNOWN_KEY'], mockServiceFamilyTypes)).toEqual([
      'Activities and appointments',
    ])
  })
})
