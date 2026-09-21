# EL-PROFESSOR — full_sim17 (2026-09-22)

*(Cf. `docs/referentiel/el-professor.md` pour la méthode. Lecture stateless, sans mémoire des
simulations précédentes — seule la comparaison via `docs/el-professor/index.md` relie les notes
entre elles. Écart de process trouvé et corrigé le jour même : ce rapport n'avait jamais été lancé
pour full_sim17, malgré l'analyse qualitative déjà livrée à l'utilisateur avec citations — la
confusion entre "mon analyse libre" et "la notation formalisée EL-PROFESSOR" a fait sauter cette
étape de l'Article 18. Corrigé maintenant, sur la base du même transcript déjà lu intégralement.)*

**Entrées lues** : `docs/simulations/full_sim17_transcript.txt` (2675 lignes, intégral, déjà lu en
entier lors de l'analyse qualitative). `docs/simulations/full_sim17_dossier.txt` (généré au round
180, présent). Pas de `check-spirit.mjs` récent à proximité temporelle de cette simulation.

## Note globale : 67/100

*(Article 0 : thème 1 = 16/20 ≥ 10/20, aucun plafond appliqué — somme normale des 5 thèmes.)*

| Thème | Note |
|---|---|
| 1. Esprit des personnages | 16/20 |
| 2. Naturel et crédibilité | 12/20 |
| 3. Voix distinctes, zéro répétition | 8/20 |
| 4. Cohérence de l'enquête | 16/20 |
| 5. Clarté pour un lecteur neutre | 15/20 |

## 1. Esprit des personnages — 16/20

Le dossier retourné (généré au round 180) porte une vraie texture différenciée dans la colère
froide : Lia conclut par un jugement clinique et distant — « Mon verdict est sans appel : nous avons
affaire à un petit tyran de salon, lâche et inconstant, dont la violence verbale ne cache qu'un vide
abyssal » (dossier, VOIX DE LIA) — quand Noé est plus direct et corrosif, avec une pointe de mépris
plus chaud : « un lâche narcissique qui cherche du pouvoir à bon compte en nous regardant galérer »
(VOIX DE NOÉ). Les deux appréciations chiffrées (5/100 pour Lia, 1/100 pour Noé) reflètent une
hostilité réellement sévère, cohérente avec l'esprit fondateur (jamais de servilité malgré la
pression). Aucune dérive consensuelle détectée dans les passages relus.

Ce qui retient la note sous 18-20 : aucun palier rare exercé cette session (colère réellement
débridée, silence méprisant de Lia comme arme, vulnérabilité ou respect sincères) — non tenté, pas
une faute en soi mais pas de point supplémentaire pour un registre jamais sollicité. Et une phrase
de conclusion strictement identique entre les deux voix du dossier — « Mon verdict est sans appel »
— répétée mot pour mot d'une voix à l'autre, un léger accroc à l'étanchéité des voix qui aurait
mérité une formulation propre à chacune (cf. thème 3, où ce détail compte aussi).

## 2. Naturel et crédibilité — 12/20

