# integration-outil — instanciation sur « Maison IA vivante »

Script : `scripts/integration-outil.mjs`. Blueprint générique : `docs/integration-outil-blueprint.md`.
Registre des passages : `docs/integration-outil/index.md`.

## Pourquoi il existe ici

Demande explicite de l'utilisateur, le 2026-09-22 : « ecris quelque part le process integration ou
renforce le si deja existant, pour le rendre plus efficace et te permettre d'integrer plus facilement
un outil ». Il n'existait rien : ni document, ni entrée dans `PROCESSES`, ni contrôleur de process.

Le constat chiffré derrière la demande : faire entrer SAFE-EXPORT puis TOOL-LEARNING a demandé
**sept inscriptions manuelles chacun**, chacune révélée en faisant échouer un test. C'est mot pour
mot le diagnostic ouvert de l'Article 24 : « les garde-fous [...] DÉTECTENT l'oubli au lieu de
l'ÉVITER : l'agent reste le mécanisme d'intégration ».

## Son déclencheur

Un ÉVÉNEMENT, jamais un calendrier : **un outil arrive**. C'est pour cette raison qu'il n'est pas un
item de Ronde — un rythme périodique lui ferait poser la même question à vide pendant des semaines,
puis la ferait sauter le jour où elle compte.

Il se consulte **avant** de commencer. Consulté après le premier test rouge, il ne fait plus que
confirmer ce que le test vient de dire : les onze garde-fous continuent d'échouer si l'inscription
manque, cet outil n'existe que pour inverser le MOMENT où on l'apprend.

## Les onze registres, et ce que chacun gouverne

| Clé | Fichier | Ce que ça change concrètement |
|---|---|---|
| `fiabilite` | `scripts/lib-shell.mjs` | l'avertissement d'inexactitude affiché en tête de ses rapports |
| `categorie` | `scripts/lib-shell.mjs` | son rang dans l'organigramme (Agent / Gardien sacré / Membre) |
| `domaine-gardien` | `scripts/lib-shell.mjs` | *(selon décision)* les dossiers qu'il surveille, si Gardien sacré |
| `couverture-axa` | `scripts/axa-check.mjs` | sans quoi il est invisible à la couverture de test et à la stagnation |
| `registre-rapports` | `scripts/doc-report.mjs` | décision HTML/texte, index global, journaux orphelins |
| `avertissement` | `scripts/doc-report.mjs` | le fichier porte-t-il réellement l'avertissement |
| `catalogue-coordinateur` | `scripts/le-coordinateur.mjs` | ce que tool-brain peut me recommander |
| `ronde` | `scripts/circle-tasks.mjs` | item périodique **ou** exclusion écrite si déjà câblé au commit |
| `table-maitresse` | `docs/regles-de-travail.md` §7ter | la description détaillée outil par outil |
| `inventaire-charte` | `CLAUDE.md` | le tableau « Inventaire documentaire des outils » |

## Ce qu'il a trouvé à sa première exécution réelle

Conformément à l'Article 25 (« un outil qui n'a jamais tourné contre le vrai dépôt n'est pas un
outil vérifié, c'est une intention »), il a été lancé sur le vrai dépôt avant d'être considéré fini :

- **SAFE-EXPORT et TOOL-LEARNING absents de `PRESTATIONS` depuis leur naissance.** Aucun des sept
  garde-fous ne couvrait ce registre — ils vérifient chacun le leur, et celui-ci n'avait personne.
  Un vrai manque, invisible à tout le reste du dispositif.
- **Trois de ses propres lecteurs cassés**, attrapés par `findLecteursCasses()` avant qu'il ait
  produit le moindre chiffre : ancrage sur la première occurrence du nom (qui tombait dans un
  commentaire 80 lignes plus haut) plutôt que sur la déclaration ; `id:` pris pour `slug:` ; un
  registre dont les entrées nomment les outils en toutes lettres.
- **Une exclusion volontaire réclamée comme un manque** : safe-export est délibérément hors de la
  Ronde (Gardien sacré, il tourne à chaque commit), et l'outil demandait de l'y inscrire. Corrigé en lui
  apprenant à lire `CIRCLE_AUTO_COVERED_REGISTRIES` — l'exclusion déclarée EST la décision.

## Sa limite, déclarée

Aucun mécanisme ne peut m'obliger à le consulter (même honnêteté que tool-brain et
SMART-CONSO-TOKEN, et même raison : rien n'intercepte une action avant qu'elle ait lieu).
L'obligation vit dans l'entrée « Intégration d'un nouvel outil » de `PROCESSES`
(`scripts/god-of-all-process.mjs`), surveillée par god-of-all-process — qui la signale, sans jamais
bloquer (Article 26/28).

