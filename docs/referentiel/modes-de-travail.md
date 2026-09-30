# modes-de-travail — fiche d'instanciation

*(Blueprint générique : `docs/modes-de-travail-blueprint.md` · script : `scripts/modes-de-travail.mjs` · registre : `docs/modes-de-travail/index.md`.)*

## Ce qu'il sert ici

`scripts/modes-de-travail.mjs` (2026-09-23) : les trois modes de travail du projet, déclarés une
fois et lus partout.

## Pourquoi il existe dans CE projet

Le projet vivait sur UN booléen, `nightAutonomousMode`, **recopié dans 31 endroits**. Il portait à
lui seul deux questions sans rapport : « l'utilisateur est-il là pour répondre ? » et « une fenêtre
de question a-t-elle le droit de bloquer ? ».

Tant qu'il n'existait que deux situations (piloté, nuit), les confondre ne se voyait pas. Le **mode
semi-autonome**, demandé le 2026-09-23 en ces termes — « c'est comme le mode autonome, sauf que je
suis present et je peux repondre aux questions » — sépare les deux pour de bon : l'utilisateur EST
là, et pourtant rien ne doit bloquer.

## Ce qu'il change pour les autres outils

Un quatrième mode s'ajoute **ici et nulle part ailleurs**. Ce qui gouverne un comportement est une
CLÉ de ce registre, jamais un `if (mode === "…")` recopié (Article 24). Le garde-fou associé
signale un outil qui teste un mode inconnu.

## Qui doit le consulter, et quand

L'Article 32, obligation 4 : « le temps de L'UTILISATEUR compte autant que celui de la machine ». Une
question bloquante posée à trois heures du matin ne bloque pas dix secondes, elle bloque la nuit
entière. **C'est ce registre qui répond à cette question-là** — on le consulte au lieu de le
supposer.

## Sa limite ici

Il déclare les modes ; il ne sait pas dans lequel on se trouve. Cette information ne vit que dans la
conversation, et le déclarer EST la protection (Article 27).

## `fraicheurDuMode()` et `formatFraicheurDuMode()` — un état déclaré une fois n'est pas un état vrai (2026-09-30, tâche #1284)

**LE FAIT, MESURÉ, ET IL DURAIT DEPUIS SEPT JOURS.** `.mode-de-travail.json` portait `autonome`,
déclaré le **2026-09-23 à 22h53** et jamais retouché. Pendant sept jours — donc pendant toutes les
séances de JOUR où l'utilisateur était là et répondait en direct — tout lecteur du mode recevait
« utilisateur absent · une fenêtre ne peut pas bloquer · questions reportées ».

**CE QUE ÇA CONTREDIT EST LA RÈGLE QUE LE MODE SERT.** L'Article 16 dit « mieux vaut trop de
questions que pas assez » ; ce fichier existe pour savoir si une question peut être posée
maintenant. Bloqué sur `autonome`, il répondait NON pendant qu'il attendait devant son écran. Un
mécanisme de protection retourné contre ce qu'il protège est pire qu'un mécanisme absent, parce
qu'il inspire confiance.

**LA CAUSE N'ÉTAIT PAS UN OUBLI, C'ÉTAIT UNE ABSENCE DE PORTEUR.** `modeCourant()` lit `slug` et
ignore `depuis`, pourtant écrit dans le fichier depuis le premier jour. L'avertissement existait
même en toutes lettres dans AGENT-DU-TEMPS — « si le mode n'a pas été changé, il décrit l'intention
d'hier ». Une phrase qui prévient d'un risque sans jamais mesurer s'il s'est réalisé n'est pas un
garde-fou, c'est une clause de style (Article 27).

| Fonction | Ce qu'elle rend |
|---|---|
| `fraicheurDuMode()` | `{ mesurable, slug, depuis, heures, expire, date }` — et `mesurable: false` **avec sa raison** quand le mode n'a pas de date lisible, jamais un âge de zéro (L5/L11) |
| `formatFraicheurDuMode(f)` | la ligne à imprimer **à côté** du mode, jamais à sa place |

**DEUX MODES SEULEMENT EXPIRENT, ET C'EST CE QUI REND LE SIGNAL LISIBLE** (leçon L4) : `piloté`
n'affirme rien de daté — c'est le repli de `modeCourant()` et l'état normal du travail. `autonome`
et `semi-autonome` affirment quelque chose de DATÉ : que l'utilisateur est absent, ou qu'il n'est
pas devant l'écran. **Le seuil, 16 heures, est dérivé de ce qui est affirmé** : la plus longue nuit
plausible. Au-delà, l'affirmation n'est plus seulement invérifiée, elle est invraisemblable.

**CE QU'ELLES NE FONT JAMAIS : changer le mode.** Décider que l'utilisateur est revenu n'est pas une
déduction mécanique. L'outil signale et laisse redéclarer (`node scripts/modes-de-travail.mjs
<mode>`) ; il ne tranche pas à la place de qui que ce soit.

**Lu par** : sa propre ligne de commande, et AGENT-DU-TEMPS, que l'Article 32 désigne comme le
porteur de la question « de combien de temps dispose l'utilisateur ? ».
