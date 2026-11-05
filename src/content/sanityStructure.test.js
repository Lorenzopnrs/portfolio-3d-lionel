import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const readProjectFile = (path) => readFileSync(`${root}${path}`, 'utf8')

test('Studio registers the five editorial document types', () => {
  const indexSource = readProjectFile('studio/schemaTypes/index.ts')
  const bookSource = readProjectFile('studio/schemaTypes/book.ts')

  for (const typeName of [
    'about',
    'agendaEvent',
    'book',
    'audioStory',
    'socialLink',
  ]) {
    assert.match(indexSource, new RegExp(typeName))
    assert.match(
      readProjectFile(`studio/schemaTypes/${typeName}.ts`),
      new RegExp(`name:\\s*['"]${typeName}['"]`),
    )
  }

  assert.match(bookSource, /featuredOrder == \$featuredOrder/)
  assert.match(bookSource, /Cette position est déjà utilisée/)
})

test('frontend integration keeps Sanity primary and local content as fallback', () => {
  const appSource = readProjectFile('src/App.jsx')
  const aboutOverlaySource = readProjectFile(
    'src/final-route/AboutDetailOverlay.jsx',
  )
  const routeAssetSource = readProjectFile(
    'src/final-route/FinalRouteAsset.jsx',
  )
  const querySource = readProjectFile('src/sanity/queries.js')

  assert.match(appSource, /usePortfolioContent/)
  assert.match(appSource, /data-content-source=\{portfolioContent\.source\}/)
  assert.match(aboutOverlaySource, /\{about\.name\}/)
  assert.doesNotMatch(aboutOverlaySource, /<strong>Lionel Chiry<\/strong>/)
  assert.match(routeAssetSource, /featuredBooks/)
  assert.match(querySource, /featuredOrder/)
  assert.match(querySource, /displayOrder/)
  assert.match(querySource, /published/)
  assert.doesNotMatch(routeAssetSource, /from '..\/content\/portfolioContent'/)
})

test('the general migration leaves the agenda to the Studio', () => {
  const migrationSource = readProjectFile(
    'studio/scripts/migrateContent.mjs',
  )

  assert.doesNotMatch(migrationSource, /agendaEvent/)
})

test('migration uses deterministic documents and the existing local assets', () => {
  const migrationSource = readProjectFile(
    'studio/scripts/migrateContent.mjs',
  )
  const verificationSource = readProjectFile(
    'studio/scripts/verifyContent.mjs',
  )

  assert.match(migrationSource, /createOrReplace/)
  assert.match(migrationSource, /about-profile/)
  assert.match(migrationSource, /public\/categories\/about\/portrait\.jpg/)
  assert.match(migrationSource, /public\/categories\/books\/tome-1\/affiche1\.jpeg/)
  assert.match(migrationSource, /public\/categories\/books\/tome-2\/affiche2\.jpeg/)
  assert.match(migrationSource, /public\/categories\/books\/le-penseur\/affiche\.jpeg/)
  assert.match(migrationSource, /await migrateContent\(\)/)
  assert.match(verificationSource, /await verifyContent\(\)/)
})
