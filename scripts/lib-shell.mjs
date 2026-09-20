// Petit assistant partagé pour lancer une commande shell sans jamais faire planter l'appelant sur
// un code de sortie non nul (2026-09-19, extrait après avoir trouvé la même fonction réécrite à
// l'identique dans trois scripts — always-new-code.mjs, check-level-target.mjs,
// hyper-scan-checkpoint.mjs — exactement le genre de duplication que la nouvelle règle de
// mutualisation de docs/regles-de-travail.md §7ter est censée empêcher désormais).

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// PERSONNAGES vs MEMBRE DE L'ÉQUIPE (2026-09-21, tâche #245) — garde-fou mécanique contre une vraie
// erreur commise ce soir : proposer d'appliquer MEMENTO (pensé pour la mémoire narrative de Lia/Noé)
// comme condition du badge des membres de l'équipe (scripts comme ARGUS/HARMONIA). Root-cause :
// l'organigramme (Direction/Équipe noyau/Membre de l'équipe/VIP, docs/suivi #222) ne mentionnait
// nulle part Lia et Noé, laissant la case vide qui a permis la confusion. Constante partagée ici
// (jamais dans le-coordinateur.mjs, pour que MEMENTO — futur — puisse l'importer aussi sans créer de
// cycle) : les Personnages ne sont JAMAIS des membres de l'équipe, et réciproquement — aucun outil
// pensé pour l'un ne doit jamais s'appliquer à l'autre (badge/blueprint/couverture AXA-CHECK pour les
// membres de l'équipe ; cohérence narrative/mémoire pour les Personnages, jamais l'inverse).
export const PERSONNAGES = new Set(["Lia", "Noé", "Noe"]);

export function assertNotAPersonnage(name, callerLabel) {
  if (PERSONNAGES.has(name)) {
    throw new Error(`${callerLabel} ne s'applique jamais à un Personnage ("${name}") — Lia et Noé sont une catégorie structurellement distincte des membres de l'équipe (cf. docs/suivi tâche #245). Un outil pensé pour la mémoire/cohérence narrative des personnages (ex. MEMENTO) ne doit jamais recouper un outil de badge/blueprint/couverture de code.`);
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
