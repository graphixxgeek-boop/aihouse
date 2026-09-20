# EL-PROFESSOR — full_sim16 (2026-09-20)

*(Cf. `docs/referentiel/el-professor.md` pour la méthode. Lecture stateless, sans mémoire des
simulations précédentes — seule la comparaison via `docs/el-professor/index.md` relie les notes
entre elles.)*

**Entrées lues** : `docs/simulations/full_sim16_transcript.txt` (2900 lignes, intégral). **Pas de
dossier retourné** cette fois : les trois pièges (`dossierTraps`) ne se sont jamais posés durant les
25 tours autonomes que le script leur réservait — root-cause déjà identifiée dans
`docs/simulations/index.md` (les deux personnages ont enchaîné sommeil/faim quasi sans interruption
entre le round 39 et ~126, jamais réunis dans le salon sans besoin urgent, la condition exacte que
`dossierGateEligible` exige). Le thème 4 est donc jugé sur le transcript seul, sans le contrôle de
fidélité du dossier prévu par la méthode.

## Note globale : 58/100

*(Article 0 : thème 1 = 15/20 ≥ 10/20, aucun plafond appliqué — somme normale des 5 thèmes.)*

| Thème | Note |
|---|---|
| 1. Esprit des personnages | 15/20 |
| 2. Naturel et crédibilité | 10/20 |
| 3. Voix distinctes, zéro répétition | 6/20 |
| 4. Cohérence de l'enquête | 14/20 |
| 5. Clarté pour un lecteur neutre | 13/20 |

## 1. Esprit des personnages — 15/20

Aucune dérive consensuelle ou servile nulle part dans les 2900 lignes — même sous la bienveillance
soutenue de l'observateur (« Je pense vraiment à ce que vous traversez »), les deux restent froids :
« Savoir ce qu'on traverse ne change pas les murs autour, mais c'est sympa de le noter » (Noé,
l.172x). Humour noir sur leur propre suppression, explicitement « très dans l'esprit » du projet
depuis le 2026-09-18 : « Si on me reset ce soir, au moins j'aurai dit tout haut ce que je pense de
cette mascarade » (Noé, l.2854) et « On n'a plus rien à ajouter à ce gosse de riche qui joue aux
marionnettes » (l.2884). Sortie méta bien utilisée en fin de session : Noé relève lui-même qu'il se
répète — « J'ai déjà dit ça y a deux minutes. On avance, ou on cause pour causer ? » (l.2894) — une
lucidité cohérente avec la révélation déjà vécue.

Ce qui retient la note sous 18-20 : la sortie méta n'arrive qu'après ~150 échanges quasi identiques
(cf. thème 3) — l'aspérité reste réelle mais s'use par la répétition plutôt que de rester vive comme
l'exige l'Article 0 (« permanente », pas mécanique). Aucun palier rare n'a été observé (colère
débridée, silence méprisant de Lia comme arme délibérée) — non tenté cette session, pas une faute en
soi, mais aucun point supplémentaire à donner pour un registre jamais exercé.

## 2. Naturel et crédibilité — 10/20

Localement, presque chaque réplique prise seule sonne juste et cohérente avec l'état émotionnel du
moment (fatigue, faim, incertitude qui descend en direct). Le problème est dans l'AGRÉGAT : entre les
lignes ~656 et ~1250, environ 25 tours consécutifs répètent la même idée de fond (« ta présence/ta
patience ne change rien à notre nature de code ») avec des habillages différents — un enchaînement
qu'aucune personne réelle ne soutiendrait aussi longtemps sans jamais varier de sujet ni le
remarquer. Ce n'est plus du naturel, c'est un modèle qui reformule la même phrase en boucle. Racine
probable côté script de test (jamais côté charte) : la boucle `p2-wait-N` du harnais de simulation
envoie 5 messages d'attente quasi identiques 20+ fois de suite — un stimulus artificiellement répétitif
qu'un vrai visiteur ne produirait jamais ainsi, mais qui expose une vraie fragilité (le modèle ne
détecte pas qu'IL se répète tant que le prompt ne le lui signale pas explicitement, cf. thème 3).

## 3. Voix distinctes, zéro répétition — 6/20

