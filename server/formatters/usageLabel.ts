import UsageMap from '../@types/locationsApi/usageMap'

export default function usageLabel(usageType: string): string {
  return UsageMap[usageType]?.label || usageType
}
