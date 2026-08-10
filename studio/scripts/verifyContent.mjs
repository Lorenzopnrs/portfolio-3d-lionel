import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-08-01'})
const temporaryBookId = 'book-temporary-pipeline-verification'

async function verifyContent() {
  const firstCoverReference = await client.fetch(
    `*[_type == "book" && defined(cover.asset)][0].cover.asset._ref`,
  )

  if (!firstCoverReference) {
    throw new Error('No migrated book cover is available for pipeline verification.')
  }

  try {
    await client.createOrReplace({
      _id: temporaryBookId,
      _type: 'book',
      title: 'Temporary pipeline verification',
      author: 'Lionel Chiry',
      category: 'Verification',
      summary: 'Temporary document used to verify dynamic library loading.',
      description: ['Temporary document used to verify dynamic library loading.'],
      cover: {
        _type: 'image',
        asset: {_type: 'reference', _ref: firstCoverReference},
      },
      featured: false,
      displayOrder: 999,
      published: true,
    })

    const result = await client.fetch(`{
      "publishedBookIds": *[_type == "book" && published == true] | order(displayOrder asc)._id,
      "featuredBookIds": *[_type == "book" && published == true && featured == true] | order(featuredOrder asc)[0...3]._id
    }`)

    if (!result.publishedBookIds.includes(temporaryBookId)) {
      throw new Error('The temporary published book did not appear in the complete library query.')
    }

    if (result.featuredBookIds.length > 3) {
      throw new Error('The featured book query returned more than three physical slots.')
    }

    console.log(
      `Verified ${result.publishedBookIds.length} published books and ${result.featuredBookIds.length} featured slots.`,
    )
  } finally {
    await client.delete(temporaryBookId)
  }
}

try {
  await verifyContent()
} catch (error) {
  console.error('Sanity content verification failed.', error)
  process.exitCode = 1
}
