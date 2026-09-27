# LE-COORDINATEUR — fiche d'instanciation

## Ce qu'il sert ici

`scripts/le-coordinateur.mjs` (2026-09-19), nommé par l'utilisateur et calibré par lui via
l'Article 16 :

> « est-ce qu'il est possible de le créer à moindre coût, simplement comme un coordinateur de
> fonctions existantes ? juste là pour fiabiliser et fluidifier l'existant »

## Ce qu'il lance ici

Les vérifications gratuites du dépôt, en un passage — 13 lignes dans le tableau de sortie. Il porte
aussi le **catalogue PRESTATIONS**, que tool-brain interroge pour recommander un outil.

## Une décision d'organisation prise le 2026-09-26

Il **a rendu le rang d'Agent Cadre** ce jour-là, faute de pouvoir convoquer les autres : ce rang se
définit par un pouvoir précis (convoquer et rendre un verdict), et il ne l'a pas. Il est Membre
classique.

## Le défaut réel qu'il a coûté ici

Son intégration n'avait **aucun test** jusqu'à ce qu'un lancement manuel révèle une `ReferenceError`
dans une de ses lignes — jamais vue, parce que ce point d'intégration n'était couvert par rien.
Corrigé, puis couvert par un test de bout en bout.

## Le trou trouvé le 2026-09-26, et il vient de son catalogue

Quatre outils bien réels n'avaient **jamais eu d'entrée** dans PRESTATIONS — dont lui-même. Un outil
absent du catalogue est invisible à tool-brain, donc jamais recommandé. Trouvé par un chemin
inattendu : la classification des rapports, qui dérive le sujet d'un rapport de la `demande` du
catalogue, sortait six dossiers en « sujet non déterminé ».

## Sa limite ici

Il agrège, il ne conclut jamais. Et son catalogue est tenu à la main : un outil qui n'y entre pas
n'existe pas pour tool-brain, et rien ne l'annonce à sa naissance sauf le garde-fou d'intégration.

## Le trou trouvé le 2026-09-27 : son garde-fou comparait deux listes écrites à la main

*(Tâche #714. Sa question d'origine : « est-ce que le catalogue du coordinateur se met à jour en
auto ? ».)*

**Ce qui existait.** `findToolsMissingFromMenu()` confronte la **table maîtresse**
(`docs/regles-de-travail.md` §7ter, un tableau Markdown tenu à la main) au catalogue `PRESTATIONS`
(une liste tenue à la main dans `scripts/le-coordinateur.mjs`). Deux listes manuelles vérifiées
l'une contre l'autre.

**Pourquoi ça ne suffit pas, et le chiffre le dit mieux qu'un argument.** Le jour de la correction,
ce garde-fou rendait **« aucun outil muet »** — et la table sur laquelle il se fonde ne connaissait
que **63 des 90 scripts réels**. Son vert ne disait pas « tout le monde a une offre », il disait
« je n'ai pas regardé les autres ». Deux listes manuelles peuvent s'accorder parfaitement tout en
ignorant la même chose (leçon L11 : un zéro mesure un silence, jamais une absence de problème).

**Ce qui a été ajouté.** `findOutilsMuets()` part du **dépôt réel** : le recensement du
classificateur, jamais une liste. Mesure du premier passage — **onze outils parfaitement lançables
n'avaient aucune offre** (`check-level-target`, `check-suivi-fidelity`, `circle-process-guardian`,
`criticite`, `le-regisseur`, `modes-de-travail`, `route-booster`, `run-simulation`,
`summarize-simulation-log`, `the-ghost`, `tool-usage`). Un outil absent du catalogue est invisible à
tool-brain, donc jamais recommandé, donc jamais lancé — et son zéro d'usage se lit ensuite comme un
verdict sur lui. Les onze entrées ont été écrites le jour même : **58 → 69 offres, 11 muets → 0**.

**Les deux fonctions restent, parce qu'elles ne posent pas la même question** : l'ancienne demande
« la table et le catalogue se contredisent-ils ? », la nouvelle « qui, dans le dépôt, n'a pas
d'offre ? ».

**Deux dérivations, jamais deux listes** (Article 24) :
- **Qui doit une offre** = tout fichier dont le classificateur a dérivé une porte « ligne de
  commande », son type n'étant pas `crochet` (un crochet est lancé par git, jamais commandé — il lui
  arrive d'avoir cette porte parce qu'un document explique comment le lancer à la main pour le
  déboguer). Une bibliothèque partagée, un script d'installation ne sont jamais accusés, sans qu'un
  seul de leurs noms soit écrit quelque part.
- **Le rapprochement** passe par l'inventaire de CLAUDE.md (script → fiche → nom d'outil), jamais
  par le nom du fichier : le catalogue cite ARGUS, le script s'appelle `check-argus.mjs`, et une
  comparaison sur le nom de fichier accuserait un outil parfaitement catalogué. C'est l'erreur
  « SANS FICHE, 22 fois », déjà payée par le classificateur.

**Il refuse de conclure sans recensement** : « personne n'est muet » et « je n'ai regardé
personne » s'écrivent tous les deux zéro.

Sortie : à chaque passage de `node scripts/le-coordinateur.mjs`, sous le rapport d'offres
concurrentes — même rapport, deux questions voisines, aucune ne remplaçant l'autre.
