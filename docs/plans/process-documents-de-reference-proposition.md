# Modifier un document de référence : le process qui manque (proposition)

*(2026-09-25, tâche #846 — instruction du constat TaskList #223. **Ce document PROPOSE, il n'acte
rien** : un process porte un nom, et les noms se choisissent ici par l'utilisateur.)*

## Le constat, rendu par l'outil et non par moi

`node scripts/god-of-all-process.mjs` déclare dix process et signale **deux activités à enjeu qui
n'en ont aucun**. La seconde est celle-ci, dans ses mots :

> **Modifier CLAUDE.md ou un document de référence** — « une règle affaiblie par erreur ne se voit
> pas : elle s'applique en silence pendant des semaines, et c'est le garde-fou non négociable de
> l'Article 13 ».

## Ce qui existe déjà, et c'est beaucoup

La vraie surprise de l'instruction : **presque toutes les étapes sont déjà écrites et déjà portées
par un mécanisme**. Ce qui manque n'est pas le contenu, c'est le fait qu'elles ne soient nulle part
rassemblées en une suite qu'on puisse suivre et dont on puisse voir les trous.

| Étape | Déjà exigée par | Porteur mécanique |
|---|---|---|
| 1. Reprendre les notes sur le sujet avant d'ouvrir | Article 30 | `data-archangel notes` + `angel-of-ia-process` (demandé, pas deviné) |
| 2. Comprendre la raison d'être de ce qu'on va toucher | Article 19 | `findRaisonsPerdues()` (safe-export) — alerte quand une raison DISPARAÎT |
| 3. Lire l'heure plutôt que la taper | Article 32 | `agent-du-temps` + `findHorodatagesFuturs()` |
| 4. Écrire la modification | Articles 6 et 13 | — |
| 5. Vérifier qu'aucun Article n'a disparu, glissé ou été vidé | préambule + Article 13 | **`protegerLaCharte()`** (post-commit sur CLAUDE.md) |
| 6. Vérifier qu'aucun chemin cité n'est devenu inatteignable | Article 13 | `cheminsPerdus()` (abraham-les-references) |
| 7. Pour un Article NEUF : est-il rédigé aussi sobrement que les autres ? | sa demande du 2026-09-21 | `protegerLaCharte()` depuis aujourd'hui (tâche #828) |
| 8. Inscrire la raison du changement dans la mémoire des opérations | Article 27 | `protegerLaCharte()` (alerte si la mémoire est vide) |
| 9. Répercuter dans les autres documents concernés | Article 13 | — **rien ne le vérifie** |
| 10. Ligne de suivi dans le même commit | systeme-de-suivi.md | `check-suivi-fidelity` |

## Les deux seuls vrais trous

**A. L'étape 9 n'a aucun porteur.** La charte exige qu'un changement de comportement se répercute
« le jour même » dans les documents concernés — `CLAUDE.md`, `docs/referentiel/principes.md`,
`parametres.md`, `lib/reference.ts`. Rien ne vérifie que ça a été fait. C'est précisément le genre
d'obligation qui n'existe plus à la session suivante (Article 27).

**B. La suite n'existe nulle part comme suite.** Chacune des dix étapes vit dans son coin. Un agent
qui modifie un document de référence doit les retrouver de mémoire — ce que l'Article 30 dit
justement de ne jamais faire.

## Ce que je te demande

**1. Le nom du process.** Les dix autres portent des noms courts (`ronde`, `simulation`, `nuit`,
`meta`, `xp-ia`). Trois pistes, et tu en choisis une ou tu en donnes une autre :
`documents-de-reference` · `livraison-charte` (le nom que l'outil lui donne déjà en interne) ·
`la-regle-qui-change`.

**2. L'étape 9 : la construire, ou déclarer qu'elle reste humaine ?** La construire veut dire un
contrôle qui, quand `CLAUDE.md` change, demande si `principes.md`/`parametres.md`/`lib/reference.ts`
devaient bouger aussi. Il ne pourra jamais savoir s'ils le devaient — seulement poser la question.
C'est le même compromis que pour les six règles qu'`angel-of-ia-process` DEMANDE au lieu de deviner.

## Plan d'action (Article 28)

- **RETENU** — l'inventaire ci-dessus, qui montre que huit étapes sur dix sont déjà portées → tâche
  **#846**, faite.
- **À TRANCHER** — le nom du process et le sort de l'étape 9 → tâche **#846**, en attente.
- **ÉCARTÉ** — écrire le process et le nommer moi-même : les noms se choisissent ici par
  l'utilisateur, et un process acté sans lui serait un onzième process que personne n'a voulu.
