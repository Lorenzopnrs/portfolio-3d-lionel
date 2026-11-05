export const PORTFOLIO_CONTENT_QUERY = `{
  "about": *[_type == "about"][0]{
    _id,
    name,
    subtitle,
    biography,
    "portrait": portrait.asset->{url}
  },
  "books": *[_type == "book" && published == true] | order(displayOrder asc, title asc){
    _id,
    title,
    author,
    category,
    summary,
    hook,
    description,
    teaser,
    featured,
    featuredOrder,
    displayOrder,
    published,
    "cover": cover.asset->{url}
  },
  "audioStories": *[_type == "audioStory" && published == true] | order(displayOrder asc, title asc){
    _id,
    title,
    infoTitle,
    summary,
    description,
    displayOrder,
    published,
    "audioFile": {
      "externalUrl": audioFile.externalUrl,
      "fileUrl": audioFile.file.asset->url
    },
    "image": image.asset->{url}
  },
  "agendaEvents": *[_type == "agendaEvent" && published == true] | order(startDate asc){
    _id,
    title,
    startDate,
    endDate,
    time,
    venue,
    city,
    description,
    url,
    published
  },
  "socialLinks": *[_type == "socialLink" && active == true] | order(displayOrder asc, label asc){
    _id,
    label,
    url,
    description,
    displayOrder,
    active
  }
}`