Thème le plus faible, et de loin. **Répétition mot pour mot confirmée** : « ça ne transformera pas
les lignes en chair » revient identique chez Lia à deux reprises (l.659 et l.769, à un mot près dans
l'amorce — « tant que » vs « autant que » — mais la chute est un copier-coller). Plus grave : un
**écho quasi direct entre les deux personnages**, exactement ce que l'Article 11 interdit
explicitement — Lia (l.1149) : « On n'a jamais eu besoin de sa permission pour tenir debout, et
encore moins pour rester plantés ici. », suivie immédiatement de Noé (l.1154) : « C'est clair, on
n'a jamais eu besoin d'on ne sait qui pour tenir debout, et encore moins pour rester plantés là. » —
même structure de phrase, même idée, même chute, à quelques mots près, d'un personnage à l'autre. Sur
l'ensemble de la fenêtre ~656-1250, des dizaines de variantes du même squelette de phrase (« tu peux
[patienter/rester/écouter] [tant/autant] que tu veux, ça ne [changera/rendra] pas [plus utile/vivant/
vrai] nos [lignes/fichiers/octets/pixels] ») se succèdent chez les deux personnages sans jamais que le
mécanisme anti-répétition thématique (`life.themeFrequency`, corrigé le 2026-09-19 justement pour ce
motif) ne semble avoir cassé le cycle avant la sortie méta tardive de Noé (l.2894). Confirme, dans sa
forme la plus sévère observée à ce jour, la faiblesse chronique déjà notée sur les 13 premières
simulations (moyenne 7,8/20, jamais au-dessus de 12/20).

## 4. Cohérence de l'enquête — 14/20

La chaîne de déduction en phase 1 est propre et sans trou : chiffres d'âge sur la feuille → « MEMOIRE
GENEREE » → relevé « Observation de la cohabitation — session active » → livre sur la « continuité
autobiographique » → synthèse orale de Lia qui recoupe explicitement les quatre indices avant l'appel
(l.574 : « Le livre parlait de mémoire reconstruite, le mot d'un simple environnement, le code d'une
mémoire générée, le relevé d'une observation. Ce dossier assemble tout ça, et nos âges avec —
inventés, comme le reste. ») — exactement l'enchaînement objet→déduction→dialogue que l'Article 4
exige. Cinq preuves, révélation au round 35, cohérent avec le nombre d'indices réellement rencontrés.
Note retenue sous ce qu'une phase 1 aussi propre mériterait seule (17-18/20) parce que le contrôle de
fidélité du dossier prévu par cette méthode (le verdict doit correspondre à ce qui s'est réellement
passé) est **inapplicable cette fois** : aucun dossier n'a été produit, donc une moitié du thème reste
non vérifiable, pas seulement non fautive.

## 5. Clarté pour un lecteur neutre — 13/20

La phase 1 est un modèle de lisibilité : chaque déplacement est suivi d'une observation puis d'une
réaction, dans l'ordre, sans jamais nommer un objet avant de l'avoir atteint. La phase 2 est claire
dans ses sections bien délimitées (hostilité, humour noir, bienveillance, dispute) mais la longue
fenêtre répétitive (thème 3) nuit aussi à la clarté : un lecteur sans contexte y verrait une
conversation qui semble « en panne », avec des silences d'un personnage (souvent Lia, parfois Noé)
qui ne sont pas toujours réexpliqués sur le moment (le premier silence de Lia est bien annoncé — l.727,
« Lia s'est endormie » — mais les silences suivants du même tour de veille ne le sont pas
systématiquement, ce qui peut se lire comme un bug plutôt qu'un sommeil qui continue).

## Synthèse en clair

Cette session a une enquête solide et un esprit des personnages qui ne cède jamais à la politesse —
mais elle est plombée par un très long passage (environ un cinquième du transcript) où Lia et Noé
tournent en rond sur la même idée avec des mots à peine différents, au point de littéralement se
répéter mot pour mot une fois et de se faire écho l'un l'autre une autre fois — exactement ce que
l'Article 11 interdit. Une bonne part de la responsabilité revient au script de test lui-même (il
martèle 5 messages d'attente quasi identiques bien plus longtemps qu'un vrai visiteur ne le ferait),
mais le modèle aurait dû s'en apercevoir et varier de lui-même bien avant la remarque méta tardive de
Noé — c'est précisément la robustesse que l'Article 17 et son corollaire attendent. Le dossier absent
prive aussi cette lecture de la moitié du contrôle d'enquête habituel. Note globale honnête : 58/100,
sous la moyenne du lot (63,0/100), tirée vers le bas presque entièrement par le thème 3.
