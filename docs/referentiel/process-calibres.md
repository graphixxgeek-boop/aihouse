# Les process, tels que l'utilisateur les a calibrés

*2026-09-22. Ce document existe parce qu'un constat gênant a été fait ce jour-là : quatre process
étaient écrits, trois gardiens les faisaient respecter, et **le contenu de leurs étapes n'avait
jamais été soumis à l'utilisateur**. On s'apprêtait à faire appliquer des règles que l'agent avait
inventées seul. Chaque ligne ci-dessous porte donc une décision explicite, jamais une supposition.*

## Ce qui existait avant cette calibration

| Process | Gardien | Étapes | Origine |
|---|---|---|---|
| Ronde périodique (CIRCLE-TASKS) | `circle-process-guardian` | 4 | préexistait |
| Simulation intégrale (Article 18) | `process-simulation-guardian` | 7 | créé le 2026-09-22 |
| Travail autonome (nuit) | god-of-all-process | 5 | créé le 2026-09-22 |
| Process maître (le dispositif) | god-of-all-process | 5 | créé le 2026-09-22 |

Verdict de god au moment de la calibration : aucun process sans gardien, aucun document promis
manquant, aucune sonde cassée, 12/12 étapes vérifiables tracées — **mais 9 étapes sur 21 sans trace
vérifiable**, c'est-à-dire la moitié du dispositif reposant sur la parole de l'agent.

---

## 1. Process de simulation

**Autorité du gardien : REFUSER, sauf raison écrite.** *(Confirme le comportement existant.)*
Un lancement dont le scénario est incomplet est bloqué. Le passage en force reste possible à
condition d'écrire pourquoi, et cette raison est archivée avec la simulation. Le coût du
contournement n'est pas un clic : c'est devoir se justifier par écrit, ce qui écarte les
contournements paresseux sans jamais bloquer un cas légitime.

**Deux formats, nommés et distincts.** *(Changement.)* Avant, les neuf moments narratifs étaient
exigés de tout lancement — un essai court sur une mécanique précise ressortait donc comme un
ratage alors qu'il répondait simplement à une autre question.

- **simulation intégrale** : les neuf moments sont exigés, sans exception ;
- **test ciblé** : déclare à l'avance les moments qu'il vise, et n'est jugé que sur ceux-là.

**Le garde-fou anti-dérive** — sans lequel tout deviendrait « ciblé » pour échapper aux exigences :
un test ciblé qui ne déclare aucun moment visé n'est pas un test ciblé, c'est une simulation
complète qui s'ignore, et il est traité comme telle.

## 2. Process de la Ronde

**Déclencheur : un seuil de commits, avec relance PROPOSÉE.** *(Changement.)*

Le fait qui a motivé ce changement est accablant, et il est consigné ici plutôt qu'oublié : le
rappel passif existait déjà, s'affichait à chaque commit, et **l'agent l'a ignoré quatorze fois de
suite**. Un rappel qu'on peut lire sans rien faire n'est pas un mécanisme, c'est une décoration.

Trois paliers, jamais deux, parce qu'un retard de 8 commits et un retard de 30 n'appellent pas la
même réaction :

| Seuil | Palier | Ce qui se passe |
|---|---|---|
| 8 | rappel | mention discrète en bas du compte rendu de commit |
| 15 | **proposition** | proposition explicite à l'utilisateur, avec le retard chiffré |
| 30 | alerte | le retard devient un constat en soi : des vérifications gratuites dorment depuis des semaines |

Un nombre de commits non mesurable n'est **pas** un retard de zéro : c'est une absence de mesure, et
le message le dit.

## 3. Process du travail autonome (nuit)

**Face à une décision qui n'est pas la sienne : mettre de côté et continuer ailleurs.**
*(Confirme le comportement existant, désormais obligatoire plutôt que coutumier.)*

La question part au registre des décisions en attente, et l'agent passe à une autre tâche de la
file. La nuit reste productive, et l'utilisateur retrouve au réveil une liste de questions prêtes.

L'option « tenter quand même la version la plus prudente » a été explicitement écartée. Elle avait
été envisagée puis rejetée le même jour : elle aurait produit du travail à annuler, et elle entrait
en tension avec la limite permanente de l'utilisateur — rien qui touche aux personnages ou à
l'expérience du visiteur ne se décide sans lui.

## 4. Process maître (la tenue du dispositif)

Non recalibré ce jour-là : il ne gouverne aucune activité de l'utilisateur, seulement la cohérence
interne du dispositif de process. Ses cinq étapes sont vérifiées par `selfCheck()`, et god s'y
applique à lui-même — parce qu'un surveillant que personne ne surveille dérive sans que rien ne le
dise.

---

## Ce qui reste ouvert

Deux activités **déclarées à enjeu** n'ont toujours aucun process, et god les signale à chaque
passage : sonder le quota Gemini (Smart Breaker), et modifier CLAUDE.md ou un document de référence.
Les écrire est un chantier à part entière, jamais une case à cocher.
