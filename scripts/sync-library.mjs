// Copies the admin kit from the library repo into admin/library so the static site has no cross-repo imports.
// Usage: node scripts/sync-library.mjs [path-to-library]   (default: ../library)
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const src = path.resolve(process.argv[2] || '../library')
const dst = path.resolve('admin/library')
const DIRS = ['utils', 'constants', 'lib', 'hooks', 'providers', 'components']
const ONLY = { 'tokens/tokens.css': 1, 'styles/components/admin/admin.css': 1 }
if (!fs.existsSync(src)) { console.error('Library not found at', src); process.exit(1) }
fs.rmSync(dst, { recursive: true, force: true })
const copy = (from, to) => {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const f = path.join(from, e.name), t = path.join(to, e.name)
    if (e.isDirectory()) { fs.mkdirSync(t, { recursive: true }); copy(f, t) }
    else if (/\.(js|css|json)$/.test(e.name)) { if (e.name === 'package.json' && !/utils|constants|lib|hooks|providers|components/.test(from)) continue; fs.copyFileSync(f, t) }
  }
}
for (const d of DIRS) { fs.mkdirSync(path.join(dst, d), { recursive: true }); copy(path.join(src, d), path.join(dst, d)) }
for (const f of Object.keys(ONLY)) { fs.mkdirSync(path.dirname(path.join(dst, f)), { recursive: true }); fs.copyFileSync(path.join(src, f), path.join(dst, f)) }
// schemas as an importable module (no JSON import attributes needed)
const schemas = {}
for (const f of fs.readdirSync(path.join(src, 'schemas'))) if (f.endsWith('.schema.json')) schemas[f.replace('.schema.json', '')] = JSON.parse(fs.readFileSync(path.join(src, 'schemas', f), 'utf8'))
fs.mkdirSync(path.join(dst, 'schemas'), { recursive: true })
fs.writeFileSync(path.join(dst, 'schemas/index.js'), `// Generated from library/schemas by scripts/sync-library.mjs. Do not edit.\nexport const schemas = ${JSON.stringify(schemas, null, 2)}\n`)
fs.writeFileSync(path.join(dst, 'package.json'), '{ "type": "module" }\n')
let rev = 'unknown'; try { rev = execSync('git rev-parse --short HEAD', { cwd: src }).toString().trim() } catch { /* not a git checkout */ }
fs.writeFileSync(path.join(dst, 'VERSION'), `nadeemmurtaza/library @ ${rev}\n`)
console.log('synced library', rev, '->', dst)
