#!/usr/bin/env node
// ecotoken-claude.md — réduire le coût PERMANENT de CLAUDE.md (tâche #359, 2026-09-22).
//
// POURQUOI CET OUTIL EXISTE. CLAUDE.md est le seul document du dépôt rechargé à CHAQUE message :
// ses ~29 600 tokens se paient en boucle, là où les 196 autres documents ne coûtent que quand on
// les ouvre. Deux passes d'allègement ont déjà eu lieu, et le fichier est remonté — signe qu'une
// passe ponctuelle ne suffit pas, il faut un outil et un garde-fou.
//
// CE QU'IL N'EST PAS, et ne sera jamais : un outil qui coupe tout seul. Le garde-fou de la charte
// est explicite — « un allègement de CLAUDE.md ne doit JAMAIS entamer la qualité ou les
// fonctionnalités du projet [...] en cas de doute sur si un retrait affaiblit une règle réelle, la
// réponse par défaut est de NE PAS couper ». Il RÉDIGE le remplacement exact et mesure le gain
// réel ; l'utilisateur valide section par section (calibrage explicite du 2026-09-22).
//
// CE QU'IL NE RECALCULE JAMAIS. Le poids, le découpage en articles, les citations croisées et les
// apartés narratifs datés sont déjà produits par SMART-CONSO-TOKEN/CHARTER-SPY. Cet outil les
// IMPORTE (anti-duplication, docs/regles-de-travail.md §7ter) et n'ajoute que ce qui manquait
// vraiment : le rendement par section, la rédaction du remplacement, et le budget anti-retour.
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { estimateTokens, measureClaudeMdWeight, buildClaudeMdRuleTable, listDatedNarrativeMarkers } from "./smart-conso-token.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CHARTER = join(ROOT, "CLAUDE.md");
export const OUT_DIR = join(ROOT, "docs/ecotoken-claude-md");

