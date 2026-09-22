#!/usr/bin/env node
// ecotoken — réduire le coût PERMANENT de CLAUDE.md (tâche #359, 2026-09-22).
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
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { estimateTokens, measureClaudeMdWeight, buildClaudeMdRuleTable, listDatedNarrativeMarkers, SCOPE_LEVELS } from "./smart-conso-token.mjs";
// Les nœuds sensibles du moteur sont DÉJÀ déclarés et maintenus ailleurs (CHECK-LEVEL-TARGET, carte
// HARMONIA). ecotoken les LIT plutôt que de prétendre les mesurer de son côté — un second jugement
// sur la même chose divergerait tôt ou tard (règle anti-doublon du projet). Aucun cycle :
// check-level-target n'importe pas ecotoken.
import { SENSITIVE_NODES } from "./check-level-target.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReliabilityNotice } from "./lib-shell.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CHARTER = join(ROOT, "CLAUDE.md");
export const OUT_DIR = join(ROOT, "docs/ecotoken");

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
// Les clés sont des chemins RELATIFS à la racine du dépôt (corrigé le 2026-09-22) : elles étaient
// absolues, si bien que toute recherche par clé (`fichiers["scripts/hooks/pre-commit"]`, un test de
// chemin racine) échouait silencieusement en rendant toujours « rien trouvé » — un faux négatif
// parfait, le pire genre de bug dans un outil de mesure. Les crochets git, sans extension, étaient
// par ailleurs exclus par le filtre : c'est précisément la tuyauterie qu'on veut reconnaître.
export function loadRepoFiles(root = ROOT, roots = ["lib", "scripts", "docs", "app", "components"]) {
  const files = {};
  const walk = (p) => {
    for (const entry of readdirSync(p)) {
      const full = join(p, entry);
      if (statSync(full).isDirectory()) { if (!/node_modules|\.git|\.wrangler/.test(full)) walk(full); continue; }
      const rel = full.slice(root.length + 1).replace(/\\/g, "/");
      if (/\.(md|txt|ts|tsx|mjs)$/.test(full) || /^scripts\/hooks\//.test(rel)) files[rel] = readFileSync(full, "utf8");
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
//
// Le suffixe est normalisé sur sa PHRASE DE TÊTE (tout ce qui précède la première virgule ou
// parenthèse) — corrigé le 2026-09-22 : « memory-audit — blueprint exportable, l'exception qui
// cible les Personnages » formait à lui seul une famille d'un membre et sortait du tableau.
// Un membre oublié dans un catalogue, c'est de l'information PERDUE, le seul résultat qu'un outil
// d'allègement n'a jamais le droit de produire (garde-fou de la charte).
export function findHeadingFamilies(sections, minSize = 3) {
  const groups = new Map();
  for (const s of sections) {
    const m = /^(.+?)\s+—\s+(.+)$/.exec(s.titre ?? "");
    if (!m) continue;
    const famille = m[2].split(/[,(]/)[0].trim().toLowerCase();
    if (!famille) continue;
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
// Le choix du chemin ne se fait JAMAIS par « le premier qui ressemble » — corrigé le 2026-09-22
// après deux erreurs réelles dans le premier tableau produit : find-booster renvoyait vers
// `claude-md-asides-historique.md` (le premier `docs/referentiel/` cité dans son aparté, pas sa
// fiche), et l'Outil de résilience API affichait « — » alors que son blueprint existe, simplement
// nommé `docs/outil-resilience-api.md` sans le mot « blueprint ». Un catalogue qui envoie vers le
// mauvais document est pire que pas de catalogue du tout.
const MOTS_VIDES = new Set(["de", "du", "des", "la", "le", "les", "un", "une", "et", "aux", "pour", "the"]);
function motsCles(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !MOTS_VIDES.has(w));
}
// Combien de mots du NOM du membre se retrouvent dans le nom de fichier. Zéro mot commun = ce
// chemin ne parle probablement pas de ce membre.
function affiniteChemin(chemin, membre) {
  const cible = new Set(motsCles(chemin.split("/").pop().replace(/\.md$/, "")));
  const mots = motsCles(membre);
  if (!mots.length) return 0;
  return mots.filter((w) => cible.has(w)).length;
}
function meilleurChemin(paths, membre, filtre) {
  const candidats = paths.filter(filtre);
  if (!candidats.length) return null;
  const classe = candidats.map((p) => ({ p, score: affiniteChemin(p, membre) })).sort((a, b) => b.score - a.score);
  // Si AUCUN candidat ne partage un mot avec le nom du membre, on garde le premier cité (le
  // comportement d'origine) : mieux vaut le renvoi historique qu'un blanc, mais on ne prétend pas
  // avoir reconnu quoi que ce soit.
  return classe[0].p;
}

function roleUtile(role, membre) {
  if (!role) return null;
  const propre = role.replace(/\s+/g, " ").trim().replace(/[,;]$/, "");
  const motsMembre = new Set(motsCles(membre));
  const apport = motsCles(propre).filter((w) => !motsMembre.has(w));
  return apport.length ? propre : null;
}

export function extractCatalogFacts(section) {
  const body = section.texte ?? "";
  const paths = [...body.matchAll(/`(docs\/[^`]+?\.md)`/g)].map((x) => x[1]);
  const membre = section.membre ?? (section.titre ?? "").split("—")[0].trim();
  const role = (body.match(/documente l['’]ARCHITECTURE\s+(?:de\s+|du\s+|des\s+|d['’])([^—(.]+)/i)
    || body.match(/^\s*`[^`]+`\s+([^—(.]{20,120})/m) || [])[1];
  // Un blueprint, par convention de ce projet, est un `docs/*.md` à la racine de docs/ — le mot
  // « blueprint » dans son nom est fréquent mais pas garanti.
  const architecture = meilleurChemin(paths, membre, (p) => /blueprint/.test(p))
    ?? meilleurChemin(paths, membre, (p) => /^docs\/[^/]+\.md$/.test(p) && affiniteChemin(p, membre) > 0);
  return {
    membre,
    architecture: architecture ?? null,
    instanciation: meilleurChemin(paths, membre, (p) => /referentiel\//.test(p)) ?? null,
    // Un « rôle » qui ne fait que répéter le nom du membre (« memory-audit | memory-audit »)
    // n'apprend rien : mieux vaut dire franchement qu'il reste à écrire à la main.
    role: roleUtile(role, membre),
    nbLignes: section.nbLignes,
    tokens: section.tokens,
    texte: section.texte,
  };
}

// Une cellule de tableau coupée en plein milieu d'un mot (« la combinaison d'outil », « veille au
// respect de `docs/philosophie-et-politique ») donne un catalogue qui a l'air cassé. On coupe au
// dernier espace, et on ne laisse jamais un backtick ouvert sans son jumeau.
export function couperProprement(texte, max) {
  let t = String(texte).trim();
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, "") + "…";
  if ((t.match(/`/g) || []).length % 2 === 1) t = t.slice(0, t.lastIndexOf("`")).trim().replace(/[,;]$/, "") + "…";
  return t.replace(/\|/g, "\\|");
}

export function buildCatalogueReplacement(famille, facts) {
  const L = [];
  L.push(`## Catalogue — ${famille}`);
  L.push("");
  L.push(`*(Condensé par ecotoken : ces ${facts.length} entrées avaient chacune leur propre section`);
  L.push(`narrative, soit ${facts.reduce((s, f) => s + f.nbLignes, 0)} lignes rechargées à CHAQUE message. Leur récit — genèse, arbitrages,`);
  L.push("limites honnêtes — n'est pas supprimé : il vit dans la fiche de chacune, lue à la demande. Ce");
  L.push("tableau garde ce qui doit rester sous les yeux en permanence.)*");
  L.push("");
  L.push("| Nom | Ce que c'est | Architecture | Instanciation |");
  L.push("|---|---|---|---|");
  for (const f of [...facts].sort((a, b) => a.membre.localeCompare(b.membre))) {
    const role = f.role ? couperProprement(f.role, 90) : "*(à écrire à la main — non extractible mécaniquement)*";
    L.push(`| ${f.membre} | ${role} | ${f.architecture ? "`" + f.architecture + "`" : "—"} | ${f.instanciation ? "`" + f.instanciation + "`" : "—"} |`);
  }
  return L.join("\n");
}

// --- CE QUE LA PREMIÈRE PASSE RÉELLE M'A APPRIS (2026-09-22) ------------------------------------
// L'outil découpait par titre `##`. Or CLAUDE.md n'a que 12 sections `##` : sa VRAIE structure est
// faite de blocs en gras à l'intérieur de celles-ci. Conséquence mesurée : la section « Charte de
// qualité » pesait 12 346 tokens d'un bloc, et l'Article 19 à lui seul 5 351 — soit 43 % de la
// charte — sans qu'aucune proposition ne puisse jamais viser cette masse, parce qu'elle n'était pas
// une « section ». L'outil était aveugle à l'endroit précis où se trouvait le gros du poids.
//
// Le raisonnement que j'ai dû faire à la main, et qu'il faut lui donner :
//   1. descendre au niveau du BLOC EN GRAS, pas du titre `##` ;
//   2. se demander non pas « ce texte est-il long ? » mais « ce texte est-il À SA PLACE ? ».
// Les deux trouvailles réelles sont venues de la question 2, jamais de la taille :
//   • un MANUEL D'EXPLOITATION d'outil (Smart Breaker, 2 820 tk) logé dans un Article qui parle de
//     tout autre chose, alors que deux fiches dédiées existaient déjà — 13 % du fichier ;
//   • huit blocs de RÈGLES VIVANTES rangés sous le mauvais Article par accident de mise en page :
//     aucun token à gagner, mais la charte mentait sur sa propre structure.
export function splitBoldBlocks(section) {
  const lignes = String(section.texte ?? "").split("\n");
  const blocs = [];
  let courant = { titre: "(entête de section)", lignes: [], debut: section.debut ?? 1 };
  lignes.forEach((l, i) => {
    const m = /^\*\*(.{4,120}?)\.?\*\*/.exec(l);
    if (m) { blocs.push(courant); courant = { titre: m[1].trim(), lignes: [], debut: (section.debut ?? 1) + i }; }
    courant.lignes.push(l);
  });
  blocs.push(courant);
  return blocs.filter((b) => b.lignes.join("").trim()).map((b) => {
    const texte = b.lignes.join("\n");
    return { ...b, texte, nbLignes: b.lignes.length, tokens: estimateTokens(texte) };
  });
}

// TROUVAILLE 1 — un MANUEL logé dans la charte. Trois conditions cumulatives, toutes vérifiables :
// le bloc est gros, il décrit l'exploitation d'un outil nommé, et cet outil a DÉJÀ un document
// dédié qui existe sur le disque. C'est le motif le plus rentable trouvé sur le fichier maître, et
// le seul qui ne demande aucun arbitrage douteux : le contenu a déjà un domicile.
export function findLodgedManuals(texte, { root = ROOT, seuilTokens = 400 } = {}) {
  const trouvailles = [];
  for (const section of splitSections(texte)) {
    if (classifySectionNature(section) !== "regle") continue;
    for (const bloc of splitBoldBlocks(section)) {
      if (bloc.tokens < seuilTokens) continue;
      // Les documents que le bloc cite et qui existent réellement, hors renvois génériques.
      const fiches = [...new Set([...bloc.texte.matchAll(/`(docs\/[^`\s]+?\.md)`/g)].map((m) => m[1]))]
        .filter((f) => existsSync(join(root, f)) && affiniteChemin(f, bloc.titre) > 0);
      if (!fiches.length) continue;
      // Un bloc qui EST une règle de la charte (il énonce un devoir général) n'est pas un manuel,
      // même s'il cite une fiche. Un manuel décrit un OUTIL : il nomme des scripts, des commandes.
      const commandes = (bloc.texte.match(/`(?:node )?scripts\/[a-z0-9-]+\.mjs/g) || []).length;
      if (commandes < 2) continue;
      trouvailles.push({
        section: section.titre, bloc: bloc.titre, tokens: bloc.tokens, nbLignes: bloc.nbLignes,
        fiches, commandes,
        pourquoi: `${bloc.tokens} tk d'exploitation d'outil (${commandes} commandes citées) logés dans une section de RÈGLES, alors que ${fiches.join(" et ")} traite(nt) déjà le sujet`,
        prudence: "avant de sortir : garder dans la charte la partie qu'il faut avoir sous les yeux le jour d'une panne (la procédure d'urgence), jamais le renvoi seul",
      });
    }
  }
  return trouvailles.sort((a, b) => b.tokens - a.tokens);
}

// TROUVAILLE 2 — un bloc RANGÉ SOUS LE MAUVAIS ARTICLE. Zéro token à gagner : ce n'est pas une
// économie, c'est une correction de structure. Elle compte quand même, pour deux raisons vécues :
// un agent qui cherche une règle sous son Article ne la trouve pas, et tout outil qui découpe par
// Article voit une masse aberrante (ici un Article 19 huit fois trop gros) qu'il attribue à la
// mauvaise règle. Le signal est mécanique : le bloc cite un AUTRE Article plus souvent que celui
// sous lequel il est rangé.
export function findMisfiledBlocks(texte) {
  const trouvailles = [];
  for (const section of splitSections(texte)) {
    let articleCourant = null;
    for (const bloc of splitBoldBlocks(section)) {
      const entete = /^Article (\d+) —/.exec(bloc.titre);
      if (entete) { articleCourant = Number(entete[1]); continue; }
      if (articleCourant === null || bloc.tokens < 80) continue;
      const cites = [...bloc.texte.matchAll(/\bArticle (\d+)\b/g)].map((m) => Number(m[1]));
      if (!cites.length) continue;
      const comptes = {};
      for (const n of cites) comptes[n] = (comptes[n] ?? 0) + 1;
      // HUITIÈME APPRENTISSAGE (2026-09-22, constaté en rangeant réellement la charte). Deux
      // corrections, dont une qui change la NATURE de ce signal :
      //
      // 1. L'Article 0 est la hiérarchie des lois : il est cité partout par construction, c'est même
      //    ce qu'on attend d'un bloc qui pèse une décision. Il ne peut être le domicile de rien.
      // 2. Surtout : ce détecteur ne peut PAS distinguer « ce bloc appartient à l'Article X » de
      //    « ce bloc renvoie à l'Article X ». Preuve faite sur pièces le même jour — « Format de
      //    présentation » (qui traite du format des questions, Article 16, et cite l'Article 18
      //    comme exemple d'occasion) et « Questions de calibrage après voici mes commentaires » (qui
      //    traite bien du cycle post-simulation, Article 18) ont EXACTEMENT la même signature :
      //    Article 18 deux fois, Article 16 une fois. Aucun comptage ne les sépare. Le premier devait
      //    rester, le second devait partir.
      //
      // Un signal qui ne peut pas trancher ne doit pas prétendre trancher : il POSE LA QUESTION,
      // exactement comme planExtractions() le fait quand aucune destination n'existe. Le verdict
      // « accident de mise en page » devient une interrogation, et le choix revient à qui lit.
      delete comptes[0];
      const meilleurEntree = Object.entries(comptes).sort((a, b) => b[1] - a[1])[0];
      if (!meilleurEntree) continue;
      const [meilleur, n] = meilleurEntree;
      const chezLui = comptes[articleCourant] ?? 0;
      if (Number(meilleur) === articleCourant || n < 2 || n <= chezLui) continue;
      trouvailles.push({
        bloc: bloc.titre, tokens: bloc.tokens, rangeSous: articleCourant, appartientA: Number(meilleur),
        pourquoi: `rangé sous l'Article ${articleCourant}, mais il cite ${n} fois l'Article ${meilleur} et ${chezLui} fois son hôte — est-ce son SUJET (alors il est mal rangé) ou un simple RENVOI (alors il reste) ? L'outil ne peut pas trancher : les deux cas ont la même signature.`,
        gain: 0, note: "aucun token en jeu — une question posée sur la structure, jamais un verdict",
      });
    }
  }
  return trouvailles.sort((a, b) => b.tokens - a.tokens);
}

// STRATÉGIE 2 — extraction. Une section longue dont la nature n'est PAS une règle part en entier
// dans un document lu à la demande, en laissant un renvoi de deux lignes. Le seuil est relatif au
// fichier (une section qui pèse plus de 3 % du total), jamais un nombre de lignes absolu qui
// deviendrait faux dès que la charte change de taille.
// SIXIÈME APPRENTISSAGE (2026-09-22, constaté dès que le rapport de scan s'est mis à parler) : le
// seuil relatif de 3 % n'a aucun plancher absolu, et le quatrième apprentissage ci-dessous a
// transformé chaque petite section en QUESTION posée à l'agent. Sur organisation-agence.md, l'outil
// demandait sérieusement s'il fallait déménager « Les Agents Cadre » — 173 tokens, 3,5 % du
// document. Une question coûte de l'attention à lire ; quand elle porte sur moins de tokens qu'elle
// n'en fait dépenser, c'est du bruit produit par l'outil même qui prêche la sobriété. On exige donc
// les DEUX : une vraie part du document (relatif, inchangé) ET assez de matière pour qu'un
// déménagement en vaille la peine (absolu). Le seul cas réel que ce plancher garde est justement le
// bon : « Référentiel technique » de CLAUDE.md, 4 414 tk sur 20 057.
// SEPTIÈME APPRENTISSAGE (2026-09-22, même passage) : restaient deux questions posées sur
// parametres.md — « Besoins (`lib/simulation.ts`) » et « Attirance et attachement
// (`lib/relationship.ts`…) », assez lourdes pour passer le plancher, et pourtant absurdes : ce sont
// les entrées mêmes du document des paramètres. Le signal mécanique qui le dit sans ambiguïté est
// dans le TITRE : une section dont l'intitulé nomme le fichier de code qu'elle documente est une
// entrée par module dans un document de référence, jamais un corps étranger — la déplacer voudrait
// dire déplacer toutes ses sœurs, c'est-à-dire vider le document. Discriminant volontairement
// étroit (le chemin doit être dans le titre, pas dans le corps) : « Référentiel technique » de
// CLAUDE.md, la seule vraie extraction restante, n'en cite aucun et reste donc posée.
const TITRE_NOMME_UN_FICHIER_SOURCE = /`[^`]*\.(ts|tsx|mjs|js)`/;

export function planExtractions(sections, totalTokens, { seuilPct = 3, seuilTokens = 400 } = {}) {
  return sections
    .filter((s) => classifySectionNature(s) !== "regle" && s.tokens / totalTokens * 100 >= seuilPct && s.tokens >= seuilTokens && !/^\(préambule\)$/.test(s.titre) && !TITRE_NOMME_UN_FICHIER_SOURCE.test(s.titre))
    .map((s) => {
      // La cible d'extraction se CHOISIT, elle ne se prend pas au premier chemin venu (corrigé le
      // 2026-09-22, même classe de bug que le catalogue avant lui) : la section « Plan d'origine »
      // se voyait renvoyée vers `docs/simulations/correctifs-a-revalider.md`, un registre qui parle
      // d'autre chose, simplement parce que c'était le premier `docs/` cité. Un renvoi faux est pire
      // que pas de renvoi : il envoie lire le mauvais document en croyant avoir la bonne adresse.
      // On exige donc une vraie affinité entre le titre de la section et le nom du fichier ; sinon
      // on dit franchement qu'il reste à créer.
      const candidats = [...s.texte.matchAll(/`(docs\/[^`]+?\.md)`/g)].map((m) => m[1]);
      const cible = candidats.map((c) => ({ c, score: affiniteChemin(c, s.titre) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score)[0]?.c ?? null;
      const stub = `## ${s.titre}\n\n${cible ? `Voir \`${cible}\`.` : "*(document d'accueil à CRÉER — aucun des documents cités dans la section ne traite réellement de son sujet ; renvoyer vers l'un d'eux serait une fausse adresse.)*"} Retiré de la charte par ecotoken : lu à la demande, jamais rechargé à chaque message.`;
      // QUATRIÈME APPRENTISSAGE (2026-09-22, en passant aux fichiers suivants) : sans destination
      // EXISTANTE, une extraction n'est pas un gain, c'est une question. Sur parametres.md,
      // systeme-de-suivi.md et organisation-agence.md, l'outil proposait 7 extractions qui
      // revenaient toutes à vider un document de référence de son propre contenu — « Besoins » hors
      // du document des paramètres, « Les Agents Cadre » hors de l'organigramme. Le seuil de 3 %
      // suffit à déclencher ça sur tout document court, où chaque vraie section dépasse 3 %.
      // Le discriminant n'est pas la taille : c'est de savoir si la section est un CORPS ÉTRANGER
      // dans ce document, et la preuve la plus solide qu'elle l'est, c'est qu'un autre document
      // traite déjà son sujet. Sans cette preuve, l'outil pose la question au lieu de chiffrer un
      // gain — exactement comme pour la feuille de route de CLAUDE.md, qui était bien un corps
      // étranger, mais sur MON jugement, jamais sur un calcul.
      return { section: s.titre, nature: classifySectionNature(s), tokensAvant: s.tokens, tokensApres: estimateTokens(stub), gain: s.tokens - estimateTokens(stub), cible, cibleManquante: !cible, aExaminer: !cible, stub, texte: s.texte };
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
// CE QUE CETTE STRATÉGIE A APPRIS D'UNE VRAIE CONVERSATION (2026-09-22, second temps). Sa première
// version mettait tous les crochets dans le même sac. Une discussion avec l'utilisateur sur un
// sujet voisin — le réveil conditionnel des Gardiens — a fait apparaître une distinction que
// l'outil ignorait, et qui change son verdict du tout au tout :
//
//   • Un mécanisme BLOQUANT (crochet pre-commit) rend la consigne presque entièrement superflue.
//     Il est PHYSIQUEMENT IMPOSSIBLE de commiter sans que les tests et le typage soient passés :
//     me rappeler de les lancer ne change donc strictement rien à ce qui se produit. C'est le cas
//     le plus pur de coup d'épée dans l'eau.
//   • Un mécanisme CONSULTATIF (crochet post-commit) est différent. Il signale sans jamais rien
//     empêcher — savoir qu'il existe change réellement ma façon de travailler, et cette
//     connaissance mérite de rester. Seule sa PROCÉDURE (comment le lancer, quand, dans quel
//     ordre) devient superflue.
//
// Traiter les deux pareil, c'était soit sous-estimer le gaspillage du premier, soit risquer de
// couper une vraie valeur dans le second. Cette leçon est exactement le métier de cet outil — et
// il ne l'avait pas trouvée seul : elle est venue d'une question de l'utilisateur. Consigné tel
// quel plutôt que maquillé en trouvaille de l'outil.
export const ENFORCEMENT = {
  bloquant: { entrypoint: "scripts/hooks/pre-commit", compression: 0.1, note: "impossible de commiter sans — la consigne ne change rien à ce qui se produit" },
  consultatif: { entrypoint: "scripts/hooks/post-commit", compression: 0.4, note: "signale sans bloquer — l'existence du contrôle mérite de rester, seule sa procédure est superflue" },
};
// check-last-commit.mjs est le corps réel du post-commit : ses imports sont donc du consultatif.
const CONSULTATIF_EXTRA = ["scripts/hooks/check-last-commit.mjs"];

// Quels outils tournent RÉELLEMENT tout seuls, ET À QUELLE FORCE — lu dans les crochets eux-mêmes,
// jamais une liste recopiée à la main qui se périmerait au premier changement (Article 24).
export function findAutomatedTools(root = ROOT) {
  const parNiveau = { bloquant: new Set(), consultatif: new Set() };
  const lire = (rel, niveau) => {
    const full = join(root, rel);
    if (!existsSync(full)) return;
    for (const m of readFileSync(full, "utf8").matchAll(/(?:node\s+scripts\/|from\s+"\.\.?\/)([a-z0-9-]+)\.mjs/g)) parNiveau[niveau].add(m[1]);
  };
  lire(ENFORCEMENT.bloquant.entrypoint, "bloquant");
  lire(ENFORCEMENT.consultatif.entrypoint, "consultatif");
  for (const extra of CONSULTATIF_EXTRA) lire(extra, "consultatif");
  // Un outil présent dans les deux compte comme BLOQUANT : c'est le niveau le plus fort qui décide
  // ce que la consigne apporte encore, jamais le plus faible.
  for (const o of parNiveau.bloquant) parNiveau.consultatif.delete(o);
  return parNiveau;
}

// Repère les passages de la charte qui DÉCRIVENT une procédure déjà automatisée, et gradue selon
// la force du mécanisme. Un passage n'est signalé que s'il réunit les deux conditions : il nomme un
// outil réellement automatisé ET il contient un verbe de déclenchement manuel. Nommer un outil ne
// suffit pas — une règle peut légitimement citer ARGUS sans demander de le lancer.
// Un passage qui dit lui-même qu'il ne peut PAS être mécanisé. Ce n'est pas une liste de mots
// interdits mais la reconnaissance d'une affirmation précise : « c'est écrit parce que rien ne peut
// le vérifier ». Ces règles-là sont les plus fragiles du document, jamais les plus superflues.
const INCOERCIBLE = /(aucun mécanisme technique ne peut|obligation écrite|la seule protection possible|jamais un garde-fou vérifiable|aucun compteur externe)/i;
const DECLENCHEMENT_MANUEL = /\b(lancer|lance|relancer|exécuter|exécute|appeler|appelle|consulter|consulte)\b/i;

export function findAlreadyMechanised(charterText, automatedTools = findAutomatedTools()) {
  const niveauDe = (outil) => (automatedTools.bloquant?.has(outil) ? "bloquant" : automatedTools.consultatif?.has(outil) ? "consultatif" : null);
  const tous = [...(automatedTools.bloquant ?? []), ...(automatedTools.consultatif ?? [])];
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
      // GARDE-FOU 1 — un passage qui déclare lui-même qu'aucun mécanisme ne peut le faire respecter
      // n'est JAMAIS « déjà mécanisé » : le texte écrit EST la seule protection qui existe. Le
      // couper reviendrait à supprimer la règle en prétendant qu'un outil la porte déjà.
      if (INCOERCIBLE.test(para)) continue;
      const cites = tous.filter((o) => new RegExp(`\\b${o.replace(/-/g, "[- ]?")}\\b`, "i").test(para) || para.includes(`scripts/${o}.mjs`));
      if (!cites.length) continue;
      // GARDE-FOU 2 — l'outil automatisé doit être le SUJET du passage, pas une simple mention.
      // Cas réel : le paragraphe sur `check-spirit.mjs` (qui coûte de vrais appels API et se lance
      // à la main) cite `check-house.mjs` pour s'en distinguer — il était classé « déjà mécanisé »
      // à cause de cette seule mention, alors qu'il parle précisément de l'outil qui ne l'est pas.
      const autresScripts = [...para.matchAll(/`?scripts\/([a-z0-9-]+)\.mjs`?/g)].map((m) => m[1]).filter((n) => !tous.includes(n));
      const occurrences = (nom) => (para.match(new RegExp(nom.replace(/-/g, "[- ]?"), "gi")) || []).length;
      const pointeAutomatise = Math.max(...cites.map(occurrences));
      if (autresScripts.length && Math.max(...autresScripts.map(occurrences)) >= pointeAutomatise) continue;
      // Le niveau le plus fort cité dans le passage décide de sa compression.
      const niveau = cites.some((o) => niveauDe(o) === "bloquant") ? "bloquant" : "consultatif";
      const tokens = estimateTokens(para);
      trouvailles.push({
        section: section.titre, outils: cites, niveau, tokens,
        tokensApres: Math.round(tokens * ENFORCEMENT[niveau].compression),
        pourquoi: ENFORCEMENT[niveau].note,
        extrait: para.replace(/\s+/g, " ").trim().slice(0, 150),
      });
    }
  }
  return trouvailles.sort((a, b) => (b.tokens - b.tokensApres) - (a.tokens - a.tokensApres));
}

// TROISIÈME APPRENTISSAGE (2026-09-22, en passant au fichier suivant) — une stratégie dépend du
// RÔLE du document, pas seulement de son contenu. Sur `docs/regles-de-travail.md`, la stratégie
// « déjà mécanisé » proposait 6 134 tk sur 32 passages : tous des règles et des décisions de
// conception, aucun superflu. La cause n'est pas un mauvais réglage, elle est structurelle — ce
// document EST le manuel des procédures du projet. Lui reprocher de décrire des procédures, c'est
// lui reprocher d'exister. Quinze autres fichiers le désignent explicitement comme l'endroit où
// une procédure est documentée : c'est le signal, mécanique et vérifiable, qu'il est le domicile
// de référence et non un lieu où la procédure traîne par accident.
export function estLeManuelDesProcedures(path, repoFiles, { seuil = 3 } = {}) {
  const echappe = String(path).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const motif = new RegExp(`(documenté|documentée|détaillé|détaillée|décrit|décrite|entièrement)[^.]{0,40}${echappe}`, "i");
  const renvois = Object.entries(repoFiles ?? {}).filter(([n, c]) => n !== path && motif.test(String(c))).length;
  return { estLeManuel: renvois >= seuil, renvois, pourquoi: `${renvois} fichier(s) le désignent comme le lieu où une procédure est documentée` };
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
    const av = mecanises.reduce((a, b) => a + b.tokens, 0);
    const ap = mecanises.reduce((a, b) => a + b.tokensApres, 0);
    const nbBloquants = mecanises.filter((m) => m.niveau === "bloquant").length;
    propositions.push({
      strategie: "mecanise",
      cible: `${mecanises.length} passage(s) décrivant une procédure déjà automatisée${nbBloquants ? ` (dont ${nbBloquants} par un mécanisme BLOQUANT)` : ""}`,
      tokensAvant: av, tokensApres: ap, gain: av - ap,
      // Un passage adossé à un mécanisme bloquant est presque sans risque à condenser : la règle
      // continue de s'appliquer qu'on la lise ou non. D'où un risque faible dès qu'il y en a un.
      risque: nbBloquants ? "faible" : "moyen", remplacement: null, detail: mecanises,
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

// --- Garde-fou anti-regrossissement, sur TOUT document profilé -----------------------------------
// La charte a déjà maigri deux fois et regrossi les deux fois. Une alerte NON BLOQUANTE au commit
// (choix explicite de l'utilisateur) : le but n'est pas d'empêcher d'ajouter une vraie règle
// importante, c'est d'empêcher de le faire sans le savoir.
//
// Élargi le 2026-09-22 : le budget ne porte plus sur CLAUDE.md seul. Chaque document profilé a le
// sien, dérivé de son poids au moment où le budget est posé plutôt que d'un chiffre rond arbitraire
// — un seuil inventé n'aurait aucun sens sur un document qu'on découvre. La marge par défaut de
// 10 % dit : « tu peux grossir un peu, mais pas silencieusement ».
export const DEFAULT_BUDGET_TOKENS = 30_000;
export const MARGE_DEFAUT = 0.1;

// Budgets réels, curatés (Article 24 : nature manuelle écrite ici même). Un document absent de
// cette table n'a pas de budget — l'absence est dite, jamais remplacée par une valeur inventée.
export const BUDGETS = {
  "CLAUDE.md": 30_000,
  "docs/regles-de-travail.md": 60_000,
  "docs/referentiel/principes.md": 28_000,
  // lib/reference.ts (2026-09-22, décision explicite de l'utilisateur : « un budget surveillé,
  // comme pour la charte »). L'outil signalait depuis ce matin que ce fichier était profilé mais
  // SANS plafond — donc libre de grossir sans qu'aucun avertissement ne se déclenche. Il avait
  // atteint 83 000 tokens sans que personne ne s'en aperçoive, dont 89 % d'historique de versions,
  // et il part entier dans le paquet déployé. Après séparation du journal de bord ancien
  // (lib/reference-history.ts, chargé seulement à la demande) il retombe à ~15 000 : le plafond est
  // posé à 25 000, une vraie marge pour les vingt versions glissantes sans laisser revenir la
  // dérive. Ce qui dépasse se déplace vers le journal, jamais ne se résume ni ne se supprime.
  "lib/reference.ts": 25_000,
};

export function checkWeightBudget(charterText, budget = DEFAULT_BUDGET_TOKENS) {
  const poids = measureClaudeMdWeight(charterText);
  const tokens = poids.tokens;
  const depassement = tokens - budget;
  const sections = splitSections(charterText).sort((a, b) => b.tokens - a.tokens);
  return {
    tokens, budget,
    depasse: depassement > 0,
    depassement: Math.max(0, depassement),
    margePct: Math.round(((budget - tokens) / budget) * 100),
    plusLourdes: sections.slice(0, 3).map((s) => ({ titre: s.titre, tokens: s.tokens })),
  };
}

// Le même contrôle, sur tous les documents budgétés d'un coup.
// Garde-fou d'évolutivité (Article 24) : BUDGETS et DOCUMENT_PROFILES sont deux tables tenues à la
// main qui parlent des mêmes documents. Rien ne détectait qu'un document profilé — donc reconnu
// comme réellement relu — n'avait aucun budget : il pouvait grossir indéfiniment sans qu'un seul
// avertissement ne se déclenche. Trouvé en cherchant les trous de logique de cet outil même, et non
// par un scan : `docs/referentiel/parametres.md` était dans ce cas. Les dossiers sont exclus, un
// budget ne voulant rien dire sur un répertoire entier.
export function findProfiledDocumentsWithoutBudget(profiles = DOCUMENT_PROFILES, budgets = BUDGETS) {
  return profiles
    .filter((p) => !p.dossier && !(p.chemin in budgets))
    .map((p) => ({ chemin: p.chemin, chargement: p.chargement, ecart: "document profilé (donc réellement relu) mais sans budget — il peut grossir sans qu'aucun avertissement ne se déclenche" }));
}

export function checkAllBudgets(budgets = BUDGETS, root = ROOT) {
  const lignes = [];
  for (const [chemin, budget] of Object.entries(budgets)) {
    const full = join(root, chemin);
    if (!existsSync(full)) { lignes.push({ chemin, absent: true }); continue; }
    lignes.push({ chemin, ...checkWeightBudget(readFileSync(full, "utf8"), budget) });
  }
  return { lignes, depassements: lignes.filter((l) => l.depasse) };
}

// --- RÉVEIL CONDITIONNEL D'ECOTOKEN LUI-MÊME -----------------------------------------------------
// Cohérence assumée (2026-09-22, demande de l'utilisateur) : l'outil qui reproche aux Gardiens de
// tourner pour rien doit s'appliquer sa propre médecine. Vérifier le poids de la charte après un
// commit qui n'a touché que du code est exactement le coup d'épée dans l'eau qu'ecotoken dénonce.
// Il ne se réveille donc que si un document BUDGÉTÉ a réellement changé.
// Même prudence que pour les Gardiens : si on ne sait pas ce qui a changé, on tourne.
// Une seule source pour « quels documents surveillés ont bougé » (Article 3 : une règle, un
// endroit). `ecotokenShouldRun` et `recommendScope` répondaient à la même question avec deux
// implémentations parallèles : elles s'accordent aujourd'hui, mais rien ne le garantissait demain.
export function watchedDocumentsTouched(changedFiles, budgets = BUDGETS) {
  if (!changedFiles) return null; // « on ne sait pas » n'est pas « aucun » — distinction à ne jamais perdre.
  const surveilles = Object.keys(budgets);
  return changedFiles.filter((f) => surveilles.some((d) => f === d || f.startsWith(d.replace(/\.md$/, "") + "/")));
}

export function ecotokenShouldRun(changedFiles, budgets = BUDGETS) {
  const touches = watchedDocumentsTouched(changedFiles, budgets);
  return touches === null || touches.length > 0;
}

// --- SÛRETÉ : POURQUOI CET OUTIL NE PEUT PAS ABÎMER CE QU'IL ANALYSE ------------------------------
// Demande du 2026-09-22 : « un outil sans danger même s'il agit sur des parties ultra sensibles ».
//
// La garantie n'est pas une promesse de bonne conduite, c'est une PROPRIÉTÉ DE STRUCTURE : ecotoken
// n'a aucun chemin d'écriture vers un document analysé. Ses deux seules écritures vont dans son
// propre dossier (son registre de passages et son rapport). Tout allègement réel est appliqué par
// un humain — ou par moi sous validation humaine — jamais par l'outil.
//
// Pour que ce ne soit pas qu'un commentaire (Article 24 : une promesse n'est pas un mécanisme),
// toute écriture passe par `assertSafeWriteTarget()`, qui REFUSE toute cible hors du dossier de
// l'outil, et un test de check-house.mjs vérifie qu'aucun appel d'écriture ne le contourne.
// Conséquence : même en cas de bug, même sur CLAUDE.md, le pire que peut faire ecotoken est
// d'écrire un mauvais rapport dans son propre dossier.
export function assertSafeWriteTarget(chemin, outDir = OUT_DIR) {
  // Un chemin relatif est résolu depuis la racine du dépôt : refuser « docs/ecotoken/x.txt » au
  // seul motif qu'il n'est pas absolu serait un faux refus, aussi trompeur qu'une fausse permission.
  const normalise = (p) => {
    const s = String(p).replace(/\\/g, "/").replace(/\/+$/, "");
    return s.startsWith("/") ? s : join(ROOT, s).replace(/\\/g, "/");
  };
  if (!normalise(chemin).startsWith(normalise(outDir) + "/")) {
    throw new Error(`ecotoken refuse d'écrire hors de son propre dossier : "${chemin}". Un allègement réel s'applique à la main, après validation humaine — jamais par l'outil.`);
  }
  return chemin;
}

// --- CRITICITÉ D'UN FICHIER, ET CE QU'ELLE CHANGE -------------------------------------------------
// Demande du 2026-09-22 : « CLAUDE.md est un fichier sensible, central : l'outil sait mesurer la
// criticité d'un fichier ou d'une partie de code et adapter son diagnostic ou ses actions ».
//
// PREUVE VIVANTE que ce garde-fou manquait, faite le jour même : le premier catalogue produit sur
// CLAUDE.md a fait disparaître six outils entiers (LE-COORDINATEUR, CIRCLE-TASKS, doc-HTML,
// tool-usage, Doc-Report, find-deep-booster) et l'obligation d'usage de tool-brain — des
// paragraphes de RÈGLE logés à la fin de sections qui, elles, n'étaient que des renvois. La perte
// n'a été vue qu'en comparant à la main les chemins cités avant/après. Un outil d'allègement qui
// peut faire ça sur le document le plus critique du dépôt sans le dire n'est pas fiable : il lui
// fallait (a) savoir qu'il touche à du critique, (b) le vérifier mécaniquement.
// CINQ niveaux, pas quatre (recalibré le 2026-09-22 : « le niveau max est le fichier maître, non ?
// et la tuyauterie ? »). Les deux plus hauts ne s'atteignent PAS par accumulation de points — ils
// sont catégoriels, parce que ce qui les caractérise n'est pas « beaucoup de signaux » mais un
// signal qui suffit à lui seul :
//   • maitre     — LE document qui gouverne tout le travail. Un seul par dépôt, par définition.
//   • tuyauterie — le code dont dépend tout le reste (crochets, filet de sécurité, socle partagé).
//                  Un crochet git contient presque zéro « jamais/toujours » : il aurait été classé
//                  périphérique par la seule densité de règles, alors que le casser casse TOUT.
//                  C'était le vrai trou de la première version de cette mesure.
// Les trois autres restent, eux, un cumul de signaux ordinaire.
export const CRITICITE = {
  maitre: { seuil: Infinity, categoriel: true, consigne: "VIGILANCE MAXIMALE — aucune proposition appliquée sans relecture humaine, sans contrôle de perte de références ET sans verifyProtectiveSubstance() avant/après ; le doute tranche toujours pour NE PAS couper" },
  tuyauterie: { seuil: Infinity, categoriel: true, consigne: "VIGILANCE MAXIMALE — c'est le socle dont tout dépend : aucune proposition appliquée sans relecture humaine, et le filet de sécurité complet doit repasser au vert avant de considérer le changement terminé" },
  critique: { seuil: 6, consigne: "aucune proposition appliquée sans relecture humaine ET sans contrôle de perte de références ; le doute tranche toujours pour NE PAS couper" },
  sensible: { seuil: 4, consigne: "proposition à risque « faible » seulement ; contrôle de perte de références obligatoire" },
  ordinaire: { seuil: 2, consigne: "propositions applicables normalement, contrôle de perte recommandé" },
  peripherique: { seuil: 0, consigne: "aucun garde-fou particulier — un document que rien ne cite et qu'aucune règle n'habite" },
};

// La TUYAUTERIE, reconnue à ce qu'elle EST, jamais à une liste de chemins tenue à la main
// (Article 24) : un fichier est de la tuyauterie s'il est exécuté à chaque commit (crochet), s'il
// EST le filet de sécurité, ou s'il est importé par beaucoup d'autres scripts — casser l'un des
// trois casse le travail de tout le monde, pas seulement le sien.
// Une MENTION n'est pas un LANCEMENT (corrigé le 2026-09-22, deux faux positifs trouvés en auditant
// la détection au lieu de la supposer bonne) : le crochet pre-commit parle de `post-commit` et de
// `kpi-report.mjs` dans ses COMMENTAIRES, et les deux étaient annoncés « lancés par le crochet
// bloquant ». Une raison fausse dans un outil de mesure est aussi grave qu'un niveau faux.
// De même, tout ce qui vit dans scripts/hooks/ n'est pas un crochet : `install.mjs` y habite mais
// est lancé par le gestionnaire de paquets, jamais à chaque commit.
function lignesExecutables(texte) {
  return String(texte).split("\n").filter((l) => !/^\s*(#|\/\/)/.test(l));
}
function estVraimentLance(texteLanceur, base) {
  const echappe = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return lignesExecutables(texteLanceur).some((l) => new RegExp(`(node|bash|sh|\\./|scripts/)\\s*\\S*${echappe}\\b`).test(l));
}

export function assessPlumbing(path, { root = ROOT, repoFiles = null, seuilImports = 5 } = {}) {
  const fichiers = repoFiles ?? loadRepoFiles(root);
  const raisons = [];
  const base = path.split("/").pop();
  // 1. UN crochet git : dans scripts/hooks/ ET sans extension (git n'exécute que ces fichiers-là).
  if (/^scripts\/hooks\/[^/.]+$/.test(path)) raisons.push("crochet git — exécuté automatiquement à chaque commit");
  // 2. Lancé pour de vrai par un crochet — en distinguant le bloquant de l'avertisseur, parce que
  // la conséquence d'une panne n'est pas la même.
  for (const [nom, contenu] of Object.entries(fichiers)) {
    if (!/^scripts\/hooks\/[^/.]+$/.test(nom) || nom === path) continue;
    if (!estVraimentLance(contenu, base)) continue;
    raisons.push(nom.endsWith("pre-commit")
      ? "lancé par le crochet pre-commit BLOQUANT — sa panne empêche tout commit"
      : `lancé par le crochet ${nom.split("/").pop()} à chaque commit`);
  }
  // 3. Lancé par le gestionnaire de paquets (le cas réel d'install.mjs, qui installe les crochets).
  const pkg = existsSync(join(root, "package.json")) ? readFileSync(join(root, "package.json"), "utf8") : "";
  if (base && estVraimentLance(pkg, base)) raisons.push("lancé par un script du gestionnaire de paquets");
  // 4. Socle partagé.
  const importateurs = Object.entries(fichiers).filter(([n, c]) => n !== path && new RegExp(`from\\s+["'\`][^"'\`]*${base.replace(/\./g, "\\.")}["'\`]`).test(String(c))).length;
  if (importateurs >= seuilImports) raisons.push(`importé par ${importateurs} autres scripts — socle partagé`);
  return { estTuyauterie: raisons.length > 0, raisons, importateurs };
}

// --- RECONNAÎTRE LE FICHIER MAÎTRE ----------------------------------------------------------------
// Demande du 2026-09-22 : « l'outil doit reconnaître le fichier maître, comme ici CLAUDE.md mais
// aussi un autre fichier dans un autre projet si ecotoken est un jour exporté ».
//
// Le fichier maître n'est JAMAIS reconnu à son nom : un blueprint exportable qui chercherait
// "CLAUDE.md" ne trouverait rien ailleurs, et un projet qui nommerait ainsi un fichier anodin
// serait mal jugé. Il est reconnu à ce qui le rend maître : il est rechargé en permanence, il est
// cité partout, et il est écrit en règles. Les noms connus ne servent que d'INDICE d'appoint,
// jamais de décision — et leur nature d'indice est écrite ici même (Article 24).
export const NOMS_DE_CHARTE_CONNUS = ["CLAUDE.md", "AGENTS.md", "GEMINI.md", ".cursorrules", "CONVENTIONS.md"];

// Les candidats sont cherchés à la RACINE du dépôt, directement sur le disque (corrigé le
// 2026-09-22) : `loadRepoFiles()` ne descend que dans lib/scripts/docs/app/components, si bien
// qu'AUCUN fichier racine n'était candidat. La déduction ne marchait ici que parce que « CLAUDE.md »
// figure dans la liste de noms connus — un projet dont la charte s'appellerait `RULES.md` n'aurait
// rien trouvé. C'est précisément la panne que ce blueprint ne doit pas avoir ailleurs.
function candidatsRacine(root) {
  const out = new Set(NOMS_DE_CHARTE_CONNUS);
  try {
    for (const nom of readdirSync(root)) {
      if (/^(node_modules|\.git)$/.test(nom)) continue;
      if (/\.(md|mdc|txt)$/i.test(nom)) out.add(nom);
      // Les conventions sans extension (.cursorrules, .windsurfrules…) sont aussi des chartes.
      else if (/^\.[a-z-]*rules$/i.test(nom)) out.add(nom);
    }
  } catch { /* racine illisible : on se rabat sur les seuls noms connus */ }
  return [...out].filter((n) => existsSync(join(root, n)));
}

// Un candidat est PESÉ sur des faits, jamais sur son nom : densité de règles, citations réelles.
function peserCandidat(nom, root, fichiers) {
  const texte = readFileSync(join(root, nom), "utf8");
  const regles = (texte.match(/\b(jamais|toujours|doit|obligatoire|never|always|must)\b/gi) || []).length;
  const citations = Object.entries(fichiers).filter(([n, c]) => n !== nom && String(c).includes(nom)).length;
  // Le bonus de nom connu est délibérément MODESTE : il départage deux candidats à égalité, il ne
  // doit jamais couronner un fichier que les faits ne soutiennent pas (les seuils ci-dessous
  // s'appliquent de toute façon avant lui).
  const bonusNom = NOMS_DE_CHARTE_CONNUS.includes(nom) ? 10 : 0;
  return { nom, regles, citations, score: regles + citations * 3 + bonusNom, bonusNom };
}

export function detectMasterFile({ root = ROOT, repoFiles = null, profiles = DOCUMENT_PROFILES } = {}) {
  const fichiers = repoFiles ?? loadRepoFiles(root);
  // 1. La preuve la plus forte, quand elle existe : un profil qui déclare un rechargement permanent.
  // Elle n'est PAS crue aveuglément — un profil périmé pointant vers un fichier vidé de sa substance
  // couronnerait un fichier qui n'a plus rien de maître. On vérifie que les faits la soutiennent.
  const declares = profiles.filter((p) => p.chargement === "toujours" && existsSync(join(root, p.chemin)));
  if (declares.length) {
    const pese = peserCandidat(declares[0].chemin, root, fichiers);
    if (pese.regles >= 20) {
      return {
        chemin: declares[0].chemin, confiance: "certaine",
        raisons: ["déclaré rechargé à chaque message dans les profils de documents", `confirmé par les faits : ${pese.regles} formulations normatives, cité par ${pese.citations} fichiers`],
        // Deux documents déclarés « toujours » est une incohérence de configuration, jamais un choix.
        ambiguite: declares.length > 1 ? `${declares.length} documents sont déclarés rechargés en permanence (${declares.map((d) => d.chemin).join(", ")}) — il ne peut y en avoir qu'un` : null,
      };
    }
    // Le profil dit une chose, le fichier en dit une autre : on le signale au lieu de choisir en silence.
    return { chemin: declares[0].chemin, confiance: "declaree-mais-non-confirmee", raisons: [`déclaré rechargé en permanence, mais le fichier ne contient que ${pese.regles} formulations normatives — déclaration probablement périmée`] };
  }
  // 2. Sinon, on le déduit sur preuves. Seuils : sans règles ni citations, ce n'est pas une charte.
  const peses = candidatsRacine(root).map((n) => peserCandidat(n, root, fichiers)).filter((p) => p.regles >= 20 && p.citations >= 3).sort((a, b) => b.score - a.score);
  // Une absence honnête plutôt qu'un candidat par défaut : tous les projets n'ont pas de charte.
  if (!peses.length) return { chemin: null, confiance: "aucune", raisons: ["aucun document racine ne cumule densité de règles et citations suffisantes — ce dépôt n'a probablement pas de fichier maître"] };
  const [premier, second] = peses;
  return {
    chemin: premier.nom, confiance: "deduite",
    raisons: [`${premier.regles} formulations normatives`, `cité par ${premier.citations} fichiers`, ...(premier.bonusNom ? ["porte un nom de charte connu (indice d'appoint, jamais la décision)"] : [])],
    // Deux candidats au coude à coude : le dire, plutôt que de laisser croire à une certitude.
    ambiguite: second && second.score > premier.score * 0.8 ? `« ${second.nom} » est presque aussi crédible (${second.score} contre ${premier.score}) — vérifier à la main` : null,
    autresCandidats: peses.slice(1, 4).map((p) => ({ nom: p.nom, score: p.score })),
  };
}

// Cinq signaux RÉELS, chacun vérifiable, jamais un score d'opinion. Un point par signal fort.
export function assessCriticality(path, { root = ROOT, repoFiles = null, profiles = DOCUMENT_PROFILES } = {}) {
  const full = join(root, path);
  if (!existsSync(full)) return { chemin: path, absent: true };
  const texte = readFileSync(full, "utf8");
  const fichiers = repoFiles ?? loadRepoFiles(root);
  const prof = profiles.find((p) => p.chemin === path);

  const signaux = [];
  // 1. Rechargé à chaque message : son coût est permanent, mais sa perte l'est aussi.
  const toujoursCharge = prof?.chargement === "toujours";
  if (toujoursCharge) signaux.push({ nom: "rechargé à chaque message", poids: 3, detail: "toute règle retirée cesse d'être vue à CHAQUE tour, pas seulement quand on ouvre le fichier" });
  // 2. Cité ailleurs : d'autres documents et scripts s'appuient dessus.
  const citations = Object.entries(fichiers).filter(([nom, c]) => nom !== path && String(c).includes(path)).length;
  if (citations >= 10) signaux.push({ nom: `cité par ${citations} fichiers`, poids: 2, detail: "un renvoi cassé se propage" });
  else if (citations >= 3) signaux.push({ nom: `cité par ${citations} fichiers`, poids: 1, detail: "quelques renvois en dépendent" });
  // 3. Densité de RÈGLES : ce n'est pas de la prose, c'est du normatif.
  const regles = (texte.match(/\b(jamais|toujours|doit|obligatoire|non négociable)\b/gi) || []).length;
  if (regles >= 200) signaux.push({ nom: `${regles} formulations normatives`, poids: 3, detail: "document de règles : ce qui en disparaît cesse de s'appliquer" });
  else if (regles >= 50) signaux.push({ nom: `${regles} formulations normatives`, poids: 1, detail: "contient de vraies règles, pas seulement du récit" });
  // 4. Adossé à un contrôle mécanique : un test ou un crochet lit ce fichier.
  const teste = Object.entries(fichiers).some(([nom, c]) => /^scripts\/(check-house|hooks\/)/.test(nom) && String(c).includes(path));
  if (teste) signaux.push({ nom: "lu par un test ou un crochet", poids: 1, detail: "un changement peut casser le filet de sécurité lui-même" });

  // 5. Le fichier MAÎTRE du dépôt : la vigilance la plus haute, quoi que disent les autres signaux.
  // Ce n'est pas un signal de plus parmi quatre — c'est celui qui, à lui seul, impose le régime
  // « critique » et rend la vérification du fond obligatoire.
  const maitre = detectMasterFile({ root, repoFiles: fichiers, profiles });
  const estFichierMaitre = maitre.chemin === path;
  if (estFichierMaitre) signaux.push({ nom: `FICHIER MAÎTRE du dépôt (détection ${maitre.confiance})`, poids: 3, detail: `${maitre.raisons.join(" ; ")} — tout ce qui en disparaît cesse de gouverner le travail, immédiatement et partout` });

  // 6. NŒUD SENSIBLE DU MOTEUR, tel que CHECK-LEVEL-TARGET/HARMONIA le déclarent déjà. Sans ce
  // signal, ecotoken jugeait `lib/simulation.ts` « ordinaire » alors qu'une autre mesure du même
  // dépôt le tient pour sensible — un désaccord réel, trouvé par findCriticalityDisagreements() dès
  // son premier lancement. Plutôt que de trancher en inventant un second jugement, ecotoken adopte
  // celui qui existe : ses propres signaux sont documentaires (densité de règles, citations) et ne
  // peuvent pas voir ce qu'est un nœud du moteur.
  const noeud = (SENSITIVE_NODES ?? []).find((n) => (n.files ?? []).includes(path));
  if (noeud) signaux.push({ nom: `nœud sensible du moteur « ${noeud.node} »`, poids: 3, detail: "déclaré tel quel par CHECK-LEVEL-TARGET/HARMONIA — lu, jamais recalculé" });

  // 7. La TUYAUTERIE. Catégorielle comme le fichier maître, et pour la même raison : un seul de
  // ces signaux suffit, le cumul n'y est pour rien.
  const plomberie = assessPlumbing(path, { root, repoFiles: fichiers });
  if (plomberie.estTuyauterie) signaux.push({ nom: "TUYAUTERIE du dépôt", poids: 3, detail: `${plomberie.raisons.join(" ; ")} — la casser casse le travail de tout le monde, pas seulement le sien` });

  const score = signaux.reduce((a, s) => a + s.poids, 0);
  // Les deux niveaux catégoriels priment sur le cumul de points, jamais l'inverse. Entre les deux,
  // le fichier maître l'emporte : c'est lui qui dit ce que la tuyauterie a le droit de faire.
  const niveau = estFichierMaitre ? "maitre"
    : plomberie.estTuyauterie ? "tuyauterie"
    : Object.entries(CRITICITE).filter(([, v]) => !v.categoriel).find(([, v]) => score >= v.seuil)[0];
  const hautNiveau = niveau === "maitre" || niveau === "tuyauterie" || niveau === "critique";
  return {
    chemin: path, score, niveau, signaux,
    estFichierMaitre, estTuyauterie: plomberie.estTuyauterie,
    consigne: CRITICITE[niveau].consigne,
    // Propre au fichier maître : on ne se contente pas de vérifier que les renvois résolvent, on
    // vérifie que le FOND qui protège le projet (Articles, phrases socles, règles) est intact.
    verificationDuFondObligatoire: estFichierMaitre,
    // Propre à la tuyauterie : c'est le filet de sécurité complet qui doit repasser au vert — un
    // contrôle de références ne dirait rien d'utile sur un crochet git.
    filetDeSecuriteObligatoire: plomberie.estTuyauterie,
    // Ce que la criticité CHANGE concrètement, jamais une étiquette décorative.
    risqueMaxAutorise: hautNiveau || niveau === "sensible" ? "faible" : "moyen",
    controlePerteObligatoire: hautNiveau || niveau === "sensible",
    validationHumaineObligatoire: hautNiveau,
  };
}

// --- HARMONIE AVEC LES AUTRES ÉCHELLES DU PROJET --------------------------------------------------
// Demande du 2026-09-22 : « vérifie que ces niveaux définis sont en harmonie avec d'autres niveaux
// de criticité mesurés par ailleurs [...] il faut un ensemble cohérent ».
//
// Constat d'abord, avant toute fusion (Article 19) : ce projet a DÉJÀ quatre échelles, et elles ne
// mesurent pas la même chose. Les fondre en une seule serait une fausse harmonie, qui détruirait
// de l'information :
//   • CHECK-LEVEL-TARGET  (leger/standard/approfondi/exceptionnel) — combien VÉRIFIER. Un effort.
//   • SENSITIVE_NODES     (binaire) — quels NŒUDS du moteur sont délicats. Un endroit du code.
//   • CHARTER-SPY         (très sensible/sensible/normale) — la gravité d'une RÈGLE.
//   • ecotoken            (6 niveaux) — la criticité d'un FICHIER.
// L'harmonie utile n'est donc pas un vocabulaire unique : ce sont des PONTS là où les objets se
// rejoignent réellement, plus un garde-fou qui détecte les désaccords. Deux ponts existent :
//
// PONT 1 — criticité d'un fichier → niveau de vérification attendu. Toucher au fichier maître ou à
// la tuyauterie ne peut pas se vérifier « léger ». C'est le pont qui rend les deux échelles
// comparables, dans le seul sens qui a du sens (un effort se déduit d'un enjeu, jamais l'inverse).
export const CRITICITE_VERS_NIVEAU_DE_VERIFICATION = {
  maitre: "exceptionnel",
  tuyauterie: "approfondi",
  critique: "approfondi",
  sensible: "standard",
  ordinaire: "standard",
  peripherique: "leger",
};

export function recommendCheckLevelFor(path, options = {}) {
  const c = assessCriticality(path, options);
  if (c.absent) return { chemin: path, absent: true };
  return {
    chemin: path, criticite: c.niveau,
    niveauMinimal: CRITICITE_VERS_NIVEAU_DE_VERIFICATION[c.niveau],
    pourquoi: `${c.niveau} → la vérification ne peut pas descendre sous « ${CRITICITE_VERS_NIVEAU_DE_VERIFICATION[c.niveau]} » (vocabulaire de CHECK-LEVEL-TARGET, jamais un cinquième inventé)`,
  };
}

// PONT 2 — le garde-fou. Un fichier qu'HARMONIA/CHECK-LEVEL-TARGET déclarent NŒUD SENSIBLE et
// qu'ecotoken classerait « ordinaire » ou « périphérique » est un désaccord réel entre deux mesures
// du même dépôt : l'une des deux se trompe, et le silence laisserait la plus laxiste gagner. On ne
// tranche pas mécaniquement qui a raison — on refuse que le désaccord passe inaperçu.
export function findCriticalityDisagreements(sensitiveNodes, options = {}) {
  const trop_bas = ["ordinaire", "peripherique"];
  const findings = [];
  for (const noeud of sensitiveNodes ?? []) {
    for (const f of noeud.files ?? []) {
      const c = assessCriticality(f, options);
      if (c.absent) { findings.push({ fichier: f, noeud: noeud.node, desaccord: "déclaré nœud sensible mais le fichier n'existe pas" }); continue; }
      if (trop_bas.includes(c.niveau)) findings.push({ fichier: f, noeud: noeud.node, niveauEcotoken: c.niveau, desaccord: `déclaré nœud sensible par CHECK-LEVEL-TARGET/HARMONIA, mais ecotoken le classe « ${c.niveau} » — l'une des deux mesures est fausse` });
    }
  }
  return findings;
}

// LE contrôle qui manquait. Compare le texte avant/après et liste ce qui a cessé d'être mentionné :
// chemins de fichiers, identifiants entre accents graves, et titres de sections. Ne juge PAS du
// sens (aucun outil ne le peut) — il dit seulement « ceci était cité, ça ne l'est plus », ce qui
// suffisait à voir les six outils disparus.
// `attendues` : les pertes ASSUMÉES, déclarées par l'appelant (les 22 titres de section qu'un
// catalogue condense, par exemple). Sans ce paramètre le contrôle crierait au loup à chaque
// allègement réussi et finirait ignoré — un garde-fou qu'on ignore ne garde plus rien. Une perte
// non déclarée reste toujours signalée, elle : c'est tout l'intérêt.
export function findLostReferences(avant, apres, { attendues = [] } = {}) {
  const extraire = (t) => {
    const s = new Set();
    for (const m of String(t).matchAll(/`([^`\n]{2,80})`/g)) s.add(m[1]);
    for (const m of String(t).matchAll(/^##+ (.+)$/gm)) s.add("§ " + m[1].trim());
    return s;
  };
  const a = extraire(avant), b = extraire(apres);
  const estAttendue = (x) => attendues.some((p) => (p instanceof RegExp ? p.test(x) : String(x).includes(String(p))));
  const perdues = [...a].filter((x) => !b.has(x) && !estAttendue(x));
  // Un chemin réel perdu est TOUJOURS grave ; un nom de fonction perdu l'est moins (il vit dans le
  // code). La distinction évite de noyer la vraie alerte sous du bruit.
  const graves = perdues.filter((x) => /^(§ |docs\/|lib\/|app\/|scripts\/|components\/)/.test(x));
  return { perdues, graves, total: perdues.length };
}

// --- PORTÉE D'UN SCAN ----------------------------------------------------------------------------
// Demande du 2026-09-22 : « 2 ou 3 niveaux de scan selon le zoom [...] que tout soit bien cohérent ».
// Réponse cohérente plutôt que nouvelle : ce projet a DÉJÀ un vocabulaire de portée, créé pour
// THE-FINAL-JUDGE puis réutilisé tel quel par SMART-CONSO-TOKEN (`SCOPE_LEVELS`). En inventer un
// cinquième ici (« une famille », « une catégorie de scripts », « tout le code »…) créerait
// exactement la divergence silencieuse que l'Article 24 interdit. ecotoken IMPORTE donc la même
// échelle — jamais une copie, jamais un synonyme.
//
// Ce que chaque palier veut dire POUR ECOTOKEN (le vocabulaire est partagé, la cible ne l'est pas —
// SMART-CONSO-TOKEN pèse, ecotoken réduit) :
//   • global  — tout le paysage surveillé : les documents budgétés + les documents profilés.
//   • partiel — une famille de fichiers désignée par un préfixe réel (`docs/referentiel/`,
//               `scripts/`, `docs/`) — la « catégorie de scripts » ou le « dossier » demandés.
//   • zoome   — un seul fichier.
//   • focus   — une seule section d'un seul fichier (`CLAUDE.md#Article 18`).
//
// Frontière à ne jamais confondre, même quand deux mots se ressemblent : les 4 NIVEAUX de
// CHECK-LEVEL-TARGET (Léger/Standard/Approfondi/Exceptionnel) répondent à « à quel point faut-il
// vérifier », ces 4 PORTÉES à « sur quelle surface ». Même remarque déjà écrite pour
// THE-FINAL-JUDGE (docs/referentiel/the-final-judge.md) — pas un nouveau garde-fou, le même.
export { SCOPE_LEVELS };

// Les extensions réellement analysables : ecotoken découpe du Markdown. Un `.ts` n'a pas de
// sections `##` — le scanner produirait une seule section géante et zéro proposition, c'est-à-dire
// du bruit. Limite dite, jamais contournée par un faux résultat.
const ANALYSABLE = /\.md$/;

// Un préfixe de portée `partiel` n'est jamais deviné : il doit désigner un dossier réel du dépôt.
export function resolveScopeTargets(portee, cible, { root = ROOT, budgets = BUDGETS, profiles = DOCUMENT_PROFILES } = {}) {
  if (!SCOPE_LEVELS.includes(portee)) throw new Error(`Portée inconnue: "${portee}" — attendu l'un de ${SCOPE_LEVELS.join(", ")}`);
  if (portee === "global") {
    const vus = new Set();
    for (const c of Object.keys(budgets)) vus.add(c);
    for (const p of profiles) if (!p.dossier && ANALYSABLE.test(p.chemin)) vus.add(p.chemin);
    return [...vus].filter((c) => existsSync(join(root, c))).sort();
  }
  if (!cible) throw new Error(`La portée "${portee}" exige une cible (un dossier, un fichier, ou fichier#section).`);
  if (portee === "partiel") {
    const base = join(root, cible);
    if (!existsSync(base) || !statSync(base).isDirectory()) throw new Error(`Portée "partiel" : "${cible}" n'est pas un dossier réel du dépôt.`);
    const out = [];
    const walk = (rel) => {
      for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
        const sous = `${rel}/${e.name}`;
        if (e.isDirectory()) walk(sous);
        else if (ANALYSABLE.test(e.name)) out.push(sous);
      }
    };
    walk(cible.replace(/\/$/, ""));
    return out.sort();
  }
  // zoome et focus visent tous deux UN fichier ; focus n'en garde qu'une section (géré à l'analyse).
  const fichier = String(cible).split("#")[0];
  if (!existsSync(join(root, fichier))) throw new Error(`Fichier introuvable : ${fichier}`);
  return [fichier];
}

export function scanScope(portee, cible, { root = ROOT, repoFiles = null } = {}) {
  const cibles = resolveScopeTargets(portee, cible, { root });
  // Le dépôt est lu UNE fois pour tout le scan (corrigé le 2026-09-22) : sans ça, chaque document
  // analysé relisait l'intégralité du dépôt pour calculer sa criticité — 37 relectures complètes
  // sur un scan de `docs/referentiel/`, 1 320 ms là où 90 suffisent. Un outil qui prêche la sobriété
  // n'a pas le droit de gaspiller ainsi.
  repoFiles = repoFiles ?? loadRepoFiles(root);
  const section = portee === "focus" ? String(cible).split("#").slice(1).join("#") : null;
  if (portee === "focus" && !section) throw new Error('Portée "focus" : attendu la forme "fichier.md#Titre de section".');
  // Une section qui n'existe pas rendait « 0 gain », exactement comme une vraie section sans rien à
  // gagner — un silence trompeur, le contraire de l'honnêteté que tout le reste de cet outil
  // s'impose. On vérifie donc d'abord qu'elle existe réellement.
  if (section) {
    const titres = splitSections(readFileSync(join(root, cibles[0]), "utf8")).map((x) => String(x.titre).toLowerCase());
    if (!titres.some((t) => t.includes(section.toLowerCase()))) {
      return { portee, cible, section, sectionIntrouvable: true, documentsAnalyses: 0, tokensTotal: 0, gainTotal: 0, avecGain: [], sansGain: [],
        raison: `Aucune section de ${cibles[0]} ne correspond à « ${section} » — ce n'est pas « rien à gagner », c'est une cible qui n'existe pas.` };
    }
  }
  const documents = [];
  for (const chemin of cibles) {
    const r = analyzeDocument(chemin, { repoFiles, root });
    if (r.absent) continue;
    if (section) {
      const cherche = section.toLowerCase();
      const gardees = r.propositions.filter((p) => String(p.cible).toLowerCase().includes(cherche));
      documents.push({ ...r, section, propositions: gardees, gainTotal: gardees.reduce((a, b) => a + b.gain, 0) });
    } else documents.push(r);
  }
  const gainTotal = documents.reduce((a, b) => a + b.gainTotal, 0);
  return {
    portee, cible: cible ?? null, section,
    documentsAnalyses: documents.length,
    tokensTotal: documents.reduce((a, b) => a + b.tokens, 0),
    gainTotal,
    // Les documents qui ne rendent RIEN sont gardés dans le compte mais sortis du classement : un
    // zéro honnête est une information (cf. principes.md scanné sans trouvaille), jamais une ligne
    // de remplissage dans un palmarès.
    avecGain: documents.filter((d) => d.gainTotal > 0).sort((a, b) => b.gainTotal - a.gainTotal),
    // 5e apprentissage (2026-09-22) : `sansGain` ne gardait QUE le chemin — toute l'analyse déjà
    // calculée pour ces documents (criticité, manuel logé, bloc mal rangé, extraction à examiner)
    // était jetée, précisément pour les documents où elle est la SEULE chose à dire. Résultat
    // constaté en direct : `scan zoome docs/referentiel/principes.md`, 24 413 tokens, rendait six
    // lignes vides de sens. Un outil qui a évolué dont le rapport est resté basique — exactement ce
    // que le réseau reproche aux autres. On garde donc le document entier ; c'est l'affichage qui
    // choisit quoi en dire.
    sansGain: documents.filter((d) => d.gainTotal === 0),
  };
}

// Quelle portée pour QUOI — le pendant de `ecotokenShouldRun` : celui-là dit s'il faut tourner,
// celui-ci dit sur quelle surface. Jamais un palier par défaut figé (même principe que
// THE-FINAL-JUDGE, dont l'intensité se choisit au déclenchement) : la portée se déduit de ce qui a
// réellement changé, et le cas « on ne sait pas » retombe sur global, le plus prudent.
export function recommendScope(changedFiles, { budgets = BUDGETS } = {}) {
  const touches = watchedDocumentsTouched(changedFiles, budgets);
  if (touches === null) return { portee: "global", cible: null, raison: "Rien ne dit ce qui a changé — on regarde tout le paysage surveillé plutôt que de deviner." };
  if (!touches.length) return { portee: null, cible: null, raison: "Aucun document budgété n'a bougé — ecotoken n'a rien à faire ici (son propre réveil conditionnel)." };
  if (touches.length === 1) return { portee: "zoome", cible: touches[0], raison: `Un seul document surveillé a changé (${touches[0]}) — inutile de rescanner les autres.` };
  return { portee: "global", cible: null, raison: `${touches.length} documents surveillés ont changé — le paysage entier est plus honnête qu'un scan partiel arbitraire.` };
}

// --- QUAND IL DOIT SE DÉCLENCHER / QUAND IL SE DÉCLENCHE VRAIMENT --------------------------------
// Demande du 2026-09-22 : « fiabiliser la partie : quand est-ce qu'il doit se déclencher ? quand
// est-ce qu'il se déclenche effectivement ? ». Les deux questions n'ont pas la même réponse tant
// que personne ne vérifie — et un commentaire promettant « branché dans le crochet » n'est jamais
// une preuve (Article 24, mot pour mot : « un simple commentaire promettant une synchronisation
// future n'est jamais une protection suffisante »).
//
// TRIGGERS déclare le CONTRAT (ce qui doit être vrai). `auditTriggers()` va LIRE les fichiers réels
// et dit, déclencheur par déclencheur, si le câblage existe vraiment. Même patron mécanique que
// findToolsMissingFromMenu()/findGardiensMissingFromSource(), déjà prouvé 12 fois dans ce dépôt.
export const TRIGGERS = [
  {
    id: "post-commit",
    quand: "à chaque commit touchant un document budgété (jamais les autres — réveil conditionnel)",
    portee: "zoome ou global, selon recommendScope()",
    cout: "gratuit (comptage de tokens seul)",
    fichier: "scripts/hooks/post-commit",
    preuve: /ecotoken\.mjs\s+budget/,
  },
  {
    id: "ronde-circle",
    quand: "à chaque Ronde CIRCLE-TASKS (périodique), même si aucun commit n'a touché la charte",
    portee: "global",
    cout: "gratuit",
    fichier: "scripts/circle-tasks.mjs",
    preuve: /ecotoken\.mjs/,
  },
  {
    id: "network-check",
    quand: "à chaque passage réseau de LE-COORDINATEUR (état de santé instantané du poids)",
    portee: "global (budgets seuls, pas de plan)",
    cout: "gratuit",
    fichier: "scripts/le-coordinateur.mjs",
    preuve: /checkWeightBudget|checkAllBudgets/,
  },
  {
    id: "sur-demande",
    quand: "quand l'agent ou l'utilisateur veut un plan chiffré avant d'alléger un document",
    portee: "au choix — global / partiel / zoome / focus",
    cout: "gratuit",
    fichier: "docs/regles-de-travail.md",
    preuve: /ecotoken/,
  },
];

export function auditTriggers(root = ROOT, read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null)) {
  return TRIGGERS.map((t) => {
    const contenu = read(join(root, t.fichier));
    if (contenu === null) return { ...t, cable: false, ecart: `fichier absent : ${t.fichier}` };
    const cable = t.preuve.test(contenu);
    return { ...t, cable, ecart: cable ? null : `déclencheur déclaré mais introuvable dans ${t.fichier}` };
  });
}

export function findTriggersNotWired(root = ROOT, read) {
  return auditTriggers(root, read).filter((t) => !t.cable);
}

// --- LE FOND QUI PROTÈGE LE PROJET ---------------------------------------------------------------
// Demande du 2026-09-22 : « lors de la correction sur CLAUDE.md par ex, on doit bien veiller à ne
// pas modifier le fond des choses qui protègent le projet ». Cette veille existait, mais elle
// reposait sur ma relecture — donc sur ma vigilance, donc sur rien de garanti. Elle devient ici un
// contrôle mécanique, exécutable par n'importe qui, avant/après n'importe quel allègement.
//
// Trois couches, de la plus dure à la plus souple :
//   1. LES ARTICLES — leur nombre ET leur intitulé exact. Un Article disparu ou renommé est un
//      échec sec, jamais un arbitrage : les intitulés sont cités tels quels dans tout le dépôt.
//   2. LES PHRASES SOCLES — le principe fondateur et les garde-fous non négociables, cherchés sur
//      un texte aplati (un simple retour à la ligne déplacé ne doit pas déclencher une fausse
//      alerte, ni en masquer une vraie).
//   3. LES PHRASES NORMATIVES — toute phrase contenant jamais/toujours/doit/obligatoire qui a
//      cessé d'exister. Elles sont TRIÉES : celles qui ne font que redire la convention
//      documentaire (« jamais X, qui vit dans docs/… ») sont du rangement ; les autres sont
//      remontées une par une pour lecture humaine. L'outil ne décide jamais qu'une règle était
//      superflue — il dit laquelle regarder.
// Les socles ne sont PAS une liste tenue à la main toute seule (Article 24). Ceux qui peuvent être
// DÉRIVÉS le sont : CHARTER-SPY classe déjà chaque Article du fichier maître en « très sensible »
// (Article 0) / « sensible (se déclare non négociable) » / « normale ». Un Article ainsi classé est
// par définition un socle : son intitulé doit survivre à tout allègement. La liste écrite ci-dessous
// ne garde donc que ce qu'aucun classement ne peut produire — des phrases de PROSE, hors Article.
export function derivedSocles(texteCharte, { classify = null } = {}) {
  try {
    const table = buildClaudeMdRuleTable(texteCharte);
    return (table.rows ?? [])
      .filter((r) => !/normale/.test(r.sensibilite ?? "normale"))
      .map((r) => String(r.titre).trim())
      .filter(Boolean);
  } catch { return []; }
}

export const PHRASES_SOCLES = [
  "esprit rugueux, sarcastique, cynique",
  "est la loi suprême",
  "Aucune règle ci-dessous ne peut le contredire",
  "un allègement de CLAUDE.md ne doit JAMAIS entamer la qualité",
  "la réponse par défaut est de NE PAS couper",
];

const CONVENTION_DOC = /(blueprint|documente l['’]ARCHITECTURE|qui viv(ent|t) dans|instanciation|registre|dossier \+ index|Cf\. `docs)/i;

export function verifyProtectiveSubstance(avant, apres, { socles = PHRASES_SOCLES } = {}) {
  const plat = (t) => String(t).replace(/\s+/g, " ");
  const A = plat(avant), B = plat(apres);
  // Aux socles écrits s'ajoutent ceux que CHARTER-SPY sait déjà reconnaître — jamais deux listes
  // qui divergeraient en silence, une liste écrite et une liste dérivée qui se complètent.
  socles = [...new Set([...socles, ...derivedSocles(avant)])];
  const titres = (t) => [...t.matchAll(/\*\*Article (\d+) — ([^.*]+)/g)].map((m) => `${m[1]} — ${m[2].trim()}`);
  const ta = titres(A), tb = titres(B);
  const articlesPerdus = ta.filter((x) => !tb.includes(x));
  const soclesPerdus = socles.filter((s) => A.includes(s) && !B.includes(s));
  const phrases = (t) => new Set(t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => /\b(jamais|toujours|doit|obligatoire|non négociable)\b/i.test(s)));
  const pa = phrases(A), pb = phrases(B);
  const disparues = [...pa].filter((x) => !pb.has(x));
  const rangement = disparues.filter((p) => CONVENTION_DOC.test(p));
  const aExaminer = disparues.filter((p) => !CONVENTION_DOC.test(p));
  return {
    // Un seul verdict binaire, et il ne porte QUE sur ce qui est mécaniquement décidable.
    sur: articlesPerdus.length === 0 && soclesPerdus.length === 0,
    articles: { avant: ta.length, apres: tb.length, perdus: articlesPerdus },
    soclesPerdus,
    normatives: { avant: pa.size, apres: pb.size, disparues: disparues.length, rangement: rangement.length, aExaminer },
    // Dit franchement ce que ce contrôle ne sait PAS faire, plutôt que de laisser croire à une preuve.
    limite: "Ce contrôle vérifie qu'une règle est encore ÉCRITE, jamais qu'elle a le même SENS. Les phrases « à examiner » demandent une lecture humaine — elles ne sont pas un verdict.",
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

// =================================================================================================
// LE COÛT RÉEL : POIDS × FRÉQUENCE (2026-09-22, demande d'élargissement de l'utilisateur).
//
// Jusqu'ici l'outil raisonnait en POIDS. C'est la bonne mesure pour un seul document, mais la
// mauvaise dès qu'on compare deux documents entre eux — et c'est précisément ce qu'il faut faire
// pour savoir où dépenser son effort. Un document lourd lu une fois par session coûte moins qu'un
// document moyen rechargé à chaque message.
//
// Le calcul est volontairement SIMPLE et transparent : poids × nombre de lectures par session. Pas
// de pondération inventée, pas de score composite opaque — un nombre de tokens réellement payés,
// que n'importe qui peut refaire à la main. La seule inconnue honnête est le nombre de messages par
// session, qui varie : il est donc un PARAMÈTRE affiché, jamais une constante cachée.
export const CHARGEMENT = {
  // Rechargé intégralement à chaque message de la session. Un seul document dans ce cas.
  toujours: (poids, messages) => poids * messages,
  // Lu quand l'agent en a besoin. `lectures` est une observation, jamais une prédiction.
  a_la_demande: (poids, _messages, lectures = 1) => poids * lectures,
  // Jamais relu par l'agent en conditions normales (archives, transcripts de simulation). Coût
  // réel nul tant que personne ne l'ouvre — leur taille n'est PAS un problème, contrairement à ce
  // qu'un classement par poids brut laisse croire.
  archive: () => 0,
};

// Profils réels de ce projet. Liste volontairement CURATÉE (Article 24 : sa nature manuelle est
// écrite ici même) — le mode de chargement d'un document n'est déductible d'aucun scan, il dépend
// de la façon dont l'agent travaille. `lectures` est une estimation basse assumée : mieux vaut
// sous-estimer un coût que le gonfler pour justifier une coupe.
export const DOCUMENT_PROFILES = [
  { chemin: "CLAUDE.md", chargement: "toujours", lectures: null, note: "la charte, rechargée intégralement à chaque message" },
  { chemin: "docs/regles-de-travail.md", chargement: "a_la_demande", lectures: 2, note: "relu dès qu'un protocole de travail est en jeu (simulation, Ronde, livrable)" },
  { chemin: "docs/referentiel/principes.md", chargement: "a_la_demande", lectures: 1, note: "relu avant toute intervention sur le moteur du jeu" },
  { chemin: "docs/referentiel/parametres.md", chargement: "a_la_demande", lectures: 1, note: "relu lors d'un rééquilibrage" },
  { chemin: "docs/suivi/sessions", chargement: "a_la_demande", lectures: 3, note: "le suivi de la session en cours, relu à chaque mise à jour de tâche", dossier: true },
  // Ajouté le 2026-09-22 après mesure : 83 000 tokens, le plus gros artefact du dépôt, dont 92 % de
  // versions anciennes jamais relues. Il n'était dans AUCUN profil, donc totalement invisible aux
  // mesures de coût — un angle mort de 4× CLAUDE.md. Déclaré ici pour qu'il cesse de l'être, PAS
  // pour être découpé : c'est le référentiel affiché en jeu (panneau Admin) et un fichier du
  // MOTEUR, pas de la documentation. Le restructurer changerait ce qu'un utilisateur voit — une
  // décision qui appartient à l'utilisateur, jamais à l'outil ni à moi (garde-fou de la charte).
  { chemin: "lib/reference.ts", chargement: "a_la_demande", lectures: 1, note: "référentiel affiché en jeu ; 171 versions, 92 % d'historique jamais relu — coûteux à ouvrir, rarement ouvert" },
];

export function realSessionCost(profiles = DOCUMENT_PROFILES, { messagesParSession = 50, root = ROOT } = {}) {
  const lignes = [];
  for (const prof of profiles) {
    const full = join(root, prof.chemin);
    if (!existsSync(full)) continue;
    let poids = 0;
    if (prof.dossier) {
      for (const f of readdirSync(full)) if (/\.md$/.test(f)) poids += estimateTokens(readFileSync(join(full, f), "utf8"));
    } else poids = estimateTokens(readFileSync(full, "utf8"));
    const calc = CHARGEMENT[prof.chargement] ?? CHARGEMENT.a_la_demande;
    lignes.push({ ...prof, poids, coutSession: Math.round(calc(poids, messagesParSession, prof.lectures ?? 1)) });
  }
  const total = lignes.reduce((a, b) => a + b.coutSession, 0);
  return {
    messagesParSession, total,
    lignes: lignes.sort((a, b) => b.coutSession - a.coutSession).map((l) => ({ ...l, partPct: total ? Math.round((l.coutSession / total) * 100) : 0 })),
  };
}

// =================================================================================================
// ÉLARGISSEMENT À N'IMPORTE QUEL DOCUMENT (même demande).
//
// Trois des cinq stratégies sont DÉJÀ génériques sur n'importe quel Markdown : le découpage en
// sections, la détection de familles de titres et l'extraction ne savent rien de CLAUDE.md. Deux
// ne le sont pas, et c'est assumé plutôt que forcé :
//   • le rendement par article suppose une charte numérotée en Articles ;
//   • « déjà mécanisé » suppose un document qui donne des consignes à un agent.
// Les appliquer à un document qui n'a ni l'un ni l'autre produirait du bruit, pas des trouvailles.
// `analyzeDocument()` les active donc seulement quand le document s'y prête réellement, détecté sur
// son contenu — jamais sur son nom de fichier, qui ne prouve rien.
export function analyzeDocument(path, { repoFiles = null, root = ROOT } = {}) {
  const full = join(root, path);
  if (!existsSync(full)) return { chemin: path, absent: true };
  const texte = readFileSync(full, "utf8");
  const sections = splitSections(texte);
  const estUneCharte = /\*\*Article \d+\s*[—-]/.test(texte);
  const donneDesConsignes = /\b(jamais|toujours|doit|obligatoire)\b/gi.test(texte) && (texte.match(/\b(jamais|toujours|doit)\b/gi) || []).length >= 20;
  const propositions = [];
  for (const fam of findHeadingFamilies(sections)) {
    const facts = fam.members.map(extractCatalogFacts);
    const remplacement = buildCatalogueReplacement(fam.famille, facts);
    const apres = estimateTokens(remplacement);
    propositions.push({ strategie: "catalogue", cible: `${fam.members.length} sections « … — ${fam.famille} »`, tokensAvant: fam.tokens, tokensApres: apres, gain: fam.tokens - apres, risque: "faible", remplacement, deplacements: facts.map((f) => ({ nom: f.membre, vers: f.instanciation ?? f.architecture, cibleManquante: !f.instanciation && !f.architecture, texte: f.texte })) });
  }
  const total = sections.reduce((a, b) => a + b.tokens, 0);
  const dejaVues = new Set(propositions.flatMap((p) => p.deplacements.map((d) => d.nom)));
  const extractionsAExaminer = [];
  for (const e of planExtractions(sections, total)) {
    if (dejaVues.has(e.section)) continue;
    // Sans destination existante : une question posée, jamais un gain annoncé.
    if (e.aExaminer) { extractionsAExaminer.push({ section: e.section, tokens: e.tokensAvant, question: `« ${e.section} » pèse ${e.tokensAvant} tk. Est-ce un corps étranger dans ce document (alors il faut lui créer un domicile) ou son sujet même (alors il reste) ? Aucun document existant ne traite déjà ce sujet — l'outil ne peut pas trancher.` }); continue; }
    propositions.push({ strategie: "extraction", cible: e.section, tokensAvant: e.tokensAvant, tokensApres: e.tokensApres, gain: e.gain, risque: e.nature === "narration" ? "faible" : "moyen", remplacement: e.stub, deplacements: [{ nom: e.section, vers: e.cible, cibleManquante: e.cibleManquante, texte: e.texte }] });
  }
  const manuelRef = estLeManuelDesProcedures(path, repoFiles ?? loadRepoFiles(root));
  if (donneDesConsignes && !manuelRef.estLeManuel) {
    const meca = findAlreadyMechanised(texte).filter((m) => !dejaVues.has(m.section));
    if (meca.length) {
      const av = meca.reduce((a, b) => a + b.tokens, 0), ap = meca.reduce((a, b) => a + b.tokensApres, 0);
      propositions.push({ strategie: "mecanise", cible: `${meca.length} passage(s) décrivant une procédure déjà automatisée`, tokensAvant: av, tokensApres: ap, gain: av - ap, risque: meca.some((m) => m.niveau === "bloquant") ? "faible" : "moyen", remplacement: null, detail: meca, deplacements: meca.map((m) => ({ nom: `${m.section} · ${m.outils.join("/")}`, vers: "docs/regles-de-travail.md", cibleManquante: false, texte: m.extrait })) });
    }
  }
  // La criticité FILTRE réellement, elle n'est pas une étiquette posée à côté (2026-09-22) : sur un
  // document critique ou sensible, une proposition à risque « moyen » n'est plus proposée à
  // l'application — elle reste VISIBLE, listée à part, parce que la masquer serait mentir sur le
  // gain possible ; elle cesse seulement d'être une chose qu'on applique sans y réfléchir.
  const criticite = assessCriticality(path, { root, repoFiles });
  // Les deux signaux venus de la première passe réelle. Ils ne rejoignent PAS `propositions` :
  // un manuel logé demande un vrai arbitrage humain (que garder sous les yeux ?) et un bloc mal
  // rangé ne fait gagner aucun token. Les mélanger aux propositions chiffrées laisserait croire
  // à un gain automatique là où il y a une décision à prendre.
  const manuelsLoges = findLodgedManuals(texte, { root });
  const malRanges = findMisfiledBlocks(texte);
  const rangRisque = { faible: 0, moyen: 1, élevé: 2, eleve: 2 };
  const plafond = rangRisque[criticite.risqueMaxAutorise] ?? 1;
  const toutes = propositions.filter((p) => p.gain > 0).sort((a, b) => b.gain - a.gain);
  const utiles = toutes.filter((p) => (rangRisque[p.risque] ?? 1) <= plafond);
  const retenuesParCriticite = toutes.filter((p) => !utiles.includes(p));
  return {
    chemin: path, tokens: estimateTokens(texte), nbSections: sections.length,
    criticite, retenuesParCriticite, manuelsLoges, malRanges, extractionsAExaminer,
    // Dit honnêtement quelles stratégies ont été ÉCARTÉES et pourquoi, plutôt que de laisser croire
    // à une analyse complète là où deux angles n'étaient simplement pas applicables.
    strategiesApplicables: { catalogue: true, extraction: true, mecanise: donneDesConsignes, rendementParArticle: estUneCharte },
    strategiesEcartees: [
      !donneDesConsignes && "mecanise (ce document ne donne pas de consignes à un agent)",
      donneDesConsignes && manuelRef.estLeManuel && `mecanise (ce document EST le manuel de référence des procédures — ${manuelRef.pourquoi} ; lui reprocher d'en décrire serait lui reprocher d'exister)`,
      !estUneCharte && "rendement par article (ce document n'est pas une charte numérotée)",
    ].filter(Boolean),
    propositions: utiles, gainTotal: utiles.reduce((a, b) => a + b.gain, 0),
  };
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

// L'ironie à corriger (trouvée en cherchant les trous de cet outil même, 2026-09-22) : la criticité
// déclare `verifyProtectiveSubstance()` OBLIGATOIRE sur le fichier maître, mais rien ne la rendait
// possible — il fallait avoir gardé une copie d'avant sous la main. Une obligation écrite sans
// mécanisme, exactement ce qu'ecotoken reproche aux autres.
//
// La correction n'est pas un rappel de plus : à chaque scan, une copie du fichier maître est
// déposée dans le dossier de l'outil (donc via assertSafeWriteTarget, la sûreté reste entière).
// Le contrôle avant/après devient alors exécutable à tout moment, sans rien demander à personne.
// Journal LOCAL, jamais committé (déclaré dans .gitignore, même statut que .gemini-key-health.json
// ou .tool-usage-history.json) : committer une copie entière de la charte à chaque changement
// dupliquerait le document le plus lourd du dépôt, indéfiniment. Il vit donc à la racine, hors du
// dossier de rapports — mais reste couvert par assertSafeWriteTarget via son propre dossier autorisé.
export const SNAPSHOT_MAITRE = join(OUT_DIR, ".dernier-fichier-maitre.local.txt");

export function snapshotMasterFile({ root = ROOT, chemin = null, indexPath = SNAPSHOT_MAITRE } = {}) {
  const cible = chemin ?? detectMasterFile({ root }).chemin;
  if (!cible || !existsSync(join(root, cible))) return { ecrit: false, raison: "aucun fichier maître détecté" };
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const texte = readFileSync(join(root, cible), "utf8");
  const avant = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
  // Jamais de réécriture inutile : une copie identique n'apprend rien et efface la référence utile.
  if (avant === texte) return { ecrit: false, raison: "identique à la copie précédente", chemin: cible };
  writeFileSync(assertSafeWriteTarget(indexPath), texte, "utf8");
  return { ecrit: true, chemin: cible, precedent: avant };
}

// Le contrôle avant/après, désormais réellement exécutable : il compare la copie déposée au dernier
// scan au contenu actuel. Sans copie précédente, il le dit — jamais un faux « tout va bien ».
export function verifyAgainstSnapshot({ root = ROOT, indexPath = SNAPSHOT_MAITRE } = {}) {
  const cible = detectMasterFile({ root }).chemin;
  if (!cible) return { possible: false, raison: "aucun fichier maître détecté" };
  if (!existsSync(indexPath)) return { possible: false, raison: "aucune copie de référence encore déposée — elle le sera au prochain scan" };
  const avant = readFileSync(indexPath, "utf8"), apres = readFileSync(join(root, cible), "utf8");
  if (avant === apres) return { possible: true, inchange: true, chemin: cible };
  return { possible: true, inchange: false, chemin: cible, ...verifyProtectiveSubstance(avant, apres) };
}

export function recordPass({ poids, gainPropose, decision = "à trancher", cible = "", indexPath = INDEX_FILE } = {}) {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const header = "# ecotoken — registre des passages\n\n*(Une ligne par passage. `Décision` est la seule colonne écrite à la main : c'est la réponse de\nl'utilisateur, que rien ne peut deviner. L'outil la relit au passage suivant pour ne jamais\nreproposer en tête ce qui a déjà été refusé.)*\n\n| Date | Poids CLAUDE.md | Gain proposé | Décision | Cible |\n|---|---|---|---|---|\n";
  const prior = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : header;
  writeFileSync(assertSafeWriteTarget(indexPath), prior + `| ${new Date().toISOString().slice(0, 16).replace("T", " ")} | ${poids} | ${gainPropose} | ${decision} | ${cible} |\n`, "utf8");
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

  const criticite = assessCriticality("CLAUDE.md", { repoFiles: files });
  const declencheurs = auditTriggers();

  const L = [];
  L.push("=== ecotoken — réduire le coût permanent de la charte ===");
  L.push(`Date : ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);
  L.push("");
  L.push(`CLAUDE.md pèse ${poids.tokens} tokens sur ${texte.split("\n").length} lignes, et c'est le SEUL document rechargé`);
  L.push("à chaque message — son poids se paie en boucle, jamais une seule fois.");
  L.push("");
  // Ce bloc passe AVANT tout chiffre de gain, volontairement : sur un document critique, savoir ce
  // qu'on risque doit précéder de savoir ce qu'on gagne.
  L.push("--- CRITICITÉ DE LA CIBLE ----------------------------------------------------------");
  L.push(`Niveau : ${criticite.niveau.toUpperCase()} (score ${criticite.score}) — ${criticite.consigne}`);
  for (const s of criticite.signaux) L.push(`  · ${s.nom} : ${s.detail}`);
  L.push(`  → seules les propositions à risque « ${criticite.risqueMaxAutorise} » sont applicables ici ; les plus risquées restent visibles mais se proposent` +
    `${criticite.validationHumaineObligatoire ? " · validation humaine OBLIGATOIRE" : ""}` +
    `${criticite.controlePerteObligatoire ? " · contrôle de perte de références OBLIGATOIRE après application" : ""}`);
  L.push("  Sûreté : ecotoken n'écrit JAMAIS dans le document analysé (assertSafeWriteTarget) —");
  L.push("  ses seules écritures vont dans docs/ecotoken/. Tout allègement est appliqué à la main.");
  L.push("");
  const manuels = findLodgedManuals(texte), malRanges = findMisfiledBlocks(texte);
  if (manuels.length || malRanges.length) {
    L.push("--- STRUCTURE : CE QUI N'EST PAS À SA PLACE ----------------------------------------");
    L.push("Le poids n'est pas la seule question : un contenu mal rangé coûte à chaque message sans");
    L.push("que personne ne le voie, parce qu'il se cache sous un titre qui parle d'autre chose.");
    for (const m of manuels) L.push(`  📦 MANUEL LOGÉ · « ${m.bloc.slice(0, 60)} » (${m.tokens} tk)\n     ${m.pourquoi}\n     Prudence : ${m.prudence}`);
    for (const x of malRanges) L.push(`  🗂️  RANGEMENT À TRANCHER · « ${x.bloc.slice(0, 60)} » (${x.tokens} tk) — ${x.pourquoi}\n     ${x.note}`);
    L.push("");
  }
  L.push("--- DÉCLENCHEURS : ATTENDUS vs RÉELLEMENT CÂBLÉS -----------------------------------");
  for (const t of declencheurs) L.push(`  ${t.cable ? "✅" : "❌"} ${t.id} — ${t.quand}${t.ecart ? ` [${t.ecart}]` : ""}`);
  L.push(`  ${declencheurs.filter((t) => t.cable).length}/${declencheurs.length} vérifiés en lisant les fichiers, jamais sur promesse.`);
  L.push(`  Portées disponibles : ${SCOPE_LEVELS.join(" / ")} (vocabulaire partagé avec THE-FINAL-JUDGE et SMART-CONSO-TOKEN).`);
  const sansBudget = findProfiledDocumentsWithoutBudget();
  if (sansBudget.length) for (const d of sansBudget) L.push(`  ⚠️  ${d.chemin} — ${d.ecart}`);
  const controle = verifyAgainstSnapshot();
  L.push(`  Contrôle avant/après du fichier maître : ${controle.possible ? (controle.inchange ? "possible, fichier inchangé depuis le dernier scan" : `${controle.sur ? "✅ fond intact" : "❌ FOND ALTÉRÉ"} depuis le dernier scan`) : controle.raison}`);
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
  return { text: L.join("\n"), poids, rendements, plan, budget, parNature, criticite, declencheurs };
}

// Liste des fichiers du dernier commit, sans jamais faire échouer le crochet si git est muet.
function lastCommitFilesSafe() {
  try {
    const out = execSync("git show --name-only --format= HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const files = String(out).split("\n").map((l) => l.trim()).filter(Boolean);
    return files.length ? files : undefined;
  } catch { return undefined; }
}

function main() {
  printReliabilityNotice("ecotoken");
  // Même correctif que doc-report.mjs le même soir : sans cet enregistrement, ecotoken reste
  // éternellement « jamais sollicité » quel que soit le nombre de fois où il tourne vraiment.
  recordCliUsage("ecotoken");
  const sub = process.argv[2];
  const texte = readFileSync(CHARTER, "utf8");
  if (sub === "budget") {
    // Réveil conditionnel : ecotoken s'applique sa propre médecine. Vérifier le poids de la charte
    // après un commit qui n'a touché que du code serait exactement le coup d'épée dans l'eau qu'il
    // dénonce chez les autres.
    const changed = lastCommitFilesSafe();
    if (!ecotokenShouldRun(changed)) return;
    const all = checkAllBudgets();
    if (!all.depassements.length) {
      const pire = all.lignes.filter((l) => !l.absent).sort((a, b) => a.margePct - b.margePct)[0];
      console.log(`✅ ecotoken : ${all.lignes.filter((l) => !l.absent).length} document(s) budgété(s) sous leur seuil — le plus tendu est ${pire?.chemin} (marge ${pire?.margePct} %).`);
      return;
    }
    for (const d of all.depassements) {
      console.log(`⚠️  ecotoken : ${d.chemin} pèse ${d.tokens} tokens, ${d.depassement} au-dessus de son budget de ${d.budget} — la section la plus lourde est « ${d.plusLourdes[0]?.titre} ». Jamais bloquant : ajouter une vraie règle reste légitime, mais plus sans le savoir. Plan chiffré : node scripts/ecotoken.mjs plan`);
    }
    return;
  }
  if (sub === "cout") {
    const c = realSessionCost(undefined, { messagesParSession: Number(process.argv[3]) || 50 });
    console.log(`=== Coût réel par session de ${c.messagesParSession} messages ===\n`);
    for (const l of c.lignes) console.log(`  ${String(l.partPct).padStart(3)}% | ${String(l.coutSession).padStart(9)} tk | ${String(l.poids).padStart(6)} tk × ${l.chargement === "toujours" ? "CHAQUE message" : l.lectures + " lecture(s)"}\n        ${l.chemin}`);
    console.log(`\n  TOTAL : ${c.total.toLocaleString("fr-FR")} tokens par session.`);
    console.log("  (Le nombre de messages est un paramètre affiché, jamais une constante cachée : node scripts/ecotoken.mjs cout <messages>.)");
    return;
  }
  if (sub === "doc") {
    const cible = process.argv[3];
    if (!cible) { console.log("Usage : node scripts/ecotoken.mjs doc <chemin>"); return; }
    const r = analyzeDocument(cible);
    if (r.absent) { console.log(`Document introuvable : ${cible}`); return; }
    console.log(`=== ${r.chemin} — ${r.tokens} tokens, ${r.nbSections} sections ===`);
    if (r.strategiesEcartees.length) console.log(`Stratégies écartées : ${r.strategiesEcartees.join(" | ")}`);
    console.log(`Gain total détecté : ~${r.gainTotal} tokens sur ${r.propositions.length} proposition(s).\n`);
    for (const p of r.propositions) console.log(`  [${p.risque}] ${p.strategie} — ${p.cible}\n      ~${p.tokensAvant} → ~${p.tokensApres} tk (gain ~${p.gain})`);
    return;
  }
  if (sub === "scan") {
    const portee = process.argv[3] || "global";
    const cible = process.argv[4] || null;
    let r;
    try { r = scanScope(portee, cible); } catch (e) { console.log(`❌ ${e.message}`); return; }
    console.log(`=== ecotoken · portée ${portee}${cible ? ` · ${cible}` : ""} ===`);
    console.log(`${r.documentsAnalyses} document(s) analysé(s), ${r.tokensTotal.toLocaleString("fr-FR")} tokens au total.`);
    console.log(`Gain détecté : ~${r.gainTotal.toLocaleString("fr-FR")} tokens.\n`);
    for (const d of r.avecGain) {
      console.log(`  ~${String(d.gainTotal).padStart(6)} tk · ${d.chemin} (${d.tokens} tk, ${d.propositions.length} proposition(s))`);
      for (const p of d.propositions.slice(0, 3)) console.log(`             [${p.risque}] ${p.strategie} — ${p.cible} (~${p.gain} tk)`);
    }
    if (r.sansGain.length) console.log(`\n  Aucun gain mécanique détecté sur ${r.sansGain.length} document(s) — un zéro honnête, jamais une ligne de remplissage : ${r.sansGain.slice(0, 6).map((d) => d.chemin).join(", ")}${r.sansGain.length > 6 ? "…" : ""}`);
    // Tout ce que l'analyse a VRAIMENT trouvé, gain ou pas (5e apprentissage, 2026-09-22) : la
    // criticité de la cible, un manuel d'outil logé dans un document de règles, un bloc rangé sous
    // le mauvais titre, une section trop lourde dont l'outil ne peut pas décider seul. Aucun de ces
    // signaux ne se chiffre en tokens gagnés — c'est exactement pour ça qu'ils disparaissaient d'un
    // rapport qui ne savait parler que de gain.
    const analyses = [...r.avecGain, ...r.sansGain].slice(0, 12);
    for (const d of analyses) {
      const signaux = [];
      for (const m of d.manuelsLoges ?? []) signaux.push(`📦 manuel logé · « ${m.section} » (${m.tokens} tk) — ${m.pourquoi ?? "un mode d'emploi d'outil dans un document de règles"}`);
      for (const b of d.malRanges ?? []) signaux.push(`🗂️  rangement à trancher · « ${b.section} » — ${b.pourquoi ?? "cite un autre Article que celui sous lequel il vit"} (aucun token en jeu, c'est la structure)`);
      for (const e of d.extractionsAExaminer ?? []) signaux.push(`❓ à trancher · ${e.question}`);
      if (!signaux.length) continue;
      console.log(`\n  ── ${d.chemin} · criticité du fichier : ${d.criticite?.niveau?.toUpperCase() ?? "inconnue"} — seules les actions à risque « ${d.criticite?.risqueMaxAutorise ?? "?"} » y sont applicables directement`);
      for (const s of signaux) console.log(`     ${s}`);
    }
    // La criticité seule mérite d'être dite même quand rien d'autre ne l'est : c'est elle qui
    // gouverne ce que l'agent a le droit d'appliquer sans repasser par l'utilisateur.
    if (!analyses.some((d) => (d.manuelsLoges?.length ?? 0) + (d.malRanges?.length ?? 0) + (d.extractionsAExaminer?.length ?? 0) > 0)) {
      for (const d of analyses.slice(0, 6)) console.log(`  ── ${d.chemin} · criticité du fichier : ${d.criticite?.niveau?.toUpperCase() ?? "inconnue"} · ${d.nbSections} section(s) · stratégies écartées : ${d.strategiesEcartees?.length ? d.strategiesEcartees.join(" ; ") : "aucune"}`);
    }
    console.log(`\n  Portées disponibles : ${SCOPE_LEVELS.join(" / ")} (vocabulaire partagé avec THE-FINAL-JUDGE et SMART-CONSO-TOKEN).`);
    return;
  }
  if (sub === "verifier") {
    const avantPath = process.argv[3], apresPath = process.argv[4] || "CLAUDE.md";
    if (!avantPath) { console.log("Usage : node scripts/ecotoken.mjs verifier <avant.md> [apres.md]\n  (compare une version d'avant allègement à la version actuelle)"); return; }
    if (!existsSync(avantPath)) { console.log(`Introuvable : ${avantPath}`); return; }
    const avant = readFileSync(avantPath, "utf8"), apres = readFileSync(apresPath, "utf8");
    const v = verifyProtectiveSubstance(avant, apres);
    console.log(`=== ecotoken · le fond qui protège le projet · ${apresPath} ===\n`);
    console.log(`${v.sur ? "✅" : "❌"} Articles : ${v.articles.avant} → ${v.articles.apres}${v.articles.perdus.length ? ` — PERDUS : ${v.articles.perdus.join(" / ")}` : " (tous intacts, intitulés identiques)"}`);
    console.log(`${v.soclesPerdus.length ? "❌" : "✅"} Phrases socles : ${v.soclesPerdus.length ? "PERDUES → " + v.soclesPerdus.join(" | ") : "toutes présentes"}`);
    console.log(`\nPhrases normatives : ${v.normatives.avant} → ${v.normatives.apres} (${v.normatives.disparues} disparues, dont ${v.normatives.rangement} de pure convention documentaire)`);
    if (v.normatives.aExaminer.length) {
      console.log(`\n--- ${v.normatives.aExaminer.length} PHRASE(S) À EXAMINER À LA MAIN (l'outil ne tranche jamais) ---`);
      v.normatives.aExaminer.forEach((p, i) => console.log(`\n[${i + 1}] ${p.slice(0, 260)}`));
    }
    console.log(`\n${v.limite}`);
    const pertes = findLostReferences(avant, apres, { attendues: [/^§ .+ — blueprint exportable/] });
    console.log(`\nRéférences perdues non déclarées : ${pertes.total} (dont ${pertes.graves.length} grave(s)).`);
    for (const g of pertes.graves) console.log(`   ⚠️  ${g}`);
    return;
  }
  if (sub === "verifier-maitre") {
    const r = verifyAgainstSnapshot();
    if (!r.possible) { console.log(`Contrôle impossible : ${r.raison}`); return; }
    if (r.inchange) { console.log(`✅ ${r.chemin} est inchangé depuis la dernière copie de référence.`); return; }
    console.log(`=== ${r.chemin} a changé depuis la dernière copie de référence ===\n`);
    console.log(`${r.sur ? "✅" : "❌"} Articles : ${r.articles.avant} → ${r.articles.apres}${r.articles.perdus.length ? ` — PERDUS : ${r.articles.perdus.join(" / ")}` : " (tous intacts)"}`);
    console.log(`${r.soclesPerdus.length ? "❌" : "✅"} Phrases socles : ${r.soclesPerdus.length ? "PERDUES → " + r.soclesPerdus.join(" | ") : "toutes présentes"}`);
    console.log(`Phrases normatives : ${r.normatives.avant} → ${r.normatives.apres} (${r.normatives.aExaminer.length} à examiner à la main)`);
    r.normatives.aExaminer.forEach((x, i) => console.log(`  [${i + 1}] ${x.slice(0, 200)}`));
    console.log(`\n${r.limite}`);
    return;
  }
  if (sub === "declencheurs") {
    const audit = auditTriggers();
    console.log("=== ecotoken · quand il DOIT se déclencher / quand il se déclenche VRAIMENT ===\n");
    for (const t of audit) {
      console.log(`  ${t.cable ? "✅" : "❌"} ${t.id} — ${t.quand}`);
      console.log(`       portée ${t.portee} · ${t.cout} · câblage attendu dans ${t.fichier}`);
      if (t.ecart) console.log(`       ⚠️  ${t.ecart}`);
    }
    const manquants = audit.filter((t) => !t.cable);
    console.log(`\n  ${audit.length - manquants.length}/${audit.length} déclencheur(s) réellement câblé(s) — vérifié en lisant les fichiers, jamais sur promesse.`);
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
  writeFileSync(assertSafeWriteTarget(file), report.text, "utf8");
  const snap = snapshotMasterFile();
  if (snap.ecrit) console.log(`Copie de référence du fichier maître déposée (${snap.chemin}) — le contrôle avant/après est désormais exécutable : node scripts/ecotoken.mjs verifier-maitre`);
  const top = report.plan.propositions[0];
  recordPass({ poids: report.poids.tokens, gainPropose: report.plan.gainTotal, decision: "à trancher", cible: top ? top.cible : "" });
  console.log(`\nRapport archivé : ${file}`);
  console.log(`Passage enregistré : ${INDEX_FILE} — la colonne « Décision » est à remplir à la main une fois tranché.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
