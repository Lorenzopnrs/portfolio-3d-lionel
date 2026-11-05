import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenu du portfolio')
    .items([
      S.listItem()
        .id('about-profile')
        .title('A PROPOS DE MOI')
        .schemaType('about')
        .child(
          S.document()
            .schemaType('about')
            .documentId('about-profile')
            .title('A PROPOS DE MOI'),
        ),
      S.divider(),
      S.documentTypeListItem('book').title('LIVRES'),
      S.documentTypeListItem('audioStory').title('HISTOIRES AUDIOS'),
      S.documentTypeListItem('socialLink').title('RESEAUX SOCIAUX'),
      S.documentTypeListItem('agendaEvent')
        .title('AGENDA')
        .child(
          S.documentTypeList('agendaEvent')
            .title('AGENDA')
            .defaultOrdering([{field: 'startDate', direction: 'asc'}]),
        ),
    ])
