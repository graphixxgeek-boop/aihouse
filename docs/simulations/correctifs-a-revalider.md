# Correctifs à revalider en simulation

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur, en réponse à une question sur
l'organisation entre EL-PROFESSOR et le suivi des réparations techniques. Ce carnet est **distinct**
d'EL-PROFESSOR (`docs/referentiel/el-professor.md`) : il liste des correctifs de CODE précis, pas
une lecture de la charte en général — EL-PROFESSOR ne le consulte jamais, pour ne pas dériver vers
une liste de cas particuliers qui grandit indéfiniment (Article 17, corollaire, de `CLAUDE.md`).
Tenu par l'agent qui pilote le projet, consulté à l'étape 6 de l'Article 18 ("comparer avec la
dernière version pour mesurer l'évolution réelle et la réussite des derniers travaux engagés").)*

## Fonctionnement

- Une ligne par correctif technique récent dont l'effet doit être observable dans le TEXTE d'une
  simulation (jamais un correctif purement interne au code, invisible en jeu — celui-là n'a rien à
  faire ici, `tsc`/`check-house.mjs` suffisent à le couvrir).
- Chaque ligne précise : le bug d'origine, ce qui a été changé, et surtout **ce qu'il faut chercher
  dans le texte** pour confirmer que ça tient.
- Un correctif est retiré du carnet après **2 simulations complètes et propres consécutives** où le
  symptôme d'origine ne réapparaît pas (seuil calibré explicitement avec l'utilisateur le
  2026-09-19). Une seule simulation propre ne suffit jamais à conclure — ça peut être une
  coïncidence.
- Si le symptôme réapparaît, le compteur repart à zéro et le correctif retourne en tête de liste
  avec une note sur ce qui a été observé.

## Carnet actif

| Correctif | Ce qui a changé | À observer dans le texte | Simulations propres constatées depuis |
|---|---|---|---|
| Répétition d'un même mot sur toute une session (ex. « autant ») | `life.wordFrequency` persiste désormais sur toute la session (`lib/dialogue.ts`), plus seulement sur les deux derniers tours | Aucun mot (hors mots grammaticaux courants) ne doit revenir de façon insistante sur l'ensemble d'une session, pas seulement d'un tour à l'autre | à vérifier via la notation rétroactive de full_sim11/14/15 |
| Plafond d'enquête qui pouvait laisser un débrief traîner | Débrief ramené de 2 tentatives à 1, récap sautée si déjà en retard | Le débrief de fin d'enquête doit intervenir une seule fois au bon moment, jamais répété ni oublié quand le round est déjà dépassé | à vérifier via la notation rétroactive de full_sim11/14/15 |
| Personnalité plate la nuit (pas d'effet de fatigue perceptible) | Modificateur jour/nuit sur la fatigue + impact de personnalité (Lia plus coupante/froide, Noé plus flou/dispersé) | Un net changement de registre entre une scène de jour et une scène de nuit profonde, cohérent avec Lia/Noé respectivement | à vérifier via la notation rétroactive de full_sim11/14/15 |
| Bonus spontanés (mute/caméra) mal reliés à la roulette | Redesign complet : bonus tirés par la roulette, jamais un déclenchement spontané séparé | Chaque occurrence de mute/caméra cachée dans le texte doit correspondre à un tirage de roulette explicite, jamais surgir sans annonce | à vérifier via la notation rétroactive de full_sim11/14/15 |

## Historique des retraits (correctifs confirmés stables, sortis du carnet actif)

*(Vide pour l'instant — ce carnet vient d'être créé le 2026-09-19 ; les entrées ci-dessus seront
véritablement comptées à partir de la première lecture EL-PROFESSOR qui les évalue.)*
