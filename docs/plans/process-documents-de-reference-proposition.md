# Modifier un document de référence : le process qui manque (proposition)

> **Les règles de travail s'appliquent AUSSI ici.** Ce document décrit des ÉTAPES — quoi faire et
> dans quel ordre. Il ne remplace jamais `docs/regles-de-travail.md`, qui décrit la CONDUITE : la
> façon de poser une question, de livrer, de commiter, de rendre compte, et elle vaut pendant ce
> process comme en dehors. *(Renvoi ajouté le 2026-09-28, tâche #1059 — sa demande : « Assure-toi
> que le fichier regles de travail et process sont bien linkés. » Le croisement d'Abraham avait
> mesuré que sept documents de process, dont celui-ci, ne la citaient jamais. La différence exacte
> entre un process et une règle de travail est définie dans
> `docs/referentiel/organisation-agence.md`.)*


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
`parametres.md`, `lib/reference.ts`. Rien ne vérifie que ça a été fait. *(Note du 2026-09-27 :
`lib/reference.ts` a quitté le dépôt ce jour-là — le référentiel affiché en jeu a été retiré du
produit. Ce document garde la formulation d'origine parce qu'il date une proposition ; la liste
réelle à répercuter ne compte plus que trois documents.)* C'est précisément le genre
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

---

# LE PROCESS EST ACTÉ (2026-09-27, tâche #846)

