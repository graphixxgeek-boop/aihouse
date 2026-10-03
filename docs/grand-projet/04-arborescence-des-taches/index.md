# L'arborescence des tâches du GRAND PROJET

*(Écrit le 2026-10-02, tâche #1478. Ce dossier était **VIDE** depuis sa création le 2026-09-28,
alors que la tâche #1110 était déclarée « en cours ». L'écart est consigné plutôt que corrigé en
silence : un avancement annoncé qui n'existe pas fait attendre quelque chose qui ne vient pas.)*

**Ce document n'est pas écrit à la main.** Ses chiffres sont dérivés du suivi réel par
`check-tasks-details`, et se revérifient avec :

```
node -e "import('./scripts/check-tasks-details.mjs').then(C => { … })"
```

Le détail de la commande vit dans `docs/livrables/ou-en-est-le-grand-changement.md`, qui est la
version lisible de ce dossier.

---

## LES QUATRE ÉTAGES

Le GRAND PROJET n'est pas une liste de tâches : c'est une **cascade**, et chaque étage suppose le
précédent tranché. C'est la raison pour laquelle 19 tâches sur 43 attendent une décision plutôt
qu'un travail.

**Les quatre étages, et les tâches qui les portent** — chacun suppose le précédent tranché.

```
ÉTAGE 0 — LE BUT ULTIME                                    #1144, #1143
   « pourquoi ce projet existe » — validé le 2026-09-30, reste philo et politique
      │
      ▼
ÉTAGE 1 — LA PHILOSOPHIE ET LA POLITIQUE                   #1417, #1419, #1422, #1423, #1425
   ce en quoi le projet croit, et comment il l'applique
   RÉVÉLÉE mécaniquement ; 104 convictions sur 106 restent hors du document
      │
      ▼
ÉTAGE 2 — LES TROIS STRATÉGIES GLOBALES                    #1127, #1128, #1138, #1336, #1482
   l'Agence · le Jeu · les deux ensemble
   le document maître et son porteur ne sont pas tranchés
      │
      ▼
ÉTAGE 3 — LES CHANTIERS ET LEURS TÂCHES                    tout le reste
   classification, export, rationalisation, renommage, PACK DÉCOUVERTE
```

**La règle de la cascade, et c'est elle qui explique tout** : une tâche de l'étage 3 exécutée
avant que l'étage 2 soit tranché devra être refaite. C'est sa propre consigne — « mener un grand
changement en embarquant plusieurs sujets à la fois, plutôt que de tout faire à la file et tout
devoir défaire à chaque fois ».

---

## LES TROIS BRANCHES, ET CE QU'ELLES CONTIENNENT

### Branche A — LA CASCADE DE DÉCISION *(19 tâches, toutes À TRANCHER)*

Elles ne demandent aucun travail : elles demandent une réponse.

| # | Ce qui attend |
|---|---|
| #1125 | la COUVERTURE de sa demande — la preuve que rien n'est oublié |
| #1126 | le BUDGET D'OBLIGATIONS — aucune nouvelle sans une retirée |
| #1127 | le DOCUMENT MAÎTRE de stratégie globale, et qui le porte |
| #1128 | l'axe STRATÉGIE sur les tâches et sur la classification |
| #1129 | les DEUX règles de travail posées que rien ne porte |
| #1130 | la DYNAMIQUE D'ESCALADE tâches ↔ stratégie ↔ philosophie |
| #1131 | l'outil qui RÉAGIT quand quelque chose est fait à l'envers de la stratégie |
| #1132 | les TROIS BORNES qui diront « l'Agence est terminée » *(proposées en #1362)* |
| #1133 | la PASSE GÉNÉRALE : objectifs, KPI et RH alignés |
| #1134 | adapter la CHARTE, les RÈGLES, le RÉFÉRENTIEL et les PROCESS |
| #1135 | réorganiser les fichiers de STRATÉGIES et de NOTES |
| #1136 | le PACK DÉCOUVERTE et le système qui le livre *(point fait en #1476)* |
| #1137 | la STRATÉGIE DU JEU — la troisième partie de sa commande, jamais écrite |
| #1138 | les DEUX stratégies globales séparées |
| #1139 | le CHANTIER FINALISATION — version complète puis version light |
| #1140 | la version de l'Agence AVEC ou SANS analyse-simulation |
| #1141 | l'ORDRE remis d'aplomb : calibrage → stratégie → plan → tâches |
| #1144 | le BUT ULTIME porté par Philo et Politique |
| #1149 | LE CHEMIN : sept étapes ordonnées, à la place de sept fils parallèles |

### Branche B — CE QUI AVANCE SANS ATTENDRE *(14 tâches ouvertes)*

Ce sont les travaux que la cascade ne bloque pas, parce qu'ils **produisent la matière** dont les
décisions ont besoin.

#1100 · #1101 · #1114 · #1117 · #1118 · #1119 · #1120 · #1121 · #1143 · #1151 · #1163 · #1362 ·
#1476 · #1478

### Branche C — CE QUI A ÉTÉ RÉVÉLÉ ET ATTEND SA SUITE *(9 tâches)*

#1328 · #1336 · #1344 · #1417 · #1419 · #1422 · #1423 · #1425 · #1440

Ces neuf-là partagent une caractéristique que rien d'autre ne partage : **la mesure est faite, la
décision ne l'est pas.** Les 104 convictions hors boussole (#1422) en sont le cas type — révéler
est gratuit, corriger se paie, et le paiement appartient à l'utilisateur.

---

## CE QUE CETTE ARBORESCENCE REMPLACE

Rien. **C'est sa première version**, et elle existe parce qu'il a demandé un état des lieux et que
le document censé le porter n'avait jamais été écrit.

**Elle se régénère** : les numéros ci-dessus sont ceux du thème « Projet » du suivi réel. Une tâche
qui rejoint ce thème demain apparaîtra au prochain passage, sans toucher à ce fichier — à condition
de relancer la dérivation plutôt que de recopier cette liste (Article 24).
