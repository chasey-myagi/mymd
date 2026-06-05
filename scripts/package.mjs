// Package the built extension into mymd-v<version>.zip for the Chrome Web Store.
// Run via `npm run package` (builds first, then zips dist/). Requires the `zip`
// CLI (preinstalled on macOS/Linux).
import { readFileSync, rmSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'))

// manifest.json is what the store actually ships; keep package.json in lockstep.
const pkgVersion = read('package.json').version
const manifestVersion = read('manifest.json').version
if (pkgVersion !== manifestVersion) {
  console.error(
    `✗ Version mismatch: package.json ${pkgVersion} ≠ manifest.json ${manifestVersion}.\n` +
      `  Sync both before packaging.`
  )
  process.exit(1)
}

const distDir = resolve(root, 'dist')
if (!existsSync(resolve(distDir, 'manifest.json'))) {
  console.error('✗ dist/ not built — run `npm run build` first (or use `npm run package`).')
  process.exit(1)
}

const zipName = `mymd-v${pkgVersion}.zip`
const zipPath = resolve(root, zipName)
if (existsSync(zipPath)) rmSync(zipPath)

// Zip the *contents* of dist/ so manifest.json sits at the archive root (CWS requires this).
execFileSync('zip', ['-r', '-X', zipPath, '.', '-x', '*.DS_Store'], {
  cwd: distDir,
  stdio: 'inherit',
})

const sizeMB = (statSync(zipPath).size / 1024 / 1024).toFixed(1)
console.log(`\n✓ ${zipName} (${sizeMB}M)`)
