# Tableau de bord / KPI — instanciation pour ce projet

*(Créé le 2026-09-19, à la demande explicite de l'utilisateur. Séparé le même jour, à sa demande
également, entre l'architecture générique — réutilisable sur un autre projet équivalent, décrite
dans `docs/tableau-de-bord-blueprint.md` — et l'instanciation propre à ce projet ci-dessous. Ce
document ne répète pas le raisonnement générique : il dit seulement comment le patron s'applique
ici, à quels fichiers, à quels Articles de la charte. Comme le patron l'impose, les chiffres réels
ne s'accumulent jamais dans ce document — ils vivent en base de données (D1) et dans le dépôt lui-
même, consultables via `scripts/kpi-report.mjs`.)*

## Les 6 familles, pour ce projet

*(Chantier 2 livré le 2026-09-19 : chaque famille a désormais un KPI global en %, jamais un chiffre
nu — toujours accompagné d'une lecture concrète et, si le seuil le justifie, d'une action à mener
(demande explicite de l'utilisateur : « chaque KPI en rapport avec une décision, une action à
mener [...] je veux un tableau de bord avec des données SMART »). Un élément sans plafond naturel
(points fragiles ouverts, taille de code) reste un compteur brut, jamais forcé dans un % arbitraire
— décidé explicitement avec l'utilisateur plutôt que d'inventer un seuil non justifié.)*

1. **Performance runtime.** Fiabilité de la connexion à Gemini (fréquence des blocages 429/503,
   bascules de clé/modèle de secours via le Smart Breaker). **KPI global** :
   `successes / attempts × 100` — la proportion de tentatives Gemini qui ont abouti sans buter sur
   un blocage. `lib/gemini-keys.ts` tient des compteurs bruts en mémoire process (tours,
   disponibilité de la clé principale au départ d'un tour, tentatives par issue —
   succès/429/503/401-403), exposés par le panneau Admin (`app/api/admin/route.ts`, champ
   `geminiKeyMetrics`) et lus par `scripts/kpi-report.mjs`. Jamais en base de données : une mémoire
   process, remise à zéro à chaque redémarrage du serveur, qui correspond exactement à "un rapport
   par simulation" (Article 18). **Deux KPI supplémentaires, spécifiques au Smart Breaker,
   affichés en tête de chaque rapport, en gras** : la performance globale ci-dessus (répétée en
   tête) et un score d'**améliorations réalisées sur l'outil lui-même**
   (`SMART_BREAKER_CAPABILITIES` dans `kpi-report.mjs` : proportion de capacités de résilience
   prévues qui sont réellement implémentées ET testées — 7/8 au 2026-09-19, la validation qualité
   intégrale de `GEMINI_FALLBACK_MODELS` pour la prod restant le seul écart). Reste à construire :
   l'économie d'appels et un historique inter-sessions, qui nécessiteraient une vraie persistance
   en base (`kpi_counters`) — non fait, cf. "État d'avancement" ci-dessous pour la raison.