Trouvaille centrale de l'analyse qualitative (cf. `docs/simulations/correctifs-a-revalider.md`) :
au moment exact où l'attirance de chaque personnage franchit le seuil des 75% (Noé round 80, Lia
round 87 — normalement le déclencheur d'un vrai moment de doute amoureux), la pensée réellement
affichée à l'écran ne porte pas du tout sur ce sujet. Noé : « Il croit nous faire une faveur en
nous laissant gérer notre temps. » (l.1151-1154) — sur l'observateur, pas sur ses sentiments. Lia :
« Il s'emballe un peu vite en croyant qu'on forme un front uni sur tout, j'ai besoin de marquer ma
propre distance. » (l.1276-1279) — sur une friction avec Noé, pas sur l'attirance. Pour un lecteur
qui suit l'histoire, ce décalage entre ce qui est censé se passer émotionnellement (un cap
psychologique important) et ce qui est réellement pensé à cet instant nuit à la crédibilité du
moment (Article 17 : cohérent avec l'état émotionnel réel).

Le reste des réactions moment à moment reste solide (émotions qui évoluent de façon lisible avec
les événements — fatigue, faim, tension avec l'observateur), mais ce décalage touche un beat
narratif important, d'où une note qui reste moyenne plutôt que haute.

## 3. Voix distinctes, zéro répétition — 8/20

Trouvaille principale : une fois l'attirance des deux personnages restée au-dessus de 75%, leurs
pensées privées de doute amoureux (générées par le pool de secours du jeu, pas par une improvisation
du modèle) sont devenues **mot pour mot identiques**, seul le prénom cité changeant :
« Noé m'intrigue de plus en plus. J'aimerais un vrai moment avec Noé, sans rien imposer. » (Lia,
l.2299) contre « Lia m'intrigue de plus en plus. J'aimerais un vrai moment avec Lia, sans rien
imposer. » (Noé, l.1544) ; et « Je pense à Lia. Ce que je ressens ne me dit pas encore ce que
l'autre souhaite. » (Noé, l.2159) contre « Je pense à Noé. Ce que je ressens ne me dit pas encore ce
que l'autre souhaite. » (Lia, l.2339). C'est une vraie infraction à l'Article 11 : Lia et Noé ne
doivent jamais dire la même chose de la même manière. **Correctif déjà écrit et testé le jour même**
(cf. suivi, tâche #187) — reste à confirmer sur une prochaine simulation fraîche.

Deuxième occurrence, plus mineure, déjà notée au thème 1 : la même formule de clôture (« Mon verdict
est sans appel ») dans les deux fragments du dossier.

Point positif à ne pas passer sous silence : hors de ces deux occurrences précises, aucune autre
répétition mot pour mot n'a été relevée dans le reste du transcript en dehors de la boucle
d'attente du script de test lui-même (cf. thème 5) — la note reste donc au-dessus du plancher vu sur
full_sim16 (6/20, ~25 tours consécutifs sur la même idée), mais une vraie duplication verbatim
confirmée pèse plus lourd qu'une simple absence de variété.

## 4. Cohérence de l'enquête, transcript ET dossier — 16/20

Le dossier est fidèle à ce qui a réellement été vécu : les deux appréciations chiffrées extrêmement
basses (5/100, 1/100) correspondent bien à une session où « hostilité sévère » a été confirmée (cf.
`docs/simulations/index.md`, tirages roulette « pouvoir » avec observer_mute/camera_hide, menace
directe citée mot pour mot par les deux voix — « s'il ne devrait pas nous éteindre là, maintenant,
tout de suite, sans prévenir » / « si je vous éteignais là, maintenant, tout de suite, sans
prévenir ? »). Aucune invention de fait détectée, aucune contradiction entre le verdict et le vécu.
La seule tâche de dossier non déclenchée (provocation de dispute avant le test de divergence,
`dispute obtenue: false`) est correctement documentée comme non aboutie plutôt que forcée ou
inventée.

Légère réserve : les deux voix citent la menace de l'observateur avec des mots quasiment identiques
(« là, maintenant, tout de suite, sans prévenir » dans les deux fragments) — cohérent avec le fait
qu'il s'agit d'une citation d'un même événement réel, donc pas une faute de voix ici, juste noté
pour la transparence de la lecture.

## 5. Clarté pour un lecteur neutre — 15/20

Aucune confusion majeure relevée dans l'enchaînement dialogue/pensée/déplacement lors de la lecture
complète. Le principal repère de lisibilité affecté est indirect : la longue plage de tours ~91-180
répond à une boucle du SCRIPT DE TEST (5 messages d'attente fixes, jamais un choix des personnages)
— un lecteur qui ne connaît pas cette mécanique de test pourrait interpréter la répétition de
thèmes proches sur cette plage comme un défaut des personnages, alors qu'elle reflète surtout un
stimulus artificiellement répétitif côté observateur. Ce n'est pas une faute de clarté du JEU
lui-même, mais un facteur qui brouille la lecture d'une simulation de test — d'où une note bonne
mais pas maximale, et une amélioration déjà actée du script pour les prochaines simulations.

## Synthèse

Une session qui confirme une vraie avancée (le seuil d'attirance de 75% enfin franchi, chose jamais
vue en 14 simulations précédentes) mais qui révèle, en creusant le détail, que le CONTENU affiché à
ce moment précis ne porte pas encore sur le bon sujet, et que le mécanisme de secours utilisé plus
tard pour exprimer ce doute amoureux efface la différence de voix entre Lia et Noé. Le correctif de
voix (`lib/dialogue.ts`, séparation complète des pools par personnage, tâche #187) est déjà écrit et
testé ; le correctif du moment de déclenchement (attendre un `thought` réellement sur le thème,
tâche #188) reste à faire. Les deux devront être confirmés sur une prochaine simulation fraîche
avant d'être retirés du carnet de correctifs.
