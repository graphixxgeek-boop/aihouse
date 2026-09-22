# process.simulation.guardian — instanciation

*Blueprint générique : `docs/process-simulation-guardian-blueprint.md`. Registre :
`docs/process-simulation-guardian/`. Script : `scripts/process-simulation-guardian.mjs`.*

## Origine

Créé le 2026-09-22, nom donné par l'utilisateur : « je veux un agent script responsable du process
simu (à l'image de process.circle) il s'appelle process.simulation.guardian ». Construit sur le
modèle de circle-process-guardian, avec quatre différences voulues.

Ce qui le justifie concrètement : **une simulation Article 18 coûte une heure de vrai quota Gemini**,
et les deux défauts de full_sim18 étaient visibles dans le scénario AVANT le lancement. Un contrôle
qui n'arrive qu'après le journal découvre au prix fort ce qu'une relecture du plan aurait donné
gratuitement.

## Les cinq LEÇONS (`LESSONS`)

Chacune porte trois champs — `champ` (ce qu'on vérifie), `pourquoi` (la règle), `vecu` (l'incident
réel qui l'a payée). Une leçon sans son incident serait une intention ; celle-ci se respecte parce
qu'on sait ce qu'elle a coûté.

1. **Tours autonomes en phase 2** — full_sim18 n'en a eu aucun, d'où l'absence de dossier retourné.
2. **Pseudo envoyé avant d'écrire** — sans `identify`, le jeu invente un nom d'observateur (« Caspeer »),
   et THE-SCREENER reste bloqué sur la modale.
3. **Port réel du serveur** — une simulation lancée contre un serveur périmé teste du code qui
   n'existe plus.
4. **Verrous qui ne figent pas la boucle**.
5. **Dossier cherché sur TOUT l'historique**, jamais sur les derniers tours seulement.

## Les 9 moments narratifs (`REQUIRED_BEATS`)

Le scénario doit les couvrir. Un scénario qui en saute un produit une simulation dont l'analyse ne
pourra rien conclure sur la partie manquante.

## Les trois temps

- **`brief()`** — récite les leçons avant qu'on écrive le scénario.
- **`preflight()` + `gate()`** — contrôlent le plan et **BLOQUENT** par défaut. Passage en force
  possible avec une raison écrite d'au moins 20 caractères, archivée avec la simulation.
- **`postflight()`** — contrôle le journal réel et les 5 étapes d'archivage.

## Le bug de sa propre première version

`preflight()` écrivait ses contrôles sous la forme `(plan) => plan.X === true`, ce qui renvoie
toujours un booléen : un champ **non renseigné** devenait un « non ». Le gardien reprochait donc une
absence qu'il n'avait pas constatée — exactement le défaut récurrent du projet, commis dans l'outil
écrit pour l'éviter. Corrigé en déclarant `champ` et en lisant la valeur brute, trois états
distincts : rempli / vide / non applicable. Trouvé par son propre test.

## Anti-doublon

`postflight()` réutilise `checkPhase2Autonomy()` et `checkObserverIdentified()` de
`summarize-simulation-log.mjs` — jamais un second calcul. Dès son premier lancement réel, il a
trouvé que la ligne KPI de full_sim18 manquait.

## Sa place : gardien SECONDAIRE

Il ne livre jamais son rapport à la Ronde lui-même — god-of-all-process le relaie (décision de
l'utilisateur, 2026-09-22 : « god of process centralise »). Exclusion de Ronde motivée, écrite dans
`CIRCLE_AUTO_COVERED_REGISTRIES`. Son vrai déclencheur est de toute façon une simulation, jamais le
calendrier.

## Les rapports individuels des agents (2026-09-22)

**GO donné par l'utilisateur** sur les quatre agents qui pouvaient juger une simulation sans jamais
être sollicités : THE-SCREENER (qualité visuelle), memory-audit (mémoire narrative persistée),
memento weight (poids réel du contexte par tour), Smart Conso API (coût réel). Calibrage exact :
« chacun rend un rapport individuel, sous format txt normé, que tu dois lire avant de produire ton
analyse, avec les autres rapports dispos », chacun produit « à son moment naturel, puis un
récapitulatif ».

**`moment` porte une contrainte technique, jamais une préférence d'organisation.** Trois des sept
agents mesurent des choses qui **n'existent plus** une fois la partie finie — la capture visuelle,
le coût réel, le poids du contexte tour par tour. Les relire après coup donnerait une approximation
au mieux, un silence pris pour un zéro au pire.

**Deux manques différents, jamais confondus** :
- `findSimulationItemsMissing()` — un agent **pas encore câblé** dans le process (défaut de
  conception) ;
- `findSimulationReportsMissing(sim)` — un agent câblé qui **n'a rien produit sur CE run** (défaut
  d'exécution).

Les confondre laisserait croire qu'un process complet garantit un run complet.

**`checkReportsReadBeforeAnalysis()` — l'exigence placée en dernier, et la plus facile à laisser
tomber.** Sans elle, sept rapports peuvent exister sur le disque pendant que l'analyse s'écrit de
mémoire, et tout le dispositif ne sert qu'à produire des fichiers que personne n'ouvre.

Ce qui est observable et ce qui ne l'est pas, déclaré plutôt que confondu : l'EXISTENCE d'un rapport
se lit sur le disque ; l'avoir LU ne se lit nulle part. L'agent déclare donc, et **un rapport présent
mais non déclaré est un écart bloquant** — jamais une lecture supposée parce que le fichier était là.
Une déclaration absente rend le contrôle `mesurable: false` et **jamais `ok`** : c'est exactement
ainsi que sept rapports finissent produits et aucun lu. Cas distinct signalé à part, et le plus
inquiétant des deux : un rapport **déclaré lu mais absent du disque**.

**Étape de process correspondante** : `lecture-rapports` dans le process de simulation
(`god-of-all-process.mjs`), placée AVANT le sondage et les questions de calibrage.
