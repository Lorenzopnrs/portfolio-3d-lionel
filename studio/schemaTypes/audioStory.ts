import {defineField, defineType} from 'sanity'

export const audioStory = defineType({
  name: 'audioStory',
  title: 'HISTOIRES AUDIOS',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'infoTitle',
      title: 'Sous-titre éditorial',
      type: 'string',
    }),
    defineField({
      name: 'summary',
      title: 'Résumé court',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      description: 'Chaque élément correspond à un paragraphe distinct.',
      of: [{type: 'text', rows: 5}],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'audioFile',
      title: 'Enregistrement audio',
      type: 'object',
      description: 'Téléversez un fichier audio ou utilisez un lien externe existant.',
      fields: [
        defineField({
          name: 'file',
          title: 'Fichier audio',
          type: 'file',
          options: {accept: 'audio/*'},
        }),
        defineField({
          name: 'externalUrl',
          title: 'Lien externe',
          type: 'url',
          description: 'Utilisé pour les enregistrements YouTube actuels.',
          validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
        }),
      ],
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const audioSource = value as
            | {file?: {asset?: unknown}; externalUrl?: string}
            | undefined

          return audioSource?.file?.asset || audioSource?.externalUrl
            ? true
            : 'Ajoutez un fichier audio ou un lien externe.'
        }),
    }),
    defineField({
      name: 'image',
      title: 'Image optionnelle',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'displayOrder',
      title: 'Ordre d’affichage',
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
      title: 'Ordre d’affichage',
      name: 'displayOrder',
      by: [{field: 'displayOrder', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'infoTitle',
      media: 'image',
    },
  },
})
