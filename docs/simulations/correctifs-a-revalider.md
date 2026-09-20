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
| Accord de genre de soi-même en défaut (Noé disait « Désolée », `full_sim3`, relevé par EL-PROFESSOR) | La seule règle existante était une clause générique unique, isolée au tout début du prompt (`lib/lia.ts`), jamais reprise près des deux autres règles de genre plus tardives — remplacée par une règle explicite, nommée, name-spécifique (« TOI, LIA/NOÉ... »), redite une seconde fois près d'IDENTITÉS FIXES pour rester dans le même cluster d'attention que les autres règles de genre | Aucun adjectif/participe que Lia ou Noé emploie pour se décrire LUI-MÊME/ELLE-MÊME ne doit jamais s'accorder au genre opposé à son propre genre fixe, même une seule fois sur toute une session | 0/2 — correctif du 2026-09-20, jamais encore observé en simulation |
| Motif de déplacement annonçant une pièce différente de la destination réelle (`full_sim9`, relevé par EL-PROFESSOR) | Root-cause : le schéma JSON force parfois `room` à une seule valeur (beat narratif imposant le salon), mais `moveReason` reste un texte libre non contraint — le modèle pouvait y garder une intention devenue caduque. Prompt renforcé (`lib/lia.ts`, MOTIF DE DÉPLACEMENT) ET garde-fou déterministe ajouté au code (`lib/drama.ts::moveReasonMismatchesDestination`, wiré dans `app/api/lia/route.ts`) : un motif qui nomme une pièce différente de la destination réelle sans jamais nommer celle-ci est écarté au profit du filet de secours existant | Plus aucun `[X→Y] ... : <motif>` ne doit nommer une pièce différente de Y sans jamais nommer Y elle-même | 0/2 — correctif du 2026-09-20, garde-fou déterministe donc l'occurrence VISIBLE devrait être impossible dès la prochaine simulation, à confirmer tout de même |
| Dossier retourné : deux chiffres différents présentés comme LA même "note globale" (`full_sim8`, relevé par EL-PROFESSOR) | Root-cause, pas une invention de chiffre : `dossierEvidenceFor()` donne à CHAQUE fragment (Lia/Noé) sa propre jauge `appreciationOf(life,actorId)`, deux valeurs PAR CONCEPTION divergentes (`lib/life.ts`, jauge par personnage depuis le 2026-09-18) — le bug est que chaque voix la présentait comme un score officiel unique ("la note globale") plutôt que comme son propre ressenti personnel. Prompt renforcé (`app/api/lia/route.ts::generateDossierFragment`) : le chiffre doit toujours être présenté comme un ressenti personnel ("pour moi..."), jamais comme "la note globale"/"le score final" partagé. Jamais de garde-fou déterministe ici (contrairement au motif de déplacement) : la divergence des deux chiffres reste voulue, seule la FORMULATION doit changer — un problème de langage libre, pas un ensemble fermé comme les noms de pièces | Plus aucune formule du type "note/score global de X" (implicite au singulier, comme un fait partagé) ne doit apparaître dans un fragment quand l'autre fragment cite un chiffre différent | 0/2 — correctif du 2026-09-20, prompt seul (probabiliste), jamais garanti à 100% |

## Historique des retraits (correctifs confirmés stables, sortis du carnet actif)

*(Vide pour l'instant — ce carnet vient d'être créé le 2026-09-19 ; les entrées ci-dessus seront
véritablement comptées à partir de la première lecture EL-PROFESSOR qui les évalue.)*
