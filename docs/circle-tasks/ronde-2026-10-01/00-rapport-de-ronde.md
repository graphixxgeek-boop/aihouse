# Ronde GOAT du 2026-10-01 — rapport de passage

**Mode** : GOAT (choisi par lui : « fais une ronde goat quand tu pourras »), exécutée en **mode
autonome déclaré** — il dort, personne n'est là pour arbitrer.

**Heure LUE, jamais tapée** (Article 32) : ouverte le 2026-10-01 à 00h55 UTC, clôturée à 01h20 UTC.
Source de l'heure : **système** — les deux API de temps rendent HTTP 403 depuis ce conteneur, et le
dire vaut mieux que de laisser croire à une heure réseau.

## Ce qui a tourné, et ce qui ne l'a pas fait

**24 entrées gratuites exécutées pour de vrai**, chacune déposant son artefact daté dans ce dossier.

**4 entrées REPORTÉES, avec leur raison écrite** (Article 18/26 : on ne saute une étape que pour une
raison qu'on ÉCRIT) — toutes les quatre pour le même motif, qui n'est pas la fatigue mais une règle :

| Entrée | Pourquoi reportée |
|---|---|
| THE-FINAL-JUDGE | un agent séparé, coût réel en jetons — l'Article 22 exige une validation humaine explicite sur un seuil dur, et il dort |
| THE-DEEP-READER | idem, coût variable et **deux conseillers obligatoires** avant lancement |
| x-port-blindtest | ~37 000 jetons par lancement, annoncé COÛTEUX par la Ronde elle-même |
| THE-SCREENER | conditionnel : il n'a de sens que contre un serveur déjà actif avec un vrai état en cours, et il n'y en a pas |

**Ce n'est pas une Ronde au rabais** : les quatre reportées sont exactement les quatre que la Ronde
déclare elle-même comme non gratuites. Les 24 autres sont passées en entier.

## Les deux ouvertures refusées, et pourquoi la clôture est quand même régulière

`circle-process-guardian` a rendu 12 signalements, dont un blocage dur : l'ouverture enregistrée
datait de plus de 24 h. L'ouverture régulière exige `--repondu-par=utilisateur` sur **Q1** (« voulez-
vous changer de modèle pour cette Ronde ? »), à laquelle **il n'a jamais été répondu** — la déclarer
répondue aurait été une falsification, exactement ce que ce projet refuse.

La clôture passe donc par `record-run --autonome`, qui est le chemin **prévu** pour ce cas :
« en mode autonome, TOUT est autorisé sans ouverture — une barrière qui empêcherait une Ronde de
nuit de se clôturer serait précisément le blocage qu'elle interdit ». Le mode GOAT, lui, **est** sa
réponse : il l'a choisi lui-même.

## LA TROUVAILLE DE LA RONDE

**JESUS-LE-SAUVEUR** : « 341 constats RETENUS dorment dans les rapports du dépôt, et le taux
d'actionnabilité **N'EST PAS CALCULABLE** — pas par manque de données, par manque de LIEN. »

Traduit sans jargon : **tout ce paysage d'outils existe pour trouver des problèmes, et rien ne
pouvait vérifier qu'un problème trouvé hier avait fini en vrai travail.** On pouvait le vérifier à
la seconde où on l'écrivait ; plus jamais après. La cause exacte : un plan d'action écrivait sa
tâche en prose et ne citait **jamais son numéro**.

**Et JESUS avait écrit son propre remède le 28/09** — « que le plan d'action inscrive le numéro de
la tâche qu'il a fait naître » — resté une intention depuis. C'est donc l'Article 28 pris en défaut
sur l'outil même qui traque ce défaut.

**Construit cette nuit** (tâche #1355, détail dans `docs/referentiel/report-template.md`) : le
gabarit partagé porte un emplacement `numeroTache`, à position fixe, optionnel — **aucun des 49
outils ne voit sa sortie bouger**. Deux premiers usagers réels, jamais un mécanisme sans appelant.

**Effet immédiat et mesuré** : 341 constats sont redescendus à **335** le jour où la sonde a cessé
de lire son propre registre. La contamination n'était pas théorique.

## Les autres constats, par ordre d'intérêt

1. **`fils-de-discussion` était le dernier des 49** outils à ne jamais conclure par un plan
   d'action (pure-gold-unity). Corrigé la nuit même.
2. **79 noms d'outils sur 85 n'ont jamais été validés** au registre des baptêmes (AGENT DES NOMS) —
   et les noms, c'est lui qui les choisit, par séries. Le plan prépare sa décision, il ne la prend
   pas.
3. **20 outils du catalogue jamais sollicités** sur la fenêtre de 45 h (tool-brain) — et il le dit
   lui-même : « le défaut est du côté de l'agent, jamais de l'outil ».
4. **La discipline tool-brain a RECULÉ** : 44 % sur tout l'historique, **41 % sur 24 h**.
5. **5 paires de documents couvrent le même terrain** sans qu'aucun ne cite l'autre (Abraham).
6. **Exportabilité globale 88 %**, 8 dimensions sur 8 réellement mesurées — mais le banc témoin est
   **PÉRIMÉ** : 51 fichiers de `scripts/` ont changé depuis la dernière installation réelle ailleurs.
7. **god-of-all-process : 0 manquement**, 25 règles non vérifiables sans réponse.
8. **~19 642 jetons par tour de jeu** (deux cerveaux) — toujours le premier poste de lenteur, loin
   devant le rendu 3D.

## Plan d'action

| État | Constat | Ce qui en découle |
|---|---|---|
| **RETENU** | le chaînon manquant de l'Article 28 | **FAIT cette nuit** — tâche **#1355**, close et fidèle |
| **RETENU** | `fils-de-discussion` ne concluait jamais | **FAIT cette nuit** — même tâche **#1355** |
| **RETENU** | le banc témoin d'export est périmé (51 fichiers changés) | rattaché à **#902** (export et commercialisation, déjà ouverte et PRIORITAIRE-OBLIGATOIRE) |
| **À TRANCHER** | 79 noms jamais validés | **sa décision, par séries** — il l'a posé lui-même comme règle : « je ne fais pas des noms au cas par cas » |
| **À TRANCHER** | 20 outils jamais sollicités : les lancer pour de vrai, ou les retirer | arbitrage de fond, pas une correction |
| **À TRANCHER** | 5 paires de documents jumeaux | fusionner, déclarer la frontière, ou écarter avec raison — jamais un retrait en masse |
| **ÉCARTÉ** | « 29 lignes À TRANCHER » de tool-learning | **raison écrite** : c'est à lui, à la Ronde, de dire si une leçon a été APPLIQUÉE — `enregistrerXp()` refuse un jugement qui ne porte pas `parUtilisateur: true`. Y répondre à sa place serait précisément ce que le mécanisme interdit. |
| **ÉCARTÉ** | les 4 entrées coûteuses non lancées | **raison écrite** : Article 22, seuil dur, aucune validation humaine possible cette nuit |
