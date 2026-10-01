# FIL 06 — L'export de l'Agence, son noyau, et la question des « plusieurs versions »

**Balle :** À TOI
**Dernier mouvement :** 2026-09-30
**Place dans le plan :** Étage 2 — ça ne se décide qu'une fois l'organisation cible posée (fil 03), et ça commande la commercialisation (fil 07).
**Saisines :** COMMANDE IMPORTANTE · TARGET ARCHITECTURE · réponses 2026-09-29 · réponses 2026-09-30

---

## ① L'HISTOIRE — ce qui s'est déjà dit sur ce sujet, résumé

**Ce que tu as demandé** — savoir si l'Agence peut réellement partir ailleurs, et décider si on
proposera **plusieurs versions** (une légère, une complète) ou une seule.

**La mesure est faite, et elle est dérangeante.** Elle répond à une phrase de ta propre TARGET
ARCHITECTURE : *« un fichier séparé n'est pas automatiquement un module extractible »*. Trois
mesures, trois réponses qui ne se contredisent pas — elles répondent à trois questions
différentes :

| La question posée | La réponse mesurée |
|---|---|
| un fichier « noyau » a-t-il besoin d'un fichier hors noyau ? | **99 % propre** — 73 fichiers sur 74, un seul lien à couper |
| le fichier nomme-t-il des chemins qui n'existent que chez nous ? | **56 % en portent** — 41 fichiers sur 74 |
| ces chemins sont-ils **réglables de l'extérieur** ? | 🔴 **CE CHIFFRE EST RETIRÉ le 2026-10-01 — il n'est pas reproductible** (voir ci-dessous) |

**Donc : selon la question, le même noyau paraît 99 % portable ou 5 % portable.** Ce n'est pas une
contradiction, c'est la différence entre « les pièces tiennent ensemble » et « les pièces savent
vivre ailleurs ».

> ### ⚠️ CORRECTION DU 2026-10-01 — le « 5 % » et le « 38 sur 40 » sont retirés
>
> **Le chiffre venait d'une commande qui n'existe plus** : le document du 29/09 qui le porte ne
> cite aucun script, donc rien ne le rejoue (leçon L2). **Quatre tentatives de le reproduire ont
> donné quatre réponses différentes en vingt minutes.**
>
> **Et le garde-fou de portabilité du projet dit l'inverse** : `findScriptsNonPortables()` rend
> **0 script non portable sur 88**. Chaque cas ouvert à la main était une **déclaration**
> (`export const …`, `path: "…"`), jamais un chemin enfoui — y compris les 599 occurrences de
> `check-house`, qui sont des **faux chemins de test** dans des assertions.
>
> **Ce qui reste vrai** : le vrai couplage existe, mais il est **rare et concentré**, pas général.
> Détail complet et correction : `docs/grand-projet/02-strategie/la-portabilite-vraiment-mesuree.md`.

**Les chiffres par fichier qui suivaient ici** — `le-classificateur` 37, `circle-tasks` 28,
`god-of-all-process` 26, `safe-export` 18 — **sortaient de la même commande disparue et sont
retirés pour la même raison.** Vérifiés à la main, ces trois derniers ne portent que des
déclarations.

**Sur les « plusieurs versions »** : l'analyse de ce qui ralentit le projet (outil JESUS-LE-SAUVEUR,
passage du 29/09 à 23h06) couvre **trois** de tes quatre axes — le codage, l'IA, l'Agence. Elle ne
sait **rien dire du JEU**. C'est écrit en tête de ce document plutôt qu'en note de bas de page.

---

## ② OÙ ÇA SE SITUE — et pourquoi ce sujet existe

**C'est l'étage 2.** Il dépend de l'organisation cible (on ne sait pas quoi exporter avant de
savoir ce qu'est l'Agence), et il commande la commercialisation (on ne vend pas ce qu'on ne sait
pas livrer).

**Le lien avec le fil 05 est direct et nouveau** : cette mesure porte sur les **fichiers d'outils**.
L'axe création/produit fini (fil 05) porte sur les **documents**. Les deux moitiés de la même
question, et une seule était mesurée.

---

## ③ LA CHAÎNE VIVE — numérotée, pour que tu puisses répondre par le numéro

**Q6.1 — À TOI.** Les 38 fichiers à chemins écrits en dur : c'est un chantier réel. On le fait
**maintenant** (avant de vendre quoi que ce soit), **plus tard** (au premier vrai export), ou
**jamais** (on assume que chaque export demandera une adaptation à la main) ?
*(a) maintenant · (b) au premier export · (c) jamais, on assume*

**Q6.2 — À TOI.** Plusieurs versions ou une seule ? L'analyse penche vers **une seule**, parce que
maintenir deux versions double le coût de chaque règle nouvelle — mais c'est ta décision
commerciale, pas ma mesure. *(a) une seule · (b) deux (légère / complète) · (c) montre-moi le coût
chiffré des deux avant que je tranche*

**Q6.3 — PARTIELLEMENT FAIT le 2026-09-30, tâche #1322.** Le JEU a désormais sa sonde, et
JESUS couvre enfin les **quatre** axes que tu avais nommés. Ce qu'elle mesure : **9 821 tokens
envoyés en moyenne par personnage et par tour** sur 310 tours réels, et **deux cerveaux par
tour** — soit **~19 600 tokens par tour de jeu**. C'est le premier poste de lenteur, avant tout
rendu 3D. Ce qu'elle NE mesure pas est nommé un par un dans sa sortie : la latence réelle, les
images par seconde, le poids envoyé au navigateur, et le ressenti d'un visiteur.

**Q6.4 — À MOI, tâche **#1323**.** Rendre les chemins réglables **sans toucher au comportement** — c'est exactement
ta borne (« rien de difficile à annuler »). Je dois prouver ça avant de proposer le chantier.
