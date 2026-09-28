# rapport-gros-prompt — fiche d'instanciation

*(Blueprint générique : `docs/rapport-gros-prompt-blueprint.md` · script : `scripts/rapport-gros-prompt.mjs` · registre : `docs/rapport-gros-prompt/index.md`.)*

## Ce qu'il sert ici

`scripts/rapport-gros-prompt.mjs` (2026-09-24) : produit le rapport d'une saisine (un « gros
prompt »), point par point, chaque point portant son sort.

## Pourquoi il existe dans CE projet

**Son process à lui, et c'est une bonne pratique qu'il a construite seul** : il accumule ses idées,
ses tâches et ses questions pendant qu'on travaille plutôt que d'interrompre par petits messages —
« c'était un de mes défauts à corriger » — et il les envoie d'un bloc avant une période autonome.
Le matin, il doit trouver un rapport de gros prompt.

## LE DÉFAUT PRÉCIS QU'IL A NOMMÉ, et c'est lui qui a motivé l'outil

La première version, faite à la main, marquait certains points « FAIT » **sans leur associer la
moindre tâche**. Sa réaction : « j'ai remarqué que des taches pouvaient etre associés, et ce n'est
pas fait, et tu ne me l'as pas proposé ».

Un point traité sans tâche est invérifiable. D'où la règle mécanique : l'outil **REFUSE** de
produire le rapport plutôt que de le produire incomplet.

C'est la chaîne de l'Article 28 appliquée à une saisine : `point → sort → tâche dans docs/suivi/`.

## Ce qu'il réutilise, jamais ne réinvente

Le gabarit partagé des rapports (`report-template.mjs`), le rendu HTML (`html-report.mjs`), et les
types de tâche proposés par `check-tasks-details.mjs`. Jamais un second gabarit concurrent.

## Sa limite ici

Il garantit qu'aucun point n'est déclaré traité sans trace. Il ne juge pas si le traitement était
le bon — ça reste la lecture de l'utilisateur.

## Sur CE projet : les quatre saisines dont le texte est perdu (2026-09-27, tâche #723)

Les quatre rapports déjà archivés dans `docs/rapports-gros-prompt/` ont été produits **avant** la
règle du texte intégral. Leur source n'existe plus nulle part dans le dépôt : elle n'a jamais été
écrite. Chacun porte donc un champ `texteIntegralPerdu` qui **déclare la perte avec sa raison**
plutôt que de la combler — un texte plausible fabriqué serait une pièce à conviction falsifiée, et
c'est exactement ce que ce projet refuse ailleurs sous le nom de faux vert.

| Saisine | Date du prompt | Points | Citations conservées |
|---|---|---|---|
| `A-minuit.json` | 2026-09-24, vers minuit | 8 | 695 caractères |
| `B-classification.json` | 2026-09-24, vers 22h | 4 | 602 caractères |
| `C-1h.json` | 2026-09-25, vers 1h | 11 | 1 631 caractères |
| `D-nuit-2026-09-26.json` | 2026-09-25, au soir | 31 | 5 409 caractères |

Ces chiffres ne sont pas la longueur de ses messages : ce sont **mes extraits**. C'est toute la
raison d'être de la règle.

**La déclaration de perte n'est acceptée que pour une saisine antérieure au 2026-09-27**, et cette
borne est mécanique, jamais une question de bonne foi : sans elle, « perdu » deviendrait la case à
cocher qui dispense de tout.

## Sur CE projet : ce que le seuil vaut ici (tâche #724)

`node scripts/rapport-gros-prompt.mjs seuil <message.txt>` répond à « ce message mérite-t-il le
process ? » sans rien produire.

- **Seuil de demandes : 4** — DÉRIVÉ du corpus de ce dépôt (8, 4, 11, 31 points). La plus petite
  saisine qui ait réellement mérité le process en portait quatre.
- **Seuil de caractères : 1 500, PROVISOIRE** — il ne peut pas être dérivé tant que trois vraies
  saisines n'ont pas été archivées avec leur texte. À recalibrer à ce moment-là, et pas avant.

**Ce que rien ne peut faire ici** : intercepter un message à son arrivée. La règle de conduite
`seuil-gros-prompt` d'`angel-of-ia-process` le demande donc à l'agent et refuse d'être au vert sans
réponse — la seule protection possible pour une règle qui ne se joue que dans la conversation
(Article 27).