2. **Robustesse du code** (Article 5, Article 7). **KPI global** : moyenne de la propreté `tsc`
   (100% si 0 erreur, sinon 0% — un type cassé n'est jamais "presque bon") et de la proportion de
   blocs de `check-house.mjs` qui passent. Points fragiles ouverts
   (`docs/referentiel/points-fragiles.md`) et taille des fichiers les plus denses (`lib/lia.ts`,
   `lib/dialogue.ts`) restent des compteurs bruts, affichés à côté du %, jamais forcés dedans.
3. **Qualité de sortie** (Article 0, Article 11). **KPI global** :
   `100 - antiEchoInterventions / turns × 100` — proportion de tours n'ayant eu besoin d'aucune
   réplique de repli anti-écho (`lib/quality-metrics.ts`, compteur process, même cadence que le
   Smart Breaker). Référence à la dernière vérification approfondie par `check-spirit.mjs` (date +
   verdict, enregistrés manuellement après chaque passage — cet outil coûte de vrais appels API
   donc reste lancé à la main, jamais automatisé, cf. Article 13) : lien pas encore câblé dans le
   rapport automatique, à faire.
4. **Cohérence logique** (Articles 2, 4, 12, 17). **KPI global** :
   `100 - interventions de groundTruncation / turns × 100`, avec un détail par personnage
   (Lia/Noé) — un déséquilibre net entre les deux déclenche une action spécifique dans le rapport
   plutôt qu'une moyenne qui le masquerait.
5. **Rejouabilité/rythme** (Article 9). **KPI partiel livré le 2026-09-19** : diversité des bonus
   de la roulette parmi les 12 derniers tirages (`bonusLog`, déjà existant, plafonné à 12 entrées)
   — `distinctBonuses / 9 × 100`. Limite honnête, documentée dans le rapport lui-même : ce n'est
   PAS un historique inter-sessions réel (tours jusqu'à la révélation, nombre de disputes, variété
   des ouvertures), qui nécessiterait la table `kpi_session_snapshots` jamais construite — cf.
   "État d'avancement".
6. **Smart Conso** (Article 22, écart réel comblé le 2026-09-20 — cette famille avait déjà une
   réponse de calibrage de l'utilisateur, jamais construite : « taux de respect de leur consigne :
   par moi, par toi, par les outils. KPI des tokens/API économisées grâce à l'outil + efficacité des
   process actuels + indice de fraîcheur »). **KPI global** : `smartConsoScore()` moyenne les
   composantes réellement mesurables cette fois (une composante absente est exclue, jamais comptée
   comme zéro) :
   - **Conformité API** (`burstComplianceScore()`, Smart Conso API) — proportion des vraies salves
     d'appels Gemini (`.gemini-key-health.json`, preuve indépendante) réellement précédées d'une
     consultation confirmée. La seule composante backée par un dénominateur honnête, contrairement
     à l'historique de SMART-CONSO-TOKEN qui ne voit que les consultations réellement faites.
   - **Adoption** (`computeAdoptionKpi()`, SMART-CONSO-TOKEN) — réduction moyenne réellement mesurée
     des propositions déjà appliquées (l'« efficacité des process actuels »).
   - **Fraîcheur** (`checkKnowledgeFreshness()`, SMART-CONSO-TOKEN) — le registre de schémas
     coûteux est-il encore validé pour le modèle courant.
   Limite honnête, documentée dans le rapport HTML lui-même : l'adoption ne peut jamais prouver
   qu'une consultation a été OUBLIÉE (biais de survivance), seule la conformité API le peut.

## KPI général — couverture du tableau de bord lui-même

*(Ajouté le 2026-09-19, demande explicite de l'utilisateur : « crée un KPI général qui juge des
performances du tableau de bord lui-même, indicateur à surveiller en priorité ».)* Combien des 6
familles ci-dessus (corrigé le 2026-09-21, tâche #145 : cette section disait encore "5", resté faux
depuis que Smart Conso est devenue la 6e famille le 2026-09-20 — écart doc/code réel, corrigé le
jour de sa découverte, jamais laissé pour plus tard, Article 13) ont produit une vraie mesure à
CETTE exécution précise du rapport (jamais une estimation ni un défaut silencieux) :
`dashboardCoverageScore` dans `scripts/kpi-report.mjs`. Affiché juste avant la synthèse, et
déclenche sa propre alerte si sous 100% — parce qu'un tableau de bord qui n'affiche que 3 familles
sur 6 sans le signaler clairement inspirerait une confiance non méritée à la synthèse globale
(risque explicitement nommé par l'utilisateur : « des informations erronées pourrait conduire tout
le projet dans une mauvaise direction »). Ce raisonnement — jamais confondre "la mesure est basse"
avec "la mesure n'existe pas" — est le même principe que la distinction `undefined` (donnée
absente) vs `0` (vraie mesure nulle) appliquée à chaque fonction de calcul du rapport, cf. section
"Fiabilité" ci-dessous.

**Section observationnelle non comptée dans les 6 familles (2026-09-21, ajoutée le jour de la
tâche #169, initialement sous le nom "MEMENTO" — cf. `docs/referentiel/memento-weight.md`) :
« KPI — Mémoire des personnages (memento weight) ».** Rapporte le poids moyen réel
du contexte envoyé à Gemini par tour et par personnage (`reportMementoWeight()`, alimenté par
`averageContextWeightByActor()`), affichée dans chaque rapport mais délibérément EXCLUE du calcul
de `dashboardCoverageScore` — même précédent déjà établi pour ARGUS/HARMONIA/Smart Conso API avant
leur intégration (cf. "État d'avancement" ci-dessous) : une section trop récente pour être comptée
comme une famille à part entière tant qu'elle n'a tourné qu'une poignée de fois. À réévaluer une
fois une vraie donnée obtenue après une simulation réelle.

## Fiabilité des calculs (2026-09-19)

*(Demande explicite de l'utilisateur, après deux bugs réels trouvés en construisant cette version :
« assure-toi que cette partie est parfaitement robuste et maîtrisé, sécurisé ».)* Chaque fonction
de calcul de `scripts/kpi-report.mjs` (exportée, testée directement dans `check-house.mjs`) valide
la forme de ses entrées avant de calculer quoi que ce soit : une métrique manquante, du mauvais
type, ou un dénominateur à zéro renvoie `undefined` — **jamais `NaN`, jamais un `0%` qui se ferait
passer pour une vraie mesure**. Le rapport affiche alors "N/A" plutôt qu'un chiffre trompeur. Deux
bugs réels trouvés pendant la construction (corrigés le jour même, jamais laissés "pour plus
tard") : une regex qui ratait les blocs de test utilisant des guillemets doubles (faussant le
dénominateur de la Robustesse du code), et un test dont la propre chaîne de test contenait
littéralement le motif recherché par cette même regex, faussant le décompte une seconde fois par
auto-référence — les deux sont désormais couverts par le test dédié
(`scripts/check-house.mjs`, bloc "kpi-report.mjs scoring function").

## Accès et alertes, pour ce projet

- **Accès** : un bouton dédié, séparé du bouton "Admin" (référentiel) déjà existant, protégé par
  le même code d'accès.
- **Alerte qualité** : remonte à deux endroits — dans le panneau dédié, et mise en évidence dans
  les réponses de l'agent en conversation via `**🚨 ALERTE TABLEAU DE BORD**` en tout début de
  réponse (convention du patron générique, adoptée ici faute de vraie mise en forme disponible
  dans ce terminal de conversation).
- **Rapport dans la conversation** : tant que le site n'est pas publié, l'agent fait spontanément
  un point sur ce tableau de bord à chaque fin de chantier important — pour compenser l'absence de
  vrais visiteurs et de retour terrain à ce stade du projet.
- **Détail complet en fichier, jamais collé dans la conversation** (2026-09-19, demande explicite
  de l'utilisateur : « dans la conversation, tu ne fais que la synthèse globale et relèves les
  points d'attention [...] tu l'envoies dans un fichier séparé [...] avec tous les chiffres »). À
  chaque exécution, `scripts/kpi-report.mjs` produit dans le terminal le rapport détaillé complet
  (à garder pour la lecture humaine directe ou la relecture de l'agent) ET une section finale
  "SYNTHÈSE COMPACTE" — un petit tableau `Famille → % global` plus la liste des points d'attention,
  strictement le seul contenu à recopier dans la conversation. Le détail complet (tous les chiffres,
  tour par tour) va dans `docs/referentiel/kpi-historique.csv`, livré à l'utilisateur en fichier
  joint (jamais collé en clair), qui l'ouvre dans un tableur s'il veut le détail.
- **Archivage du rapport complet + index des évolutions** (2026-09-19, demande explicite de
  l'utilisateur : « archive chaque rapport dans un fichier local [...] un document résume
  l'historique des rapports, ce qu'il y a à noter dans les évolutions [...] sert aussi d'index pour
  retrouver rapidement telle version du rapport par rapport à telle version de la simulation »). En
  plus du CSV (les chiffres bruts), le texte complet de chaque exécution est archivé tel quel dans
  `docs/referentiel/kpi-rapports/<run>.txt`, et `docs/referentiel/kpi-index.md` tient à jour, une
  ligne par run, le lien vers ce fichier archivé et un jugement écrit à la main (par l'agent, jamais
  généré automatiquement) sur ce qui a évolué depuis le run précédent. Procédure complète dans
  `kpi-index.md` lui-même.
- **Historique** : `docs/referentiel/kpi-historique.csv`, un fichier CSV committé dans le dépôt
  (choisi pour son format ultra-compact — un fichier texte consommerait bien plus de tokens à
  relire, un JSON répéterait les mêmes clés à chaque ligne) — une ligne par exécution de
  `kpi-report.mjs`, colonnes auto-descriptives (`KPI_HISTORY_COLUMNS` dans le script). Une famille
  non mesurée cette fois-là laisse sa cellule vide, jamais un faux zéro. C'est un fichier de DONNÉES
  qui change à chaque exécution, pas un document de règles : il vit dans `docs/referentiel/` par
  cohérence de rangement, mais son contenu évolue en continu, contrairement au reste de ce dossier.

## Outil

`scripts/kpi-report.mjs` — à la demande, jamais en continu (Article 8). Sert à la fois
l'utilisateur (consultation manuelle, ou lecture du fichier `kpi-historique.csv` livré) et l'agent
(relecture rapide de l'état du projet en début de session ou après un chantier). Usage :
`node scripts/kpi-report.mjs [nom-du-run]` — le nom du run (ex. `full_sim11`, ou un horodatage par
défaut si omis) identifie la ligne correspondante dans l'historique. Toutes les fonctions de calcul
sont exportées et testées directement dans `scripts/check-house.mjs` (2026-09-19, demande explicite
de l'utilisateur : « un test est-il prévu dédié au tableau de bord ? [...] assure-toi que cette
partie est parfaitement robuste ») — chemin sain (données bien formées → bon pourcentage) ET chemin
de robustesse (donnée manquante/malformée/division par zéro → `undefined`, jamais `NaN` ni un faux
0%) sont couverts, après que deux bugs réels de cette nature ont été trouvés et corrigés en
construisant cette version (cf. section "Fiabilité des calculs" ci-dessus).

## État d'avancement

*(Corrigé le 2026-09-19 lors d'un audit complet des docs de référentiel demandé explicitement par
l'utilisateur : cette section affirmait encore "Chantier 2 — à venir" alors que le chantier 2 avait
déjà été livré le même jour, en totale contradiction avec le reste de ce document — Article 3/13,
traité comme le bug documentaire qu'il est, pas laissé pour plus tard.)*

- **Chantier 1 (2026-09-19) — fait** : famille "Robustesse du code", registre des points fragiles,
  script `kpi-report.mjs`, et le présent découpage architecture/instanciation.
- **Chantier 1bis (2026-09-19) — fait** : efficacité du Smart Breaker, en mémoire process (pas de
  base de données), exposée par le panneau Admin et lue par `kpi-report.mjs` — cf. famille
  "Performance runtime" ci-dessus pour le détail complet.
- **Chantier 2 (2026-09-19) — fait** : KPI global en % pour les 4 familles restantes (Qualité,
  Cohérence logique, Rejouabilité/rythme, Robustesse déjà faite au chantier 1), KPI de couverture
  du tableau de bord lui-même, historique CSV, archive+index des rapports complets, synthèse
  compacte livrée en conversation. Restent hors de ce chantier (pas encore faits, faute d'une vraie
  persistance en base) : l'historique inter-sessions réel (`kpi_session_snapshots`) et un bouton
  dédié dans l'interface — la lecture reste pour l'instant uniquement via `kpi-report.mjs` en ligne
  de commande.
- **Chantier 3 (piste ouverte, pas planifiée)** : creuser en priorité l'un des points listés dans
  `docs/referentiel/points-fragiles.md` (validation qualité de `GEMINI_FALLBACK_MODELS`, relance de
  `check-spirit.mjs`, confirmation du recul adaptatif des clés), si l'un d'eux devient plus urgent
  que l'enchaînement normal des chantiers. Le signal "espace" (répartition des pièces visitées,
  échecs de déplacement) reste une piste non conçue.
- **Idée notée le 2026-09-19, à mettre de côté jusqu'au retour sur ce chantier** (demande explicite
  de l'utilisateur) : un indicateur d'efficacité de la COLLABORATION elle-même — est-ce que l'agent
  comprend bien où en est le travail, comprend bien les demandes et les réponses de l'utilisateur,
  reste bien sur la même longueur d'onde — à consulter par l'agent lui-même régulièrement pour
  vérifier la qualité et la pertinence de son propre travail. Distinct des 6 familles déjà définies
  ci-dessus (qui mesurent le CODE et la PARTIE, pas la conversation de travail) — famille candidate
  à ajouter, ou son propre sujet séparé ; pas encore de conception à ce stade.
- **Note de distinction (2026-09-19)** : ce tableau de bord mesure le CODE et la PARTIE jouée ; il
  est distinct des trois outils de vigilance créés le même jour (ARGUS, HARMONIA, Smart Conso API,
  cf. sections dédiées de CLAUDE.md) qui ont chacun leur propre registre, pas encore raccordés à ce
  tableau de bord général — prématuré tant que chacun n'a tourné qu'une poignée de fois.
