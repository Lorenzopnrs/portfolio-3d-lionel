import {
  ABOUT_PORTRAIT_URL,
  BOOK_COVER_URLS,
} from '../assets/runtimeAssetPaths.js'

export const aboutContent = Object.freeze({
  id: 'about',
  title: 'A PROPOS DE MOI',
  summary: 'Ma passion pour l’écriture est née d’une contrainte.',
  paragraphs: Object.freeze([
    'Ma passion pour l’écriture est née d’une contrainte. Alors que mes camarades s\'exerçaient sur les terrains de sport, mon corps, lui, m’imposait l’immobilité. C’est sur le banc de touche, un stylo à la main et un bloc de feuilles sur les genoux, que j’ai découvert ma véritable liberté. Ce qui n’était qu’une évasion face à la maladie est devenu, au fil des pages, une nécessité vitale.',
    'Aujourd\'hui, mon métier d’éducateur spécialisé nourrit mon regard d’auteur. Mon expérience de vie et mon quotidien auprès de l\'humain m\'ont appris à observer les fêlures, les silences et la résilience. J\'écris pour explorer ces zones d\'ombre de la psyché où la réalité se fragmente, en y insufflant toute l\'authenticité que mon parcours m\'a enseignée.',
  ]),
  portrait: Object.freeze({
    src: ABOUT_PORTRAIT_URL,
    alt: 'Black-and-white portrait of Lionel Chiry seated outdoors.',
  }),
  sourceFiles: Object.freeze([
    'catégories/A propos de moi/aproposdemoi.rtf',
    ABOUT_PORTRAIT_URL,
  ]),
})

export const books = Object.freeze([
  Object.freeze({
    id: 'shadow-of-jack-volume-1',
    title: 'L’OMBRE DE JACK',
    author: 'Lionel Chiry',
    category: 'Romans & Essais - Thriller',
    hook: '« Je suis dans ta tête, tu es dans ma tête... je suis toi, tu es moi. »',
    summary:
      'Lisa Hillis n’est plus qu’une silhouette brisée. Manipulée par une voix surgie du passé, elle a commis l’irréparable pour protéger les siens.',
    backCover: Object.freeze([
      'Lisa Hillis n’est plus qu’une silhouette brisée. Manipulée par une voix surgie du passé, elle a commis l’irréparable pour protéger les siens. Désormais tondue et enfermée, elle n’a qu’une certitude : Jack existe.',
      'L’inspecteur Gardner, hanté par une série de meurtres d’animaux macabres, refuse de croire à la simple folie. Entre les murs d’un hôpital psychiatrique et les décombres d’un vieil orphelinat, il remonte la piste d’un marionnettiste invisible.',
      'Jack est-il le fruit d’une psychose ou un fantôme effacé par un système corrompu ?',
      'Dans ce thriller psychologique, Lionel Chiry nous plonge dans l’abîme, là où les souvenirs d’enfance deviennent des armes fatales.',
    ]),
    cover: Object.freeze({
      src: BOOK_COVER_URLS.shadowOfJackVolumeOne,
      alt: 'Cover of L’Ombre de Jack by Lionel Chiry.',
    }),
    teaser: Object.freeze({
      sourceUrl: 'https://www.youtube.com/watch?v=PI4bK17n48o',
      title: 'Teaser for L’Ombre de Jack',
      sourceFile: 'catégories/livres/Tome 1/Teaser1.webloc',
    }),
    sourceFiles: Object.freeze([
      'catégories/livres/Tome 1/infos.rtf',
      BOOK_COVER_URLS.shadowOfJackVolumeOne,
      'catégories/livres/Tome 1/Teaser1.webloc',
    ]),
  }),
  Object.freeze({
    id: 'shadow-of-jack-volume-2',
    title: 'L’OMBRE DE JACK TOME 2 : Le Miroir des Traumatismes',
    author: 'Lionel Chiry',
    category: 'Romans & Essais - Thriller',
    hook: '« On ne s’échappe jamais vraiment de la Cage. »',
    summary:
      'Lisa Hillis pensait le pire derrière elle, mais la voilà enfermée à l’hôpital psychiatrique face au Docteur Olsson.',
    backCover: Object.freeze([
      'Lisa Hillis pensait le pire derrière elle, mais la voilà enfermée à l’hôpital psychiatrique face au Docteur Olsson. Est-elle la proie d’un manipulateur sadique ou l’architecte de sa propre déchéance ? Pendant ce temps, l’inspecteur Gardner s’enfonce dans une enquête qui le dépasse. Entre les dossiers scellés de l’orphelinat Saint-José et ses propres zones d’ombre, il découvre que Jack est une blessure béante que personne n’a soignée.',
      'Alors que le puzzle s’assemble, une question demeure : qui est le véritable monstre ? Celui qui se cache derrière un masque de clown, ou celui qui a laissé l’horreur s’installer en 1987 ? La vérité est une cellule dont on ne sort pas indemne.',
    ]),
    cover: Object.freeze({
      src: BOOK_COVER_URLS.shadowOfJackVolumeTwo,
      alt: 'Cover of L’Ombre de Jack Tome 2 by Lionel Chiry.',
    }),
    teaser: Object.freeze({
      sourceUrl:
        'https://www.youtube.com/watch?is=gQyLEBEi2hN2vZhT&v=x0FZNvFNkiQ&feature=youtu.be',
      title: 'Teaser for L’Ombre de Jack Tome 2',
      sourceFile: 'catégories/livres/Tome 2/Teaser2.webloc',
    }),
    sourceFiles: Object.freeze([
      'catégories/livres/Tome 2/infos.rtf',
      BOOK_COVER_URLS.shadowOfJackVolumeTwo,
      'catégories/livres/Tome 2/Teaser2.webloc',
    ]),
  }),
  Object.freeze({
    id: 'the-thinker',
    title: 'LE PENSEUR',
    author: 'Lionel Chiry',
    category: 'Romans & Essais - Thriller',
    hook: null,
    summary:
      "La vie de Monsieur Wills est devenue un cauchemar après avoir tout perdu lors de son accident de voiture, il y' a de cela 10 ans.",
    backCover: Object.freeze([
      "La vie de Monsieur Wills est devenue un cauchemar après avoir tout perdu lors de son accident de voiture, il y' a de cela 10 ans. Il vit seul dans son appartement dans des conditions précaires, il est invalide et rongé par la culpabilité.",
      "Son passé a façonné sa personnalité mais comment arrivera t'il à gérer son futur avec toutes les péripéties qui feront emballer une machine anxiogène inarrêtable ? Monsieur Wills devra faire preuve de lucidité à tout moment !",
      'En réalité tout sera compliqué !',
    ]),
    cover: Object.freeze({
      src: BOOK_COVER_URLS.thinker,
      alt: 'Cover of Le Penseur by Lionel Chiry.',
    }),
    teaser: null,
    sourceFiles: Object.freeze([
      'catégories/livres/Le penseur/infos.rtf',
      BOOK_COVER_URLS.thinker,
    ]),
  }),
])

