// ARGUS — partie mécanique et gratuite (2026-09-19, cf. docs/argus-blueprint.md et
// docs/referentiel/argus.md). Deux vérifications structurelles, zéro appel réseau, zéro coût :
// (1) un champ déclaré dans le type Life (lib/life.ts) mais jamais lu ailleurs dans le projet —
//     exactement la nature du bug réel déjà trouvé cette session (le bouton jour/nuit manuel,
//     envoyé jusqu'au modèle sans jamais être lu) ;
// (2) une trace de travail explicitement laissée inachevée (TODO/FIXME) dans le code source.
// La partie "raisonnement" d'ARGUS (repérer une combinaison jamais envisagée, une conséquence
// logique oubliée, un lien discret) reste hors de portée d'un script déterministe par nature —
// elle se fait à la demande, avec une vraie réflexion, jamais simulée ici par une fausse promesse
// de couverture totale (cf. "Ce que ce patron n'est pas", docs/argus-blueprint.md).

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", ".wrangler", ".sites-runtime", "dist"].includes(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

// Extrait les noms de champs de PREMIER NIVEAU du type Life (lib/life.ts), en suivant la
// profondeur des accolades — un champ imbriqué dans un sous-type (ex. `food` dans `bonusUntil`)
// n'est jamais compté séparément, pour éviter les faux positifs sur des noms courts et génériques.
function extractLifeFields(source) {
  const start = source.indexOf("export type Life={");
  if (start === -1) throw new Error("export type Life={ introuvable dans lib/life.ts — ARGUS ne peut pas vérifier les champs sans ce point d'ancrage.");
  let depth = 0, i = start + "export type Life=".length, fieldStart = -1;
  const fields = [];
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === "{") { depth++; if (depth === 1) fieldStart = i + 1; continue; }
    if (c === "}") { depth--; if (depth === 0) break; continue; }
    if (depth === 1 && (c === ";")) {
      const chunk = source.slice(fieldStart, i);
      const m = chunk.match(/^\s*(\w+)\??:/);
      if (m) fields.push(m[1]);
      fieldStart = i + 1;
    }
  }
  const lastChunk = source.slice(fieldStart, i);
  const m = lastChunk.match(/^\s*(\w+)\??:/);
  if (m) fields.push(m[1]);
  return [...new Set(fields)];
}

export function findDeadLifeFields(files, lifeSource) {
  const fields = extractLifeFields(lifeSource);
  const dead = [];
  for (const field of fields) {
    let uses = 0;
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const re = new RegExp(`\\.${field}\\b|life\\.${field}\\b|\\b${field}\\s*:`, "g");
      const matches = content.match(re);
      if (matches) uses += matches.length;
    }
    // Une déclaration dans le type (1) + sa ligne dans readLife (généralement 1 de plus, parfois 2
    // pour un champ par-personnage {1:...,2:...}) constituent le plancher attendu sans aucune
    // vraie lecture ailleurs — au-delà de 4 occurrences totales projet, le champ est considéré
    // utilisé quelque part de façon crédible. Seuil volontairement large pour rester "confirmé"
    // seulement sur les cas francs, jamais un faux positif sur un champ réellement exploité.
    if (uses <= 4) dead.push({ field, uses, confidence: uses <= 2 ? "confirmé" : "probable" });
  }
  return dead;
}

export function findTodoMarkers(files) {
  const found = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      // Ancré en début de ligne (après l'éventuel indentation) : un TODO/FIXME réel ouvre TOUJOURS
      // son propre commentaire, jamais mentionné plus loin dans une phrase déjà en cours — sans cet
      // ancrage, un commentaire qui PARLE de TODO/FIXME (comme celui-ci, ou celui qui documente
      // cette même règle) se ferait passer pour un vrai marqueur. Bug auto-référentiel réel trouvé
      // en construisant ARGUS le 2026-09-19, corrigé ainsi plutôt qu'en excluant des fichiers.
      if (/^\s*\/\/\s*(TODO|FIXME)\b/i.test(line)) found.push({ file: relative(ROOT, file), line: idx + 1, text: line.trim() });
    });
  }
  return found;
}

