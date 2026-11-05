import {defineField, defineType} from 'sanity'

const DATE_OPTIONS = {dateFormat: 'DD/MM/YYYY'}

function formatPreviewDate(date?: string) {
  return date
    ? new Date(`${date}T00:00:00Z`).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
        year: 'numeric',
      })
    : 'Date à choisir'
}

export const agendaEvent = defineType({
  name: 'agendaEvent',
  title: 'AGENDA',
  type: 'document',
  fields: [
    defineField({
      name: 'startDate',
      title: 'Date',
      description: 'Le premier jour, si l’événement dure plusieurs jours.',
      type: 'date',
      options: DATE_OPTIONS,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Dernier jour',
      description: 'À remplir seulement si l’événement dure plusieurs jours.',
      type: 'date',
      options: DATE_OPTIONS,
      validation: (Rule) =>
        Rule.custom((endDate, context) => {
          const startDate = (context.document as {startDate?: string} | undefined)?.startDate

          return !endDate || !startDate || endDate >= startDate
            ? true
            : 'Le dernier jour ne peut pas précéder la date de début.'
        }),
    }),
    defineField({
      name: 'time',
      title: 'Horaires',
      description: 'Par exemple : 14h - 18h. Le site les écrit proprement tout seul.',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Nom de l’événement ou du lieu',
      description: 'Par exemple : Tennis Club de Mons.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Lieu',
      description: 'Seulement si le nom ci-dessus est celui de l’événement.',
      type: 'string',
    }),
    defineField({
      name: 'city',
      title: 'Ville',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'url',
      title: 'Lien',
      type: 'url',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'published',
      title: 'Afficher sur le portfolio',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: 'Date',
      name: 'startDateAsc',
      by: [{field: 'startDate', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'startDate',
      city: 'city',
    },
    prepare({title, date, city}) {
      return {
        title,
        subtitle: [formatPreviewDate(date), city].filter(Boolean).join(' · '),
      }
    },
  },
})
