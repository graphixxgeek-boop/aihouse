# AUDIT EXÉCUTIF — ORGANISATION ET AGENCE
## Maison IA vivante — 28 septembre 2026

## 1. Verdict architectural

**L'Agence n'est pas une architecture finale propre. Elle n'est pas non plus un simple assemblage chaotique.**

Le diagnostic le plus précis est :

> **plateforme R&D très riche, dotée d'une vraie pensée architecturale locale et d'une forte culture de contrôle, mais dont la géométrie globale reste historiquement accumulative.**

Le travail à faire est une réarchitecture, pas une reconstruction depuis zéro.

## 2. Curseurs

| Axe | Actuel | Cible | Lecture |
|---|---:|---:|---|
| Richesse fonctionnelle | 90/100 | 90 | très forte |
| Intelligence accumulée | 88 | 90 | très forte |
| Documentation | 87 | 95 | forte |
| Gouvernance | 82 | 92 | forte |
| Auto-observation | 88 | 95 | très forte |
| Architecture globale | 52 | 90 | chantier majeur |
| Séparation responsabilités | 55 | 92 | chantier majeur |
| Contrats | 48 | 90 | insuffisamment explicites |
| Modularité | 45 | 90 | historique encore dominant |
| Runtime Agence | 43 | 90 | à construire explicitement |
| Indépendance modèle | 38 | 90 | adapter à créer |
| Repository / persistence | 40 | 90 | frontière à créer |
| QA industrialisée | 60 | 92 | déjà solide, à normaliser |
| Exportabilité | 38 | 90 | potentiel élevé, infrastructure incomplète |
| Productisation | 30 | 85 | encore exploratoire |
| Commercialisation | 25–30 | 80 | à traiter comme chantier séparé |

## 3. Ce qui est excellent

- richesse des garde-fous ;
- culture de vérification ;
- accumulation de connaissances opérationnelles ;
- présence de mécanismes de mesure et d'export ;
- capacité à observer le comportement de l'Agence elle-même ;
- plusieurs frontières naturelles déjà identifiables.

## 4. Ce qui doit être entièrement revu

### Architecture globale
Les scripts expriment plusieurs couches différentes sous une même forme historique.

### Sémantique des composants
Le mot « agent » recouvre des rôles qui devraient être distincts : service, outil, policy, registry, orchestrator, check, renderer, adapter.

### Contracts
Une grande partie des contrats existe implicitement dans le code, les conventions et les registres plutôt que comme interfaces explicites.

### Model / persistence
Gemini et D1 sont trop proches du chemin d'exécution principal.

### Agency runtime
Le comportement d'agence existe surtout comme réseau émergent de scripts ; il faut le transformer en runtime explicite.

### Productisation
La valeur technique est largement supérieure à la lisibilité commerciale actuelle.

## 5. Le risque principal

Le plus grand danger n'est pas de manquer de fonctionnalités.

C'est de continuer à ajouter des fonctionnalités **avant que les nouvelles fonctionnalités aient une place architecturale explicite**.

## 6. La transformation correcte

```text
                    AUJOURD'HUI
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
    PRODUIT           AGENCE           KNOWLEDGE
       │                 │                 │
       └───────────┬─────┴───────┬─────────┘
                   ↓
             RATIONALISATION
                   ↓
             CAPABILITY MAP
                   ↓
          RESPONSIBILITY MAP
                   ↓
             CONTRACTS
                   ↓
          BOUNDARIES / PORTS
                   ↓
            MODULARISATION
                   ↓
              EXTRACTION
                   ↓
             EXPORTABILITY
                   ↓
             PRODUCTISATION
```

## 7. Règle de conservation

Aucune réorganisation ne doit perdre :

- comportement utile ;
- invariants ;
- raisons historiques encore valides ;
- tests ;
- connaissances métier ;
- protections ;
- mesures ;
- règles de gouvernance ;
- mécanismes d'export.

On change la géométrie, pas l'intelligence.

## 8. Critères de fin de rationalisation

La phase sera considérée comme réussie lorsque :

1. un nouvel agent comprend les grandes branches sans l'historique ;
2. chaque capacité a une autorité unique ;
3. un tool peut être retiré sans archéologie ;
4. un modèle peut être remplacé sans réécrire le domaine ;
5. la persistance peut être remplacée sans réécrire les règles métier ;
6. les tests portent sur des contrats ;
7. la gouvernance ne devient pas une nouvelle jungle ;
8. l'export fonctionne en environnement vierge ;
9. le produit peut être expliqué en quelques minutes ;
10. une équipe externe peut utiliser le runtime sans connaître Maison IA.

## 9. Décision directrice

**Ne pas recommencer le projet. Ne pas simplement découper les fichiers. Réarchitecturer la forme globale, puis extraire progressivement les bonnes frontières.**

Formule directrice :

> **CONSERVER L'INTELLIGENCE — CHANGER LA GÉOMÉTRIE.**
