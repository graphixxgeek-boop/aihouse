# Points fragiles ouverts

Registre vivant des points identifiés comme fragiles, incertains, ou en attente d'une décision de
conception — pas une liste de bugs actifs (ceux-là se corrigent directement, cf. Article 3 de
CLAUDE.md), mais des zones où une hypothèse n'a pas encore été vérifiée, où une décision reste à
trancher avec l'utilisateur, ou où une fonctionnalité reste sciemment limitée en attendant une
validation plus poussée.

Ce fichier est lu par `scripts/kpi-report.mjs` (famille "performance/robustesse" du tableau de
bord) : le nombre d'entrées sous chaque section ci-dessous est compté tel quel, donc la structure
(une puce `- ` par point, sous les titres `##`) doit rester stable. Une entrée se retire de ce
fichier dès qu'elle est résolue ou tranchée — jamais laissée ici "au cas où" une fois close.

## Points ouverts

- `GEMINI_FALLBACK_MODELS` n'a pas encore reçu la validation qualité intégrale (lecture humaine de
  tous les scénarios `check-spirit.mjs` et `check-profile.mjs` avec ce modèle comme `GEMINI_MODEL`
  effectif) — reste donc réservé au dev/simulation, jamais activé en production (cf. CLAUDE.md,
  section Smart Breaker).
- `scripts/check-spirit.mjs` (16 scénarios) n'a pas été relancé depuis les derniers changements de
  `lib/lia.ts` (registre de fatigue jour/nuit, ajouté le 2026-09-19) — l'Article 13 de CLAUDE.md
  demande explicitement de le lancer en priorité après un changement de ce fichier, jamais fait
  depuis. Coûte de vrais appels API (Article 8), à lancer à la main, pas en continu.
- Avant la compaction de cette session, une inquiétude avait été notée sur le recul adaptatif de
  rotation des clés Gemini (`lib/gemini-keys.ts`) : risque de sur-pénaliser un 429 transitoire
  comme s'il s'agissait d'un vrai épuisement de quota journalier. Le recul exponentiel avec reset
  au premier succès (déjà implémenté) semble répondre à cette inquiétude, mais ce lien n'a jamais
  été explicitement reconfirmé avec l'utilisateur — à vérifier avec lui plutôt que supposer réglé.
- Le motif "on tourne en rond"/"en boucle"/"disque rayé" apparaît dans 8 des 13 premières notations
  EL-PROFESSOR (`docs/el-professor/synthese-2026-09-19.md`), malgré un principe déjà écrit à
  l'Article 17 censé le couvrir — le registre anti-doublon en place ne semble pas suffire pour cette
  famille précise d'expressions ; à investiguer avant tout nouveau correctif (Article 3/19).
- Répétitions verbatim de motifs de déplacement (`moveReason`) entre Lia et Noé, relevées sur la
  quasi-totalité des 13 premières notations EL-PROFESSOR, un cas extrême dans `full_sim14` (60 %
  des déplacements recyclant l'une de 6 phrases identiques) — le pool de motifs semble trop
  restreint ou insuffisamment cloisonné par personnage malgré le principe de l'Article 10.
- Biais possible dans `generateDossierFragment()` qui sous-évalue l'hostilité réellement vécue par
  rapport au transcript (relevé dans 3 des 13 premières notations EL-PROFESSOR : `full_sim4`,
  `full_sim9`, `full_sim10`) — à vérifier comme un sujet à part, distinct d'un cas isolé.
- Les paliers rares de la charte (colère réellement débridée, silence méprisant de Lia, vulnérabilité
  ou respect sincères, dispute grave Lia/Noé) restent quasiment jamais sollicités dans les 13
  premières simulations notées par EL-PROFESSOR — une future simulation Article 18 devrait les
  pousser délibérément pour vérifier qu'ils fonctionnent, pas seulement le registre habituel.
