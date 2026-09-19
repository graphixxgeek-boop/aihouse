// Installe le crochet git tracké (2026-09-19) — lancé automatiquement par le script "prepare" de
// package.json à chaque `pnpm install`, donc actif sur tout clone frais du dépôt sans jamais une
// étape manuelle à refaire. Pointe simplement git vers scripts/hooks/ (`core.hooksPath`, un réglage
// LOCAL au clone, jamais commité — c'est exactement pourquoi cette installation doit se refaire à
// chaque install plutôt que de compter sur un réglage déjà fait une fois ailleurs) et s'assure que
// le crochet reste exécutable, au cas où les bits d'exécution ne survivraient pas un checkout sur
// certains systèmes.
import { chmodSync, existsSync } from "node:fs";
import { join } from "node:path";
import { sh } from "../lib-shell.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
// pre-commit (2026-09-19, demande explicite : « est-ce que le réseau d'outils tourne pendant qu'on
// crée la suite du projet ? ») bloque le commit si check-house.mjs/tsc échouent ; post-commit
// (suivi) avertit sans jamais bloquer — les deux crochets tracés ici, jamais un seul fichier qui
// mélangerait deux politiques différentes (bloquant vs avertissant).
const HOOKS = ["pre-commit", "post-commit"];

try {
  sh("git config core.hooksPath scripts/hooks", { cwd: ROOT });
  for (const name of HOOKS) {
    const hook = join(ROOT, "scripts/hooks", name);
    if (existsSync(hook)) chmodSync(hook, 0o755);
  }
  console.log("Crochets git installés (core.hooksPath=scripts/hooks) : " + HOOKS.join(", ") + ".");
} catch (err) {
  // Ne jamais faire échouer `pnpm install` pour ça — un dépôt qui ne serait pas un vrai clone git
  // (rare : archive .zip, certains environnements CI) doit continuer à s'installer normalement.
  console.log("Crochet git non installé (pas un dépôt git ici, ou git indisponible) : " + (err instanceof Error ? err.message : String(err)));
}
