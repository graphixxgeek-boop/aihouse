// INTEGRATION-OUTIL (2026-09-22) — le process d'intégration d'un nouvel outil dans l'Agence Codex,
// rendu ACTIF plutôt qu'écrit.
//
// POURQUOI IL EXISTE, ET LA DEMANDE EXACTE QUI L'A FAIT NAÎTRE. L'utilisateur, le 2026-09-22 :
// « ecris quelque part le process integration ou renforce le si deja existant, pour le rendre plus
// efficace et te permettre d'integrer plus facilement un outil ». Il n'en existait aucun : ni
// document, ni entrée dans PROCESSES, ni gardien.
//
// CE QUE L'ABSENCE COÛTAIT, MESURÉ ET PAS SUPPOSÉ. Faire entrer SAFE-EXPORT puis TOOL-LEARNING a
// demandé SEPT inscriptions manuelles chacun, dans sept registres différents. Chacune s'est
// signalée en FAISANT ÉCHOUER un test — jamais avant. C'est le diagnostic que l'Article 24 pose
// noir sur blanc depuis le 2026-09-22 : « les garde-fous font bien leur travail (rien ne passe en
// silence), mais ils DÉTECTENT l'oubli au lieu de l'ÉVITER : l'agent reste le mécanisme
// d'intégration, ce qui est exactement ce que cette précision juge insuffisant. »
//
// CE QUE CET OUTIL CHANGE, ET CE QU'IL NE CHANGE PAS. Il ne remplace aucun garde-fou : les sept
// continuent d'échouer si l'inscription manque, et c'est très bien — un filet qu'on retire parce
// qu'on a mis un panneau n'est plus un filet. Il inverse seulement le MOMENT : la liste des
// registres est DÉRIVÉE en lisant chaque fichier réel (Article 24 : un registre se lit, il ne
// s'énumère pas), donc demandable AVANT de commencer plutôt que découverte un test après l'autre.
//
// SA LIMITE, DÉCLARÉE PLUTÔT QUE TUE (même honnêteté que tool-brain et SMART-CONSO-TOKEN) : aucun
// mécanisme ne peut m'obliger à le consulter. Ce que le code garantit, c'est qu'une réponse
// demandée est exacte et complète ; que je la demande reste une obligation écrite, portée par
// l'entrée « Intégration d'un nouvel outil » de PROCESSES et surveillée par god-of-all-process.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES REGISTRES, chacun avec sa façon de se LIRE. `extrait` renvoie l'ensemble des slugs déjà
// déclarés dans le fichier réel — jamais une liste recopiée ici, qui se serait périmée au premier
// registre ajouté. `forme` est la ligne à écrire, donnée telle quelle pour que l'inscription ne
// demande aucune fouille : c'est là que se gagne le « plus facilement » de la demande.
export const REGISTRES_D_INTEGRATION = [
  {
    cle: "fiabilite", fichier: "scripts/lib-shell.mjs", quoi: "classification de fiabilité (l'avertissement d'inexactitude affiché en tête de rapport)",
    extrait: (t) => slugsDansBloc(t, "TOOL_RELIABILITY"),
    forme: (s) => `  "${s}": { niveau: "...", raison: "..." },  // dans TOOL_RELIABILITY`,
  },
  {
    cle: "categorie", fichier: "scripts/lib-shell.mjs", quoi: "rôle dans l'organigramme (Agent / Gardien sacré / Membre)",
    extrait: (t) => slugsDansBloc(t, "AGENT_CATEGORIES"),
    forme: (s) => `  "${s}": "Membre",  // dans AGENT_CATEGORIES — « Gardien sacré du code » seulement si scan de qualité ET gratuit à CHAQUE commit`,
  },
  {
    cle: "domaine-gardien", fichier: "scripts/lib-shell.mjs", quoi: "domaine surveillé (uniquement si l'outil devient Gardien sacré)",
    extrait: (t) => slugsDansBloc(t, "GARDIEN_DOMAINS"), facultatif: true,
    forme: (s) => `  "${s}": ["docs", "scripts"],  // dans GARDIEN_DOMAINS — les dossiers qu'il surveille vraiment`,
  },
  {
    cle: "couverture-axa", fichier: "scripts/axa-check.mjs", quoi: "couverture de test réelle (sans quoi l'outil est invisible à AXA-CHECK et à la stagnation)",
    extrait: (t) => chemin_scripts(t, "AGENT_SCRIPT_FILES"),
    forme: (s) => `  "scripts/${s}.mjs",  // dans AGENT_SCRIPT_FILES`,
  },
  {
    cle: "registre-rapports", fichier: "scripts/doc-report.mjs", quoi: "registre de rapports (décision HTML/texte, index global, journaux orphelins)",
    extrait: (t) => slugsDansBloc(t, "REGISTRIES"),
    forme: (s) => `  { slug: "${s}", path: "docs/${s}/index.md", scriptPath: "scripts/${s}.mjs", html: false },  // dans REGISTRIES`,
  },
  {
    cle: "avertissement", fichier: "scripts/doc-report.mjs", quoi: "fichier porteur de l'avertissement d'inexactitude",
    extrait: (t) => chemin_scripts(t, "RELIABILITY_SCRIPT_FILES"),
    forme: (s) => `  "scripts/${s}.mjs",  // dans RELIABILITY_SCRIPT_FILES`,
  },
  {
    cle: "catalogue-coordinateur", fichier: "scripts/le-coordinateur.mjs", quoi: "catalogue des prestations (ce que tool-brain peut me recommander)",
    // PRESTATIONS ne porte pas de slug : ses entrées nomment les outils en toutes lettres
    // (« SAFE-EXPORT ») ou par leur script. On lit donc les deux formes, en minuscules — jamais une
    // regex « universelle » qui prétendrait couvrir des registres de formes différentes et
    // trouverait surtout des faux positifs.
    extrait: (t) => nomsOuScripts(t, "PRESTATIONS"),
    forme: (s) => `  { slug: "${s}", quand: "...", cout: "gratuit" },  // dans PRESTATIONS`,
  },
  {
    cle: "ronde", fichier: "scripts/circle-tasks.mjs", quoi: "item de Ronde périodique, OU exclusion documentée si l'outil tourne déjà à chaque commit",
    // CIRCLE_ITEMS indexe par `id:`, jamais par `slug:` — une différence d'un mot qui rendait le
    // lecteur muet, et un lecteur muet déclare tout le monde absent.
    // Deuxième correction, au passage suivant : un Gardien sacré est VOLONTAIREMENT hors de la Ronde
    // (il tourne déjà à chaque commit), et cette exclusion est écrite noir sur blanc dans
    // CIRCLE_AUTO_COVERED_REGISTRIES. Ne lire que CIRCLE_ITEMS réclamait donc une inscription qui
    // aurait DÉFAIT une décision documentée — le pire cas pour un outil censé aider : un conseil
    // faux mais net. L'exclusion déclarée compte comme « renseigné », puisqu'elle EST la décision.
    extrait: (t) => new Set([
      ...[...blocApres(t, "CIRCLE_ITEMS").matchAll(/\bid:\s*["']([a-z0-9-]+)["']/g)].map((m) => m[1]),
      ...[...blocApres(t, "CIRCLE_AUTO_COVERED_REGISTRIES").matchAll(/^\s*["']([a-z0-9-]+)["']\s*:/gm)].map((m) => m[1]),
    ]),
    forme: (s) => `  { slug: "${s}", theme: "...", ... },  // dans CIRCLE_ITEMS — ou une exclusion écrite si déjà câblé au post-commit`,
  },
  {
    cle: "table-maitresse", fichier: "docs/regles-de-travail.md", quoi: "table maîtresse §7ter (la description détaillée outil par outil)",
    extrait: (t) => new Set([...t.matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1])),
    forme: (s) => `| ${s} | ... | \`scripts/${s}.mjs\` |  — ligne de la table maîtresse §7ter`,
  },
  {
    cle: "catalogue-charte", fichier: "CLAUDE.md", quoi: "catalogue « blueprint exportable » de la charte (blueprint + instanciation + script)",
    extrait: (t) => new Set([...t.matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1])),
    forme: (s) => `| ${s} | ... | \`docs/${s}-blueprint.md\` | \`docs/referentiel/${s}.md\` | \`scripts/${s}.mjs\` |`,
  },
];

// Deux lectures, volontairement distinctes plutôt qu'une regex unique « intelligente » : un registre
// indexé par slug (`"safe-export": {...}`) et un registre listant des chemins
// (`"scripts/safe-export.mjs"`) n'ont pas la même forme, et une regex qui prétendrait couvrir les
// deux trouverait aussi des choses qui n'en sont pas. Deux fonctions honnêtes valent mieux qu'une
// qui ratisse large.
// Ancré sur la DÉCLARATION (`export const X = `), jamais sur la première occurrence du mot : celle-ci
// tombait dans un commentaire 80 lignes plus haut, et la fenêtre de lecture ratait la moitié du
// registre. Trouvé au premier vrai passage de cet outil sur le vrai dépôt (Article 25).
function blocApres(texte, nom) {
  const i = texte.indexOf(`export const ${nom}`);
  const j = i < 0 ? texte.indexOf(nom) : i;
  return j < 0 ? "" : texte.slice(j, j + 40000);
}
function slugsDansBloc(texte, nom) {
  return new Set([...blocApres(texte, nom).matchAll(/["'{\s]slug:\s*["']([a-z0-9-]+)["']|^\s*["']([a-z0-9-]+)["']\s*:/gm)].map((m) => m[1] ?? m[2]).filter(Boolean));
}
function nomsOuScripts(texte, nom) {
  const bloc = blocApres(texte, nom);
  const parScript = [...bloc.matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1]);
  const parNom = [...bloc.matchAll(/["']([A-Za-z][A-Za-z0-9-]{2,})["']/g)].map((m) => m[1].toLowerCase());
  return new Set([...parScript, ...parNom]);
}
function chemin_scripts(texte, nom) {
  return new Set([...blocApres(texte, nom).matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1]));
}

// etatIntegration() — où en est CET outil, registre par registre. Un fichier illisible rapporte
// `mesurable: false` plutôt que « absent » : une absence de mesure n'est pas une absence
// d'inscription, et les confondre enverrait réécrire une ligne déjà présente.
export function etatIntegration(slug, { root = ROOT, readFileImpl = readFileSync, registres = REGISTRES_D_INTEGRATION } = {}) {
  return registres.map((r) => {
    let texte;
    try {
      texte = readFileImpl(join(root, r.fichier), "utf8");
    } catch {
      return { ...r, mesurable: false, pourquoi: `${r.fichier} illisible — aucune conclusion tirée` };
    }
    const declares = r.extrait(texte);
    return { cle: r.cle, fichier: r.fichier, quoi: r.quoi, facultatif: !!r.facultatif, mesurable: true, present: declares.has(slug), forme: r.forme(slug) };
  });
}

// planDIntegration() — ce qu'il reste à faire, dans l'ordre, prêt à coller. Les registres facultatifs
// sont donnés à part : les mélanger ferait passer un choix (« devient-il Gardien ? ») pour une
// formalité à cocher, et c'est une décision de fond, pas une ligne de plus.
export function planDIntegration(slug, options = {}) {
  const etat = etatIntegration(slug, options);
  return {
    slug,
    fait: etat.filter((e) => e.mesurable && e.present).map((e) => e.cle),
    restant: etat.filter((e) => e.mesurable && !e.present && !e.facultatif),
    optionnel: etat.filter((e) => e.mesurable && !e.present && e.facultatif),
    nonMesurable: etat.filter((e) => !e.mesurable),
    complet: etat.every((e) => !e.mesurable || e.present || e.facultatif),
  };
}

// findLecteursCasses() — le garde-fou de l'outil sur lui-même, et il n'est pas décoratif : un
// `extrait` dont la regex cesse de correspondre (un registre reformaté, renommé, déplacé) renverrait
// un ensemble VIDE, donc déclarerait tous les outils absents partout — un rapport spectaculaire et
// entièrement faux. SAFE-EXPORT a vécu exactement ça le 2026-09-22 (25 blueprints « fautifs » parce
// que son marqueur cherchait le mauvais mot) ; le chiffre lui-même était l'alarme. Un registre réel
// contient forcément plusieurs outils : zéro ou un, c'est le lecteur qui est cassé, pas le dépôt.
export function findLecteursCasses({ root = ROOT, readFileImpl = readFileSync, registres = REGISTRES_D_INTEGRATION, minimum = 2 } = {}) {
  const casses = [];
  for (const r of registres) {
    let texte;
    try {
      texte = readFileImpl(join(root, r.fichier), "utf8");
    } catch {
      casses.push({ cle: r.cle, pourquoi: `${r.fichier} introuvable` });
      continue;
    }
    const n = r.extrait(texte).size;
    if (n < minimum) casses.push({ cle: r.cle, pourquoi: `n'extrait que ${n} outil(s) de ${r.fichier} — un vrai registre en contient plusieurs, donc c'est le lecteur qui est cassé, jamais le registre qui serait vide` });
  }
  return casses;
}

function main() {
  printReliabilityNotice("integration-outil");
  const slug = process.argv[2];
  console.log("=== INTEGRATION-OUTIL — faire entrer un outil dans l'Agence Codex ===\n");
  const casses = findLecteursCasses();
  if (casses.length) {
    console.log("⚠️  Lecteurs cassés — le rapport ci-dessous serait faux, à corriger AVANT de s'y fier :");
    for (const c of casses) console.log(`   ${c.cle} : ${c.pourquoi}`);
    console.log("");
  }
  if (!slug) {
    console.log(`${REGISTRES_D_INTEGRATION.length} registres à renseigner pour un outil qui arrive :\n`);
    for (const r of REGISTRES_D_INTEGRATION) console.log(`· ${r.cle}${r.facultatif ? " (selon décision)" : ""} — ${r.quoi}\n    ${r.fichier}`);
    console.log("\nUsage : node scripts/integration-outil.mjs <slug-de-l-outil>");
    recordCliUsage("integration-outil", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return;
  }
  const plan = planDIntegration(slug);
  console.log(`Outil : ${slug}\n${plan.fait.length}/${REGISTRES_D_INTEGRATION.length} registre(s) déjà renseigné(s) : ${plan.fait.join(", ") || "aucun"}\n`);
  if (plan.restant.length) {
    console.log(`${plan.restant.length} inscription(s) manquante(s) — à faire AVANT le commit, pas après l'échec du test :`);
    for (const e of plan.restant) console.log(`\n· ${e.quoi}\n  ${e.fichier}\n  ${e.forme}`);
  } else {
    console.log("Tous les registres obligatoires sont renseignés.");
  }
  for (const e of plan.optionnel) console.log(`\n· (selon décision) ${e.quoi}\n  ${e.fichier}\n  ${e.forme}`);
  for (const e of plan.nonMesurable) console.log(`\n· ${e.cle} : ${e.pourquoi}`);
  recordCliUsage("integration-outil", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
