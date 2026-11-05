# La Bibliothèque des Mondes Inachevés

Portfolio immersif React, Three.js et React Three Fiber. Le contenu éditorial est administré avec Sanity Studio, tandis que l’architecture 3D, le mouvement et la direction artistique restent dans l’application.

## Portfolio

```bash
npm install
npm run dev
```

Vérifications:

```bash
npm test
npm run lint
npm run build
npm run preview
```

## Sanity Studio

Le Studio existant se trouve dans `studio/` et utilise le projet `43dsdcuf` avec le dataset `production`. Il est en ligne sur <https://portfolio-lionel-chiry.sanity.studio>. `npm run deploy` depuis `studio/` y publie les changements de `schemaTypes/` et de `structure.ts`.

```bash
cd studio
npm install
npm run dev
```

Le Studio permet de gérer exclusivement:

- `A PROPOS DE MOI`
- `LIVRES`
- `HISTOIRES AUDIOS`
- `RESEAUX SOCIAUX`
- `AGENDA`

## Migration éditoriale

La migration est idempotente: elle reprend le contenu local réel, téléverse le portrait et les couvertures correspondantes, puis utilise `createOrReplace` avec des identifiants stables.

```bash
cd studio
npm run migrate:content
npm run verify:content
```

Les fichiers locaux sous `public/categories/` et les données de `src/content/portfolioContent.js` restent disponibles comme fallback. Une indisponibilité de Sanity ne bloque donc pas l’expérience 3D.

## Ajouter un livre

1. Ouvrir `LIVRES` dans Sanity Studio.
2. Créer un document et renseigner le titre, l’auteur, la catégorie, le résumé, la couverture et la description.
3. Ajouter un lien de bande-annonce si disponible.
4. Choisir `displayOrder` pour la bibliothèque complète.
5. Activer `published` pour rendre le livre visible.
6. Publier le document dans Sanity Studio.

Tout livre publié apparaît automatiquement dans `VOIR TOUTE LA BIBLIOTHÈQUE` et sur la bibliothèque 3D au bout de la galerie, dans l’ordre de `displayOrder`. La couleur de sa tranche vient de sa couverture, et un `:` dans le titre sépare le titre du sous-titre sur la tranche. Aucun changement de code ou d’architecture n’est nécessaire.

Pour placer un livre dans l’un des trois cadres physiques, activer `featured` et choisir une valeur `featuredOrder` entre `1` et `3`. Le frontend trie ces livres et limite toujours le rendu à trois emplacements.

## Ajouter une histoire audio

Toute histoire publiée dans `HISTOIRES AUDIOS` apparaît automatiquement sur la bibliothèque au fond de la salle audio, dans l’ordre de `displayOrder`. Les trois premières sont aussi affichées dans les cadres du mur de gauche.

L’illustration provient du champ `image` de Sanity. S’il est vide, le site utilise la miniature de la vidéo YouTube et retire ses bandes noires. Sans image ni vidéo, une carte affiche le titre.

## Ajouter une date à l’agenda

1. Ouvrir `AGENDA` dans Sanity Studio et créer un document.
2. Renseigner la date, les horaires et le nom de l’événement ou du lieu.
3. Cliquer sur `Publish`.

La date apparaît seule sur le tableau et dans la fiche `Agenda`, triée par date, au prochain chargement du site. Sanity peut mettre environ une minute à la diffuser. Une date passée disparaît seule le lendemain de son dernier jour.

Les dates de `agendaEvents` dans `src/content/portfolioContent.js` ne servent que si Sanity est injoignable: l’agenda se gère uniquement dans le Studio.

## Variables Render

Ajouter les variables publiques suivantes au service frontend Render:

```text
VITE_SANITY_PROJECT_ID=43dsdcuf
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2026-08-01
```

Ces valeurs ne sont pas secrètes. Aucun jeton Sanity ne doit être ajouté aux variables `VITE_*` ni au bundle frontend.

Une fois l’URL Render définitive connue, l’ajouter aux origines CORS du projet Sanity sans autoriser les identifiants:

```bash
cd studio
npx sanity cors add https://your-service.onrender.com --no-credentials
```
