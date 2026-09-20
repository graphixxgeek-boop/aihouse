// Petit assistant partagé pour lancer une commande shell sans jamais faire planter l'appelant sur
// un code de sortie non nul (2026-09-19, extrait après avoir trouvé la même fonction réécrite à
// l'identique dans trois scripts — always-new-code.mjs, check-level-target.mjs,
// hyper-scan-checkpoint.mjs — exactement le genre de duplication que la nouvelle règle de
// mutualisation de docs/regles-de-travail.md §7ter est censée empêcher désormais).

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// PERSONNAGES — HORS DE L'ÉQUIPE, JAMAIS UNE CATÉGORIE DE L'ORGANIGRAMME (2026-09-21, tâche #245,
// corrigé le même soir après un second quasi-recouvrement). Root-cause réelle, en deux temps :
// (1) une confusion commise ce soir-là — proposer d'appliquer MEMENTO (pensé pour la mémoire
// narrative de Lia/Noé) comme condition du badge des membres de l'équipe (scripts comme
// ARGUS/HARMONIA) ; corrigée sur le moment en ajoutant "Personnages" comme une 5e catégorie DE
// L'ORGANIGRAMME lui-même (à côté de Direction/Équipe noyau/Membre de l'équipe/VIP). (2) Cette
// correction était elle-même la mauvaise forme de réparation : en gardant Lia/Noé DANS le même
// tableau que l'équipe (juste une case de plus), elle laissait la porte ouverte à ce que le même
// type de confusion revienne (constaté une seconde fois en construisant le menu PRESTATIONS de
// MEMENTO). Root-cause plus profonde encore, antérieure à #245 : la toute première note de
// conception de CASSANDRA-RH (docs/suivi 2026-09-20T09:40Z) prévoyait déjà qu'elle "noterait TOUS
// les membres de l'équipe [...] les mascottes Lia/Noé" — l'idée fondatrice mélangeait les deux
// avant même qu'une séparation existe. Décision finale (demande explicite de l'utilisateur,
// 2026-09-21) : Lia et Noé n'ont AUCUNE existence dans l'équipe — ce sont des personnages de la
// simulation, un domaine entièrement séparé (charte de contenu CLAUDE.md), jamais une case de
// l'organigramme de travail (docs/regles-de-travail.md). Cette constante n'est donc pas une
// catégorie interne à ranger à côté des autres : c'est une LISTE D'EXCLUSION, un pare-feu au bord
// du domaine équipe. Partagée ici (jamais dans le-coordinateur.mjs, pour que memory-audit puisse
// l'importer aussi sans créer de cycle) : aucun mécanisme pensé pour l'équipe (badge, PRESTATIONS,
// blueprint, couverture AXA-CHECK) ne doit jamais s'appliquer à Lia/Noé, et réciproquement aucun
// mécanisme de mémoire/cohérence narrative pensée pour eux (memory-audit) ne doit jamais s'appliquer
// à un script.
export const PERSONNAGES = new Set(["Lia", "Noé", "Noe"]);

export function assertNotAPersonnage(name, callerLabel) {
  if (PERSONNAGES.has(name)) {
    throw new Error(`${callerLabel} ne s'applique jamais à un Personnage ("${name}") — Lia et Noé n'ont aucune existence dans l'équipe de travail, ce sont des personnages de la simulation (cf. docs/suivi tâche #245 et sa correction du 2026-09-21). Un outil pensé pour la mémoire/cohérence narrative des personnages (ex. memory-audit) ne doit jamais recouper un outil de badge/blueprint/couverture de code.`);
  }
}

export function sh(cmd, { cwd, verbose = false, env } = {}) {
  try {
    return execSync(cmd, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return verbose ? (e.stdout || "") + "\n[erreur: " + e.message + "]" : e.stdout || "";
  }
}

// Extrait le 2026-09-21 de check-tasks-details.mjs (même règle de mutualisation §7ter que sh()
// ci-dessus) : circle-tasks.mjs en a aussi besoin (garde-fou de fraîcheur du catalogue de la
// Ronde) et importer directement depuis check-tasks-details.mjs créerait un cycle (celui-ci importe
// déjà daysSince() de circle-tasks.mjs). `root` doit être fourni SANS séparateur final (rappel
// trouvé le 2026-09-20 : un simple `slice(root.length + 1)` grignotait la première lettre de
// "docs/", faussant silencieusement toute vérification de registre en aval).
export function walkDocsPaths(dir, root, out = new Set()) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    out.add(full.slice(root.length).replace(/^[\\/]/, "").replace(/\\/g, "/"));
    if (entry.isDirectory()) walkDocsPaths(full, root, out);
  }
  return out;
}