export const audioStories = Object.freeze([
  Object.freeze({
    id: 'between-four-mirrors',
    title: 'Entre quatre miroirs',
    infoTitle: 'L’Allégorie du Miroir : De la Haine à la Réconciliation',
    summary:
      'Ce récit introspectif explore la thématique de la dysmorphophobie et de la prison mentale.',
    paragraphs: Object.freeze([
      'Ce récit introspectif explore la thématique de la dysmorphophobie et de la prison mentale. À travers une mise en scène métaphorique, l’auteur dépeint le combat d’un individu face à ses propres complexes, représentés par quatre miroirs invulnérables.',
    ]),
    media: Object.freeze({
      sourceUrl: 'https://www.youtube.com/watch?v=iiPtbwL6E44',
      title: 'Listen to Entre quatre miroirs',
      sourceFile:
        'catégories/audio:histoire/Entre quatre miroirs/Entre quatre miroir.webloc',
    }),
    sourceFiles: Object.freeze([
      'catégories/audio:histoire/Entre quatre miroirs/infos.rtf',
      'catégories/audio:histoire/Entre quatre miroirs/Entre quatre miroir.webloc',
    ]),
  }),
  Object.freeze({
    id: 'coffee-time',
    title: 'Le temps d’un café',
    infoTitle: 'Une structure en compte à rebours : De la macro à la micro-temporalité',
    summary:
      'Le texte est construit sur une gradation descendante qui donne une impression d’entonnoir.',
    paragraphs: Object.freeze([
      'Le texte est construit sur une gradation descendante (une hypotypose du temps) qui donne une impression d’entonnoir. Le narrateur nous emmène du plus vaste au plus infime.',
    ]),
    media: Object.freeze({
      sourceUrl:
        'https://www.youtube.com/watch?v=eiD-zwDqOn4&feature=youtu.be',
      title: 'Listen to Le temps d’un café',
      sourceFile:
        "catégories/audio:histoire/Le temps d'un café/Le temps d'un café.webloc",
    }),
    sourceFiles: Object.freeze([
      "catégories/audio:histoire/Le temps d'un café/infos.rtf",
      "catégories/audio:histoire/Le temps d'un café/Le temps d'un café.webloc",
    ]),
  }),
])

export const socialContent = Object.freeze({
  id: 'social-networks',
  title: 'RESEAUX SOCIAUX',
  summary: 'Liens officiels fournis dans les archives du portfolio.',
})

export const socialLinks = Object.freeze([
  Object.freeze({
    id: 'instagram',
    label: 'Instagram',
    description: 'Ouvrir le profil Instagram fourni',
    href: 'https://www.instagram.com/lionelchiry/',
    sourceFile: 'catégories/Reseaux sociaux/Instagram.webloc',
  }),
  Object.freeze({
    id: 'facebook',
    label: 'Facebook',
    description: 'Ouvrir le profil Facebook fourni',
    href: 'https://www.facebook.com/lionel.chiry/',
    sourceFile: 'catégories/Reseaux sociaux/Facebook.webloc',
  }),
  Object.freeze({
    id: 'youtube',
    label: 'YouTube',
    description: 'Ouvrir la chaîne YouTube fournie',
    href: 'https://www.youtube.com/@LioStory-u5b',
    sourceFile: 'catégories/Reseaux sociaux/Chaine YouTube.webloc',
  }),
  Object.freeze({
    id: 'author-page',
    label: 'Publier un livre',
    description: 'Ouvrir la page auteur fournie',
    href:
      'https://www.publier-un-livre.com/fr/le-livre-en-papier-auteur/11211-lionel-chiry?srsltid=AfmBOorTyJTIHP86m70SsqO2MOSw_AUCgwvdeFheKp1EXEvIGnZDAqIO',
    sourceFile:
      'catégories/Reseaux sociaux/Publier un livre.webloc',
  }),
])