function main() {
  recordCliUsage("argus");
  const lifeSource = readFileSync(join(ROOT, "lib/life.ts"), "utf8");
  const files = walk(join(ROOT, "lib")).concat(walk(join(ROOT, "app"))).concat(walk(join(ROOT, "components")).filter(f => existsSync(join(ROOT, "components"))));
  const dead = findDeadLifeFields(files, lifeSource);
  const todos = findTodoMarkers(walk(ROOT).filter(f => !f.includes("/scratchpad/")));

  printReportHeader({ tool: "argus", title: "ARGUS — partie mécanique (zéro coût API)", scriptPath: "scripts/check-argus.mjs" });
  console.log(`Champs de life.ts potentiellement jamais lus ailleurs (${dead.length}) :`);
  if (!dead.length) console.log("  Aucun — tous les champs déclarés dans le type Life sont référencés au moins 5 fois dans le projet.");
  for (const d of dead) console.log(`  [${d.confidence}] ${d.field} (${d.uses} occurrence(s) trouvée(s) au total, déclaration + lecture éventuelle incluses)`);
  console.log(`\nMarqueurs TODO/FIXME trouvés (${todos.length}) :`);
  if (!todos.length) console.log("  Aucun.");
  for (const t of todos) console.log(`  ${t.file}:${t.line} — ${t.text}`);

  // LE PLAN D'ACTION, ABSENT JUSQU'AU 2026-09-23 (Article 28). Question de l'utilisateur après la
  // Ronde : « et les plans d'action écrits dans ces rapports [...] des plans d'action avec des
  // tâches en sortie ? » Non : ARGUS trouvait 6 champs potentiellement morts et s'arrêtait là.
  //
  // C'est le trou le plus cher du paysage, et le plus discret : un rapport produit RESSEMBLE à un
  // problème traité. Cinq Gardiens sacrés sur sept n'émettaient aucun plan — mais trois d'entre eux
  // n'avaient rien trouvé, ce qui est légitime. Les deux vrais écarts étaient ARGUS (6 constats
  // réels sans suite) et ALWAYS-NEW-CODE. Celui-ci est corrigé ici.
  //
  // `fausseUneMesure: false` : un champ mort ne fausse aucune mesure, il alourdit le code — d'où
  // des tâches RECOMMANDÉES, jamais obligatoires. Le niveau se dérive, il ne se décrète pas.
  const ecartsArgus = [
    ...dead.map((d) => ({ fichier: "lib/life.ts", defaut: `champ « ${d.field} » ${d.confidence === "probable" ? "probablement" : "possiblement"} jamais lu ailleurs`, consequence: `${d.uses} occurrence(s) au total, déclaration incluse — à confirmer à la main avant tout retrait (Article 19 : la leçon trottoirGranted)` })),
    ...todos.map((t) => ({ fichier: `${t.file}:${t.line}`, defaut: "marqueur TODO/FIXME laissé dans le code", consequence: String(t.text).slice(0, 90) })),
  ];
  const planArgus = planDactionDepuisEcarts(ecartsArgus, { toolSlug: "argus", fausseUneMesure: false,
    libelle: (e) => `${e.fichier} — ${e.defaut} (${e.consequence})`,
    tache: (e) => e.defaut.startsWith("marqueur")
      ? `trancher le TODO laissé en ${e.fichier} : le faire ou l'effacer`
      : `confirmer à la main que ${e.fichier} n'a plus besoin de ce champ, puis le retirer` });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of planArgus.lignes) console.log(l);

  const outDir = join(ROOT, "docs/argus");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const runId = "scan-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const reportPath = join(outDir, runId + ".txt");
  writeFileSync(reportPath, [
    "ARGUS — balayage mécanique — " + new Date().toISOString(),
    "",
    "Champs de life.ts potentiellement jamais lus ailleurs :",
    ...(dead.length ? dead.map(d => `  [${d.confidence}] ${d.field} (${d.uses} occurrence(s))`) : ["  Aucun."]),
    "",
    "Marqueurs TODO/FIXME :",
    ...(todos.length ? todos.map(t => `  ${t.file}:${t.line} — ${t.text}`) : ["  Aucun."]),
  ].join("\n") + "\n");
  const indexed = indexArgusScan(runId, { dead, todos });
  console.log(`\nRapport archivé : docs/argus/${runId}.txt${indexed ? " — et indexé automatiquement dans docs/argus/index.md" : " (déjà présent dans docs/argus/index.md)"}`);
}

// Auto-indexation du scan qui vient d'être écrit (2026-09-22, Ronde CIRCLE-TASKS en mode AUTO).
// Cause racine réelle, corrigée ICI plutôt que chez chaque appelant (Article 3) : ce script écrivait
// bien son rapport mais n'a JAMAIS ajouté la ligne d'index correspondante, alors que trois chemins
// distincts l'appellent (crochet post-commit, runNetworkCheck() de LE-COORDINATEUR, la version
// modernisée d'HYPER-SCAN-CHECKPOINT). Résultat : cinq scans orphelins à rattraper à la main en deux
// jours, dont un pendant la Ronde qui a trouvé ce trou. Corriger l'appelant aurait laissé les deux
// autres chemins produire des orphelins — la correction n'a de sens qu'à la source.
// Ligne volontairement FACTUELLE (le décompte mécanique, jamais un jugement) : la colonne
// "Trouvailles confirmées" d'un vrai passage reste la plume de l'agent, qui écrase cette ligne
// quand il a réellement lu le scan. Écrire une ligne pauvre mais présente vaut mieux qu'un orphelin
// invisible à `findOrphanReportFiles()` — même principe d'absence honnête que le reste du paysage.
export function indexArgusScan(runId, { dead = [], todos = [] } = {}, indexPath = join(ROOT, "docs/argus/index.md")) {
  if (!existsSync(indexPath)) return false;
  const text = readFileSync(indexPath, "utf8");
  if (text.includes(runId)) return false;
  const lines = text.split("\n");
  const headerIdx = lines.findIndex(l => /^\|\s*-+\s*\|/.test(l.replace(/\s/g, " ")) || /^\|[-\s|]+\|$/.test(l));
  if (headerIdx === -1) return false;
  const date = runId.slice("scan-".length, "scan-".length + 10);
  const row = `| ${date} | [${runId}.txt](${runId}.txt) | ${dead.length} champ(s) candidat(s), ${todos.length} marqueur(s) TODO/FIXME | Indexé automatiquement à l'écriture du scan (jamais relu par un humain à ce stade — cette ligne est un décompte mécanique, à écraser par un vrai constat si le scan est réellement analysé). |`;
  lines.splice(headerIdx + 1, 0, row);
  writeFileSync(indexPath, lines.join("\n"));
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
