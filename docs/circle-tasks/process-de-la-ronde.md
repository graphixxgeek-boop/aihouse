<!-- DOCUMENT GÉNÉRÉ — produit intégralement par un outil, aucune ligne n'est écrite à la main -->
# Le process de la Ronde, de bout en bout

> Produit par `node scripts/circle-tasks.mjs process` le 2026-10-04T03:47Z (heure de source système).
> Ta demande : « le process ronde doit etre revu de bout en bout : 1/ tu me donneras les etapes du process 2/ je te redonnerai le vrai process que je veux ».

**Étape 1 sur 2.** Ce document rend le process TEL QU'IL EST. Il ne commente rien, ne défend rien et ne recommande rien : la réorganisation est la tienne.

```
LE PROCESS DE LA RONDE, TEL QU'IL EST AUJOURD'HUI — 12 étape(s), 3 verrou(s) d'ouverture, 45 item(s) exécutable(s).

Ce document DÉCRIT, il ne défend rien : aucune étape n'y est justifiée, aucun item n'y est mis en avant.
Le process est écrit dans : docs/circle-process-detail.txt
Il est surveillé par : scripts/circle-process-guardian.mjs — ce contrôleur peut BLOQUER une Ronde.

## ① AVANT DE LANCER — les verrous d'ouverture

  · numerotation-du-suivi — numéros de tâche en double ou non croissants dans docs/suivi/
  · outil-muet-au-compteur — outils qui ont une ligne de commande et n'enregistrent jamais leur passage
  · registre-hors-ronde — registres réels sans item de Ronde ni couverture automatique documentée

## ② LES ÉTAPES, DANS L'ORDRE DÉCLARÉ

   1. poser la fenêtre à cocher (AUTO/PRIME/GOAT)
      clé : questionnaire · aucune trace vérifiable (à confirmer soi-même)
   2. annoncer la durée ET la consommation estimées du programme réellement coché, avant de lancer quoi que ce soit
      clé : estimation · trace attendue : docs/circle-tasks/estimations.md
   3. en fin de Ronde, confronter l'estimation au réel et consigner l'écart — c'est lui qui corrige l'estimation suivante, jamais une nouvelle intuition
      clé : comparaison · trace attendue : docs/circle-tasks/estimations.md
   4. exécuter les items cochés
      clé : execution · trace attendue : docs/
   5. produire le rapport de fin de Ronde
      clé : rapport · trace attendue : .circle-tasks-run-summary-latest.txt
   6. poser la fenêtre de réponses sur les points problématiques de son évaluation, avant de clore
      clé : voix-utilisateur · trace attendue : docs/angel-of-ia-process/reponses-evaluation.md
   7. trier les constats des rapports — jamais un récapitulatif, un tri
      clé : analyse · trace attendue : docs/circle-tasks/
   8. donner à chaque constat son état : retenu / écarté avec sa raison / à trancher (le plan vit DANS l'analyse, jamais ailleurs)
      clé : plan-action · trace attendue : docs/circle-tasks/
   9. inscrire dans docs/suivi/ les tâches issues des constats retenus
      clé : taches · trace attendue : docs/suivi/sessions/
  10. chaque signal écrit dans le registre d'un outil enregistre la contribution (recordCircleItemReport → recordToolContribution)
      clé : contributions · trace attendue : .tool-usage-history.json
  11. poser les 10 questions d'alignement — 5 de fond avec ma réponse PRÉVUE écrite avant la sienne, 5 de détail sur les frontières obscures ; un écart sur le fond est un problème GRAVE, jamais une correction à noter
      clé : alignement · trace attendue : docs/circle-tasks/alignement.json
  12. enregistrer la Ronde comme faite
      clé : enregistrement · trace attendue : .circle-tasks-last-run.json

## ③ CE QUE LA RONDE PEUT EXÉCUTER — 45 items, par thème

### Suivi & référentiels (7)
  · [profil] Mettre à jour le profil utilisateur — gratuit — lecture/écriture de texte, zéro appel API
  · [sauvegarde] Produire et LIVRER la sauvegarde du projet — gratuit — une archive git et une lecture de fichiers, zéro appel API
  · [referentiel] Relire tous les documents de référence — gratuit — lecture, aucun appel API
  · [correctifs] Relire les carnets de correctifs et points fragiles — gratuit — lecture, aucun appel API
  · [suivi-open-tasks-signal] Signaler la tâche ouverte la plus ancienne (docs/suivi) — gratuit — lecture des fichiers de session déjà écrits, aucun appel API
  · [agent-des-noms] Les noms : lesquels traînent en provisoire, lesquels n'ont jamais été validés ? — gratuit — relit les fichiers locaux, aucun appel API
  · [agent-du-temps] Tester l'agent du TEMPS — d'où vient l'heure, et les estimations tiennent-elles ? — gratuit — une requête HTTP de temps, et l'horloge système en repli

### Suivi des chantiers (6)
  · [chantier-preliminaire-signal] Vérifier que les idées de gros chantier sont bien dans leur fichier préliminaire, et que leur valeur y est vraiment restituée — gratuit — relit docs/suivi/ et croise avec le registre CHANTIER_PRELIMINARY_FILES, aucun appel API
  · [idee-a-trancher-signal] Vérifier qu'aucune idée nouvelle n'attend encore une décision (fichier / abandon / entre-deux) — gratuit — relit docs/suivi/ et docs/idees-a-trancher.md, aucun appel API
  · [ou-on-en-est] Où on en est — ce qui a été fait, et ce que le projet y a gagné — gratuit — relecture seule de docs/suivi/, zéro appel API
  · [check-tasks-report] check-tasks-details — rapport de Ronde (chiffres vérifiés, état du projet, œil critique, 3 zooms) — gratuit — relecture seule de docs/suivi/, zéro appel API
  · [god-of-all-process-conformite] Conformité des process — god-of-all-process (rapport unique, coupable nommé) — gratuit — relit les traces réelles sur le disque et relaie les verdicts des gardiens secondaires, zéro appel API
  · [fils-de-discussion] LES FILS DE DISCUSSION — qui a la balle, et depuis quand — gratuit (zéro appel réseau) — il lit des fichiers déjà écrits

### KPI & scans (11)
  · [the-king-signal] Digest THE-KING : fraîcheur et tensions possibles de la philosophie — gratuit — relit un seul fichier local, zéro appel API
  · [controle-fidelite-gouvernance] Contrôle de fidélité du document de gouvernance (article 72) — la philosophie remonte-t-elle ? — gratuit — relance la révélation sur le corpus local, zéro appel API
  · [kpi] Lancer le rapport KPI (familles gratuites) — gratuit — node scripts/kpi-report.mjs, zéro nouvel appel API
  · [safe-export-kits] Scanner les kits d'export — de chaque fichier ET de l'Agence elle-même — gratuit — relit l'inventaire des sources et l'arborescence docs/, aucun appel API
  · [export-central] Le rapport EXPORT central — où on en est, ce qu'on sait faire, ce qu'on ne sait pas encore faire — gratuit — il n'appelle que des mesures déjà écrites et relit la file de tâches, zéro appel API
  · [systeme-des-index] Le système des index — tous les fichiers sont-ils annoncés quelque part ? — gratuit — relit l'arborescence docs/ et les index, aucun appel API
  · [documents-jumeaux] Deux documents qui disent la même chose — gratuit — relit l'arborescence docs/ et compare les vocabulaires, aucun appel API
  · [recap-evaluations] Récapitulatif complet des évaluations — qui juge qui, sur quelles bases, avec quel résultat — gratuit — relit des mesures déjà collectées par huit outils, aucun appel API
  · [smart-conso-api-scan] Scanner les schémas de consommation API (Smart Conso API) — gratuit — node scripts/smart-conso-api.mjs scan, lecture de l'historique déjà accumulé, zéro nouvel appel API
  · [smart-conso-token-scan] Scanner le poids des documents de travail (SMART-CONSO-TOKEN) — gratuit — scan de portée Global, lecture de fichiers, zéro appel API
  · [data-archangel-scan] La donnée produite par l'équipe est-elle exploitée, ou écrite pour rien ? — gratuit — relit le code des scripts et la date des fichiers déjà sur le disque, zéro appel API

### Qualité du code (6)
  · [pure-gold-unity-scan] Vérifier qu'aucun nouveau rapport n'échappe au gabarit partagé — gratuit — relit le code des outils tenus par le gabarit, aucun appel API
  · [clean-dirty-old-signal] Vérifier depuis quand CLEAN-DIRTY-OLD n'a pas été consulté — gratuit — lecture du registre de passages déjà accumulé, jamais le vrai balayage (ça, c'est le travail réel de CLEAN-DIRTY-OLD une fois lancé)
  · [html-wiring-check] Vérifier que tous les rapports produisent bien leur copie HTML — gratuit — lecture du code source de chaque script déjà enregistré, aucun appel API
  · [ecotoken-scan] Vérifier le poids en tokens de CLAUDE.md (allègement périodique) — gratuit — relit CLAUDE.md et applique les fonctions déjà exportées par SMART-CONSO-TOKEN, aucun appel API
  · [integration-audit] Chaque membre est-il RÉELLEMENT intégré partout (badge, docs, catalogue, Ronde) ? — gratuit — relit la table maîtresse, les documents et les registres déjà sur le disque, zéro appel API
  · [organigramme-signal] Organigramme de l'Agence Codex, reconstruit depuis les données réelles — CASSANDRA-RH — gratuit — dérive la table maîtresse, AGENT_CATEGORIES, GARDIEN_DOMAINS et les émetteurs de rapport, zéro appel API

### Passages réels (smoke run) (4)
  · [tool-brain-report] Rapport tool-brain (usage réel des outils + auto-diagnostic) — gratuit — relit .tool-usage-history.json (compteur déjà existant), zéro appel API
  · [profil-utilisateur-guard] Lancer le vrai garde-fou du dossier profil-utilisateur (fiches orphelines, liens morts) — gratuit — node scripts/check-profil-utilisateur.mjs, lecture de fichiers déjà sur disque, zéro appel API
  · [network-check-run] Lancer une vraie synthèse LE-COORDINATEUR (runNetworkCheck) — gratuit — zéro appel API, mais plus lourd que les autres items de cette liste : relance check-house.mjs avec instrumentation de couverture V8
  · [coordinateur-catalogue] Mettre à jour le catalogue d'offres nommé (LE-COORDINATEUR) — gratuit — node scripts/le-coordinateur.mjs catalogue, écrit une nouvelle version seulement si PRESTATIONS a réellement changé, zéro appel API

### Qualité & fun (6)
  · [tool-learning] Vérifier que les outils apprennent — et que je les aide vraiment à progresser — gratuit — relit les registres et les traces déjà produits, aucun appel API
  · [the-equalizer] Tout est-il à niveau ? — un verdict par domaine, et ce que personne ne vérifie — gratuit — relit le référentiel des standards et relaie des verdicts déjà calculés
  · [dream-team-photo] Régénérer la « photo » de la dream team (récap des outils nommés) — gratuit — lecture de la liste des outils déjà nommés dans CLAUDE.md/docs/regles-de-travail.md, mise en forme, zéro appel API
  · [the-screener] Capturer et noter 2 captures d'écran (THE-SCREENER) — zéro appel à l'API Gemini pour le mécanisme lui-même (capture Playwright locale) — CONDITIONNEL : n'a de sens que si une session/un serveur avec un vrai état est déjà en cours ; ne jamais lancer une nouvelle simulation juste pour cet item
  · [ines-official-signal] Proposer une nouvelle édition INES-official si l'ancienne date — gratuit — lecture de l'index existant, l'édition elle-même (si proposée ensuite) reste 0 appel API
  · [cassandra-rh-signal] Bilan RH complet de l'équipe (effectif, badges, tendance KPI) — CASSANDRA-RH — gratuit — relit checkAgentOnboarding()/kpi-historique.csv/tool-usage.mjs, jamais un second calcul, zéro appel API malgré le mode complet

### Audit lourd (5)
  · [x-port-blindtest] Tester à l'aveugle la QUALITÉ d'un kit d'export (1 membre par passage) — COÛTEUX — un agent séparé, ~37 000 jetons par lancement (Article 22/SMART-CONSO-TOKEN à consulter AVANT)
  · [the-final-judge] THE-FINAL-JUDGE — audit indépendant — ⚠️🔴 COÛTEUX — ~37 000 tokens fixes (agent séparé), quel que soit le palier choisi
  · [the-deep-reader] THE-DEEP-READER — relecture lourde du suivi (conversation vs docs/suivi) — ⚠️🔴 COÛTEUX — ~37 000 tokens fixes (agent séparé) + volume réel de la conversation à relire (variable, jamais fixe)
  · [hyper-scan-checkpoint-light] HYPER-SCAN-CHECKPOINT — version légère (couche mécanique) — gratuit (zéro appel réseau) — mais la checklist qualitative qui suit reste un vrai passage à part, jamais automatisable
  · [jesus-le-sauveur] JESUS-LE-SAUVEUR — ce qui freine le projet, causes indirectes comprises — gratuit (zéro appel réseau) — il lit des registres déjà écrits, il n'en produit aucun nouveau

```

<!-- /DOCUMENT GÉNÉRÉ -->
