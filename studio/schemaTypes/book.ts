import {defineField, defineType} from 'sanity'

const API_VERSION = '2026-08-01'

type FeaturedValidationContext = {
  document?: {
    _id?: string
    featured?: boolean
    published?: boolean
  }
  getClient: (options: {apiVersion: string}) => {
    fetch: (
      query: string,
      params: Record<string, number | string>,
    ) => Promise<number>
  }
}

async function validateFeaturedLimit(
  featured: boolean | undefined,
  context: FeaturedValidationContext,
) {
  if (!featured || !context.document?.published) {
    return true
  }

  const publishedId = context.document._id?.replace(/^drafts\./, '') ?? ''
  const draftId = `drafts.${publishedId}`
  const featuredCount = await context.getClient({apiVersion: API_VERSION}).fetch(
    `count(*[
      _type == "book" &&
      featured == true &&
      published == true &&
      !(_id in path("drafts.**")) &&
      !(_id in [$publishedId, $draftId])
    ])`,
    {publishedId, draftId},
  )

  return featuredCount < 3
    ? true
    : 'Trois livres publiés sont déjà sélectionnés pour les cadres physiques.'
}

async function validateFeaturedOrder(
  featuredOrder: number | undefined,
  context: FeaturedValidationContext,
) {
  if (
    featuredOrder === undefined ||
    !context.document?.featured ||
    !context.document.published
  ) {
    return true
  }

  const publishedId = context.document._id?.replace(/^drafts\./, '') ?? ''
  const draftId = `drafts.${publishedId}`
  const matchingOrderCount = await context
    .getClient({apiVersion: API_VERSION})
    .fetch(
      `count(*[
        _type == "book" &&
        featured == true &&
        published == true &&
        featuredOrder == $featuredOrder &&
        !(_id in path("drafts.**")) &&
        !(_id in [$publishedId, $draftId])
      ])`,
      {draftId, featuredOrder, publishedId},
    )

  return matchingOrderCount === 0
    ? true
    : 'Cette position est déjà utilisée par un autre livre publié.'
}

export const book = defineType({
  name: 'book',
  title: 'LIVRES',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Auteur',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Résumé court',
      type: 'text',
      rows: 3,
      description: 'Texte concis utilisé dans les accès rapides du corridor.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hook',
      title: 'Accroche',
      type: 'string',
    }),
    defineField({
      name: 'cover',
      title: 'Couverture',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description / quatrième de couverture',
      type: 'array',
      description: 'Chaque élément correspond à un paragraphe distinct.',
      of: [{type: 'text', rows: 5}],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'teaser',
      title: 'Lien de la bande-annonce',
      type: 'url',
      description: 'Lien YouTube ou autre URL HTTPS vers la bande-annonce.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'featured',
      title: 'Afficher dans un cadre physique',
      type: 'boolean',
      description: 'Trois livres publiés maximum peuvent occuper les trois cadres du corridor.',
      initialValue: false,
      validation: (Rule) => Rule.custom(validateFeaturedLimit),
    }),
    defineField({
      name: 'featuredOrder',
      title: 'Position du cadre',
      type: 'number',
      description: '1, 2 ou 3. Obligatoire uniquement lorsque le livre est mis en avant.',
      hidden: ({document}) => !document?.featured,
      validation: (Rule) =>
        Rule.integer()
          .min(1)
          .max(3)
          .custom((value, context) =>
            context.document?.featured && value === undefined
              ? 'Choisissez une position entre 1 et 3.'
              : true,
          )
          .custom(validateFeaturedOrder),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Ordre dans la bibliothèque complète',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'published',
      title: 'Publié sur le portfolio',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Ordre de la bibliothèque',
      name: 'displayOrder',
      by: [{field: 'displayOrder', direction: 'asc'}],
    },
    {
      title: 'Ordre des cadres',
      name: 'featuredOrder',
      by: [{field: 'featuredOrder', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'author',
      media: 'cover',
    },
  },
})
