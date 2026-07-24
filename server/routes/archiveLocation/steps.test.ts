import { Response } from 'express'
import FormWizard from 'hmpo-form-wizard'
import steps from './steps'

describe('archiveLocation steps', () => {
  // The entry step routes leaf locations through the archive-or-inactive choice, but sends parent
  // locations straight to confirmation - a parent is hidden from the list, never made inactive.
  const entryNext = steps['/'].next as [FormWizard.Step.CallbackCondition, string]
  const parentBranch = entryNext[0]

  const resFor = (isLeafLevel: boolean) => ({ locals: { locationDetails: { isLeafLevel } } }) as unknown as Response

  it('sends a parent location straight to the confirm step', () => {
    expect(parentBranch.next).toBe('confirm')
    expect(parentBranch.fn({} as FormWizard.Request, resFor(false))).toBe(true)
  })

  it('sends a leaf location to the archive-or-inactive choice', () => {
    expect(parentBranch.fn({} as FormWizard.Request, resFor(true))).toBe(false)
    expect(entryNext[1]).toBe('archive-or-inactive')
  })
})
