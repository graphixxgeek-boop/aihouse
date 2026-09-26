# Registre de data-archangel

Deux commandes écrivent ou rendent quelque chose ici :

- `node scripts/data-archangel.mjs notes <sujet>` — dit **où** un sujet a déjà été traité, dans les
  cinq lieux où vivent les notes. Geste de l'Article 30, avant d'ouvrir un chantier : il doit rester
  instantané, donc il n'écrit rien.
- `node scripts/data-archangel.mjs dossier <sujet>` — **rassemble** : extraits verbatim, état réel de
  chaque ligne de suivi, et les tâches dont l'état se contredit. Écrit un fichier
  `dossier-<sujet>-<date>.md` dans ce dossier.

## Passages

### 2026-09-25 — `dossier classification` (tâche #742)

Premier passage réel. **57 fichiers portent le sujet · 44 lignes de suivi retrouvées** :
31 décidées · 12 ouvertes · 1 en attente de sa décision · 0 illisible.

**Deux défauts de l'outil trouvés et corrigés à ce passage même**, tous deux du même genre — une
sonde qui ne peut pas voir rend exactement ce que rend une sonde qui n'a rien trouvé :

1. Un plafond d'extraits par fichier s'appliquait aussi aux lignes de suivi. Comme elles vivent
   toutes dans le même fichier de session, il en rendait **9 au lieu de 44**. Le plafond ne concerne
   plus que la prose : une décision perdue est exactement ce que ce dossier existe pour empêcher.
2. Le motif de l'état « terminé » exigeait la forme féminine. Huit lignes étaient classées « état
   illisible » pour un accent au masculin. Le vocabulaire est désormais **lu dans le suivi réel**
   (`terminée — fidèle` 302 × · `terminée` 178 × · `Ouverte` 66 × · `TERMINÉ` 24 × · `à faire` 21 ×).

**Une trouvaille que personne ne cherchait** : **six numéros de tâche portent deux lignes** dont les
états se contredisent (#754 « En attente de sa décision » et « Terminée », #755 « Ouverte » et
« Terminée », entre autres). Ce n'est pas illégitime dans un journal où l'on ajoute sans réécrire,
mais un lecteur qui cherche L'ÉTAT d'une tâche en trouve deux et rien ne lui dit lequel fait foi.
**Signalé, jamais arbitré** — c'est une règle de tenue du suivi, donc une décision de l'utilisateur.

## La classification des rapports et des datas (depuis le 2026-09-26)

`node scripts/data-archangel.mjs classification` range les rapports réels sur trois axes — le SUJET
traité, l'ÉQUIPE propriétaire (lue dans les registres déclarés), la FONCTION — croise les deux
premiers, et intègre les datas qui ne sont pas des rapports (journaux locaux, séries chiffrées).
Elle écrit **deux** fichiers par passage : `classification-<date>.txt` et `.html`.

`node scripts/data-archangel.mjs classification ronde` ajoute la vérification en lecture seule des
rapports de Ronde (tâche #612) : `verification-ronde-<date>.txt`.

**Mise à jour en continu, et ce que ça veut dire exactement** : le rapport ne contient aucun chiffre
figé — il relit le dépôt réel à chaque passage, donc il ne peut pas se périmer. Et ce passage est
déclenché par l'item de Ronde `data-archangel-scan`, jamais par la mémoire de l'agent. Les deux
ensemble font la continuité ; l'un sans l'autre ne la ferait pas.

Le document qui la PRÉSENTE (à quoi servent les axes, ce qu'elle refuse de ranger, ce qui est hors
périmètre) : `docs/referentiel/classification-des-rapports-et-datas.md`.

| Date | Rapports classés | Sans sujet | Sans équipe | Fichiers |
|---|---|---|---|---|
| 2026-09-26 | 290 en 40 dossiers | 6 | 0 (4 déclarés hors registre, avec raison) | `classification-2026-09-26.txt` · `.html` · `verification-ronde-2026-09-26.txt` |