*(Cette section transforme la proposition ci-dessus en process déclaré. Les deux décisions qui
bloquaient ont été prises par l'utilisateur en fenêtre dédiée le 2026-09-27.)*

**SES DEUX DÉCISIONS :**

1. **Le nom : `documents-de-reference`** — retenu parmi les trois pistes présentées, contre
   `livraison-charte` et `la-regle-qui-change`. Inscrit au registre des baptêmes
   (`docs/agent-des-noms/registre.md`) avec les deux pistes écartées et la raison du choix : c'est
   le plus descriptif, et il dit sur quoi porte le process sans contexte — là où `livraison-charte`
   dirait « charte » alors que le process couvre aussi `principes.md` et `parametres.md`.
2. **L'étape 9 : la construire, et elle DEMANDE.** Même compromis que les six règles
   qu'`angel-of-ia-process` demande au lieu de deviner. Le mécanisme ne saura jamais si les autres
   documents *devaient* bouger ; il sait dire qu'une obligation a changé d'un seul côté, et poser
   la question.

**LE GARDIEN DU PROCESS : `scripts/moise-tables-de-loi.mjs`** — l'agent dédié à la charte, jamais
un douzième script. Il porte déjà `protegerLaCharte()` (étape 4) et `cheminsPerdus()` (étape 5) ;
`detteDeRepercussion()` (étape 9) le rejoint naturellement, puisque c'est la même question posée
sur la même matière : une règle a-t-elle bougé, et l'a-t-elle fait proprement ?

## Les dix étapes, et les fichiers sur lesquels elles s'appuient

| # | Étape | Porteur | Fichier |
|---|---|---|---|
| 1 | reprise des notes | Article 30 · `data-archangel notes` | — |
| 2 | comprendre la raison d'être | Article 19 · `findRaisonsPerdues()` | — |
| 3 | heure lue, jamais tapée | Article 32 · `agent-du-temps` | — |
| 4 | aucun Article disparu, glissé ni vidé | `protegerLaCharte()` | `CLAUDE.md` |
| 5 | aucun chemin devenu inatteignable | `cheminsPerdus()` | — |
| 6 | sobriété d'un Article neuf | compte d'obligations | — |
| 7 | mémoire des opérations | registre de la charte | `docs/referentiel/charte-operations.md` |
| 8 | ligne de suivi dans le même commit | `check-suivi-fidelity` | `docs/suivi/sessions/` |
| 9 | **répercussion le jour même** | **`detteDeRepercussion()`** (MOÏSE) | `docs/referentiel/principes.md` |
| 10 | filet de sécurité avant de clore | `check-house.mjs` | — |

## Ce que l'étape 9 mesure, et le premier essai qui était faux

**LA BONNE MESURE EST LE NOMBRE D'OBLIGATIONS**, jamais le nombre d'unités de règle. J'ai d'abord
compté ces dernières : elles valent **33** et n'ont pas bougé d'un iota sur 80 commits, y compris
pendant les passes d'allègement qui ont réécrit des Articles entiers. Normal — elles comptent les
**Articles**. Un détecteur bâti dessus n'aurait mordu qu'à la création ou à la suppression d'un
Article, c'est-à-dire presque jamais : un motif qui ne PEUT pas matcher ressemble trait pour trait à
un motif qui ne matche pas (leçon L11). Trouvé en mesurant, jamais en relisant.

**TROIS CAS, ET LES DISTINGUER EST TOUT LE TRAVAIL :**

- une charte retouchée **sans qu'aucune obligation bouge** → rien à répercuter, et crier là ferait
  hurler le contrôle sur du travail d'entretien, donc le ferait taire pour de bon (L4) ;
- une obligation qui bouge **avec** un document du référentiel touché → répercussion faite ;
- une obligation qui bouge **sans** → dette, et le crochet post-commit pose la question.

**MESURE SUR 80 COMMITS RÉELS** : 1 changement d'obligation, correctement répercuté, **zéro dette**.

## Les quatre maillons sans objet, et leur raison est une seule

Ce process **APPLIQUE** une décision, il n'en produit pas. Les constats qui motivent un changement
de règle viennent d'ailleurs — d'une Ronde, d'un rapport d'outil, d'une demande — et c'est là qu'ils
sont triés, retenus ou écartés. Celui-ci commence APRÈS, quand il est déjà acquis qu'une règle doit
bouger, et sa seule mission est que ça se fasse sans rien casser ni rien perdre.

`rapports` · `analyse` · `plan-action` · `questions` sont donc déclarés sans objet, chacun avec sa
raison écrite dans `scripts/god-of-all-process.mjs` — jamais laissés vides en espérant que ça passe.

**L'ESTIMATION AUSSI est déclarée sans objet**, et pour une raison de fond : la durée ne dépend pas
du process mais de la règle touchée. Corriger un chemin prend une minute, réécrire un Article une
heure, et les deux suivent les mêmes dix étapes. Annoncer une durée ici serait annoncer un chiffre
qui ne mesure rien — et un chiffre qui ne mesure rien finit par servir de référence.

## Ce que ce process existe pour empêcher

**Qu'une règle soit affaiblie par erreur sans que personne le voie.** C'est la formulation exacte du
constat qui a ouvert la tâche : « une règle affaiblie par erreur ne se voit pas, elle s'applique en
silence pendant des semaines ». Un Article vidé de ses obligations, un chemin devenu inatteignable,
une obligation ajoutée d'un côté et jamais répercutée de l'autre : aucun de ces trois accidents ne
produit d'erreur visible. Le document reste lisible, le code continue de tourner, et la règle ne
gouverne plus rien.

## Son déclencheur

**Avant de toucher une règle** — de `CLAUDE.md`, de `docs/referentiel/principes.md`, de
`docs/referentiel/parametres.md`, ou de tout autre document du référentiel. Jamais après coup : les
étapes 1 à 3 (reprise des notes, raison d'être, heure lue) ne servent à rien une fois le changement
écrit.

## Son contrôleur, nommé

**`scripts/moise-tables-de-loi.mjs`** — l'agent dédié à la charte. Il SIGNALE, il ne bloque jamais :
l'étape 9 pose une question au commit, elle n'empêche aucun changement de partir.

## Ce qu'il ne fait pas

**Il ne juge JAMAIS si la règle est bonne.** Il vérifie qu'elle est changée proprement — pas qu'elle
méritait de l'être. Cette décision-là appartient à l'utilisateur, et un process qui prétendrait la
prendre serait exactement la dérive que l'Article 14 interdit.

**Il ne sait pas si les autres documents DEVAIENT bouger.** L'étape 9 constate qu'une obligation a
changé d'un seul côté et pose la question ; elle ne saura jamais y répondre. C'est une limite
assumée, pas un manque à combler : y répondre demanderait de comprendre la règle, ce qu'aucune
mécanique ne fait.

**Il ne remplace aucun des huit autres porteurs.** Ils existaient tous avant lui, chacun dans son
coin. Ce qu'il apporte n'est pas un contrôle de plus — c'est la SUITE, celle dont on peut enfin voir
les trous.