// --- Découpage --------------------------------------------------------------------------------
// Par titre de niveau `##`, la seule structure que CLAUDE.md respecte réellement de bout en bout.
// Le préambule (avant le premier `##`) est une section comme les autres : il pèse, donc il compte.
export function splitSections(text) {
  const lines = String(text ?? "").split("\n");
  const sections = [];
  let current = { titre: "(préambule)", lignes: [], debut: 1 };
  lines.forEach((line, i) => {
    if (/^## /.test(line)) {
      sections.push(current);
      current = { titre: line.replace(/^## /, "").trim(), lignes: [], debut: i + 1 };
    }
    current.lignes.push(line);
  });
  sections.push(current);
  return sections.map((s) => {
    const texte = s.lignes.join("\n");
    return { ...s, texte, nbLignes: s.lignes.length, tokens: estimateTokens(texte) };
  });
}

// --- Nature d'une section ----------------------------------------------------------------------
// Trois natures, trois traitements. La distinction n'est pas cosmétique : elle décide de ce qui a
// le droit de partir. Une RÈGLE gouverne le comportement de l'agent et reste, quoi qu'elle pèse.
// Une NARRATION raconte quand et pourquoi une décision a été prise — précieuse, mais lue à la
// demande. Un INVENTAIRE énumère ce qui existe ailleurs — un tableau suffit.
export const NATURES = ["regle", "narration", "inventaire"];

export function classifySectionNature(section) {
  const t = section.titre ?? "";
  const body = section.texte ?? "";
  if (/blueprint exportable/i.test(t)) return "inventaire";
  if (/^Référentiel technique|^Documentation de contexte|^Simulations archivées/i.test(t)) return "inventaire";
  if (/^Plan d'origine/i.test(t)) return "narration";
  if (/^Charte de qualité|^Le principe fondateur|^Règles de travail|^Philosophie/i.test(t)) return "regle";
  // Par défaut : une section dense en impératifs de comportement est traitée comme une règle —
  // le doute profite toujours à la conservation (garde-fou de la charte), jamais à la coupe.
  const imperatifs = (body.match(/\b(jamais|toujours|doit|ne doit|obligatoire|interdit)\b/gi) || []).length;
  return imperatifs >= 3 ? "regle" : "narration";
}

// --- Rendement ---------------------------------------------------------------------------------
// LA métrique qui manquait : un article très cité et court est rentable ; long et peu cité, il se
// paie cher à chaque message pour peu de service rendu. Mesurée sur les CITATIONS RÉELLES dans le
// dépôt (buildClaudeMdRuleTable de CHARTER-SPY), jamais sur une importance déclarée à la main.
// Un rendement bas n'est JAMAIS un ordre de couper : l'Article 19, le plus bas de tous, est une
// vraie règle opérationnelle — son score signale seulement qu'il mérite d'être regardé.
export function articleYield(charterText, repoFiles) {
  const table = buildClaudeMdRuleTable(charterText, repoFiles);
  return table.rows
    .map((r) => ({ ...r, rendement: r.lignes ? Math.round((r.referencesCroisees / r.lignes) * 10) / 10 : 0 }))
    .sort((a, b) => a.rendement - b.rendement);
}

// --- Lecture du dépôt (pour les citations croisées) ---------------------------------------------
export function loadRepoFiles(root = ROOT, roots = ["lib", "scripts", "docs", "app", "components"]) {
  const files = {};
  const walk = (p) => {
    for (const entry of readdirSync(p)) {
      const full = join(p, entry);
      if (statSync(full).isDirectory()) { if (!/node_modules|\.git|\.wrangler/.test(full)) walk(full); continue; }
      if (/\.(md|txt|ts|tsx|mjs)$/.test(full)) files[full] = readFileSync(full, "utf8");
    }
  };
  for (const r of roots) { const p = join(root, r); if (existsSync(p)) walk(p); }
  return files;
}

// --- LES STRATÉGIES DE RÉDUCTION ----------------------------------------------------------------
// L'outil ne traite pas UN problème (les sections blueprint n'en sont qu'un cas) : il traite LE
// sujet — réduire le coût permanent de la charte, quelle que soit la forme que prend le gras.
// Quatre stratégies génériques, chacune détectée mécaniquement sur le texte réel plutôt que
// déclenchée par une liste de sections codée en dur (Article 24 : une construction qui reflète un
// autre document se lit dynamiquement, jamais recopiée à la main).
//
// Chacune porte un RISQUE, dérivé de la nature de ce qu'elle touche : une règle ne se condense
// jamais sans perte, un inventaire presque toujours sans perte. Le risque n'interdit rien — il
// ordonne ce qu'on regarde en premier.
export const STRATEGIES = {
  catalogue: { label: "Sections répétitives → un seul tableau", risqueBase: "faible" },
  extraction: { label: "Section longue lue à la demande → déplacée, un renvoi reste", risqueBase: "moyen" },
  asides: { label: "Apartés narratifs datés → fichier d'historique", risqueBase: "faible" },
  doublon: { label: "Deux passages disant la même chose → fusion", risqueBase: "moyen" },
  mecanise: { label: "Procédure déjà appliquée par un crochet → un fait court remplace la consigne", risqueBase: "moyen" },
};

// STRATÉGIE 1 — catalogue. Générique : détecte toute FAMILLE de sections dont les titres partagent
// le même suffixe après un tiret cadratin (« X — blueprint exportable », et toute famille future
// bâtie sur le même moule). Trois sections suffisent à faire une famille : en dessous, un tableau
// coûterait plus cher en en-têtes qu'il ne ferait gagner.
export function findHeadingFamilies(sections, minSize = 3) {
  const groups = new Map();
  for (const s of sections) {
    const m = /^(.+?)\s+—\s+(.+)$/.exec(s.titre ?? "");
    if (!m) continue;
    const famille = m[2].trim().toLowerCase();
    if (!groups.has(famille)) groups.set(famille, []);
    groups.get(famille).push({ ...s, membre: m[1].trim() });
  }
  return [...groups.entries()]
    .filter(([, members]) => members.length >= minSize)
    .map(([famille, members]) => ({ famille, members, tokens: members.reduce((a, b) => a + b.tokens, 0), nbLignes: members.reduce((a, b) => a + b.nbLignes, 0) }))
    .sort((a, b) => b.tokens - a.tokens);
}

// Les faits conservés pour une entrée de catalogue. Volontairement extraits du texte RÉEL (chemins
// cités, première proposition de rôle), jamais reformulés : ce que l'outil ne sait pas dire
// honnêtement, il le laisse vide et le signale plutôt que de l'inventer.
export function extractCatalogFacts(section) {
  const body = section.texte ?? "";
  const paths = [...body.matchAll(/`(docs\/[^`]+?\.md)`/g)].map((x) => x[1]);
  const role = (body.match(/documente l['’]ARCHITECTURE\s+(?:de\s+|du\s+|des\s+|d['’])([^—(.]+)/i)
    || body.match(/^\s*`[^`]+`\s+([^—(.]{20,120})/m) || [])[1];
  return {
    membre: section.membre ?? (section.titre ?? "").split("—")[0].trim(),
    architecture: paths.find((p) => /blueprint/.test(p)) ?? null,
    instanciation: paths.find((p) => /referentiel\//.test(p)) ?? null,
    role: role ? role.replace(/\s+/g, " ").trim().replace(/[,;]$/, "") : null,
    nbLignes: section.nbLignes,
    tokens: section.tokens,
    texte: section.texte,
  };
}

export function buildCatalogueReplacement(famille, facts) {
  const L = [];
  L.push(`## Catalogue — ${famille}`);
  L.push("");
  L.push(`*(Condensé par ecotoken-claude.md : ces ${facts.length} entrées avaient chacune leur propre section`);
  L.push(`narrative, soit ${facts.reduce((s, f) => s + f.nbLignes, 0)} lignes rechargées à CHAQUE message. Leur récit — genèse, arbitrages,`);
  L.push("limites honnêtes — n'est pas supprimé : il vit dans la fiche de chacune, lue à la demande. Ce");
  L.push("tableau garde ce qui doit rester sous les yeux en permanence.)*");
  L.push("");
  L.push("| Nom | Ce que c'est | Architecture | Instanciation |");
  L.push("|---|---|---|---|");
  for (const f of [...facts].sort((a, b) => a.membre.localeCompare(b.membre))) {
    const role = f.role ? f.role.slice(0, 90) : "*(à écrire à la main — non extractible mécaniquement)*";
    L.push(`| ${f.membre} | ${role} | ${f.architecture ? "`" + f.architecture + "`" : "—"} | ${f.instanciation ? "`" + f.instanciation + "`" : "—"} |`);
  }
  return L.join("\n");
}

// STRATÉGIE 2 — extraction. Une section longue dont la nature n'est PAS une règle part en entier
// dans un document lu à la demande, en laissant un renvoi de deux lignes. Le seuil est relatif au
// fichier (une section qui pèse plus de 3 % du total), jamais un nombre de lignes absolu qui
// deviendrait faux dès que la charte change de taille.
export function planExtractions(sections, totalTokens, { seuilPct = 3 } = {}) {
  return sections
    .filter((s) => classifySectionNature(s) !== "regle" && s.tokens / totalTokens * 100 >= seuilPct && !/^\(préambule\)$/.test(s.titre))
    .map((s) => {
      const cible = (s.texte.match(/`(docs\/[^`]+?\.md)`/) || [])[1] ?? null;
      const stub = `## ${s.titre}\n\n${cible ? `Voir \`${cible}\`.` : "*(cible à choisir — aucun document candidat cité dans la section.)*"} Retiré de la charte par ecotoken-claude.md : lu à la demande, jamais rechargé à chaque message.`;
      return { section: s.titre, nature: classifySectionNature(s), tokensAvant: s.tokens, tokensApres: estimateTokens(stub), gain: s.tokens - estimateTokens(stub), cible, cibleManquante: !cible, stub, texte: s.texte };
    })
    .sort((a, b) => b.gain - a.gain);
}

// STRATÉGIE 3 — apartés datés. Réutilise directement listDatedNarrativeMarkers() de CHARTER-SPY,
// jamais une seconde détection (anti-duplication).
export function planAsides(charterText) {
  const marks = listDatedNarrativeMarkers(charterText) ?? [];
  const tokens = marks.reduce((s, a) => s + estimateTokens(a.extrait ?? a.texte ?? ""), 0);
  return { nb: marks.length, gain: tokens, marks, cible: "docs/referentiel/claude-md-asides-historique.md" };
}

// STRATÉGIE 4 — doublons. Réutilise findRedundantRulePairs() de CHARTER-SPY plutôt que d'inventer
// une seconde comparaison. Limite honnête déjà connue : elle ne trouve aujourd'hui aucune paire,
// ce qui veut dire « aucun doublon LITTÉRAL », jamais « aucune redite d'idée ».
export function planDoublons(charterText, repoFiles) {
  const table = buildClaudeMdRuleTable(charterText, repoFiles);
  return { paires: table.redondances ?? [], limite: "détection littérale seulement — une redite d'idée reformulée lui échappe, la relecture humaine reste nécessaire" };
}

// STRATÉGIE 5 — « déjà mécanisé » (2026-09-22, angle ouvert par une question de l'utilisateur :
// « je pense aux scripts qui sont presents dans claude.md, qui ne s'executent une fois à
// l'ouverture, comme des coups d'eppee dans l'eau »).
//
// PRÉCISION SUR LE PHÉNOMÈNE RÉEL, parce que la formulation initiale visait à côté d'une chose
// vraie : CLAUDE.md ne contient AUCUN script exécutable — un seul bloc de code sur tout le fichier
// (un schéma), et quatre commandes simplement citées en exemple. Rien ne s'exécute à l'ouverture.
// Mais le gaspillage décrit existe bel et bien, sous un autre nom : une RÈGLE que l'agent relit à
// chaque message alors qu'un mécanisme l'applique déjà sans lui. Rappeler à l'agent de lancer
// ARGUS quand le crochet post-commit le lance de toute façon, c'est payer ~20 tokens par message
// pour une consigne qui ne change rien — le vrai coup d'épée dans l'eau.
//
// CE QUE CETTE STRATÉGIE NE DIT JAMAIS : « cette règle est inutile ». Une règle déjà mécanisée
// reste vraie, et son EXISTENCE garde une valeur (savoir que la vérification a lieu change la
// façon de travailler). Ce qui devient superflu, c'est sa PROCÉDURE détaillée : « comment lancer,
// quand lancer, dans quel ordre » n'a plus à vivre dans un document toujours chargé quand aucune
// main humaine ne déclenche plus rien. Un fait court remplace une consigne longue.
export const AUTOMATED_ENTRYPOINTS = ["scripts/hooks/pre-commit", "scripts/hooks/post-commit", "scripts/hooks/check-last-commit.mjs"];

// Quels outils tournent RÉELLEMENT tout seuls — lu dans les crochets eux-mêmes, jamais une liste
// recopiée à la main qui se périmerait au premier changement de crochet (Article 24).
export function findAutomatedTools(root = ROOT, entrypoints = AUTOMATED_ENTRYPOINTS) {
  const outils = new Set();
  for (const ep of entrypoints) {
    const full = join(root, ep);
    if (!existsSync(full)) continue;
    const txt = readFileSync(full, "utf8");
    for (const m of txt.matchAll(/(?:node\s+scripts\/|from\s+"\.\.?\/)([a-z0-9-]+)\.mjs/g)) outils.add(m[1]);
  }
  return outils;
}

// Repère les passages de la charte qui DÉCRIVENT une procédure déjà automatisée. Un passage n'est
// signalé que s'il réunit les deux conditions : il nomme un outil réellement automatisé ET il
// contient un verbe de déclenchement manuel. Nommer un outil ne suffit pas — une règle peut
// légitimement citer ARGUS sans demander de le lancer.
const DECLENCHEMENT_MANUEL = /\b(lancer|lance|relancer|exécuter|exécute|appeler|appelle|consulter|consulte)\b/i;

export function findAlreadyMechanised(charterText, automatedTools = findAutomatedTools()) {
  const trouvailles = [];
  for (const section of splitSections(charterText)) {
    // Découpage en unités remplaçables. Un paragraphe séparé par une ligne vide NE SUFFIT PAS :
    // une liste à puces s'écrit sans ligne vide entre ses entrées, donc toute la liste comptait
    // pour un seul « paragraphe » — faux positif réel au premier lancement, où les 193 lignes du
    // Référentiel technique remontaient d'un bloc à ~3 900 tokens parce qu'une seule de ses entrées
    // contenait le mot « consulter ». Chaque puce est donc sa propre unité.
    const unites = section.texte.split(/\n\s*\n/).flatMap((bloc) => (/^\s*[-*]\s/m.test(bloc) ? bloc.split(/\n(?=\s*[-*]\s)/) : [bloc]));
    for (const para of unites) {
      if (!DECLENCHEMENT_MANUEL.test(para)) continue;
      const cites = [...automatedTools].filter((o) => new RegExp(`\\b${o.replace(/-/g, "[- ]?")}\\b`, "i").test(para) || para.includes(`scripts/${o}.mjs`));
      if (!cites.length) continue;
      trouvailles.push({ section: section.titre, outils: cites, tokens: estimateTokens(para), extrait: para.replace(/\s+/g, " ").trim().slice(0, 150) });
    }
  }
  return trouvailles.sort((a, b) => b.tokens - a.tokens);
}

// --- LE PLAN COMPLET, toutes stratégies confondues -----------------------------------------------
// C'est le livrable qui manquait à tout l'outillage existant : jusqu'ici un scan disait « ce
// document est trop lourd » sans jamais produire la version allégée ni chiffrer le gain réel.
// Rien n'est écrit : le plan se lit, l'utilisateur valide section par section.
export function planReduction(charterText, repoFiles) {
  const sections = splitSections(charterText);
  const total = sections.reduce((s, x) => s + x.tokens, 0);
  const propositions = [];

  for (const fam of findHeadingFamilies(sections)) {
    const facts = fam.members.map(extractCatalogFacts);
    const remplacement = buildCatalogueReplacement(fam.famille, facts);
    const apres = estimateTokens(remplacement);
    propositions.push({
      strategie: "catalogue", cible: `${fam.members.length} sections « … — ${fam.famille} »`,
      tokensAvant: fam.tokens, tokensApres: apres, gain: fam.tokens - apres,
      risque: STRATEGIES.catalogue.risqueBase, remplacement,
      deplacements: facts.map((f) => ({ nom: f.membre, vers: f.instanciation ?? f.architecture, cibleManquante: !f.instanciation && !f.architecture, texte: f.texte })),
    });
  }
  // Anti-double-comptage (bug réel trouvé au premier lancement : AXA-CHECK et find-booster étaient
  // proposés À LA FOIS dans le catalogue et en extraction séparée, gonflant le gain total d'environ
  // 2 200 tokens qu'on n'aurait jamais pu encaisser deux fois). Une section déjà couverte par une
  // stratégie ne peut plus être reprise par une autre : un plan dont les gains ne s'additionnent
  // pas honnêtement ne vaut rien.
  const dejaCouvertes = new Set(propositions.flatMap((p) => p.deplacements.map((d) => d.nom)));
  for (const e of planExtractions(sections, total)) {
    if (dejaCouvertes.has(e.section) || [...dejaCouvertes].some((n) => e.section.startsWith(n + " —"))) continue;
    propositions.push({
      strategie: "extraction", cible: e.section, tokensAvant: e.tokensAvant, tokensApres: e.tokensApres,
      gain: e.gain, risque: e.nature === "narration" ? "faible" : STRATEGIES.extraction.risqueBase,
      remplacement: e.stub, deplacements: [{ nom: e.section, vers: e.cible, cibleManquante: e.cibleManquante, texte: e.texte }],
    });
  }
  // Même garde anti-double-comptage que pour les extractions : une section déjà condensée par le
  // catalogue ne doit pas être recomptée ici.
  const dejaVues = new Set(propositions.flatMap((p) => p.deplacements.map((d) => d.nom)));
  const mecanises = findAlreadyMechanised(charterText)
    .filter((m) => !dejaVues.has(m.section) && ![...dejaVues].some((n) => m.section.startsWith(n + " —")));
  if (mecanises.length) {
    const tk = mecanises.reduce((a, b) => a + b.tokens, 0);
    propositions.push({
      strategie: "mecanise", cible: `${mecanises.length} passage(s) décrivant une procédure déjà automatisée`,
      tokensAvant: tk, tokensApres: Math.round(tk * 0.25), gain: tk - Math.round(tk * 0.25),
      risque: "moyen", remplacement: null, detail: mecanises,
      deplacements: mecanises.map((m) => ({ nom: `${m.section} · ${m.outils.join("/")}`, vers: "docs/regles-de-travail.md", cibleManquante: false, texte: m.extrait })),
    });
  }
  const asides = planAsides(charterText);
  if (asides.nb) propositions.push({ strategie: "asides", cible: `${asides.nb} aparté(s) narratif(s) daté(s)`, tokensAvant: asides.gain, tokensApres: 0, gain: asides.gain, risque: STRATEGIES.asides.risqueBase, remplacement: null, deplacements: [{ nom: "apartés", vers: asides.cible, cibleManquante: false, texte: null }] });
  const doublons = planDoublons(charterText, repoFiles);
  if (doublons.paires.length) propositions.push({ strategie: "doublon", cible: `${doublons.paires.length} paire(s) de règles redondantes`, tokensAvant: 0, tokensApres: 0, gain: 0, risque: STRATEGIES.doublon.risqueBase, remplacement: null, deplacements: [] });

  // Ordonné par gain, à risque égal d'abord : le plus rentable et le moins risqué en tête, pour que
  // l'utilisateur n'ait jamais à arbitrer lui-même entre « ça rapporte » et « ça fait peur ».
  // Une "réduction" qui alourdit n'en est pas une. Sur une petite section, l'en-tête du tableau ou
  // le renvoi laissé derrière coûtent plus cher que ce qu'ils remplacent — bug réel attrapé par le
  // test de cet outil. Le filtre est posé ICI, une seule fois pour toutes les stratégies, plutôt
  // que répété dans chacune (Article 3 : une règle, un seul endroit).
  const utiles = propositions.filter((p) => p.gain > 0);
  const poidsRisque = { faible: 0, moyen: 1, élevé: 2 };
  utiles.sort((a, b) => (poidsRisque[a.risque] - poidsRisque[b.risque]) || (b.gain - a.gain));
  return { totalTokens: total, propositions: utiles, gainTotal: utiles.reduce((s, p) => s + p.gain, 0), doublons,
    ecartees: propositions.length - utiles.length };
}

// --- Garde-fou anti-regrossissement --------------------------------------------------------------
// La charte a déjà maigri deux fois et regrossi les deux fois. Une alerte NON BLOQUANTE au commit
// (choix explicite de l'utilisateur) : le but n'est pas d'empêcher d'ajouter une vraie règle
// importante, c'est d'empêcher de le faire sans le savoir. Un blocage dur aurait gêné l'ajout
// légitime d'une règle en pleine session — friction réelle, écartée à dessein.
export const DEFAULT_BUDGET_TOKENS = 30_000;

export function checkWeightBudget(charterText, budget = DEFAULT_BUDGET_TOKENS) {
  const poids = measureClaudeMdWeight(charterText);
  const tokens = poids.tokens;
  const depassement = tokens - budget;
  const sections = splitSections(charterText).sort((a, b) => b.tokens - a.tokens);
  return {
    tokens,
    budget,
    depasse: depassement > 0,
    depassement: Math.max(0, depassement),
    margePct: Math.round(((budget - tokens) / budget) * 100),
    plusLourdes: sections.slice(0, 3).map((s) => ({ titre: s.titre, tokens: s.tokens })),
  };
}

// --- Vérifier qu'un allègement n'a rien cassé -----------------------------------------------------
// Un allègement réussi qui casse un renvoi est un allègement raté. Deux contrôles mécaniques :
// tout Article cité ailleurs dans le dépôt doit encore exister dans la charte allégée, et tout
// contenu déplacé doit être arrivé à sa nouvelle adresse. Honnêteté : ceci vérifie que la RÉFÉRENCE
// résout, jamais que le SENS a été préservé — cette lecture-là reste humaine.
export function verifyNothingBroken(newCharterText, repoFiles, deplacements = [], readFile = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null)) {
  const findings = [];
  const citedArticles = new Set();
  for (const content of Object.values(repoFiles ?? {})) {
    for (const m of String(content).matchAll(/Article\s+(\d{1,2})\b/g)) citedArticles.add(Number(m[1]));
  }
  for (const n of [...citedArticles].sort((a, b) => a - b)) {
    if (!new RegExp(`\\*\\*Article ${n}\\s`).test(newCharterText)) {
      findings.push({ check: "article-disparu", message: `L'Article ${n} est cité ailleurs dans le dépôt mais n'existe plus dans la charte allégée — un renvoi mort.` });
    }
  }
  for (const d of deplacements) {
    if (d.cibleManquante) { findings.push({ check: "cible-manquante", message: `Le contenu de « ${d.outil} » n'a aucune fiche d'instanciation ni blueprint où atterrir — à créer avant de retirer la section.` }); continue; }
    const cible = readFile(join(ROOT, d.vers));
    if (cible === null) findings.push({ check: "cible-absente", message: `La cible « ${d.vers} » de « ${d.outil} » n'existe pas sur le disque — le contenu retiré n'aurait nulle part où aller.` });
  }
  return findings;
}

// --- MÉMOIRE ET APPRENTISSAGE ---------------------------------------------------------------------
// Demande explicite de l'utilisateur (2026-09-22) : « un rapport utile à lui-même pour apprendre,
// mais aussi à toi pour comprendre ». Deux lecteurs, deux besoins distincts dans le MÊME rapport —
// l'outil a besoin de savoir ce qui a été accepté ou refusé pour ne pas reproposer indéfiniment ce
// qu'on lui a déjà refusé ; l'agent a besoin de comprendre où est le gras et pourquoi.
//
// Ce qui est appris est strictement MÉCANIQUE et vérifiable : une proposition refusée reste
// refusée, et le poids réel mesuré au passage suivant dit si une passe acceptée a VRAIMENT fait
// maigrir la charte. Aucun apprentissage de goût, aucune inférence sur les intentions.
export const INDEX_FILE = join(OUT_DIR, "index.md");

export function loadPassHistory(indexPath = INDEX_FILE, read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "")) {
  const rows = [];
  for (const line of String(read(indexPath)).split("\n")) {
    const m = /^\|\s*(\d{4}-\d{2}-\d{2}[^|]*)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]*)\|/.exec(line);
    if (!m || /^\|\s*Date/.test(line) || /^\|[-\s|]+\|$/.test(line)) continue;
    rows.push({ date: m[1].trim(), poids: Number(String(m[2]).replace(/\D/g, "")) || null, gainPropose: Number(String(m[3]).replace(/\D/g, "")) || 0, decision: m[4].trim(), cible: m[5].trim() });
  }
  return rows;
}

// Ce que l'outil retient vraiment d'un passage à l'autre.
export function learnFromHistory(history, currentTokens) {
  const refusees = new Set(history.filter((h) => /refus/i.test(h.decision)).map((h) => h.cible).filter(Boolean));
  const acceptees = history.filter((h) => /accept|appliqu/i.test(h.decision));
  const avecPoids = history.filter((h) => Number.isFinite(h.poids));
  const precedent = avecPoids.length ? avecPoids[avecPoids.length - 1] : null;
  // La seule question qui compte pour un outil de réduction : est-ce que ça a MARCHÉ ?
  // Comparer un gain promis à un poids réellement mesuré ensuite, jamais se féliciter d'une
  // proposition jamais appliquée (même discipline anti-vanity-metric que le reste du paysage).
  let efficaciteReelle = null;
  if (precedent && Number.isFinite(currentTokens)) {
    const delta = precedent.poids - currentTokens;
    efficaciteReelle = { poidsPrecedent: precedent.poids, poidsActuel: currentTokens, delta,
      verdict: delta > 0 ? `la charte a réellement maigri de ${delta} tokens depuis le dernier passage`
        : delta === 0 ? "poids strictement inchangé depuis le dernier passage"
        : `la charte a REGROSSI de ${-delta} tokens depuis le dernier passage — c'est exactement ce que le budget est censé attraper` };
  }
  return { refusees, nbAcceptees: acceptees.length, nbPassages: history.length, efficaciteReelle };
}

export function recordPass({ poids, gainPropose, decision = "à trancher", cible = "", indexPath = INDEX_FILE } = {}) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const header = "# ecotoken-claude.md — registre des passages\n\n*(Une ligne par passage. `Décision` est la seule colonne écrite à la main : c'est la réponse de\nl'utilisateur, que rien ne peut deviner. L'outil la relit au passage suivant pour ne jamais\nreproposer en tête ce qui a déjà été refusé.)*\n\n| Date | Poids CLAUDE.md | Gain proposé | Décision | Cible |\n|---|---|---|---|---|\n";
  const prior = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : header;
  writeFileSync(indexPath, prior + `| ${new Date().toISOString().slice(0, 16).replace("T", " ")} | ${poids} | ${gainPropose} | ${decision} | ${cible} |\n`, "utf8");
  return indexPath;
}

// --- Rapport --------------------------------------------------------------------------------------
export function buildEcotokenReport({ charterText, repoFiles } = {}) {
  const texte = charterText ?? readFileSync(CHARTER, "utf8");
  const files = repoFiles ?? loadRepoFiles();
  const sections = splitSections(texte);
  const poids = measureClaudeMdWeight(texte);
  const rendements = articleYield(texte, files);
  const plan = planReduction(texte, files);
  const budget = checkWeightBudget(texte);
  const asides = listDatedNarrativeMarkers(texte);
  const history = loadPassHistory();
  const appris = learnFromHistory(history, poids.tokens);
  const parNature = {};
  for (const s of sections) { const n = classifySectionNature(s); parNature[n] ??= { sections: 0, tokens: 0 }; parNature[n].sections++; parNature[n].tokens += s.tokens; }

  const L = [];
  L.push("=== ecotoken-claude.md — réduire le coût permanent de la charte ===");
  L.push(`Date : ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);
  L.push("");
  L.push(`CLAUDE.md pèse ${poids.tokens} tokens sur ${texte.split("\n").length} lignes, et c'est le SEUL document rechargé`);
  L.push("à chaque message — son poids se paie en boucle, jamais une seule fois.");
  L.push("");
  L.push("--- RÉPARTITION PAR NATURE ---------------------------------------------------------");
  L.push("Une RÈGLE gouverne le comportement et reste quoi qu'elle pèse. Une NARRATION raconte");
  L.push("quand et pourquoi — précieuse, mais lue à la demande. Un INVENTAIRE énumère ce qui");
  L.push("existe ailleurs — un tableau suffit.");
  for (const [n, v] of Object.entries(parNature).sort((a, b) => b[1].tokens - a[1].tokens)) {
    L.push(`  ${n.padEnd(11)} ${String(v.sections).padStart(3)} section(s)  ~${String(v.tokens).padStart(6)} tokens`);
  }
  L.push("");
  L.push("--- RENDEMENT DES ARTICLES (citations réelles ÷ lignes occupées) --------------------");
  L.push("Un rendement bas n'est JAMAIS un ordre de couper — seulement un article à regarder.");
  for (const r of rendements.slice(0, 6)) L.push(`  ${String(r.rendement).padStart(5)} | Art.${String(r.article).padEnd(3)} ${String(r.lignes).padStart(3)} l. | ${r.referencesCroisees} citation(s) | ${r.titre.slice(0, 46)}`);
  L.push(`  … les ${Math.max(0, rendements.length - 6)} autres articles ont un meilleur rendement.`);
  L.push("");
  L.push("--- CE QUE L'OUTIL A RETENU DES PASSAGES PRÉCÉDENTS --------------------------------");
  if (!appris.nbPassages) L.push("  Premier passage — aucune mémoire encore, rien à retenir. Ce n'est pas un défaut : c'est une absence honnête.");
  else {
    L.push(`  ${appris.nbPassages} passage(s) enregistré(s), ${appris.nbAcceptees} proposition(s) réellement acceptée(s).`);
    if (appris.efficaciteReelle) L.push(`  Efficacité RÉELLE : ${appris.efficaciteReelle.verdict}.`);
    if (appris.refusees.size) L.push(`  Déjà refusé, ne sera plus proposé en tête : ${[...appris.refusees].join(", ")}.`);
  }
  L.push("");
  L.push("--- PLAN DE RÉDUCTION — toutes stratégies, la plus rentable et la moins risquée d'abord ---");
  L.push(`  Gain cumulé si tout était appliqué : ~${plan.gainTotal} tokens, payés à CHAQUE message.`);
  L.push("");
  for (const p of plan.propositions) {
    if (appris.refusees.has(p.cible)) { L.push(`  [refusé] ${p.cible} — écarté : déjà refusé lors d'un passage précédent, jamais reproposé en tête.`); continue; }
    L.push(`  [${p.risque.padEnd(6)}] ${STRATEGIES[p.strategie].label}`);
    L.push(`            cible : ${p.cible}`);
    L.push(`            ~${p.tokensAvant} tk → ~${p.tokensApres} tk   GAIN ~${p.gain} tk`);
    const sansCible = p.deplacements.filter((d) => d.cibleManquante);
    if (sansCible.length) L.push(`            ⚠️ ${sansCible.length} sans document d'accueil : ${sansCible.map((d) => d.nom).join(", ")}`);
  }
  if (!plan.propositions.length) L.push("  ✅ Aucune réduction mécaniquement détectable — le filon automatique est épuisé, la suite est un tri manuel (Article 19).");
  L.push("");
  L.push("--- BUDGET ANTI-REGROSSISSEMENT ----------------------------------------------------");
  L.push(budget.depasse ? `  ⚠️ ${budget.tokens} tokens — budget de ${budget.budget} DÉPASSÉ de ${budget.depassement}.` : `  ✅ ${budget.tokens} tokens sous le budget de ${budget.budget} (marge ${budget.margePct} %).`);
  for (const s of budget.plusLourdes) L.push(`     la plus lourde : ${s.titre.slice(0, 54)} (~${s.tokens} tk)`);
  L.push("");
  L.push(`--- APARTÉS NARRATIFS DATÉS restants : ${asides.length} (~${asides.reduce((s, a) => s + estimateTokens(a.extrait ?? a.texte ?? ""), 0)} tokens) ---`);
  L.push("  (le filon mécanique est épuisé — la suite du tri est manuelle, Article 19.)");
  return { text: L.join("\n"), poids, rendements, plan, budget, parNature };
}

function main() {
  const sub = process.argv[2];
  const texte = readFileSync(CHARTER, "utf8");
  if (sub === "budget") {
    const b = checkWeightBudget(texte);
    console.log(b.depasse
      ? `⚠️  ecotoken-claude.md : CLAUDE.md pèse ${b.tokens} tokens, ${b.depassement} au-dessus du budget de ${b.budget} — la section la plus lourde est « ${b.plusLourdes[0]?.titre} ». Jamais bloquant : ajouter une vraie règle reste légitime, mais plus sans le savoir.`
      : `✅ ecotoken-claude.md : ${b.tokens} tokens, sous le budget de ${b.budget} (marge ${b.margePct} %).`);
    return;
  }
  if (sub === "plan") {
    const plan = planReduction(texte, loadRepoFiles());
    const only = process.argv[3];
    console.log(`Plan de réduction — ${plan.propositions.length} proposition(s), gain cumulé ~${plan.gainTotal} tokens.\n`);
    for (const p of plan.propositions) {
      if (only && p.strategie !== only) continue;
      console.log(`=== [${p.risque}] ${STRATEGIES[p.strategie].label} — ${p.cible}`);
      console.log(`    ~${p.tokensAvant} tk → ~${p.tokensApres} tk (gain ~${p.gain} tk)`);
      if (p.remplacement) { console.log("\n--- TEXTE DE REMPLACEMENT PROPOSÉ (rien n'est écrit sans ta validation) ---\n"); console.log(p.remplacement); }
      console.log("");
    }
    return;
  }
  const report = buildEcotokenReport({ charterText: texte });
  console.log(report.text);
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `scan-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.txt`);
  writeFileSync(file, report.text, "utf8");
  const top = report.plan.propositions[0];
  recordPass({ poids: report.poids.tokens, gainPropose: report.plan.gainTotal, decision: "à trancher", cible: top ? top.cible : "" });
  console.log(`\nRapport archivé : ${file}`);
  console.log(`Passage enregistré : ${INDEX_FILE} — la colonne « Décision » est à remplir à la main une fois tranché.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
