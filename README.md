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

Le Studio existant se trouve dans `studio/` et utilise le projet `43dsdcuf` avec le dataset `production`.

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

Tout livre publié apparaît automatiquement dans `VOIR TOUTE LA BIBLIOTHÈQUE`. Aucun changement de code ou d’architecture n’est nécessaire.

Pour placer un livre dans l’un des trois cadres physiques, activer `featured` et choisir une valeur `featuredOrder` entre `1` et `3`. Le frontend trie ces livres et limite toujours le rendu à trois emplacements.

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
