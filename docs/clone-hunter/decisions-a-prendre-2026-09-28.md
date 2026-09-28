# CLONE-HUNTER — les 11 constats qui restent, et pourquoi ils t'attendent

*(Écrit le 2026-09-28 pendant la nuit autonome, tâche #997. Ton arbitrage était « Tout, jusqu'à
zéro ». On est passé de **22 à 11**, par quinze factorisations réellement prouvées équivalentes.
Ce document explique pourquoi les onze dernières ne se traitent pas de la même façon — et pourquoi
c'est **le mécanisme lui-même** qui te les renvoie.)*

---

## Pourquoi je ne peux pas descendre plus bas toute seule, et c'est voulu

CLONE-HUNTER n'accepte d'écarter un constat **que** sur un accord daté de toi **plus** une raison
écrite. Un « écarté sciemment » sans ton accord revient au passage suivant, et son rappel **grossit**
jusqu'à la question obligatoire.

**Je ne peux donc pas me faire taire moi-même.** C'est ce qui rend le chiffre de 11 honnête : il n'y
a pas un seul constat que j'aurais rangé sous le tapis. Mais ça veut dire aussi que les constats
qu'il ne faut **pas** corriger ont besoin d'un mot de toi pour cesser de revenir.

---

## Les trois familles, et une seule appelle une décision difficile

### Famille A — LA SIGNATURE PARTAGÉE (6 constats)

| Où | Ce qui est « dupliqué » |
|---|---|
| `check-suivi-fidelity.mjs` ×2 | `(sessionsDir = SESSIONS_DIR, readDir = readdirSync, readFile = …, exists = existsSync)` |
| `doc-report.mjs` | `({ root = ROOT, listDirImpl = readdirSync, readFileImpl = lireFichierPartage } = {})` |
| `safe-export.mjs` ×3 sites | `(fichiers = [], { readFileImpl = lireFichierPartage, root = ROOT } = {})` |
| `ezechiel-les-tests.mjs` | `({ root = ROOT, lire = null } = {})` |

**Ce n'est pas de la logique dupliquée : c'est un CONTRAT D'INTERFACE tenu uniformément.** Treize
fonctions de `check-suivi-fidelity` prennent exactement les mêmes quatre paramètres injectables, et
c'est précisément ce qui permet de les éprouver toutes de la même façon, sur un faux disque, sans
toucher au dépôt.

**Les fusionner coûterait plus que ça ne rapporte** : il faudrait passer tout le monde à un objet
d'options, donc réécrire chaque appelant, pour supprimer une répétition qui est en réalité une
*convention respectée*. Le détecteur compte des lignes identiques ; il ne sait pas distinguer une
convention d'un copier-coller.

**Ce que je te propose** : ton accord pour les écarter, avec cette raison. Elles reviendront
automatiquement si la signature change, ce qui est exactement ce qu'on veut.

### Famille B — LE FRAGMENT DE CONFIGURATION (4 constats)

| Où | Ce qui est dupliqué |
|---|---|
| `check-profil-utilisateur.mjs` ↔ `le-regisseur.mjs` | `libelle: (e) => e.quoi,` |
| `integration-outil.mjs` (2 sites) | `{ toolSlug: …, libelle: (e) => e.quoi, tache: (e) => e.quoiFaire }` |
| `check-tasks-details.mjs` (2 sites) | `title: report.title,` |
| `le-coordinateur.mjs` (2 sites) | `const dejaNommees = new Set();` |

Ce sont des **fragments d'appel au gabarit partagé** — deux endroits qui configurent le même outil
commun de la même manière. Les factoriser voudrait dire créer une constante pour trois mots, ce qui
rend le code *moins* lisible : on gagnerait une ligne et on perdrait de voir, sur place, ce qui est
passé.

**Deux d'entre eux méritent quand même un regard** (`integration-outil` et `le-coordinateur`, deux
sites dans un même fichier) : si les deux blocs devaient toujours rester identiques, une constante
locale les tiendrait ensemble. À toi de dire si ça vaut le geste.

### Famille C — LE VRAI RESTANT (1 constat)

`summarize-simulation-log.mjs:100` et `:141` — `pousserLesDeplacements(events, round, d, prevRoom)`
appelé dans deux branches voisines. **Celui-là est probablement une vraie factorisation à faire**,
et je ne l'ai pas touché parce qu'il est dans le seul outil de la liste qui lit un journal de
simulation : toucher à sa logique de déplacements sans une simulation sous la main, c'est
exactement le genre de correction que la nuit ne doit pas faire.

---

## Ce que la nuit a réellement corrigé, pour comparaison

Quinze factorisations, et **aucune** n'était un copier-coller paresseux — c'étaient toutes des
gestes si petits que personne ne les relisait :

- une **raison écrite en six exemplaires** (le commentaire de `recordCliUsage`) ;
- le **même KPI dans quatre outils**, dont deux réimplémentaient une lecture de table déjà partagée ;
- deux **blocs de test identiques à un statut près** (429 / 503), fusionnés sans perdre une seule
  assertion ;
- le **contexte de classement d'iceberg monté quatre fois** dans un même fichier — dont deux
  contenaient des *décisions* de classement, donc deux vérités possibles sur le même dépôt ;
- le **parcours des lignes de suivi écrit trois fois**, avec le critère de « qu'est-ce qu'une ligne
  de tâche » en triple alors que le format a bougé deux fois cette semaine ;
- la **forme du rapport HTML des deux agents séparés**, dont le pied qui dit « conseiller
  uniquement, jamais un exécutant » — une limite d'autorité en double peut s'adoucir d'un côté sans
  que l'autre bouge, et aucun test ne l'attraperait.

**Et un piège de test désamorcé en chemin** : le filet exigeait « au moins 15 duplications », un
plancher écrit à la main. Descendre sous 15 — c'est-à-dire réussir — faisait échouer le filet.
L'assertion porte désormais sur son intention et ne peut plus vieillir contre le dépôt.

---

## Plan d'action

- **À TRANCHER** · Famille A (6 constats) — accord pour les écarter comme convention d'interface,
  avec la raison ci-dessus. Sans ton accord, ils reviennent à chaque passage, de plus en plus fort.
- **À TRANCHER** · Famille B (4 constats) — même question ; et dire si les deux paires
  intra-fichier (`integration-outil`, `le-coordinateur`) méritent une constante locale.
- **RETENU** · Famille C (1 constat) — `summarize-simulation-log`, à factoriser avec une simulation
  sous la main. Reste dans la tâche #997, qui demeure ouverte pour ça.
