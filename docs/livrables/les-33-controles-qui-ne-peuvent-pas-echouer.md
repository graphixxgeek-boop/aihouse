=== Les 33 contrôles qui ne peuvent pas échouer ===
Trois familles, deux réponses évidentes et une seule vraie question — tâche #1409
Date : 2026-10-03

Le contrôleur des process vérifie que chaque étape a bien eu lieu. Pour 33 étapes sur 45, sa vérification est « ce fichier existe-t-il ? » — et le fichier en question est suivi par git, donc il existe TOUJOURS, même dans une copie neuve où rien n'a jamais été fait. Ces 33 contrôles ne peuvent pas échouer. Un contrôle qui ne peut pas échouer ACQUITTE, et un faux acquittement ne se remarque jamais.

**Tâche** : #1409 — « 33 preuves d'étape sur 45 ne peuvent jamais échouer ». Elle attend ta décision depuis le 1er octobre. **Ce document ne la prend pas** : il la réduit de 33 cas à une seule vraie question.

Ce n'est pas théorique : c'est par exactement ce trou que la déclaration de mode de travail est restée au vert pendant sept jours en affirmant que tu étais absent.

Les 33 se rangent en trois familles, et deux d'entre elles ont une réponse évidente

  Famille                           Combien  Ce que la preuve vérifie aujourd'hui  Ce qu'elle devrait vérifier                       
  --------------------------------  -------  ------------------------------------  --------------------------------------------------
  **A — un registre daté**          12       le registre existe                    une entrée datée APRÈS le début de l'activité     
  **B — un document de référence**  8        le document existe                    — rien de mécanique n'est possible, voir plus bas 
  **C — un script d'outil**         13       le script existe                      le compteur d'usage a enregistré un vrai lancement

12 + 8 + 13 = 33. La classification est mécanique, pas à l'œil : chaque preuve a été rangée par le chemin de son fichier.

Famille A — 12 preuves : le registre existe toujours, l'entrée non

  · faire-le-point / estimation · reponse-aux-questions / estimation · sonde-quota / consigner → `docs/agent-du-temps/estimations.md`
  · faire-le-point / plan-action · reponse-aux-questions / inscrire-les-taches → `docs/suivi/index.md`
  · sonde-quota / smart-conso-avant → `docs/smart-conso-api/index.md`
  · ronde / estimation · ronde / comparaison → `docs/circle-tasks/estimations.md`
  · ronde / voix-utilisateur → `docs/angel-of-ia-process/reponses-evaluation.md`
  · simulation / index → `docs/simulations/index.md`
  · semi-autonome / mode-declare → `.mode-de-travail.json`
  · xp-ia / enregistrement → `docs/tool-learning/xp-journal.json`

**Pourquoi je dis que c'est évident** : ces douze fichiers sont tous des registres où chaque ligne porte une date. « Le registre existe » ne dit rien ; « le registre a reçu une entrée depuis que l'activité a commencé » dit exactement ce que l'étape prétend. Le remplacement est strictement plus fort : il ne peut pas produire un vert là où l'ancien en produisait un à juste titre. **Aucune décision de conception là-dedans — juste un contrôle qu'on n'a pas écrit.**

Famille C — 13 preuves : la vraie preuve existe déjà et personne ne l'a branchée

  · meta (3 étapes) → `scripts/god-of-all-process.mjs`
  · integration-outil (3) → `scripts/integration-outil.mjs`, `scripts/check-house.mjs`
  · integration-ronde (4) → `scripts/circle-process-guardian.mjs`, `scripts/check-house.mjs`
  · xp-ia (2) → `scripts/tool-learning.mjs`
  · etat-des-taches (1) → `scripts/check-tasks-details.mjs`

**Ces treize étapes disent toutes « l'outil a été lancé ».** Le fichier du script prouve seulement qu'il est installé. Or le projet tient DÉJÀ un compteur d'usage (`.tool-usage-history.json`) qui enregistre chaque lancement réel — et ce fichier-là **n'est pas suivi par git**, donc il n'existe que si quelque chose l'a écrit : c'est exactement le critère que le contrôleur applique aux 12 preuves qui, elles, tiennent.

C'est la leçon L2 une fois de plus : le mécanisme existe, il fonctionne, et personne ne l'a relié à l'endroit qui en avait besoin. Le trouver a demandé de lancer l'outil et de lire sa sortie, pas de relire le code.

Famille B — 8 preuves : LA seule vraie question, et elle est pour toi

  · documents-de-reference / article-preserve → `CLAUDE.md`
  · documents-de-reference / memoire-des-operations · analyse-charte / memoire · analyse-charte / enregistrement → `docs/referentiel/charte-operations.md`
  · documents-de-reference / repercussion → `docs/referentiel/principes.md`
  · analyse-charte / cartographie → `docs/referentiel/charte-cartographie.md`
  · analyse-charte / table-regles → `docs/referentiel/claude-md-regles.md`
  · xp-ia / scan-du-registre → `docs/referentiel/lecons.md`

**Ces huit étapes disent « j'ai consulté, ou répercuté dans, un document de référence ».** Et là, il n'y a pas de bonne réponse mécanique :

  · **le fichier existe** — ne prouve rien (c'est le défaut actuel) ;
  · **le fichier a été modifié récemment** — prouve une écriture, jamais une LECTURE, et la plupart de ces étapes sont des lectures ;
  · **le fichier a été modifié dans le même commit** — pousserait à toucher un document pour faire passer un contrôle, ce qui est pire que l'absence de contrôle.

**Ce que je recommande, et c'est une position du projet, pas un renoncement** : déclarer l'impossibilité au lieu d'inventer un substitut. L'Article 27 le dit en toutes lettres — quand aucun mécanisme n'est possible, l'écrire noir sur blanc EST la protection. Ces huit étapes passeraient alors d'un faux vert à un « non mesurable, et voici pourquoi », ce qui est exactement ce que `check-spirit` fait déjà avec son `🚨 PAS MESURÉ`.

Ce que j'attends de toi, en trois réponses

  · **Famille A (12)** — je branche « une entrée datée depuis le début de l'activité » ? *(ma recommandation : oui, aucune décision de conception là-dedans)*
  · **Famille C (13)** — je branche le compteur d'usage à la place du fichier de script ? *(ma recommandation : oui, le mécanisme existe déjà)*
  · **Famille B (8)** — on déclare l'impossibilité plutôt que d'inventer un substitut ? *(ma recommandation : oui — un faux vert sur « ai-je lu la charte » est le plus coûteux de tous)*

Trois oui feraient tomber les 33 faux verts à **zéro faux vert et 8 non-mesurables déclarés**. Je n'ai rien implémenté : #1409 dit explicitement que décider ce qu'une vraie preuve doit être n'est pas à moi.

Tout ceci est de l'outillage : rien ne touche ce que Lia et Noé disent ou font, rien que le visiteur voit, rien de difficile à annuler.

---
god-of-all-process · findPreuvesToujoursVraies() — classification mécanique par chemin de fichier, lancée contre le dépôt réel le 2026-10-03.
