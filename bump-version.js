// Bu script her deploy öncesi çalışır, versiyon artırır
import { readFileSync, writeFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)
pkg.version = `${major}.${minor}.${patch + 1}`
pkg.buildDate = new Date().toISOString().split('T')[0]
writeFileSync('package.json', JSON.stringify(pkg, null, 2))

// App.tsx içindeki versiyonu da güncelle
let app = readFileSync('src/App.tsx', 'utf8')
app = app.replace(/const APP_VERSION = '[^']*'/, `const APP_VERSION = '${pkg.version}'`)
app = app.replace(/const BUILD_DATE = '[^']*'/, `const BUILD_DATE = '${pkg.buildDate}'`)
writeFileSync('src/App.tsx', app)

console.log(`✓ Versiyon güncellendi: ${pkg.version} (${pkg.buildDate})`)
