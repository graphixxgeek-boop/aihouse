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
const HOOK = join(ROOT, "scripts/hooks/post-commit");

try {
  sh("git config core.hooksPath scripts/hooks", { cwd: ROOT });
  if (existsSync(HOOK)) chmodSync(HOOK, 0o755);
  console.log("Crochet git de suivi installé (core.hooksPath=scripts/hooks).");
} catch (err) {
  // Ne jamais faire échouer `pnpm install` pour ça — un dépôt qui ne serait pas un vrai clone git
  // (rare : archive .zip, certains environnements CI) doit continuer à s'installer normalement.
  console.log("Crochet git non installé (pas un dépôt git ici, ou git indisponible) : " + (err instanceof Error ? err.message : String(err)));
}
