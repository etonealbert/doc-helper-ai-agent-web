import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/deploy.yml'),
  'utf8',
)
const qualityStart = workflow.indexOf('  quality:')
const deployStart = workflow.indexOf('  deploy:')
const qualityJob = workflow.slice(qualityStart, deployStart)
const deployJob = workflow.slice(deployStart)

describe('deployment workflow permissions and environment', () => {
  it('builds with the production environment and no OIDC permission', () => {
    expect(qualityStart).toBeGreaterThan(-1)
    expect(qualityJob).toMatch(
      /\n {4}environment:\r?\n {6}name: production(?:\r?\n|$)/,
    )
    expect(qualityJob).not.toContain('id-token: write')
  })

  it('keeps OIDC permission scoped to the production deploy job', () => {
    expect(deployStart).toBeGreaterThan(qualityStart)
    expect(deployJob).toMatch(
      /\n {4}environment:\r?\n {6}name: production(?:\r?\n|$)/,
    )
    expect(deployJob).toContain('id-token: write')
  })
})
