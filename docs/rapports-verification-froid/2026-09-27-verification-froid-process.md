# Vérification à froid du chantier process — tâches #436 et #773

**Produit le** : dimanche 27 septembre 2026 à 13h48 (UTC) — heure LUE via `node scripts/agent-du-temps.mjs`, source « système » (les deux API de temps rendent HTTP 403 dans ce conteneur, Article 32 faille 2).
**Outils réellement lancés** : `scripts/god-of-all-process.mjs` et `scripts/angel-of-ia-process.mjs`, passage du 2026-09-27 13h48 UTC · `scripts/check-house.mjs` (292 contrôles, exit 0).

---

## 1. Les rapports bruts des deux outils

Ils sont déposés à côté plutôt qu'insérés ici, et ce n'est pas une commodité : recopiés dans ce
document, ils le rendaient jumeau de `docs/plans/schemas-de-process.md` — le détecteur de documents
jumeaux l'a refusé au commit, et il avait raison. Le livrable reste le FICHIER produit par l'outil
(Article 31), simplement rangé là où il ne se duplique pas.

- `2026-09-27-god-of-all-process.txt` — le passage de god-of-all-process
- `2026-09-27-angel-of-ia-process.txt` — le passage d'angel-of-ia-process

## 3. Analyse — ce que la relance à froid a réellement trouvé

L'Article 25 dit qu'on revient à froid **en relançant les outils**, jamais en se relisant de
mémoire. C'est exactement ce qui s'est passé ici : la relecture n'aurait rien donné, et l'outil a
rendu **un défaut STRUCTUREL, pas une négligence**.

**LA TROUVAILLE PRINCIPALE — un gardien partagé accusait ses frères.** Le détecteur de dettes
documentaires annonçait **8 dettes**, toutes sur les commits du jour. En les instruisant une par
une, aucune n'était réelle : **quatre contrôleurs sur douze gardent PLUSIEURS process** (god en
garde trois — semi-autonome, nuit, meta ; moïse deux ; circle-process-guardian deux ;
check-tasks-details deux). Tout changement de l'un d'eux était donc facturé à TOUS ses process. Le
point de contrôle de nuit, documenté correctement dans le document du mode autonome, produisait une
dette sur le mode SEMI-autonome, qu'il ne touche pas.

**Pourquoi ça compte plus qu'un faux positif ordinaire** : le seul moyen de faire taire cette
accusation était de documenter des process que le changement ne concernait pas. Un garde-fou qui
accuse à tort cesse d'être lu (**leçon L4**) — et celui-ci le faisait STRUCTURELLEMENT, à chaque
commit, sans pouvoir se corriger seul.

**La règle retenue est un PRINCIPE, pas une rustine.** Première version essayée : dégrader quand un
process frère avait été documenté. Mesurée, elle ne rattrapait que **4 des 8** — elle décrivait le
symptôme (« un frère a bougé »), pas la cause. La règle finale : *un changement de gardien PARTAGÉ
ne concerne un process que si le diff NOMME sa déclaration (`slug: "…"`) ou le chemin de son
document.* Elle est **scopée à l'ambiguïté qu'elle corrige** : un gardien qui ne garde qu'un seul
process ne pose aucune question, et la dette y reste pleine — le cas fondateur de 2026-09-25 ne
bouge pas d'un pouce.

**Mesure après / avant** : **8 dettes → 2**, et les 6 disparues sont devenues des soupçons affichés
et nommés, jamais des silences. Les **2 restantes sont réelles** (angel/xp-ia, gardien non partagé).

**TROIS DÉFAUTS PAYÉS EN CHEMIN, tous trouvés par le filet et aucun par la relecture :**

1. **L'ordre des arguments de `git show`** — j'ai écrit `-- <fichier> <hash>` ; git lit le hash
   comme un chemin et rend le diff de HEAD pour tous les commits. **C'est mot pour mot le défaut de
   la tâche #1014 corrigé le matin même** : la leçon **L37** (« corriger une occurrence ne corrige
   pas la CLASSE ») vérifiée sur son propre auteur, quelques heures après son écriture.
2. **Un slug qui collisionne avec la prose** — `nuit` ressortait trois fois sur un diff qui parlait
   du « point de contrôle de nuit ». Corrigé en cherchant la DÉCLARATION (`slug: "nuit"`), qui ne
   s'écrit jamais par accident dans une phrase.
3. **Un diff vide pris pour « ne nomme pas le process »** — c'est une non-mesure, pas une absolution
   (**leçon L5**). Un test existant l'a refusé.

**CE QUE LE FILET A REFUSÉ, ET IL AVAIT RAISON.** Ma première version appliquait le test du nom à
TOUS les gardiens. Le test fondateur de #943 est tombé : elle aurait absous un commit qui change le
**seul** gardien d'un process sans rien documenter — précisément le trou que ce détecteur bouche.
Le scoping aux gardiens partagés est né de ce refus, pas d'une intuition.

**CONTRE-TEST DANS LES DEUX SENS (BP4)**, ajouté au filet (`testGardienPartageNAccusePlusSesFreres`) :
un diff qui nomme le process DOIT rester une dette pleine ; un diff qui ne le nomme pas DOIT devenir
un soupçon. Les deux vérifiés.

**LE RESTE DU PÉRIMÈTRE EST SAIN**, et ce n'est pas une impression : les 11 process déclarés ont
tous un gardien, tous un document qui existe, tous les cinq champs du gabarit ; aucune sonde cassée ;
les 3 tensions déclarées entre process sont toutes résolues et rattachées à un process vivant.

---

## 4. Plan d'action

- **RETENU — payé dans ce commit** · `angel-of-ia-process.mjs` / `docs/xp-ia-process-detail.md` :
  les 2 dettes réelles. Le document ne disait pas qu'angel porte TOUTES les règles de conduite du
  projet et que ce process n'y loge qu'une règle parmi d'autres. Conséquence écrite noir sur blanc :
  un changement d'angel ne concerne ce process-ci que s'il touche `xp-lecons`. Tâche **#773**.
- **RETENU — payé dans ce commit** · le défaut du gardien partagé, sa règle, son contre-test et sa
  mesure. Tâche **#436**.
- **RETENU — tâche #1021 ouverte** · « Sonder le quota Gemini (Smart Breaker) » reste une activité à
  enjeu sans process écrit, signalée par god. Elle consomme de vrais appels pour un diagnostic et,
  lancée au mauvais moment, aggrave le blocage qu'elle mesure (Article 22). À écrire, ou à déclarer
  noir sur blanc pourquoi elle n'en a pas besoin.
- **ÉCARTÉ, avec sa raison** · les 6 soupçons restants. Ils portent tous sur des gardiens partagés
  où le changement ne nommait pas le process ; les instruire un par un a été le travail de cette
  vérification, et ils restent AFFICHÉS plutôt que supprimés — dégrader n'est pas faire taire.
- **ÉCARTÉ, avec sa raison** · élargir le même principe aux gardiens NON partagés. Le filet l'a
  explicitement refusé (§3) : ce serait rouvrir le trou de 2026-09-25.