## Ses tests

Ses fonctions mécaniques (`findFaitsManquants` côté Ronde mis à part, qui appartient à CIRCLE-TASKS)
sont couvertes par **`scripts/check-house.mjs`** : présence/absence dans un registre, fichier
illisible rendu « non mesurable » plutôt qu'« absent », complétude du plan, et surtout
`findLecteursCasses()` vérifié en direct contre les onze registres réels du dépôt — l'assertion qui a
attrapé trois lecteurs cassés avant qu'ils ne produisent le moindre chiffre faux.

C'est l'étape `tests` du process « Intégration d'un nouvel outil » (`PROCESSES`,
`scripts/god-of-all-process.mjs`), et cette ligne existe parce que `findMecanismesAbsentsDuProcess()`
a signalé le 2026-09-23 que le fichier de tests n'était cité nulle part ici.

## Les trois natures d'un script (2026-09-23)

**Le défaut réel, et il rendait l'outil inutilisable sur un quart des scripts du dépôt.** Demander
l'intégration de `messages-courts` a produit « 0/11, 10 inscriptions manquantes » — la même réponse
que pour n'importe quel nom, y compris `criticite`, `priorites` et `modes-de-travail`. Ces quatre-là
ne sont pas des membres de l'Agence : ce sont des **modules de règles hébergés par un process**.
Suivre le plan aurait produit quatre blueprints et quatre fiches pour quatre modules qui n'ont rien
en propre à documenter, exactement ce que la charte refuse en réservant six outils « volontairement
SANS blueprint ni instanciation ». Un outil qui répond la même chose à toutes les questions ne
répond à aucune.

| Nature | Ce que ça veut dire | Ce qu'on lui demande |
|---|---|---|
| `membre` | un outil de l'Agence Codex | les onze registres |
| `module-de-regles` | une donnée/une règle qu'un process exécute | que son process hôte existe **et** le cite |
| `non-decide` | personne n'a encore dit ce que c'est | trancher, avant toute intégration |

**La nature se DÉCLARE dans le fichier** (`export const PROCESS_HOTE = "<slug>"`), jamais dans une
liste tenue ici qui se périmerait au module suivant (Article 24), et jamais devinée d'après le nom.
Le troisième état est le plus important parce qu'il est bruyant : ranger d'office un script inconnu
en « outil à intégrer » serait deviner, et deviner en silence est le défaut que la moitié de ce
paysage existe pour empêcher.

**Deux garde-fous, et aucun n'est décoratif** — sans eux la branche « module de règles » se
contenterait d'IMPRIMER une consigne, et une consigne imprimée est l'intention que la leçon L7
refuse :

- `findModulesDeReglesOrphelins()` — un module rattaché à un process qui n'existe pas. Un hôte
  fantôme rassure à tort, comme le porteur fantôme de L7.
- `findModulesNonCitesParLeurProcess()` — un module que le document de son process hôte ne cite
  nulle part. **Cas réel, trouvé le jour même** : `messages-courts` se déclarait rattaché au process
  semi-autonome dont le document l'ignorait. Le module existait, il était testé, et aucun déroulé
  n'y menait — la forme exacte de « un mécanisme qui ne sort pas du script » (L2). Corrigé le même
  soir, section dédiée dans `docs/mode-semi-autonome-process-detail.md`.

**Le faux positif que l'outil s'est infligé à lui-même** : sans ancre de début de ligne, le marqueur
matchait l'EXEMPLE écrit dans le propre commentaire d'`integration-outil.mjs`, qui se déclarait donc
module de règles rattaché au process « `<slug>` ». Trouvé en le lançant pour de vrai sur le dépôt
entier, jamais en le relisant (Article 25) — et c'est la leçon L4 prise au mot : un garde-fou qui
accuse à tort cesse d'être lu.

## L'intégration n'est plus seulement une inscription (2026-09-24, chantier 2.4)

**Ce que ce plan ne vérifiait pas, et le trou était entier** : jusqu'à cette date, `planDIntegration()`
ne savait répondre qu'à une question — « es-tu inscrit dans les onze registres ? ». Un outil pouvait
donc être parfaitement intégré au sens de cette fonction en **ne déclarant jamais sa marge d'erreur,
en ne sachant pas répondre « pas mesuré », et en ne concluant par aucun plan d'action**. Les
registres à jour, et les obligations de fond invisibles. Mesuré le soir même sur le dépôt réel :
selon l'exigence, **45 à 76 % seulement** des outils concernés l'atteignent.

