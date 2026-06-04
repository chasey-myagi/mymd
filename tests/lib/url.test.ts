import { describe, it, expect } from 'vitest'
import { normalizeFetchUrl, originPattern, requiredOrigins, hostnameOf } from '../../src/lib/url'

describe('normalizeFetchUrl', () => {
  it('rewrites a GitHub blob page to the github.com /raw/ endpoint', () => {
    // Routed through github.com (not raw.githubusercontent directly) so the
    // session cookie can authenticate private repos.
    expect(
      normalizeFetchUrl('https://github.com/NousResearch/hermes-agent/blob/main/README.zh-CN.md')
    ).toBe('https://github.com/NousResearch/hermes-agent/raw/main/README.zh-CN.md')
  })

  it('keeps branch names that contain slashes intact', () => {
    expect(
      normalizeFetchUrl('https://github.com/o/r/blob/feature/foo/dir/x.md')
    ).toBe('https://github.com/o/r/raw/feature/foo/dir/x.md')
  })

  it('leaves an already github.com /raw/ URL untouched', () => {
    const raw = 'https://github.com/o/r/raw/main/x.md'
    expect(normalizeFetchUrl(raw)).toBe(raw)
  })

  it('leaves a raw.githubusercontent.com URL untouched', () => {
    const raw = 'https://raw.githubusercontent.com/o/r/main/x.md'
    expect(normalizeFetchUrl(raw)).toBe(raw)
  })

  it('rewrites a GitLab blob page to /-/raw/', () => {
    expect(
      normalizeFetchUrl('https://gitlab.com/group/repo/-/blob/main/README.md')
    ).toBe('https://gitlab.com/group/repo/-/raw/main/README.md')
  })

  it('rewrites a Bitbucket src page to /raw/', () => {
    expect(
      normalizeFetchUrl('https://bitbucket.org/ws/repo/src/main/README.md')
    ).toBe('https://bitbucket.org/ws/repo/raw/main/README.md')
  })

  it('leaves non-matching hosts and invalid input unchanged', () => {
    expect(normalizeFetchUrl('https://example.com/a/b.md')).toBe('https://example.com/a/b.md')
    expect(normalizeFetchUrl('not a url')).toBe('not a url')
  })
})

describe('originPattern', () => {
  it('builds a match pattern from an https URL', () => {
    expect(originPattern('https://raw.githubusercontent.com/o/r/main/x.md')).toBe(
      'https://raw.githubusercontent.com/*'
    )
  })

  it('returns null for non-http(s) and invalid URLs', () => {
    expect(originPattern('file:///tmp/x.md')).toBeNull()
    expect(originPattern('nonsense')).toBeNull()
  })
})

describe('requiredOrigins', () => {
  it('requires both github.com and raw.githubusercontent.com for a github /raw/ URL', () => {
    expect(requiredOrigins('https://github.com/o/r/raw/main/x.md')).toEqual([
      'https://github.com/*',
      'https://raw.githubusercontent.com/*',
    ])
  })

  it('requires only the single origin for other hosts', () => {
    expect(requiredOrigins('https://gitlab.com/g/r/-/raw/main/x.md')).toEqual([
      'https://gitlab.com/*',
    ])
    expect(requiredOrigins('https://raw.githubusercontent.com/o/r/main/x.md')).toEqual([
      'https://raw.githubusercontent.com/*',
    ])
  })

  it('returns [] for non-http(s) URLs', () => {
    expect(requiredOrigins('file:///tmp/x.md')).toEqual([])
  })
})

describe('hostnameOf', () => {
  it('returns the hostname', () => {
    expect(hostnameOf('https://github.com/o/r')).toBe('github.com')
  })

  it('returns the input unchanged when unparseable', () => {
    expect(hostnameOf('???')).toBe('???')
  })
})
