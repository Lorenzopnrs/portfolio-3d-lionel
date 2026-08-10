import {createReadStream} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'
import {
  aboutContent,
  audioStories,
  books,
  socialLinks,
} from '../../src/content/portfolioContent.js'

const client = getCliClient({apiVersion: '2026-08-01'})

const assetPaths = {
  portrait: 'public/categories/about/portrait.jpg',
  'shadow-of-jack-volume-1': 'public/categories/books/tome-1/affiche1.jpeg',
  'shadow-of-jack-volume-2': 'public/categories/books/tome-2/affiche2.jpeg',
  'the-thinker': 'public/categories/books/le-penseur/affiche.jpeg',
}

function getRepositoryPath(relativePath) {
  return fileURLToPath(new URL(`../../${relativePath}`, import.meta.url))
}

async function uploadImage(relativePath, filename) {
  const asset = await client.assets.upload(
    'image',
    createReadStream(getRepositoryPath(relativePath)),
    {filename},
  )

  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: asset._id,
    },
  }
}

async function migrateContent() {
  const [portrait, ...covers] = await Promise.all([
    uploadImage(assetPaths.portrait, 'lionel-chiry-portrait.jpg'),
    ...books.map((book) =>
      uploadImage(assetPaths[book.id], `${book.id}-cover.jpeg`),
    ),
  ])

  const documents = [
    {
      _id: 'about-profile',
      _type: 'about',
      name: aboutContent.name,
      subtitle: aboutContent.summary,
      biography: [...aboutContent.paragraphs],
      portrait,
    },
    ...books.map((book, index) => ({
      _id: `book-${book.id}`,
      _type: 'book',
      title: book.title,
      author: book.author,
      category: book.category,
      summary: book.summary,
      hook: book.hook ?? undefined,
      cover: covers[index],
      description: [...book.backCover],
      teaser: book.teaser?.sourceUrl,
      featured: book.featured,
      featuredOrder: book.featuredOrder,
      displayOrder: book.displayOrder,
      published: book.published,
    })),
    ...audioStories.map((story) => ({
      _id: `audio-${story.id}`,
      _type: 'audioStory',
      title: story.title,
      infoTitle: story.infoTitle,
      summary: story.summary,
      description: [...story.paragraphs],
      audioFile: {
        _type: 'object',
        externalUrl: story.media.sourceUrl,
      },
      displayOrder: story.displayOrder,
      published: story.published,
    })),
    ...socialLinks.map((socialLink) => ({
      _id: `social-${socialLink.id}`,
      _type: 'socialLink',
      label: socialLink.label,
      url: socialLink.href,
      description: socialLink.description,
      displayOrder: socialLink.displayOrder,
      active: socialLink.active,
    })),
  ]

  const transaction = documents.reduce(
    (currentTransaction, document) => currentTransaction.createOrReplace(document),
    client.transaction(),
  )

  await transaction.commit({visibility: 'sync'})

  console.log(
    `Migrated ${documents.length} editorial documents and ${covers.length + 1} image assets.`,
  )
}

try {
  await migrateContent()
} catch (error) {
  console.error('Sanity content migration failed.', error)
  process.exitCode = 1
}
