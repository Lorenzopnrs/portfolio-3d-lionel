import {defineField, defineType} from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'A PROPOS DE MOI',
  type: 'document',
  description: 'Profil unique utilisé par le portail A PROPOS DE MOI. Un seul document doit exister.',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Introduction courte',
      type: 'string',
      description: 'Phrase concise affichée comme introduction ou résumé.',
    }),
    defineField({
      name: 'portrait',
      title: 'Portrait',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'biography',
      title: 'Biographie',
      type: 'array',
      description: 'Chaque élément correspond à un paragraphe distinct.',
      of: [{type: 'text', rows: 6}],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'subtitle',
      media: 'portrait',
    },
  },
})
