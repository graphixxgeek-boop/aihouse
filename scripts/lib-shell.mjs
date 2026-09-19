// Petit assistant partagé pour lancer une commande shell sans jamais faire planter l'appelant sur
// un code de sortie non nul (2026-09-19, extrait après avoir trouvé la même fonction réécrite à
// l'identique dans trois scripts — always-new-code.mjs, check-level-target.mjs,
// hyper-scan-checkpoint.mjs — exactement le genre de duplication que la nouvelle règle de
// mutualisation de docs/regles-de-travail.md §7ter est censée empêcher désormais).

import { execSync } from "node:child_process";

export function sh(cmd, { cwd, verbose = false } = {}) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return verbose ? (e.stdout || "") + "\n[erreur: " + e.message + "]" : e.stdout || "";
  }
}
