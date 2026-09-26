# api-providers — fiche d'instanciation

## Ce qu'il sert ici

`scripts/api-providers.mjs` (2026-09-18) : le registre des fournisseurs d'API sondables par l'outil
de diagnostic. Membre du groupe **Smart Breaker**, aux côtés de `check-gemini-quota.mjs`,
`gemini-key-health.mjs` et `lib/gemini-keys.ts`.

## Pourquoi il existe dans CE projet

Demande explicite de l'utilisateur : « fais en sorte que cet outil puisse s'adapter à une autre clef
API, identique ou totalement différente, c'est à dire fournie par un fournisseur différent, payante,
etc ».

## LA FRONTIÈRE, et elle est non négociable

**Portée strictement diagnostic** (`check-gemini-quota.mjs`), jamais la production : ajouter un
fournisseur ici ne branche RIEN dans le jeu réel.

`lib/lia.ts` et `app/api/lia/route.ts` continuent d'appeler exclusivement l'API Gemini, avec un
prompt et un schéma JSON de sortie qui lui sont propres. Un vrai fournisseur alternatif en
production — réponses différentes, **aucune garantie de respecter l'esprit des personnages
(Article 0)** — resterait un chantier à part entière, soumis à la même validation qualité intégrale
que tout changement de modèle. Jamais une conséquence automatique du fait d'avoir appris à le
sonder ici.

## Où lire le reste

Toutes les règles opérationnelles du Smart Breaker (quota journalier par modèle et par projet, repli
de modèle et de clé, rotation, recul exponentiel, condition stricte avant l'activation d'un modèle
de repli) vivent dans `docs/referentiel/smart-breaker-historique.md`, à lire avant toute
intervention sur ce sujet.

## Sa limite ici

Il dit si une clé répond, jamais si elle répond bien — et sur ce projet, « bien » veut dire
« conforme à l'Article 0 », ce qu'aucun sondage ne peut mesurer.