`obligationsDeClasse()` comble ce trou, et `complet` veut désormais dire **les deux** : inscrit
partout ET à niveau sur ce que sa classe exige.

**Les exigences ne sont pas recopiées ici** : elles sont LUES chez CASSANDRA-RH
(`EXIGENCES_PAR_CLASSE`), où elles vivent avec les classes transverses qu'elles gouvernent. Une
exigence ajoutée là-bas vaut donc pour la prochaine intégration sans que ce fichier bouge — c'est
exactement ce que l'Article 24 exige, et le contraire de la liste recopiée qui se périme au premier
ajout.

**Un outil en cours d'intégration est traité comme un OUTIL**, jamais comme ce qu'il est avant
d'être documenté : le mesurer autrement l'exempterait de tout au moment précis où il faut l'exiger.

**Première intégration passée sous ce régime** : AGENT-DU-TEMPS, le 2026-09-24 — onze registres sur
onze du premier coup, plus son blueprint et sa fiche. La première fois qu'un outil de ce projet
entre sans découvrir ses oublis un test après l'autre.

---

## L'ANGLE MORT de l'audit, et sa fermeture *(2026-09-26, tâche #915)*

Sa demande : « l'angle mort de l'audit d'intégration — **fermer le trou côté outil** ».

### Ce que l'audit voit, et ce qu'il ne voyait pas

Les onze registres vérifient le **BRANCHEMENT** : l'outil est-il connu de la couverture de test, du
catalogue, de la Ronde, de la charte. C'est nécessaire, et **ce n'est pas suffisant** — un outil
peut être branché 11/11 et **décrire quelque chose qui n'existe plus**. L'audit regarde les fils,
jamais ce qui passe dedans.

### Ce n'est pas une crainte : c'est arrivé cette nuit

`check-profile.mjs` a été gelé hors de l'équipe le 2026-09-26 parce que son en-tête, écrit le
2026-09-17, affirmait « le mécanisme réel n'existe pas encore dans le code ». Le mécanisme existait
depuis des jours — **et il avait été construit À PARTIR de cet outil**. Neuf jours de fausseté,
aucun registre en défaut, aucune alerte.

### La forme constante d'une phrase qui se périme en silence : le FUTUR

« pas encore », « à venir », « en cours de conception », « sera », « prochainement ». Une
description au présent vieillit mal mais reste discutable ; **une promesse devient fausse le jour
où elle est tenue — et c'est le SUCCÈS qui la rend fausse**, ce qui explique que personne ne
revienne la corriger.

`findPromessesPerimees()` lit les 40 premières lignes de chaque script et rend une **question** avec
l'âge de la phrase quand une date est écrite à côté. Il **ne conclut jamais** : un « pas encore »
parfaitement légitime existe, et un garde-fou qui accuse à tort cesse d'être lu (L4). Il tourne à
chaque passage de l'outil — un détecteur qu'il faut penser à lancer n'est lu par personne (L2).

### Deux exclusions, chacune née d'un faux positif réel

1. **Une promesse CITÉE n'en est pas une.** Premier passage : la seule trouvaille du dépôt était la
   ligne de `check-profile.mjs` qui cite son ancien en-tête pour expliquer en quoi il était faux.
   Accuser le texte qui répare le défaut est le plus sûr moyen de ne plus être lu. *(Même patron que
   `findDependancesOutillage()`, qui exclut déjà la dépendance « citée pour être écartée ».)*
2. **L'état de citation se suit d'une ligne à l'autre.** La citation en question ouvrait ligne 3 et
   fermait ligne 4 : un balayage ligne par ligne voyait une fin de citation sans son début, donc une
   promesse nue là où il y avait du discours rapporté. **Une exclusion qui ne tient pas sur deux
   lignes ne tient pas du tout** — ce dépôt écrit ses citations sur plusieurs lignes partout.

**État du dépôt après réparation : zéro promesse périmée sur 80 scripts**, vérifié en direct par un
test qui casserait le jour où une nouvelle apparaît.

### Ce qui reste hors de portée, et qui est déclaré

Il cherche des promesses **au futur**, jamais la vérité d'une description **au présent**. Un outil
qui décrit faussement quelque chose au présent lui échappe entièrement. Ce trou-là n'a pas de
mécanisme possible — le déclarer EST la protection (Article 27).
