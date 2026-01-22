type ServiceFamilyType = {
  key: string
  description: string
  values: Array<{ key: string; description: string }>
}

export default function getServicesAffected(
  usedByGroupedServices: string[] | undefined,
  serviceFamilyTypes: ServiceFamilyType[],
): string[] {
  if (!usedByGroupedServices || usedByGroupedServices.length === 0) {
    return []
  }

  const affectedFamilies: string[] = []

  usedByGroupedServices.forEach(groupKey => {
    const family = serviceFamilyTypes.find(f => f.key === groupKey)
    if (family) {
      affectedFamilies.push(family.description)
    }
  })

  return affectedFamilies
}
