# Pokédex

Application React qui affiche les Pokémon de la [PokeAPI](https://pokeapi.co/), permet de les rechercher, de consulter leur fiche détaillée et de créer ses propres Pokémon (enregistrés dans le navigateur).

**Site en ligne :** https://neowafflespy.github.io/Pokedex/

**Stack :** React 19, React Router 7, Vite 8, Axios, Vitest + Testing Library, oxlint, GitHub Actions, GitHub Pages.

**Diagrammes UML :** [docs/UML.md](docs/UML.md) (classes, modèle de données, séquences, cas d'utilisation).

---

## Sommaire

1. [Lancer le projet](#1-lancer-le-projet)
2. [Mise en ligne](#2-mise-en-ligne)
3. [Pipeline CI/CD](#3-pipeline-cicd)
4. [Tests unitaires et fonctionnels](#4-tests-unitaires-et-fonctionnels)
5. [Optimisation des performances](#5-optimisation-des-performances)
6. [KISS et qualité du code](#6-kiss-et-qualité-du-code)
7. [Gestion d'état moderne](#7-gestion-détat-moderne)
8. [Stratégie de rendu](#8-stratégie-de-rendu)
9. [Organisation en Atomic Design](#9-organisation-en-atomic-design)

---

## 1. Lancer le projet

```bash
npm install
npm run dev          # serveur de dev (https://localhost:5173)
npm test             # lance tous les tests une fois
npm run test:watch   # relance les tests à chaque modification
npm run lint         # analyse statique avec oxlint
npm run build        # build de production dans dist/
```

> Le serveur de dev utilise HTTPS avec un certificat auto-signé (`@vitejs/plugin-basic-ssl`) : le navigateur affiche un avertissement, il suffit de cliquer sur « Continuer ».

## 2. Mise en ligne

L'application est hébergée sur **GitHub Pages** : https://neowafflespy.github.io/Pokedex/

- Le déploiement est entièrement automatique (voir la pipeline ci-dessous) : chaque push sur `main` met le site à jour.
- Le site est servi sous `/Pokedex/` : le build reçoit `--base=/Pokedex/`, et le routeur utilise `basename={import.meta.env.BASE_URL}` ([src/main.jsx](src/main.jsx)) pour que les routes fonctionnent en local (`/`) comme en ligne (`/Pokedex/`).
- GitHub Pages ne connaît pas les routes d'une SPA : `index.html` est copié en `404.html` pour qu'un lien direct vers `/Pokedex/poke/25` charge quand même l'application.

## 3. Pipeline CI/CD

Fichier : [.github/workflows/CI-CD.yml](.github/workflows/CI-CD.yml)

```
push / pull request sur main
        │
        ▼
   ┌─────────── CI ────────────┐
   │ npm ci → lint → tests → build │
   └───────────────────────────┘
        │  uniquement sur un push sur main, et seulement si la CI est verte
        ▼
   ┌─────────── CD ────────────┐
   │ build (base /Pokedex/) → upload → déploiement GitHub Pages │
   └───────────────────────────┘
```

- **CI (intégration continue)** : à chaque push et à chaque pull request, le job `ci` installe les dépendances, lance le linter, les tests, puis vérifie que le build passe. Une pull request qui casse quelque chose est signalée en rouge avant d'être fusionnée.
- **CD (déploiement continu)** : sur `main`, les jobs `build` puis `deploy` ne s'exécutent que si `ci` a réussi (`needs: ci`). Un test qui échoue bloque donc la mise en production.
- **Sécurité** : par défaut les jobs n'ont que le droit de lecture ; seules les permissions `pages: write` et `id-token: write` sont accordées, et uniquement au job `deploy`.

## 4. Tests unitaires et fonctionnels

Outils : **Vitest** (lanceur de tests intégré à Vite), **jsdom** (navigateur simulé), **Testing Library** (rendu des composants et interactions utilisateur). Les tests sont dans [src/test/](src/test/). Le réseau est toujours simulé (`vi.mock` / `vi.spyOn`) : les tests ne dépendent pas de la disponibilité de la PokeAPI.

### Tests unitaires — une fonction ou un composant isolé

| Fichier | Ce qui est testé |
|---|---|
| [customPokemonStorage.test.js](src/test/customPokemonStorage.test.js) | Lecture / ajout dans le localStorage, JSON corrompu, format invalide |
| [api.test.js](src/test/api.test.js) | Mise en cache des réponses, réutilisation du cache, cache corrompu, propagation des erreurs, recherche d'un type par nom |
| [customPokemonContext.test.js](src/test/customPokemonContext.test.js) | Reducer de l'état global (ajout immuable, action inconnue) et état initial |
| [Pagination.test.jsx](src/test/Pagination.test.jsx) | Pages affichées, page courante, boutons Précédent/Suivant, ouverture/fermeture de la recherche |
| [Pokecard.test.jsx](src/test/Pokecard.test.jsx) | Carte d'un Pokémon personnalisé, carte chargée depuis l'API, message d'erreur |

### Tests fonctionnels — un parcours utilisateur complet

[App.functional.test.jsx](src/test/App.functional.test.jsx) rend **toute l'application** (routeur + état global + pages) et la pilote comme un utilisateur :

1. **Créer un Pokémon** : aller sur « Ajouter un Pokémon », remplir le formulaire, enregistrer → retour à l'accueil, le Pokémon apparaît dans la liste et est sauvegardé.
2. **Rechercher** : ouvrir la recherche, taper « char » → seul Charmander reste affiché.
3. **Consulter une fiche** : cliquer sur la carte d'un Pokémon personnalisé → sa page de détail s'ouvre.
4. **Erreur réseau** : si la PokeAPI ne répond pas, l'utilisateur voit un message d'erreur.

Résultat : **29 tests, tous verts**, lancés automatiquement par la CI.

## 5. Optimisation des performances

Le Pokédex contient plus de 1 300 Pokémon : il faut éviter de tout télécharger et tout afficher à chaque interaction.

- **Cache des requêtes** ([src/services/api.js](src/services/api.js)) : les listes et fiches de la PokeAPI sont gardées dans le `localStorage`. Au deuxième chargement, il n'y a plus d'appel réseau. Une `Map` en mémoire stocke aussi la *promesse* en cours : si 50 cartes demandent le même type au même moment, une seule requête part.
- **Pagination** ([src/pages/Home.jsx](src/pages/Home.jsx)) : seuls 50 Pokémon sont rendus à la fois, au lieu de 1 300 cartes et autant de requêtes de détails.
- **Mémoïsation** : `useMemo` évite de refaire la fusion des listes, la mise en minuscules des noms et le filtrage à chaque rendu.
- **Recherche non bloquante** : `useDeferredValue` laisse le champ de recherche réactif pendant que React filtre la liste en arrière-plan (fonction « concurrente » de React 18+).
- **Chargement différé des images** : `loading="lazy"` sur les illustrations des cartes : le navigateur ne télécharge que les images visibles à l'écran.
- **Build de production Vite** : code minifié, fichiers nommés avec un hash pour un cache navigateur long.

## 6. KISS et qualité du code

*KISS : « Keep It Simple, Stupid » — la solution la plus simple qui répond au besoin.*

- **Séparation des responsabilités** : les appels réseau sont dans `services/api.js`, le stockage dans `services/customPokemonStorage.js`, l'état global dans `state/`, l'affichage dans `components/` et `pages/`. Un composant ne sait pas d'où viennent les données.
- **Pas de dépendance inutile** : l'état global utilise ce que React fournit déjà (Context + `useReducer`) plutôt que Redux ; le cache est une simple `Map` + `localStorage`.
- **Formulaire non contrôlé** : la page d'ajout lit les 13 champs avec `FormData` à l'envoi, au lieu de 13 `useState`.
- **Fonctions pures et petites** : le reducer ne fait que calculer le nouvel état, ce qui le rend trivial à tester ; les erreurs sont gérées et affichées à l'utilisateur à chaque étape.
- **Outillage automatique** : oxlint (règles React, dont les règles des hooks) et les tests tournent dans la CI : le style et les erreurs courantes sont vérifiés à chaque push, pas seulement « quand on y pense ».

## 7. Gestion d'état moderne

Technique utilisée : **Context API + `useReducer`** — [src/state/](src/state/)

Les Pokémon personnalisés sont utilisés par trois pages (accueil, ajout, détail). Avant, chaque page relisait le `localStorage` de son côté. Ils sont maintenant dans un **état global unique** :

- [customPokemonContext.js](src/state/customPokemonContext.js) : le contexte, le **reducer** (fonction pure `(état, action) → nouvel état`), l'état initial et le hook `useCustomPokemon()`.
- [CustomPokemonProvider.jsx](src/state/CustomPokemonProvider.jsx) : le fournisseur qui enveloppe l'application ([src/main.jsx](src/main.jsx)). Il lit le `localStorage` **une seule fois** (initialisation paresseuse de `useReducer`) et expose `addPokemon()`, qui sauvegarde puis envoie l'action `added`.

```jsx
const { customPokemon, addPokemon } = useCustomPokemon();
```

Avantages : une seule source de vérité, plus de lecture en double, les mises à jour sont prévisibles (toutes passent par le reducer), et la page de détail **dérive** le Pokémon de l'état pendant le rendu au lieu de le recopier dans un `useState` via un `useEffect`.

Les données de la PokeAPI restent en état local (`useState`) dans les pages qui les affichent : elles ne sont partagées nulle part, les rendre globales n'apporterait que de la complexité (KISS).

## 8. Stratégie de rendu

L'application utilise le **CSR (Client-Side Rendering)** sous forme de **SPA (Single Page Application)** :

1. Le serveur (GitHub Pages) envoie un `index.html` quasiment vide + un bundle JavaScript.
2. React construit toute l'interface **dans le navigateur**, puis récupère les données de la PokeAPI côté client.
3. La navigation entre pages est gérée par **React Router** sans recharger la page : seul le contenu change.

**Pourquoi ce choix ?**

- GitHub Pages ne sert que des fichiers statiques : pas de serveur Node pour faire du SSR.
- Les Pokémon personnalisés vivent dans le `localStorage` du navigateur : un serveur ne pourrait pas les afficher de toute façon.
- Le référencement (SEO) n'est pas un objectif pour ce projet ; l'interactivité (recherche instantanée, navigation fluide) l'est.

**Comparaison avec les autres stratégies :**

| Stratégie | Principe | Adapté ici ? |
|---|---|---|
| **CSR** (utilisée) | Rendu dans le navigateur | Oui : hébergement statique, données locales, forte interactivité |
| SSR | HTML généré par le serveur à chaque requête (Next.js, Remix) | Non : nécessite un serveur, utile surtout pour le SEO |
| SSG | HTML généré au build | Partiellement : possible pour les 1 300 fiches API, pas pour les Pokémon personnalisés |
| ISR / hybride | SSG régénéré périodiquement | Non : les données de la PokeAPI changent très rarement |

Les inconvénients du CSR (premier affichage plus lent, page vide sans JavaScript) sont compensés ici par le cache `localStorage` et la pagination.

## 9. Organisation en Atomic Design

Les composants sont rangés selon les niveaux de l'**Atomic Design** (Brad Frost) : on part de petites briques réutilisables qu'on assemble en éléments de plus en plus grands.

```
src/
├── components/
│   ├── atoms/                 Plus petite brique d'interface, réutilisée partout
│   │   └── TypeBadges.jsx       Badges de type (icône ou nom)
│   ├── molecules/             Groupe d'atomes et d'éléments HTML avec un rôle précis
│   │   ├── Pokecard.jsx         Carte : image + nom + TypeBadges + taille/poids
│   │   └── Pagination.jsx       Navigation entre pages + champ de recherche
│   └── organisms/             Section complète de l'interface, avec ses propres données
│       ├── AbilityCards.jsx     Liste des capacités d'un Pokémon
│       └── MoveCards.jsx        Liste des attaques (utilise TypeBadges)
├── pages/                     Pages : assemblent organismes et molécules avec les vraies données
│   ├── Home.jsx                 Liste paginée + recherche
│   ├── PokeDetails.jsx          Fiche détaillée (API ou personnalisée)
│   └── AddPoke.jsx              Formulaire de création
├── App.jsx                    Template : gabarit commun (en-tête, navigation) + routes
├── state/                     État global (Context + useReducer)
├── services/                  Accès aux données (PokeAPI, localStorage) — hors UI
└── test/                      Tests unitaires et fonctionnels
```

| Niveau Atomic | Dans ce projet | Règle |
|---|---|---|
| Atomes | `TypeBadges` | Ne dépend d'aucun autre composant |
| Molécules | `Pokecard`, `Pagination` | Peuvent utiliser des atomes |
| Organismes | `AbilityCards`, `MoveCards` | Peuvent utiliser atomes et molécules |
| Template | `App.jsx` | Mise en page commune à toutes les pages |
| Pages | `pages/*` | Branchent les données réelles sur les composants |

Les dépendances vont toujours **vers le bas** : une page importe des organismes et des molécules, une molécule importe des atomes, jamais l'inverse. La logique hors interface (`services/`, `state/`) est séparée des composants, ce qui rapproche aussi le projet des couches `shared` / `entities` du **Feature-Sliced Design**.
