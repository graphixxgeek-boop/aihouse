# STRATÉGIE DE CHANTIER — organisation-de-l-agence

*(Créée le 2026-09-27 03:31Z, liée à la tâche **#1002**.)*

> **DÉCOULE DE :** `docs/strategies/strategie-globale-du-projet-entier.md`
> *stratégie de CHANTIER : elle passe par la stratégie globale, qui porte la direction d'ensemble
> et se règle elle-même sur la cible du projet entier
> (`docs/grand-projet/02-strategie/la-cible-2026-09-29.md`). L'alignement sur la cible n'est donc pas
> perdu : il est HÉRITÉ, au lieu d'être déclaré en sautant le niveau qui le porte.*
> *Rattachement corrigé le 2026-10-02 (tâche **#1434**) : jusque-là ces dix fiches déclaraient la cible
> directement, pendant que la stratégie globale affirmait de son côté que « les dix stratégies de
> CHANTIER passent par elle ». Les deux ne pouvaient pas être vrais en même temps.*


> **CE DOCUMENT NE RÉSUME JAMAIS.** Il AGRÈGE et il ORDONNE. Chaque idée y entre
> intégralement, entre guillemets, avec sa source. Trouver sa place dans la stratégie est
> le travail ; la raccourcir serait la perdre. En cas de conflit majeur entre une idée
> nouvelle et la stratégie en place, on ne tranche pas : on pose une question de calibrage.

## 1. POURQUOI CE CHANTIER

*l'intention d'origine, dans SES mots — jamais reformulée en vocabulaire d'agent*

« L'agence est un prétexte pour construire le site, le site est un prétexte pour construire l'agence. Quand le site sera fini, l'agence sera aussi potentiellement finie : il suffira de l'exporter, de prendre en compte toutes les idées retenues, et sa finalisation sera rapide. »

— source : sa formulation du 2026-09-22, reportée dans CLAUDE.md


« le fait de me juger est identifié par l'organisation. Les membres qui me jugent sont dans la categorie "jury", une categorie transverse. Il y a d'ailleurs pas mal de categories transverses identifiées, il faudra vraiment qu'on clarifie l'organisation [...] je compte sur toi pour m'aider à s'y retrouver et proposer un schéma d'agence propre et intelligent, pertinent. »

— source : sa demande du 2026-09-22, tâche #439


« le doc c'est bien "agence-conception" à enregistrer dans les notes strategie de chantier organisation. Ici, il peut nous servir à completer notre regard pour voir si tout est complet : à toi de me dire. »

— source : son message du 2026-09-27, qui a créé cette note

## 2. CE QUI EXISTE DÉJÀ

*mesuré sur le dépôt, jamais supposé — c'est ce qui évite de reconstruire ce qui est là*

« Le référentiel CANONIQUE de l'organisation est `docs/referentiel/organisation-agence.md`, et sa tenue à jour reste MANUELLE. Il tient deux axes non confondus : Statut de documentation, et Rôle dans l'organigramme. »

— source : mesuré dans le dépôt, CLAUDE.md « Référentiel technique »


« Le dossier de conception des ÉVOLUTIONS d'organigramme existe depuis le 2026-09-22 : `docs/organisation-agence-conception.md`, 420 lignes. Il accueille les évolutions proposées et pas encore actées, pour qu'aucune ne se perde entre sa formulation et sa mise en œuvre. »

— source : mesuré dans le dépôt le 2026-09-27


« Ce que l'Agence sait ranger aujourd'hui, et ce qu'elle ne sait pas, mesuré le 2026-09-27 : 90 fichiers d'OUTILLAGE classés sur 9 axes, couverture du rang 100 %. 448 DOCUMENTS classés sur DEUX axes depuis cette nuit — l'exportabilité (100 %) et la nature (99 %). Restent sans classement propre : les 39 leçons, les 4 process déclarés, les 23 colonnes de KPI. »

— source : `node scripts/le-classificateur.mjs`, passage du 2026-09-27T03:31Z


« Le vocabulaire des RANGS et des FAMILLES existe et fait loi : Gardien sacré du code (7), Contrôleur de process, Veilleur, Garde-fou mécanique. Le mot « gardien » employé seul n'a plus de sens dans ce projet, et `findGardienAmbigu()` le vérifie mécaniquement. »

— source : CLAUDE.md, Article 20bis

## 3. LES IDÉES RETENUES

*intégrales, citées, jamais résumées — chacune avec sa source*

**LE DOCUMENT QU'IL A ÉCRIT DE SON CÔTÉ, ET QU'IL A REDONNÉ LE 2026-09-27.** Il s'agit d'un dossier
de conception rédigé hors de ce dépôt — un second regard indépendant, qui n'a pas été écrit en
regardant notre code. Il est reproduit ci-dessous INTÉGRALEMENT, dans ses mots, sans une ligne
retirée : c'est la règle de ce document, et elle vaut particulièrement ici, où le texte est la seule
trace d'un raisonnement mené ailleurs.

— source : son copier-coller du PDF, message du 2026-09-27

---

**LE DOCUMENT QU'IL A ÉCRIT DE SON CÔTÉ, ET QU'IL A REDONNÉ LE 2026-09-27.** Un dossier de
conception rédigé hors de ce dépôt — un second regard indépendant, qui n'a pas été écrit en
regardant notre code.

**Il vit dans son propre fichier, et c'est sa demande** : « donne lui un nom bien distinctif pour le
retrouver facilement en cas de besoin ».

> 📄 **`docs/gouvernance-agence-virtuelle-cadre-cible.md`** — intégral, 13 sections, jamais résumé.

*Le mot « gouvernance » n'apparaît dans aucun autre nom de fichier du dépôt : une seule recherche
suffit à le retrouver.* Il n'est pas recopié ici : deux copies d'un même texte divergeraient, et
c'est très exactement le défaut que le détecteur de documents jumeaux a relevé cette nuit.

**Ce qu'il apporte, en une phrase** : deux vues au lieu d'une — un schéma de CRÉATION en 15 étapes
(classification → nivellement → harmonisation → intégration → gouvernance → …) et un schéma
d'EXPLOITATION en 10 (saisine → qualification → orchestration → … → amélioration) — plus un
catalogue de 16 rôles d'agent, 12 dimensions de contrat d'interface, 15 règles de gouvernance
G1-G15, une matrice de responsabilités et une feuille de route en 10 étapes.

**Sa nature, à ne jamais perdre de vue en le relisant** : c'est un CADRE CIBLE proposé, pas la
description d'un dispositif en place. Il le dit lui-même en note finale.

— source : son copier-coller du PDF, message du 2026-09-27

## 4. LES RECHERCHES ET TROUVAILLES

*ce qu'on est allé chercher dehors, et ce qu'on en a tiré*

*(vide — rien n'a encore été versé ici)*

## 5. LES DÉCISIONS DÉJÀ PRISES

*ce qui ne se rediscute plus, avec la date et qui a tranché*

*(vide — rien n'a encore été versé ici)*

## 6. CE QUI RESTE À TRANCHER

*les arbitrages qui lui reviennent — jamais tranchés par l'agent*

*(vide — rien n'a encore été versé ici)*

## 7. LE PLAN D'EXÉCUTION

*ne se remplit qu'À LA FIN, juste avant la construction effective*

*(vide — rien n'a encore été versé ici)*
