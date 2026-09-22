# Leçons transverses — ce que le projet a appris, et qui ne tient à aucun outil

**Pourquoi ce document existe** *(2026-09-23, question de l'utilisateur : « quand tu fais des
trouvailles bonnes à retenir [...] il faut que tu l'écrives quelque part, c'est déjà le cas ? »)*.

**La réponse honnête, ce jour-là, était NON.** Les leçons du projet vivaient dispersées dans des
commentaires de code, quelques lignes de suivi et un ou deux registres d'outils — chacune **locale à
l'outil qui l'avait apprise**. Une leçon trouvée en travaillant sur un détecteur de duplication ne
pouvait pas servir le jour où le même piège se présentait dans un tout autre coin du projet.

C'est le défaut que ce paysage traque partout ailleurs, appliqué à sa propre connaissance : une
trouvaille écrite quelque part que rien ne fait relire.

**Ce que ce document N'EST PAS.** Ce n'est ni la charte (qui ordonne), ni le référentiel technique
(qui décrit le code réel), ni le suivi (qui trace l'avancement). C'est ce qu'on a **appris en se
trompant** — formulé pour être réutilisable, y compris sur un autre projet.

**Critère d'entrée, volontairement exigeant** : une leçon n'entre ici que si elle a été payée par une
erreur réelle et qu'elle vaut au-delà du cas qui l'a révélée. Une observation ponctuelle va dans le
suivi ; une règle va dans la charte. Un registre de leçons qui accueille tout devient un journal que
personne ne relit.

---

## L1 — Une règle écrite que rien ne fait respecter, et une règle appliquée que rien n'a écrite

Deux défauts opposés, et il faut les nommer séparément parce qu'ils ne coûtent pas la même chose :

- **Écrite dans le document, absente du contrôleur** → on croit qu'elle tient. Rien ne la tient.
  C'est une illusion de sécurité, et elle est pire que l'absence de règle : on ne surveille plus.
- **Appliquée par le contrôleur, écrite nulle part** → elle tient tant que celui qui l'a posée est
  là, **et pas une session de plus**. Personne ne saura pourquoi elle existe, donc quelqu'un la
  retirera en toute bonne foi.

*Trouvée le 2026-09-23 en câblant la vérification process ↔ contrôleur de process : 28 écarts réels, dans les deux
sens.*

**Porté par** : `etatConnexionProcessGardien()` (`scripts/god-of-all-process.mjs`) — il parcourt chaque process dans les DEUX sens et nomme lequel des deux défauts il a trouvé.

## L2 — Un mécanisme qui ne sort pas du script est une intention

Un détecteur qui calcule sans imprimer, un texte produit sans être gardé, un verdict gardé sans être
lu : trois formes du même défaut. **Le plus coûteux n'est pas le mécanisme oublié, c'est le mécanisme
demandé, construit, documenté, revendiqué — et muet.** Un commentaire qui affirme « c'est vérifié »
sans rien derrière fait activement plus de mal que le silence.

*Trouvée sept fois dans la même journée, le 2026-09-23. La septième répondait à une demande explicite
de l'utilisateur, faite le matin même.*

**Porté par** : `findDetecteursMuets()` (`scripts/pure-gold-unity.mjs`) — tout détecteur qui n'est appelé de nulle part est nommé à chaque passage.

## L3 — Un test ne doit jamais exiger qu'un défaut PERSISTE

Un test écrit pour prouver qu'un outil trouve du vrai, en s'appuyant sur un défaut réel du dépôt,
devient un frein le jour où on corrige ce défaut. Ce qui doit être vérifié est la **logique** de
l'outil, jamais l'état momentané du projet : implémentations injectées, témoins synthétiques.

*Apprise le 2026-09-23, puis reproduite par le même agent deux heures plus tard sur un autre test.
Une leçon comprise n'est pas une leçon acquise.*

**Porté par** : **aucun mécanisme, et cette impossibilité est déclarée ici plutôt que tue.** Reconnaître automatiquement « ce test s'appuie sur un défaut réel du dépôt » demanderait de deviner l'intention d'une assertion ; toute tentative produirait du bruit sur les tests légitimes, donc exactement le défaut de L4. Cette leçon ne tient qu'à ce texte — c'est la protection la plus faible du registre, et elle est la seule.

## L4 — Un garde-fou qui accuse à tort cesse d'être lu

Un détecteur trop étroit qui signale les conformes se fait ignorer aussi sûrement qu'un détecteur
absent — et il coûte en plus la confiance. **Face au choix, un garde-fou doit sous-estimer plutôt
que sur-accuser** : rater des cas est réparable, produire du bruit ne l'est pas.

Corollaire : avant de qualifier une trouvaille de défaut, **vérifier que ce n'est pas une décision
déjà prise et documentée ailleurs**. Reprocher une décision assumée est la pire forme de faux positif.

*Trouvée cinq fois le 2026-09-23 : chaque nouveau détecteur a dû être resserré, certains deux fois.*

**Porté par** : `SANS_BLUEPRINT_ASSUME` / `SANS_CONSTAT_PROPRE` (`scripts/safe-export.mjs`, `scripts/report-template.mjs`) — les exemptions décidées sont déclarées comme données, jamais reprochées à chaque passage.

## L5 — Distinguer « je n'ai rien trouvé » de « je n'ai pas pu regarder »

Les deux se ressemblent dans un rapport, et ne veulent pas du tout dire la même chose. Un outil
lancé sans les données qu'il lui faut doit **dire l'absence de mesure**, jamais rendre un vert.
Corollaire : jamais un pourcentage calculé sur un dénominateur vide.

Troisième état à ne pas oublier non plus : un élément **non mesurable** (illisible, absent) ne doit
jamais être compté conforme — il casse le verdict.

**Porté par** : `relanceCircleTasks()` (`scripts/circle-tasks.mjs`) — un compte illisible rend `mesurable: false`, jamais un retard de zéro.

## L6 — Une alarme permanente ne se contente pas d'être ignorée, elle fait dépenser du travail

Un avertissement qui revient à chaque passage sur des cas déjà tranchés finit par provoquer une
enquête complète sur des questions déjà réglées. **Le coût d'un garde-fou sans mémoire n'est pas le
bruit : c'est le travail re-payé.** Un outil doit se souvenir de ses propres verdicts — et ne se
taire que sur ce qu'un humain a explicitement écarté, jamais de sa propre initiative.

*Trouvée le 2026-09-23 : un bandeau affiché pendant trois jours a fait rouvrir une enquête close.*

**Porté par** : `filtrerDejaTranches()` + `loadMemoire()` (`scripts/safe-export.mjs`) — un cas qu'un humain a explicitement écarté ne redemande plus de travail.

## L7 — Une intention écrite n'a jamais empêché quoi que ce soit

Un commentaire qui promet « jamais une copie de plus », une note qui dit « à garder aligné avec X » :
ce sont des intentions, jamais des mécanismes. Elles ne survivent pas au changement de session.
**Seul un test, un garde-fou ou un rappel automatique porte réellement une obligation.** Quand aucun
mécanisme n'est possible, l'écrire noir sur blanc EST la protection — et cette impossibilité se
déclare, elle ne se tait pas.

*Trouvée le 2026-09-23 : un commentaire se félicitait de ne pas faire « une 4e copie » d'un
chargeur, pendant que sept copies naissaient ailleurs.*

**Porté par** : `findScriptsMissingFromAgentFiles()` (`scripts/axa-check.mjs`) — le garde-fou qui a remplacé un commentaire promettant de tenir une liste alignée à la main.

## L8 — Ce qui est fragmenté paraît faux, même quand tout est vrai

Un outil qui rapporte 29 alertes pour 14 problèmes réels n'a produit aucun faux positif — et sera
pourtant pris pour du bruit. **Compter des symptômes plutôt que des problèmes suffit à discréditer
une mesure exacte.** Regrouper n'est donc pas du confort de lecture : c'est ce qui rend la mesure
utilisable.

*Trouvée le 2026-09-23 : zéro faux positif sur l'échantillon vérifié, et un soupçon légitime de
l'utilisateur sur la crédibilité de l'ensemble.*

**Porté par** : `fusionnerClusters()` + `motifDuCluster()` (`scripts/clone-hunter.mjs`) — les alertes qui se recouvrent deviennent un problème compté une fois, avec son motif.

