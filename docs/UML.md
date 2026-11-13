# Diagrammes UML — Pokédex

Les diagrammes sont écrits en [Mermaid](https://mermaid.js.org/) : GitHub les affiche directement.

1. [Diagramme de classes — architecture](#1-diagramme-de-classes--architecture)
2. [Diagramme de classes — modèle de données](#2-diagramme-de-classes--modèle-de-données)
3. [Diagramme de séquence — ajouter un Pokémon](#3-diagramme-de-séquence--ajouter-un-pokémon)
4. [Diagramme de séquence — afficher le Pokédex](#4-diagramme-de-séquence--afficher-le-pokédex)
5. [Diagramme de cas d'utilisation](#5-diagramme-de-cas-dutilisation)

Les composants React sont représentés comme des classes : les **props** sont des attributs publics (`+`), l'**état local** (`useState`) des attributs privés (`-`), et les fonctions internes des méthodes privées.

---

## 1. Diagramme de classes — architecture

```mermaid
classDiagram
    direction TB

    %% ---------- Point d'entrée et template ----------
    class main {
        <<entry point>>
        StrictMode
        BrowserRouter basename=BASE_URL
    }
    class App {
        <<template>>
        +header / nav
        +Routes
    }

    %% ---------- État global ----------
    class CustomPokemonProvider {
        <<provider>>
        -state : pokemon[], error
        +addPokemon(newPokemon)
    }
    class customPokemonContext {
        <<module>>
        +CustomPokemonContext
        +initCustomPokemonState() State
        +customPokemonReducer(state, action) State
        +useCustomPokemon() ContextValue
    }

    %% ---------- Pages ----------
    class Home {
        <<page>>
        -pokedex : Pokemon[]
        -currentPage : number
        -searchQuery : string
        -isLoading : boolean
        -error : string
    }
    class PokeDetails {
        <<page>>
        +custom : boolean
        -apiResult : id, pokemon, error
        -formatName(name)
        -getCustomError(storageError, savedPokemon)
    }
    class AddPoke {
        <<page>>
        -error : string
        -handleSubmit(event)
    }

    %% ---------- Atomic Design ----------
    class Pagination {
        <<molecule>>
        +currentPage : number
        +totalPages : number
        +searchQuery : string
        +searchResultCount : number
        +onPageChange(page)
        +onSearchChange(query)
        -isSearchOpen : boolean
    }
    class Pokecard {
        <<molecule>>
        +pokemon : PokemonEntry
        -details : object
        -detailsError : boolean
    }
    class TypeBadges {
        <<atom>>
        +types : string[] | TypeSlot[]
        -icons : map
    }
    class AbilityCards {
        <<organism>>
        +abilities : AbilitySlot[]
    }
    class MoveCards {
        <<organism>>
        +moves : MoveSlot[]
    }

    %% ---------- Services ----------
    class api {
        <<service>>
        -detailCache : Map
        +get(endpoint)
        +fetchPokemon()
        +fetchTypeDetails(type)
        +fetchAbilityDetails(ability)
        +fetchMoveDetails(move)
        -fetchData(key, endpoint)
    }
    class customPokemonStorage {
        <<service>>
        +readCustomPokemon() CustomPokemon[]
        +addCustomPokemon(pokemon) CustomPokemon[]
    }

    %% ---------- Externes ----------
    class PokeAPI {
        <<external>>
        https://pokeapi.co/api/v2
    }
    class localStorage {
        <<browser>>
    }

    %% ---------- Relations ----------
    main --> CustomPokemonProvider : wraps
    main --> App : renders
    CustomPokemonProvider ..> customPokemonContext : uses reducer
    CustomPokemonProvider ..> customPokemonStorage : persists

    App *-- Home : route /
    App *-- PokeDetails : routes /poke/id et /custom/id
    App *-- AddPoke : route /add-pokemon

    Home *-- Pagination
    Home *-- "0..50" Pokecard
    Pokecard *-- TypeBadges
    PokeDetails *-- TypeBadges
    PokeDetails *-- AbilityCards
    PokeDetails *-- MoveCards
    MoveCards *-- TypeBadges

    Home ..> customPokemonContext : useCustomPokemon()
    PokeDetails ..> customPokemonContext : useCustomPokemon()
    AddPoke ..> customPokemonContext : useCustomPokemon()

    Home ..> api : fetchPokemon()
    PokeDetails ..> api : get()
    Pokecard ..> api : get()
    TypeBadges ..> api : fetchTypeDetails()
    AbilityCards ..> api : fetchAbilityDetails()
    MoveCards ..> api : fetchMoveDetails()

    api ..> PokeAPI : HTTP (axios)
    api ..> localStorage : cache
    customPokemonStorage ..> localStorage : read / write
```

**Légende :** `*--` composition (le parent rend l'enfant), `-->` association, `..>` dépendance (utilise / appelle).

---

## 2. Diagramme de classes — modèle de données

```mermaid
classDiagram
    direction LR

    class PokemonEntry {
        <<PokeAPI : liste>>
        +name : string
        +url : string
    }
    class PokemonDetails {
        <<PokeAPI : pokemon/:id>>
        +id : number
        +name : string
        +height : number  // décimètres
        +weight : number  // hectogrammes
        +types : TypeSlot[]
        +abilities : AbilitySlot[]
        +moves : MoveSlot[]
        +stats : StatSlot[]
        +sprites : object
    }
    class CustomPokemon {
        <<localStorage>>
        +id : string  // UUID
        +isCustom : true
        +name : string
        +image : string
        +height : number
        +weight : number
        +types : string[]
        +abilities : string[]
        +moves : string[]
        +stats : Stats
    }
    class Stats {
        +hp : number
        +attack : number
        +defense : number
        +special-attack : number
        +special-defense : number
        +speed : number
    }
    class CustomPokemonState {
        <<état global>>
        +pokemon : CustomPokemon[]
        +error : string | null
    }
    class Action {
        <<reducer>>
        +type : 'added'
        +pokemon : CustomPokemon
    }

    PokemonEntry ..> PokemonDetails : url →
    CustomPokemon *-- Stats
    CustomPokemonState o-- "0..*" CustomPokemon
    Action ..> CustomPokemonState : customPokemonReducer()
```

`Home` affiche une liste qui mélange les deux sources : `[...PokemonEntry[], ...CustomPokemon[]]`. `Pokecard` les distingue grâce à `isCustom`.

---

## 3. Diagramme de séquence — ajouter un Pokémon

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant A as AddPoke
    participant P as CustomPokemonProvider
    participant S as customPokemonStorage
    participant LS as localStorage
    participant R as customPokemonReducer
    participant H as Home

    U->>A: remplit le formulaire et clique « Enregistrer »
    A->>A: handleSubmit() lit FormData, construit CustomPokemon
    A->>P: addPokemon(newPokemon)
    P->>S: addCustomPokemon(newPokemon)
    S->>LS: getItem() puis setItem()
    alt stockage indisponible
        LS-->>S: exception
        S-->>A: exception
        A-->>U: message d'erreur (role="alert")
    else succès
        P->>R: dispatch({ type: 'added', pokemon })
        R-->>P: nouvel état
        A->>H: navigate('/')
        H->>P: useCustomPokemon()
        P-->>H: customPokemon (avec le nouveau)
        H-->>U: la carte « Custom » apparaît
    end
```

---

## 4. Diagramme de séquence — afficher le Pokédex

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant H as Home
    participant API as api.js
    participant LS as localStorage
    participant PA as PokeAPI
    participant C as Pokecard (×50)
    participant T as TypeBadges

    U->>H: ouvre /
    H->>API: fetchPokemon()
    API->>LS: getItem('pokedex.Pokemon.v2')
    alt en cache
        LS-->>API: liste
    else pas en cache
        API->>PA: GET pokemon?limit=100000
        PA-->>API: liste
        API->>LS: setItem(liste)
    end
    API-->>H: liste
    H->>H: fusion avec customPokemon, filtre, pagination (50)
    loop pour chaque carte visible
        H->>C: render(pokemon)
        C->>PA: GET pokemon/:id (détails, mis en cache en mémoire)
        PA-->>C: types, taille, poids
        C->>T: render(types)
        T->>API: fetchTypeDetails(type)
        Note over API: Map en mémoire : une seule requête<br/>par type, même pour 50 cartes
        API-->>T: icône du type
    end
    H-->>U: grille de 50 cartes + pagination
```

---

## 5. Diagramme de cas d'utilisation

Mermaid n'a pas de diagramme de cas d'utilisation natif ; il est représenté ici avec un graphe.

```mermaid
flowchart LR
    U((Utilisateur))

    subgraph Pokédex
        UC1([Parcourir le Pokédex page par page])
        UC2([Rechercher un Pokémon par nom])
        UC3([Consulter la fiche d'un Pokémon])
        UC4([Créer un Pokémon personnalisé])
        UC5([Consulter un Pokémon personnalisé])
        UC6([Voir capacités et attaques])
    end

    API[(PokeAPI)]

    U --- UC1
    U --- UC2
    U --- UC3
    U --- UC4
    U --- UC5
    UC3 -. include .-> UC6
    UC1 --- API
    UC2 -. extend .-> UC1
    UC3 --- API
    UC6 --- API
```
