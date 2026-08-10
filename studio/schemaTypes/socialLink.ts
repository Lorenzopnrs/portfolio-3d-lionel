import {defineField, defineType} from 'sanity'

export const socialLink = defineType({
  name: 'socialLink',
  title: 'RESEAUX SOCIAUX',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Libellé',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'description',
      title: 'Description courte',
      type: 'string',
    }),
    defineField({
      name: 'displayOrder',
      title: 'Ordre d’affichage',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'active',
      title: 'Afficher sur le portfolio',
      type: 'boolean',
      initialValue: true,
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
      title: 'label',
      subtitle: 'url',
    },
  },
})
