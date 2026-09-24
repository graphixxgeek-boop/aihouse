// ABRAHAM-LES-REFERENCES (2026-09-23, tâche #619) — l'analyseur de N'IMPORTE QUEL document de
// règles. Le père des références : il ne connaît aucun document en particulier, et c'est ce qui
// lui permet de les servir tous.
//
// POURQUOI IL EXISTE, ET C'EST UNE ERREUR DE DÉCOUPAGE RECONNUE. Le 2026-09-23, en construisant
// MOÏSE-TABLES-DE-LOI, j'ai absorbé le générique dans le spécifique : sept fonctions qui savaient
// analyser un document à règles numérotées ont fini enfermées dans l'agent d'UN document. Une
// heure plus tard, l'utilisateur a nommé l'erreur en une phrase : « selon le découpage demandé,
// c'est charter-spy qui aurait dû être étoffé, et moïse qui peut l'appeler et compléter avec ses
// propres fonctions utiles à claude.md spécifiquement ». Il avait raison, et la mesure le
// confirmait : 30 des 40 fonctions de Moïse ne dépendaient d'aucune particularité de la charte.
//
// CE QU'IL N'EST PAS, ET QUI EXISTAIT DÉJÀ : il ne refait pas le DÉCOUPAGE d'un texte en unités —
// `decouperEnUnites()` et `pairesParJaccard()` (lib-shell) le font depuis longtemps, et THE-KING
// comme Moïse les appellent déjà. Ce qui manquait n'était pas la primitive, c'était la COUCHE
// D'ANALYSE au-dessus : qui tient réellement cette règle, quelle nature a-t-elle donc, quel geste
// appelle-t-elle, mérite-t-elle une question, qu'a-t-on déjà tenté dessus. Aucun document autre que
// la charte ne disposait de ça.
//
// SES CLIENTS, ET IL EN A DÉJÀ DEUX RÉELS : MOÏSE-TABLES-DE-LOI (la charte) et, le jour où on l'y
// branchera, THE-KING (`docs/philosophie-et-politique.md`, dont le commentaire avoue depuis sa
// naissance « même principe que CLAUDE.MD.SPY::extractRuleUnits() mais jamais la même fonction »).
// Un troisième attend sans le savoir : `docs/regles-de-travail.md`, 2 870 lignes au-dessus de son
// budget, dont personne ne sait quelles règles ont un porteur ni ce qu'on a déjà tenté dessus.
//
// CE QU'IL NE FAIT JAMAIS : nommer un document, décider à la place d'un humain, conclure. Chacun
// de ses appelants lui passe SON motif de titre, SES exceptions et SES chemins ; lui ne sait rien
// d'eux. C'est la condition pour qu'il parte vers un autre projet (Article 27).

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { decouperEnUnites, pairesParJaccard, printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";
import { renderHtmlReport } from "./html-report.mjs";

// --- 1. LE BALAYAGE DU DÉPÔT ----------------------------------------------------------------
// Fait UNE fois et passé en paramètre : c'est la partie coûteuse de tout ce qui suit, et la
// refaire par unité est la différence entre une seconde et une minute (mesuré : 30 Articles ×
// 2 balayages, c'est ce que mes greps à la main coûtaient le 2026-09-23).

const EXT_CODE = new Set([".mjs", ".ts", ".tsx", ".js"]);
const IGNORE_DIR = new Set(["node_modules", ".git", ".next", "dist", "build", ".wrangler"]);

export function fichiersDuDepot({ racine = ".", exclure = new Set() } = {}) {
  const out = {};
  const walk = (dir) => {
    let entrees;
    try { entrees = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      if (IGNORE_DIR.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const rel = relative(racine, p);
      if (exclure.has(rel)) continue;
      if (!/\.(mjs|ts|tsx|js|md|txt)$/.test(e.name)) continue;
      try { if (statSync(p).size > 2_000_000) continue; out[rel] = readFileSync(p, "utf8"); } catch { /* illisible : ignoré */ }
    }
  };
  walk(racine);
  return out;
}

export const estDuCode = (chemin) => EXT_CODE.has(chemin.slice(chemin.lastIndexOf(".")));

// --- 2. LE PORTEUR, EN TROIS ÉTATS --------------------------------------------------------
// LA PREMIÈRE VERSION ÉTAIT FAUSSE ET FLATTEUSE, et la garder en mémoire vaut mieux que la
// refaire : compter « cette règle est-elle citée par du code ? » répondait OUI pour les trente
// Articles de la charte, parce que ce projet cite ses règles partout dans ses commentaires. Une
// MENTION n'est pas un MÉCANISME. La mesure honnête demande à la règle de NOMMER son porteur, puis
// vérifie qu'il existe. Trois états en sortent, et le troisième est celui pour qui tout ça existe.

const MOTIF_FONCTION_CITEE = /`([a-zA-Z][a-zA-Z0-9_]{3,})\(\)`/g;
const MOTIF_SCRIPT_CITE = /`(scripts\/[a-z0-9-]+\.mjs)`/g;

export function porteursDeclares(texteUnite = "", fichiers = {}) {
  const nommes = new Set();
  for (const m of String(texteUnite).matchAll(MOTIF_FONCTION_CITEE)) nommes.add({ type: "fonction", nom: m[1] });
  for (const m of String(texteUnite).matchAll(MOTIF_SCRIPT_CITE)) nommes.add({ type: "script", nom: m[1] });
  const trouves = []; const fantomes = [];
  for (const n of nommes) {
    const existe = n.type === "script"
      ? Object.prototype.hasOwnProperty.call(fichiers, n.nom)
      : Object.entries(fichiers).some(([chemin, contenu]) => estDuCode(chemin) && new RegExp(`function\\s+${n.nom}\\b|const\\s+${n.nom}\\s*=`).test(contenu));
    (existe ? trouves : fantomes).push(n.nom);
  }
  if (!nommes.size) return { etat: "sans porteur", trouves: [], fantomes: [], pourquoi: "ne nomme aucun mécanisme — sa prose est son seul mécanisme (Article 27)" };
  if (fantomes.length) return { etat: "fantôme", trouves, fantomes, pourquoi: `nomme ${fantomes.length} mécanisme(s) INTROUVABLE(S) : ${fantomes.join(", ")} — pire qu'une absence, puisque ça rassure à tort` };
  return { etat: "porté", trouves, fantomes: [], pourquoi: `nomme ${trouves.length} mécanisme(s) et tous existent : ${trouves.slice(0, 3).join(", ")}${trouves.length > 3 ? "…" : ""}` };
}

// ————————————————————————————————————————————————————————————————————————
// LA CLASSIFICATION DES RÈGLES (2026-09-24, chantier 1 du plan de nuit)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR, et elle commande tout le reste du plan : « je voudrais qu'on crée une
// classification des RÈGLES cette fois-ci, et du niveau de protection et de garantie de
// déclenchement qu'elle comporte. Une classification qu'on va appliquer à la charte mais aussi à
// d'autres docs comme règles de travail par ex. » Calibré la même nuit : DEUX AXES CROISÉS —
// force de garantie **et** gravité —, et l'outil est **Abraham étendu**, jamais un outil neuf.
//
// POURQUOI ICI ET PAS DANS UN OUTIL NEUF : mesuré avant d'écrire une ligne, comme l'utilisateur
// l'a lui-même demandé en citant l'expérience MOÏSE/THE-KING. Zéro fonction de même nom entre les
// trois outils, et zéro paire de corps de fonction dépassant 0,55 de similarité de structure — la
// redondance a déjà été purgée. Ce qui manquait n'était donc pas un découpeur de plus : c'est la
// couche qui CLASSE au-dessus de `porteursDeclares()`, lequel mesure déjà le porteur réel, qui EST
// la garantie de déclenchement.
//
// CE QUI REND CETTE ÉCHELLE DÉRIVABLE PLUTÔT QU'INVENTÉE, et c'est sa seule valeur : chacun de ses
// six niveaux correspond à un mécanisme qui EXISTE dans ce dépôt et qu'on peut constater. Une
// échelle inventée à la main se serait périmée au premier mécanisme nouveau (Article 24).

export const NIVEAUX_GARANTIE = [
  { niveau: 0, cle: "aucune", libelle: "AUCUNE",
    quoi: "rien ne la porte : ni test, ni garde-fou, ni rappel, ni même une impossibilité déclarée",
    cequecoute: "elle n'existera plus à la session suivante — c'est exactement ce que l'Article 27 interdit" },
  { niveau: 1, cle: "declarative", libelle: "DÉCLARATIVE",
    quoi: "écrite seulement, mais l'impossibilité d'un mécanisme est DÉCLARÉE avec sa raison",
    cequecoute: "repose sur la lecture, donc sur la mémoire d'un agent — mais le déclarer EST la protection (Article 27)" },
  { niveau: 2, cle: "rappelee", libelle: "RAPPELÉE",
    quoi: "un outil la fait remonter au bon moment (terrain d'une leçon, tool-brain, bannière post-commit)",
    cequecoute: "elle passe sous les yeux, rien ne vérifie qu'elle a été suivie" },
  { niveau: 3, cle: "demandee", libelle: "DEMANDÉE",
    quoi: "un contrôleur exige une DÉCLARATION et refuse d'être au vert sans elle (angel-of-ia-process)",
    cequecoute: "ne rend pas le mensonge impossible — il le rend EXPLICITE, ce qui est déjà beaucoup" },
  { niveau: 4, cle: "constatee", libelle: "CONSTATÉE",
    quoi: "un garde-fou lit une TRACE RÉELLE sur le disque et compare au dû",
    cequecoute: "ne voit que ce qui laisse une trace — une étape faite sans trace lui reste invisible" },
  { niveau: 5, cle: "bloquante", libelle: "BLOQUANTE",
    quoi: "un test ou un crochet git BLOQUE le commit quand elle est enfreinte",
    cequecoute: "rien, sinon son propre périmètre : elle ne protège que ce qu'elle sait regarder" },
];

// LA GRAVITÉ NE SE DÉRIVE PAS AUSSI PROPREMENT, et le dire est plus utile que de le masquer.
// Aucun programme ne sait ce que coûte vraiment une règle enfreinte. Ce qui est dérivable, ce sont
// des SIGNAUX que le document porte lui-même — et ils sont assez nets dans ce projet-ci pour
// classer sans inventer. Chaque niveau nomme donc son signal, jamais un jugement.
export const NIVEAUX_GRAVITE = [
  { niveau: 3, cle: "vitale", libelle: "VITALE",
    signal: "invoque l'Article 0, l'esprit des personnages, la loi suprême, ou une perte de données/d'idées",
    motif: /article 0|loi suprême|esprit des personnages|non négociable|jamais perdre|perte de valeur|ligne rouge/i },
  { niveau: 2, cle: "haute", libelle: "HAUTE",
    signal: "fausse une mesure, casse un renvoi, ou porte une interdiction absolue (« jamais », « interdit »)",
    motif: /\bjamais\b|\binterdit\b|fausse une mesure|obligatoire|renvoi cassé|dette/i },
  { niveau: 1, cle: "moyenne", libelle: "MOYENNE",
    signal: "prescrit sans interdire : une manière de faire, un confort de travail, une discipline",
    motif: /\bdoit\b|\bdoivent\b|il faut|toujours/i },
  { niveau: 0, cle: "basse", libelle: "BASSE",
    signal: "n'ordonne rien de vérifiable — du récit, un rappel historique, une précision de vocabulaire",
    motif: null },
];

// ÊTRE NOMMÉ N'EST PAS ÊTRE EXÉCUTÉ, et la première version de cette classification confondait
// exactement les deux — le défaut que toute cette soirée poursuivait, reproduit dans l'outil écrit
// pour le traquer. Elle accordait le niveau BLOQUANTE dès que le nom du mécanisme APPARAISSAIT
// quelque part dans `check-house.mjs`. Or ce fichier fait onze mille lignes et cite presque tous
// les scripts du dépôt : dans ses commentaires, dans les `console.log('Passed: …')` qui racontent
// ce qu'un test a prouvé, dans les fixtures d'autres outils. Résultat mesuré sur la vraie charte :
// treize Articles sur trente déclarés « bloquants », dont l'Article 0 — alors que `check-spirit.mjs`
// qui le protège N'EST JAMAIS LANCÉ par le filet de sécurité, la charte elle-même écrivant qu'il
// « coûte de vrais appels API, donc à lancer à la main, pas en continu ». Pire encore : une de ces
// mentions venait de la fixture de test que je venais d'écrire pour CETTE fonction. L'outil se
// décernait sa propre protection.
//
// La mesure honnête demande une POSITION D'APPEL, jamais une occurrence. Les chaînes de caractères
// et les commentaires sont retirés du fichier avant la recherche, parce que c'est précisément là
// que vivent les mentions qui ne font rien. Un script, lui, ne compte que si un crochet git le
// LANCE (`node scripts/x.mjs`) ou si le filet de sécurité l'IMPORTE — et l'import étant lui-même
// une chaîne, il se cherche séparément, sur le texte brut.
export function sansChainesNiCommentaires(code = "") {
  return String(code)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/`(?:\\[\s\S]|[^\\`])*`/g, '""')
    .replace(/'(?:\\.|[^\\'])*'/g, '""')
    .replace(/"(?:\\.|[^\\"])*"/g, '""');
}

export function mecanismeExerce(nom, code = "", { chemin = "" } = {}) {
  if (!nom) return false;
  const estScript = nom.startsWith("scripts/");
  if (estScript) {
    // Un crochet LANCE le script ; le filet de sécurité l'IMPORTE. Les deux se cherchent sur le
    // texte brut, l'un comme l'autre vivant dans une chaîne par nature.
    const base = nom.slice(nom.lastIndexOf("/") + 1);
    const echappe = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`node\\s+[^\\n]*${echappe}`).test(code)) return true;
    return new RegExp(`(?:import\\s*\\(|from)\\s*['"][^'"]*${echappe}['"]`).test(code);
  }
  // Une fonction : appelée, directement ou via un espace de noms (`mtl2.protegerLaCharte(…)`).
  const nu = sansChainesNiCommentaires(code);
  const echappe = nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-zA-Z0-9_$])${echappe}\\s*\\(`, "m").test(nu) && chemin !== null;
}

export function niveauGarantie(porteur = {}, texte = "", { lire = null } = {}) {
  const t = String(texte);
  // BLOQUANTE : le mécanisme nommé est-il réellement EXÉCUTÉ par la suite de tests ou par un
  // crochet git ? Vérifié en LISANT, jamais supposé d'après le nom (leçon L5 : ne pas confondre
  // « rien trouvé » et « pas pu regarder » — sans lecteur, on ne prétend pas au niveau 5).
  const nommes = porteur.trouves ?? [];
  if (nommes.length && typeof lire === "function") {
    const cibles = ["scripts/check-house.mjs", "scripts/hooks/pre-commit", "scripts/hooks/post-commit"];
    for (const c of cibles) {
      let contenu = null;
      try { contenu = lire(c); } catch { continue; }
      if (!contenu) continue;
      const exerce = nommes.find((n) => mecanismeExerce(n, contenu, { chemin: c }));
      if (exerce) return { ...NIVEAUX_GARANTIE[5], porteur: nommes, pourquoi: `« ${exerce} » est réellement exécuté par ${c}` };
    }
  }
  // Le niveau 4 est celui que la correction ci-dessus a rendu atteignable, et il porte désormais la
  // moitié de la charte : un mécanisme qui EXISTE mais que rien ne lance à chaque commit. C'est la
  // vérité la plus utile de toute cette classification, et c'était exactement celle que la version
  // mention-vaut-mécanisme effaçait.
  if (porteur.etat === "porté") return { ...NIVEAUX_GARANTIE[4], porteur: nommes, pourquoi: `nomme ${nommes.length} mécanisme(s) qui existe(nt) vraiment, mais qu'aucun test ni crochet n'exécute : ${nommes.slice(0, 2).join(", ")}` };
  if (porteur.etat === "fantôme") return { ...NIVEAUX_GARANTIE[0], porteur: [], pourquoi: `nomme un mécanisme INTROUVABLE (${(porteur.fantomes ?? []).join(", ")}) — pire qu'une absence, ça rassure à tort` };
  if (/\bDEMANDE\b|refuse d'être (au )?vert|angel-of-ia-process/i.test(t)) return { ...NIVEAUX_GARANTIE[3], porteur: [], pourquoi: "sa conformité est DEMANDÉE et le silence compte comme un manquement" };
  if (/terrain\s*:|remont(e|ée) au bon moment|tool-brain|post-commit/i.test(t)) return { ...NIVEAUX_GARANTIE[2], porteur: [], pourquoi: "un outil la fait remonter, sans vérifier qu'elle est suivie" };
  if (/aucun mécanisme|aucun programme ne peut|impossible.*mécaniquement|limite honnête/i.test(t)) return { ...NIVEAUX_GARANTIE[1], porteur: [], pourquoi: "l'impossibilité d'un mécanisme est déclarée avec sa raison (Article 27)" };
  return { ...NIVEAUX_GARANTIE[0], porteur: [], pourquoi: "ne nomme aucun mécanisme et ne déclare aucune impossibilité — sa prose est sa seule protection" };
}

export function niveauGravite(texte = "") {
  const t = String(texte);
  for (const n of NIVEAUX_GRAVITE) if (n.motif && n.motif.test(t)) return { ...n };
  return { ...NIVEAUX_GRAVITE[NIVEAUX_GRAVITE.length - 1] };
}

// LE CROISEMENT — c'est lui qui rend la classification actionnable, jamais les deux axes séparés.
// Une règle vitale mal protégée n'est pas « une règle de plus à améliorer » : c'est la seule case
// qui doit sauter aux yeux, et c'est pour ça que l'utilisateur a demandé une carte visuelle.
// UN PORTEUR PEUT VIVRE DANS UNE AUTRE RÈGLE, et l'ignorer produit un faux rouge (leçon L4 : un
// garde-fou qui accuse à tort cesse d'être lu). Trouvé au PREMIER passage réel sur la charte :
// l'Article 0 sortait « aucune protection » alors que `check-spirit.mjs` le protège — simplement,
// c'est l'Article 13 qui le nomme, en citant explicitement « vérifier l'Article 0 ». Un mécanisme
// qui déclare quelle règle il protège compte pour cette règle, où qu'il soit écrit.
export function porteurExterne(numero, prefixe, toutesLesUnites = [], fichiers = {}) {
  if (numero === undefined || numero === null) return null;
  const moi = String(numero);
  for (const u of toutesLesUnites) {
    if (String(u.numero) === moi) continue;
    const t = u.texte ?? "";
    // LA BONNE MAILLE EST LE PARAGRAPHE, ni la phrase ni l'unité entière — et les deux extrêmes
    // ont été essayés avant de trancher, sur le vrai document. À la PHRASE, l'Article 0 restait
    // faussement rouge : l'Article 13 écrit « c'est l'outil de référence pour vérifier l'Article 0 »
    // une phrase après avoir nommé `check-spirit.mjs`. À l'UNITÉ ENTIÈRE, n'importe quel Article
    // citant un autre lui prêterait tous ses mécanismes — un faux vert bien pire qu'un faux rouge.
    // Le paragraphe est la maille où un auteur parle d'une seule chose à la fois.
    const phrases = t.split(/\n\s*\n/);
    for (const ph of phrases) {
      if (!new RegExp(`${prefixe}\\s*${moi}\\b`, "i").test(ph)) continue;
      const p = porteursDeclares(ph, fichiers);
      if (p.etat === "porté") return { depuis: u.numero, mecanismes: p.trouves, phrase: ph.slice(0, 120) };
    }
  }
  return null;
}

// L'ÉCART SE MESURE CONTRE CE QUE LA GRAVITÉ EXIGE, jamais contre un maximum absolu — et la
// première version faisait l'inverse, ce qu'une assertion écrite pour couvrir la carte a révélé
// (BP2 : un test qui n'a jamais échoué ne prouve rien). Elle calculait `gravité × 2 − garantie`,
// donc 6 − 5 = 1 pour une règle VITALE protégée par le mécanisme le plus fort qui existe : le
// meilleur état atteignable sortait « un cran manque ». Les six Articles vitaux réellement
// bloquants de la charte étaient tous en orange clair, et aucune règle vitale ne pouvait JAMAIS
// atteindre le vert. Une échelle dont l'idéal est signalé comme un défaut signale tout le monde,
// donc plus personne (leçon L4).
//
// Ce que chaque gravité EXIGE : une règle vitale demande le niveau bloquant, une règle haute une
// trace constatée, une règle moyenne une déclaration demandée, une règle basse un simple rappel.
// L'écart devient alors lisible tel quel : 0 ou moins, la protection est à la hauteur ; 5, une
// règle vitale n'a rien du tout.
export const GARANTIE_REQUISE = [2, 3, 4, 5];   // indexé par niveau de gravité (basse → vitale)

export function ecartGaranti(graviteNiveau, garantieNiveau) {
  return (GARANTIE_REQUISE[graviteNiveau] ?? 2) - garantieNiveau;
}

export function verdictDepuisEcart(ecart) {
  if (ecart >= 5) return "🔴 CRITIQUE — vitale et sans protection";
  if (ecart >= 4) return "🟠 À NIVELER — la garantie est loin de l'enjeu";
  if (ecart >= 1) return "🟡 correcte — un cran manque";
  return "🟢 à niveau";
}

export function classerUnite(unite = {}, fichiers = {}, { lire = null, toutesLesUnites = [], prefixe = "Article" } = {}) {
  const texte = unite.texte ?? "";
  let porteur = porteursDeclares(texte, fichiers);
  let externe = null;
  if (porteur.etat === "sans porteur") {
    externe = porteurExterne(unite.numero, prefixe, toutesLesUnites, fichiers);
    if (externe) porteur = { etat: "porté", trouves: externe.mecanismes, fantomes: [], pourquoi: `porté depuis ${prefixe} ${externe.depuis}` };
  }
  const g = niveauGarantie(porteur, texte, { lire });
  const grav = niveauGravite(texte);
  const ecart = ecartGaranti(grav.niveau, g.niveau);
  return {
    numero: unite.numero, titre: (unite.titre ?? "").slice(0, 90),
    porteurExterne: externe ? `${prefixe} ${externe.depuis} (${externe.mecanismes.join(", ")})` : null,
    garantie: g.cle, garantieNiveau: g.niveau, garantiePourquoi: g.pourquoi,
    gravite: grav.cle, graviteNiveau: grav.niveau, graviteSignal: grav.signal,
    obligations: unite.obligations, porteurs: g.porteur,
    ecart,
    verdict: verdictDepuisEcart(ecart),
  };
}

export function classerDocument(unites = [], fichiers = {}, { lire = null, prefixe = "Article" } = {}) {
  const lignes = unites.map((u) => classerUnite(u, fichiers, { lire, toutesLesUnites: unites, prefixe }));
  const parVerdict = {};
  for (const l of lignes) parVerdict[l.verdict] = (parVerdict[l.verdict] ?? 0) + 1;
  // LA CARTE : gravité en lignes, garantie en colonnes. Le coin haut-gauche est le danger.
  // La carte porte les NUMÉROS et pas seulement leur compte : un « 2 » dans une case dit qu'il y a
  // un problème, il ne dit pas lequel aller lire — et c'est exactement le pas que personne ne fait
  // quand le rapport s'arrête au chiffre.
  const carte = NIVEAUX_GRAVITE.map((gr) => ({
    gravite: gr.libelle,
    graviteNiveau: gr.niveau,
    cases: NIVEAUX_GARANTIE.map((ga) => lignes.filter((l) => l.graviteNiveau === gr.niveau && l.garantieNiveau === ga.niveau).length),
    numeros: NIVEAUX_GARANTIE.map((ga) => lignes.filter((l) => l.graviteNiveau === gr.niveau && l.garantieNiveau === ga.niveau).map((l) => l.numero)),
  }));
  return { lignes, parVerdict, carte, total: lignes.length,
    horsPortee: "la GRAVITÉ est dérivée de signaux que le texte porte lui-même, jamais d'un jugement sur ce qu'une règle enfreinte coûterait vraiment — aucun programme ne sait ça. Elle se relit, elle ne se croit pas." };
}

// --- 3. LA MESURE D'UNE UNITÉ -------------------------------------------------------------
// `prefixe` est ce par quoi le document se cite lui-même ailleurs — « Article » pour une charte,
// autre chose ailleurs. Il est passé, jamais deviné.

export function citationsDeLUnite(numero, prefixe, fichiers = {}) {
  // L'ESPACE EST FACULTATIF, et le découvrir a évité un faux verdict massif : ce dépôt cite ses
  // sections « §7ter », sans espace, quand il cite ses Articles « Article 19 », avec. Un motif qui
  // exigeait l'espace rendait « jamais cité » pour les DIX-HUIT sections d'un document pourtant
  // cité partout — un garde-fou qui accuse tout le monde n'accuse plus personne (leçon L4).
  const motif = new RegExp(`${prefixe}\\s*${numero}\\b`, "g");
  let citations = 0; const fichiersCitants = []; const fichiersDeCode = [];
  for (const [chemin, contenu] of Object.entries(fichiers)) {
    const n = (contenu.match(motif) || []).length;
    if (!n) continue;
    citations += n; fichiersCitants.push(chemin);
    if (estDuCode(chemin)) fichiersDeCode.push(chemin);
  }
  return { citations, fichiersCitants: fichiersCitants.length, fichiersDeCode: fichiersDeCode.length };
}

export function mesurerUnites({ texte, motifUnite, motifBorneSuperieure, champs, prefixeCitation, fichiers = {}, estimerTokens = (t) => Math.round(t.length / 3.6) }) {
  const unites = decouperEnUnites(texte, motifUnite, { motifBorneSuperieure, champs });
  return unites.map((u) => {
    const cle = u.numero ?? u.article ?? u.n;
    const porteur = porteursDeclares(u.texte, fichiers);
    return {
      numero: cle,
      titre: u.titre ?? "",
      lignes: u.texte.split("\n").length,
      tokens: estimerTokens(u.texte),
      ...citationsDeLUnite(cle, prefixeCitation, fichiers),
      porteur: porteur.etat,
      porteurPourquoi: porteur.pourquoi,
      porteurFantomes: porteur.fantomes,
      porteurMecanique: porteur.etat === "porté",
      obligations: compterObligations(u.texte),
      texte: u.texte,
    };
  });
}

// --- 3bis. COMPTER LES OBLIGATIONS -----------------------------------------------------------
// LA BONNE UNITÉ DE MESURE, ET CE N'EST PAS LE TOKEN (2026-09-23, tâche #628).
//
// On a longtemps mesuré ces documents en tokens, parce que c'est ce qui coûte. Mais ce qui CASSE
// n'est pas le coût : c'est le nombre d'ordres. La recherche publique menée ce jour-là à la demande
// de l'utilisateur le dit en clair — un modèle de pointe ne suit de façon fiable que **150 à 200
// instructions**, dont une cinquantaine déjà consommées par le prompt système de l'outil ; au-delà,
// une règle ajoutée ne s'ajoute pas, elle DILUE les autres (le phénomène est nommé « context rot »).
// Le projet avait mesuré 191 obligations pour 125 suivables AVANT de connaître ce chiffre : deux
// méthodes indépendantes trouvent le même mur, ce qui est la meilleure raison de le croire.
//
// Conséquence pratique : un allègement se juge en OBLIGATIONS RETIRÉES, jamais en tokens gagnés.
// Couper 3 000 tokens de récit ne libère aucune attention ; retirer dix ordres redondants, si.
//
// Le motif est celui d'ecotoken, délibérément : deux compteurs d'obligations qui divergeraient
// rendraient deux verdicts sur le même document (Article 24). Il est passé en paramètre pour
// qu'un autre projet, dans une autre langue, fournisse le sien sans toucher à ce fichier.
export const MOTIF_OBLIGATION_FR = /\b(doit|doivent|jamais|toujours|obligatoire|interdit|il faut|exige|impose|ne peut)\b/i;

export function compterObligations(texte = "", motif = MOTIF_OBLIGATION_FR) {
  return String(texte)
    .split(/(?<=[.!?])\s+|\n\n/)
    .map((b) => b.trim())
    .filter((b) => b && motif.test(b)).length;
}

// --- 3ter. CE QU'UN ALLÈGEMENT NE DOIT JAMAIS FAIRE PERDRE ------------------------------------
// Écrit après trois scripts jetables (2026-09-23), sur cette remarque de l'utilisateur : « pense
// bien à injecter toute la donnée interessante dans tes analyses dans moise et abraham, pour que
// tes exploits soient rentabilisés encore une prochaine fois ». Il avait raison : ces vérifications
// avaient TROUVÉ des choses réelles — trois chemins sur le point de devenir inatteignables — et
// elles allaient disparaître avec la commande qui les portait.

// Tous les chemins de fichiers qu'un texte rend atteignables.
export function cheminsCites(texte = "") {
  return new Set(String(texte).match(/`(?:docs|scripts|lib|app|components)\/[^`\s]+`/g)?.map((c) => c.slice(1, -1)) ?? []);
}

// LA VÉRIFICATION À FAIRE AVANT DE VALIDER UNE COUPE, et elle a mordu dès son premier usage : en
// condensant la liste du référentiel, trois chemins ont quitté la charte. Deux états, jamais un
// seul verdict — « perdu » et « atteignable en un saut de plus » ne sont pas la même chose : le
// second EST le but recherché (le renvoi), le premier est une régression.
export function cheminsPerdus(avant = "", apres = "", { lire = null } = {}) {
  const dedans = cheminsCites(apres);
  const partis = [...cheminsCites(avant)].filter((c) => !dedans.has(c));
  return partis.map((chemin) => {
    // Atteignable en un saut : un document encore cité par le texte allégé le cite, lui.
    const relais = lire ? [...dedans].filter((d) => { try { return (lire(d) ?? "").includes(chemin); } catch { return false; } }) : [];
    return { chemin, etat: relais.length ? "atteignable en un saut" : "PERDU", relais };
  });
}

// L'INVERSE DE LA QUESTION PRÉCÉDENTE : quel document n'est atteignable de NULLE PART ?
// Un document orphelin ne se signale jamais tout seul — il continue d'exister, d'être à jour même,
// et personne ne le lit plus. Le parcours se fait en N sauts depuis un point d'entrée, parce qu'un
// renvoi légitime peut passer par un intermédiaire (c'est tout l'intérêt du renvoi).
//
// LIMITE HONNÊTE, ET ELLE A FAILLI ME FAIRE RENDRE UN FAUX VERDICT : si on ne lui donne à explorer
// qu'un seul dossier, il déclarera orphelins des documents cités depuis AILLEURS. Le premier
// passage a nommé trois orphelins qui n'en étaient pas — ils étaient cités depuis `docs/`, hors du
// périmètre exploré. Le paramètre `dossiersExplorés` existe pour ça, et un verdict rendu sur un
// périmètre trop étroit est un verdict faux, jamais un verdict prudent (leçon L5).
export function documentsOrphelins({ candidats = [], pointDentree = "", dossiersExplores = [], lire, sauts = 3 }) {
  if (!lire) return { mesurable: false, pourquoi: "aucun lecteur de fichier fourni — rien n'a été exploré, ce qui n'est jamais la même chose que rien trouvé" };
  const atteints = new Set();
  let frontiere = [pointDentree];
  for (let n = 0; n < sauts && frontiere.length; n++) {
    const suivante = [];
    for (const texte of frontiere) {
      for (const c of [...candidats, ...dossiersExplores]) {
        if (atteints.has(c) || !String(texte).includes(c)) continue;
        atteints.add(c);
        try { suivante.push(lire(c) ?? ""); } catch { /* illisible : atteint quand même, juste pas exploré */ }
      }
    }
    frontiere = suivante;
  }
  return { mesurable: true, sauts, atteints: [...atteints], orphelins: candidats.filter((c) => !atteints.has(c)) };
}

// LA QUESTION QU'ON DOIT POUVOIR PROUVER APRÈS CHAQUE DÉPLACEMENT (2026-09-23, tâche #634) :
// les obligations qui ont quitté un document sont-elles ARRIVÉES dans l'autre, ou ont-elles
// simplement disparu ? Les deux se ressemblent parfaitement dans le document source.
//
// POURQUOI C'EST ICI PLUTÔT QUE DANS MA TÊTE : je l'ai fait DEUX FOIS à la main pendant cette
// campagne, et les deux fois c'était la seule réponse acceptable à la question que le garde-fou de
// la charte venait de poser. « Elles ont migré » est une affirmation ; +12 arrivées pour 11 parties
// est une mesure. La différence entre les deux est exactement ce que ce projet passe son temps à
// corriger chez les autres — il n'y avait aucune raison de se l'épargner à soi-même.
//
// LE VERDICT EST À TROIS ÉTATS, jamais deux : « migré » (le compte arrive), « écart » (il en
// manque, à retrouver avant de valider), et « rien n'a bougé » — qui n'est ni bon ni mauvais, juste
// autre chose, et qu'un booléen aurait écrasé sur l'un des deux camps.
export function migrationVerifiee({ sourceAvant = "", sourceApres = "", destAvant = "", destApres = "" }) {
  const parti = compterObligations(sourceAvant) - compterObligations(sourceApres);
  const arrive = compterObligations(destApres) - compterObligations(destAvant);
  if (parti <= 0) return { mesurable: true, etat: "rien n'a quitté la source", parti, arrive };
  // La tolérance d'UNE unité est assumée : la phrase d'aiguillage qui remplace le bloc déplacé
  // porte elle-même une obligation, et la compter comme un écart ferait crier le contrôle à chaque
  // déplacement correct — un garde-fou qui accuse à tort cesse d'être lu (leçon L4).
  const manquantes = parti - arrive;
  return {
    mesurable: true, parti, arrive, manquantes,
    etat: manquantes <= 1 ? "migré" : "ÉCART",
    pourquoi: manquantes <= 1
      ? `${parti} obligation(s) parties, ${arrive} arrivées — elles ont migré, elles n'ont pas disparu`
      : `${parti} parties mais seulement ${arrive} arrivées : ${manquantes} obligation(s) ne sont nulle part, à retrouver AVANT de valider la coupe`,
  };
}

// --- 4. LES QUATRE NATURES ------------------------------------------------------------------
// Ce ne sont pas des catégories de rangement : chacune commande un GESTE différent, et c'est pour
// ça qu'elles existent.

export const NATURES = {
  LOI: { cle: "LOI", geste: "intouchable — doit rester sous les yeux en permanence" },
  OUTIL: { cle: "MODE D'EMPLOI D'OUTIL", geste: "réductible à un aiguillage : le déclencheur + un renvoi vérifié" },
  DISCIPLINE: { cle: "DISCIPLINE SANS PORTEUR", geste: "substance intouchable (la prose EST le mécanisme, Article 27) ; seule la genèse datée peut partir" },
  INVENTAIRE: { cle: "INVENTAIRE", geste: "remplaçable par une convention, à condition d'un garde-fou mécanique (Article 24)" },
};

const MOTIF_CITE_UN_OUTIL = /`scripts\/[a-z0-9-]+\.mjs`|docs\/referentiel\/[a-z0-9-]+\.md/i;
const MOTIF_INVENTAIRE = /^\s*\|.*\|.*\|/m;

export function natureProposee(mesure, { horsPerimetre = new Set() } = {}) {
  if (horsPerimetre.has(mesure.numero)) return { nature: NATURES.LOI.cle, pourquoi: "hors périmètre par décision explicite de l'utilisateur" };
  if (MOTIF_INVENTAIRE.test(mesure.texte) && mesure.texte.split("\n").filter((l) => l.trim().startsWith("|")).length > 4) {
    return { nature: NATURES.INVENTAIRE.cle, pourquoi: "contient un tableau de plus de quatre lignes — un inventaire, pas une règle" };
  }
  if (MOTIF_CITE_UN_OUTIL.test(mesure.texte) && mesure.porteurMecanique) {
    return { nature: NATURES.OUTIL.cle, pourquoi: `nomme un outil et ${mesure.porteurPourquoi} — la règle est déjà servie ailleurs` };
  }
  if (mesure.lignes <= 8 && mesure.citations >= 30) {
    return { nature: NATURES.LOI.cle, pourquoi: `court (${mesure.lignes} lignes) et très cité (${mesure.citations}) — le rendement d'une loi` };
  }
  if (!mesure.porteurMecanique) return { nature: NATURES.DISCIPLINE.cle, pourquoi: "aucun mécanisme nommé — sa prose est son seul mécanisme" };
  return { nature: NATURES.DISCIPLINE.cle, pourquoi: "aucun signal net — à trancher à la lecture, jamais par défaut" };
}

// --- 5. LA PERTINENCE ET LA LOGIQUE ---------------------------------------------------------
// (2026-09-23, question directe de l'utilisateur : « est-ce que l'outil Moïse est bien capable de
// détecter si un article n'a rien à faire ici ou s'il n'est pas utile ? [...] est-ce que Moïse
// analyse la pertinence ? la logique ? ».)
//
// LA RÉPONSE HONNÊTE ÉTAIT NON, et c'est ce qui a motivé cette partie. On mesurait un poids, des
// citations, un porteur, une nature. Aucune de ces quatre mesures ne dit si une règle MÉRITE
// d'être là, ni si deux règles se contredisent. Un outil qui dit tout du COMBIEN et rien du
// POURQUOI laisse la seule question qui compte à la mémoire de l'agent — donc perdue à la session
// suivante (Article 27).
//
// LA LIGNE ROUGE, POSÉE PAR L'UTILISATEUR : aucun signal ne conclut jamais. Il OUVRE une question.
// Le code lui-même refuse de produire un verdict — `etat` ne prend qu'une seule valeur. Ce n'est
// pas une précaution de style : un outil capable d'écrire « cette règle est inutile » finirait par
// voir ce jugement appliqué sans que personne ne l'ait porté.

export const SIGNAUX_DE_PERTINENCE = [
  { cle: "jamais-cite", question: "Est-ce que quelque chose, dans ce projet, s'appuie réellement sur cette règle ?", detecte: (m) => m.citations <= 3, dire: (m) => `cité ${m.citations} fois seulement dans tout le dépôt — le document est le seul endroit qui en parle` },
  { cle: "sans-porteur-et-long", question: "Une règle que rien ne fait respecter et que personne ne relit tient-elle encore debout ?", detecte: (m) => m.porteur === "sans porteur" && m.lignes >= 20, dire: (m) => `${m.lignes} lignes sans aucun mécanisme nommé — beaucoup de texte pour une règle qui ne repose que sur la mémoire de qui la lit` },
  { cle: "sans-obligation", question: "Est-ce une règle, ou une explication rangée au mauvais endroit ?", detecte: (m) => !/\b(doit|doivent|jamais|toujours|obligatoire|interdit|il faut|exige|impose|ne peut)\b/i.test(m.texte), dire: () => "ne contient aucune formulation d'obligation — c'est une explication, pas une prescription" },
  { cle: "porteur-fantome", question: "La règle annonce-t-elle une protection qui n'existe pas ?", detecte: (m) => m.porteur === "fantôme", dire: (m) => `nomme ${m.porteurFantomes.length} mécanisme(s) introuvable(s) : ${m.porteurFantomes.join(", ")}` },
  { cle: "poids-sans-retour", question: "Ce que cette règle coûte à chaque lecture est-il en rapport avec ce qu'elle rend ?", detecte: (m, { seuilRendement }) => m.lignes >= 20 && m.citations / m.lignes < seuilRendement, dire: (m) => `${m.lignes} lignes pour ${m.citations} citations, soit ${(m.citations / m.lignes).toFixed(1)} par ligne` },
];

// Le seuil se DÉRIVE du document lui-même (médiane des rendements ÷ 3), jamais écrit en dur : un
// seuil recopié cesserait d'être vrai au premier remaniement (Article 24).
export function seuilRendementFaible(mesures = []) {
  const rendements = mesures.map((m) => m.citations / Math.max(1, m.lignes)).sort((a, b) => a - b);
  if (!rendements.length) return 0;
  return rendements[Math.floor(rendements.length / 2)] / 3;
}

export function analyserPertinence(mesures = [], { horsPerimetre = new Set() } = {}) {
  const seuilRendement = seuilRendementFaible(mesures);
  const questions = [];
  for (const m of mesures) {
    if (horsPerimetre.has(m.numero)) continue;
    const touches = SIGNAUX_DE_PERTINENCE.filter((s) => s.detecte(m, { seuilRendement }));
    if (!touches.length) continue;
    questions.push({ numero: m.numero, titre: m.titre, etat: "à trancher", signaux: touches.map((s) => ({ cle: s.cle, question: s.question, constat: s.dire(m) })) });
  }
  return { mesurable: true, seuilRendement, questions: questions.sort((a, b) => b.signaux.length - a.signaux.length) };
}

const STOPWORDS_FR = new Set(["le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "à", "au", "aux", "pour", "sur", "dans", "en", "avec", "sans", "que", "qui", "ne", "pas", "est", "être", "ce", "cette", "son", "sa", "ses", "tout", "toute", "tous", "toutes", "plus", "déjà", "jamais", "cet", "article", "jusqu"]);

export function motsSignificatifs(texte) {
  return new Set(String(texte ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 4 && !STOPWORDS_FR.has(w)));
}

// Seuil STRICT par défaut (choix explicite de l'utilisateur : « remonter étroit ») — mieux vaut
// manquer une redondance subtile que noyer chaque passage sous des paires qui ne mènent à rien.
//
// IL EST EXPORTÉ, ET C'EST LE POINT (2026-09-23) : THE-KING employait la même valeur pour ses
// tensions, recopiée chez lui, avec un commentaire promettant qu'elle resterait alignée sur
// « findRedundantRulePairs() de CLAUDE.MD.SPY ». Deux choses avaient déjà cédé sans bruit : cette
// fonction avait changé deux fois de nom et de fichier (donc la promesse désignait une adresse
// morte), et rien n'aurait signalé que l'une des deux valeurs bouge. Un commentaire qui promet une
// synchronisation n'est jamais une protection, c'est une intention (Article 24) — la seule
// protection est que les deux lisent la MÊME constante.
export const SEUIL_JACCARD_STRICT = 0.22;

export function findPairesRedondantes(unites, { threshold = SEUIL_JACCARD_STRICT } = {}) {
  const ensembles = unites.map((u) => motsSignificatifs(u.texte));
  return pairesParJaccard(ensembles, { seuil: threshold })
    .map(({ i, j, jaccard, motsPartages }) => ({ a: unites[i].numero, b: unites[j].numero, jaccard, motsPartages }))
    .sort((x, y) => y.jaccard - x.jaccard);
}

// LA LOGIQUE : un recouvrement de vocabulaire seul est un signal FAIBLE — deux règles peuvent
// légitimement parler du même sujet, et un bon document en contient plusieurs paires qui DÉCLARENT
// leur frontière. Ce qui mérite une question, c'est un recouvrement fort ET aucune frontière
// écrite : là, deux règles gouvernent le même terrain sans que rien ne dise laquelle prime.
export function findRecouvrementsNonDeclares(mesures = [], { seuil = 0.18, prefixe = "Article" } = {}) {
  const parNumero = new Map(mesures.map((m) => [m.numero, m]));
  return findPairesRedondantes(mesures, { threshold: seuil })
    .map(({ a, b, jaccard, motsPartages }) => {
      const ta = parNumero.get(a)?.texte ?? "";
      const tb = parNumero.get(b)?.texte ?? "";
      const motif = (n) => new RegExp(`(?:frontière|distinct|jamais confondu|à ne pas confondre)[^.]{0,80}${prefixe}\\s+${n}\\b`, "i");
      return { a, b, jaccard, motsPartages, frontiereDeclaree: motif(b).test(ta) || motif(a).test(tb) };
    })
    .filter((p) => !p.frontiereDeclaree);
}

// --- 6. LE HORS-UNITÉS ------------------------------------------------------------------------
// Un document de règles contient des règles numérotées ET des sections qui n'en sont pas. Une
// analyse qui ne couvre que les règles peut passer à côté de la moitié du document en ayant l'air
// complète : la couverture se DÉCLARE en pourcentage, jamais ne se suppose.

export function mesurerSections(texte = "", { motifSection = /^## /, motifUnite = null, estimerTokens = (t) => Math.round(t.length / 3.6) } = {}) {
  const lignes = String(texte).split("\n");
  const bornes = [];
  lignes.forEach((l, i) => { if (motifSection.test(l)) bornes.push({ titre: l.replace(/^#+\s*/, "").trim(), debut: i }); });
  if (!bornes.length) return [];
  return bornes.map((b, k) => {
    const fin = k + 1 < bornes.length ? bornes[k + 1].debut : lignes.length;
    const bloc = lignes.slice(b.debut, fin).join("\n");
    const lignesTableau = bloc.split("\n").filter((l) => l.trim().startsWith("|")).length;
    const unites = motifUnite ? (bloc.match(new RegExp(motifUnite.source, "g")) || []).length : 0;
    return {
      titre: b.titre, lignes: fin - b.debut, tokens: estimerTokens(bloc), unites, lignesTableau,
      // Le critère est mécanique et se trompe vers la PRUDENCE : une section qui contient ne
      // serait-ce qu'une règle n'est jamais classée inventaire, parce qu'un inventaire ne porte
      // jamais de règle.
      nature: unites > 0 ? "contient des règles — voir le détail unité par unité"
        : (lignesTableau > 4 || (bloc.match(/`(docs|scripts|lib)\//g) || []).length > 8) ? NATURES.INVENTAIRE.cle : "prose de cadrage",
    };
  });
}

// --- 7. LE DOCUMENT D'ACCUEIL -----------------------------------------------------------------
// Un renvoi ne part JAMAIS vers un document qui n'existe pas, ni vers un document qui existe mais
// ne contient pas encore ce qu'on lui confie. Preuve de besoin, mesurée le 2026-09-23 : sur huit destinations
// d'un plan d'allègement réel, CINQ ne portaient pas le contenu, et rien ne le disait.

export function verifierDocumentDAccueil(chemin, sujets = [], { racine = ".", lire = (p) => readFileSync(p, "utf8") } = {}) {
  let texte = null;
  try { texte = lire(join(racine, chemin)); } catch { texte = null; }
  if (texte == null) return { peutPartir: false, existe: false, pourquoi: `${chemin} n'existe pas — le contenu partirait dans le vide` };
  const absents = sujets.filter((s) => !texte.toLowerCase().includes(String(s).toLowerCase()));
  if (absents.length) return { peutPartir: false, existe: true, absents, pourquoi: `${chemin} existe mais ne contient pas encore : ${absents.join(" · ")}` };
  return { peutPartir: true, existe: true, pourquoi: `${chemin} existe et porte déjà les ${sujets.length} sujet(s) vérifié(s)` };
}

// --- 8. LA MÉMOIRE DES OPÉRATIONS -------------------------------------------------------------
// Au grain de la RÈGLE TOUCHÉE, jamais de la passe d'ensemble. Une ligne par passe sait dire
// combien on a gagné ; seule une ligne par règle sait dire qu'un geste précis a déjà été tenté ICI
// et n'a pas tenu. C'est la seconde qui empêche de refaire l'erreur.

export const GESTES = ["allègement", "aiguillage", "déplacement", "ajout", "réorganisation", "annulation"];
export const RESULTATS = ["tenu", "annulé", "à revoir"];

export function enteteOperations(titre = "Mémoire des opérations") {
  return [`# ${titre}`, "", "*(Grain : la RÈGLE TOUCHÉE. Une ligne par passe d'ensemble saurait dire combien on a gagné ; seule une ligne par règle sait dire qu'un geste précis a déjà été tenté ici et n'a pas tenu.)*", "", "| Date | Règle | Geste | Avant | Après | Décidé par | Résultat | Pourquoi |", "|---|---|---|---|---|---|---|---|", ""].join("\n");
}

export function lireOperations(texte) {
  if (texte == null) return { mesurable: false, operations: [], pourquoi: "le registre n'existe pas encore" };
  const operations = [];
  for (const ligne of String(texte).split("\n")) {
    const cells = ligne.split("|").map((c) => c.trim());
    if (cells.length < 9 || !/^\d{4}-\d{2}-\d{2}/.test(cells[1] ?? "")) continue;
    operations.push({ date: cells[1], regle: cells[2], geste: cells[3], avant: cells[4], apres: cells[5], decidePar: cells[6], resultat: cells[7], pourquoi: cells[8] });
  }
  return { mesurable: true, operations };
}

export function ligneOperation(op) {
  const manquants = ["date", "regle", "geste", "decidePar", "resultat", "pourquoi"].filter((c) => !op?.[c]);
  if (manquants.length) throw new Error(`ligneOperation : champ(s) obligatoire(s) manquant(s) : ${manquants.join(", ")}`);
  if (!GESTES.includes(op.geste)) throw new Error(`ligneOperation : geste inconnu « ${op.geste} » (attendus : ${GESTES.join(", ")})`);
  if (!RESULTATS.includes(op.resultat)) throw new Error(`ligneOperation : résultat inconnu « ${op.resultat} » (attendus : ${RESULTATS.join(", ")})`);
  return `| ${op.date} | ${op.regle} | ${op.geste} | ${op.avant ?? "—"} | ${op.apres ?? "—"} | ${op.decidePar} | ${op.resultat} | ${op.pourquoi} |`;
}

// LA QUESTION QU'IL FAUT POUVOIR POSER : « comment on a fait la dernière fois ? ». Une mémoire qui
// ne sait pas y répondre est une mémoire pour le plaisir.
export function commentOnAFaitLaDerniereFois(regle, memoire) {
  if (!memoire?.mesurable) return { mesurable: false, pourquoi: memoire?.pourquoi ?? "aucune mémoire fournie" };
  const miennes = memoire.operations.filter((o) => String(o.regle) === String(regle));
  if (!miennes.length) return { mesurable: true, connu: false, resume: `Aucune opération enregistrée sur ${regle} — terrain neuf.` };
  const derniere = miennes[miennes.length - 1];
  const annulees = miennes.filter((o) => o.resultat === "annulé");
  return {
    mesurable: true, connu: true, operations: miennes, derniere, annulees,
    resume: [
      `${regle} : ${miennes.length} opération(s) enregistrée(s).`,
      `Dernière — ${derniere.date}, ${derniere.geste}, ${derniere.avant} → ${derniere.apres}, décidé par ${derniere.decidePar}, résultat « ${derniere.resultat} ».`,
      annulees.length ? `⚠️ ${annulees.length} opération(s) ANNULÉE(S) : ${annulees.map((o) => `${o.date} (${o.pourquoi})`).join(" · ")} — ne pas refaire le même geste sans savoir pourquoi il n'a pas tenu.` : "Aucune annulation : les gestes passés ont tenu.",
    ].join("\n"),
  };
}

// --- 9. LA DÉCISION HUMAINE QUI SURVIT À LA RÉGÉNÉRATION ---------------------------------------
// Un générateur qui écraserait un arbitrage à chaque passage serait pire qu'inutile : il ferait
// perdre le seul travail que la machine ne sait pas refaire.

export function naturesDejaDecidees(texteExistant = "", { colonnesAvantNature = 5 } = {}) {
  const decidees = new Map();
  const motif = new RegExp(`^\\|\\s*(\\d+)\\s*\\|${"[^|]*\\|".repeat(colonnesAvantNature)}\\s*([^|]+?)\\s*\\|\\s*décidé\\s*\\|`, "i");
  for (const ligne of String(texteExistant).split("\n")) {
    const m = ligne.match(motif);
    if (m) decidees.set(Number(m[1]), m[2].trim());
  }
  return decidees;
}

// --- 10. RECONNAÎTRE LA FORME D'UN DOCUMENT QU'ON NE CONNAÎT PAS -----------------------------
//
// LE PROBLÈME À RÉSOUDRE POUR ÊTRE VRAIMENT GÉNÉRIQUE : chaque document numérote ses règles à sa
// façon. La charte écrit « **Article 19 — Titre.** », la philosophie « ### 2.3 Titre **[tag]** »,
// les règles de travail « ## 7ter. Titre ». Un outil qui exigerait qu'on lui donne le motif ne
// servirait que ceux qui savent déjà le leur.
//
// CE QUE CE N'EST PAS : une liste de documents connus. Une liste se périmerait au premier document
// ajouté, et c'est exactement ce que l'Article 24 interdit. On DÉRIVE : on essaie les formes
// courantes, on garde celle qui découpe le mieux, et on DIT laquelle a été reconnue. Un document
// dont aucune forme ne ressort rend « pas mesurable » plutôt qu'un découpage inventé (leçon L12 :
// un analyseur qui devine saute en silence, il doit refuser à la place).
export const FORMES_CONNUES = [
  { nom: "Article N — Titre.", motif: /\*\*Article (\d+) — ([^*]+?)\.\*\*/g, prefixe: "Article", champs: (m) => ({ numero: Number(m[1]), titre: m[2].trim() }) },
  { nom: "### N.N Titre", motif: /^### (\d+)\.(\d+) (.+?)\s*$/gm, prefixe: "§", champs: (m) => ({ numero: `${m[1]}.${m[2]}`, titre: m[3].trim() }) },
  { nom: "## N. Titre", motif: /^## (\d+\w*)\. (.+?)\s*$/gm, prefixe: "§", champs: (m) => ({ numero: m[1], titre: m[2].trim() }) },
  { nom: "### N. Titre", motif: /^### (\d+\w*)\. (.+?)\s*$/gm, prefixe: "§", champs: (m) => ({ numero: m[1], titre: m[2].trim() }) },
];

export const UNITES_MINIMUM = 3;

export function detecterForme(texte = "", { formes = FORMES_CONNUES, minimum = UNITES_MINIMUM } = {}) {
  const essais = formes.map((f) => ({ forme: f, trouvees: (String(texte).match(new RegExp(f.motif.source, f.motif.flags.replace("g", "") + "g")) || []).length }));
  const meilleur = essais.sort((a, b) => b.trouvees - a.trouvees)[0];
  if (!meilleur || meilleur.trouvees < minimum) {
    return { mesurable: false, pourquoi: `aucune forme de numérotation reconnue (au mieux ${meilleur?.trouvees ?? 0} unité(s), minimum ${minimum}) — découper quand même reviendrait à inventer une structure`, essais: essais.map((e) => ({ nom: e.forme.nom, trouvees: e.trouvees })) };
  }
  return { mesurable: true, ...meilleur.forme, trouvees: meilleur.trouvees };
}

// L'ANALYSE COMPLÈTE D'UN DOCUMENT QUELCONQUE, en un appel. C'est ce que Moïse fait pour la charte
// avec ses spécificités en plus ; c'est ce que n'importe quel autre document peut désormais obtenir
// sans qu'on lui construise un agent dédié.
export function analyserDocument({ texte, fichiers = {}, horsPerimetre = new Set(), forme = null, estimerTokens = (t) => Math.round(t.length / 3.6) }) {
  const f = forme ?? detecterForme(texte);
  if (!f.mesurable) return { mesurable: false, pourquoi: f.pourquoi, essais: f.essais };
  const unites = mesurerUnites({ texte, motifUnite: f.motif, motifBorneSuperieure: /^## /gm, champs: f.champs, prefixeCitation: f.prefixe, fichiers, estimerTokens });
  const sections = mesurerSections(texte, { motifUnite: f.motif, estimerTokens });
  const tokensUnites = unites.reduce((n, u) => n + u.tokens, 0);
  const tokensDocument = estimerTokens(texte);
  return {
    mesurable: true,
    forme: f.nom,
    unites: unites.map((u) => ({ ...u, nature: natureProposee(u, { horsPerimetre }).nature, pourquoi: natureProposee(u, { horsPerimetre }).pourquoi })),
    sections,
    // La couverture se DÉCLARE : une analyse qui ne voit que les unités numérotées peut passer à
    // côté de la moitié du document en ayant l'air complète.
    couverture: { tokensUnites, tokensDocument, part: tokensDocument ? Math.round((tokensUnites / tokensDocument) * 100) : 0 },
    pertinence: analyserPertinence(unites, { horsPerimetre }),
    recouvrements: findRecouvrementsNonDeclares(unites, { prefixe: f.prefixe }),
    porteursFantomes: unites.filter((u) => u.porteur === "fantôme"),
  };
}

// --- 11. LA LIGNE DE COMMANDE : analyser N'IMPORTE QUEL document ------------------------------
// `node scripts/abraham-les-references.mjs <chemin>` — aucun document n'est pré-déclaré, la forme
// se DÉRIVE. C'est ce qui le rend utilisable le jour où un document nouveau arrive, sans qu'une
// ligne de code bouge (Article 24).

// --- LA PAGE HTML ET LA CARTE VISUELLE ------------------------------------------------------
// FORME CALIBRÉE EXPLICITEMENT PAR L'UTILISATEUR (2026-09-24, fenêtre dédiée, sur la question de
// savoir sous quelle forme livrer la classification) : « Une page HTML + une carte visuelle ».
// Les deux, et pas l'un à la place de l'autre — la page dit règle par règle ce qui manque, la
// carte dit d'un coup d'œil OÙ se trouve le danger. Un tableau de trente lignes ne le montre pas :
// il faut le lire en entier pour s'apercevoir que deux cases seulement comptent.
//
// La carte se lit en diagonale : le coin HAUT-GAUCHE (gravité maximale, garantie nulle) est le
// seul endroit où une case pleine est une urgence. Le coin BAS-DROITE (gravité faible, garantie
// bloquante) est l'autre excès — du contrôle dépensé là où il ne servait à rien.

export const REGISTRE_CLASSIFICATION = "docs/abraham-les-references";

export function tonDeLaCase(graviteNiveau, garantieNiveau) {
  // LA MÊME MESURE QUE LE VERDICT, jamais une seconde échelle écrite à côté : une carte qui colore
  // autrement que ce que le tableau conclut est pire qu'une carte absente, puisqu'on la croit.
  const ecart = ecartGaranti(graviteNiveau, garantieNiveau);
  if (ecart >= 5) return "critique";
  if (ecart >= 4) return "alerte";
  if (ecart >= 1) return "correct";
  return "bon";
}

export function renderClassificationHtml(classement, { document = "", couverture = null, prefixe = "Article" } = {}) {
  const colonnes = NIVEAUX_GARANTIE.map((n) => n.libelle);
  const rows = classement.carte.map((ligne, i) => ({
    label: ligne.gravite,
    cells: ligne.numeros.map((nums, j) => ({
      items: nums.map((n) => `${prefixe.slice(0, 3)}.${n}`),
      tone: nums.length ? tonDeLaCase(classement.carte[i].graviteNiveau, NIVEAUX_GARANTIE[j].niveau) : "neutre",
    })),
  }));

  const critiques = classement.lignes.filter((l) => l.verdict.startsWith("🔴"));
  const aNiveler = classement.lignes.filter((l) => l.verdict.startsWith("🟠"));

  const blocks = [
    { type: "heading", text: "La carte — gravité en lignes, force de garantie en colonnes" },
    { type: "matrix", corner: "gravité ↓ / garantie →", columns: colonnes, rows,
      legend: "La couleur porte l'ÉCART entre l'enjeu et la protection, jamais la gravité seule : une règle vitale correctement portée n'est pas un problème, et une règle mineure sans porteur non plus. Le coin haut-gauche est le seul où une case pleine est une urgence ; le coin bas-droite est l'autre excès, du contrôle dépensé là où il ne servait à rien." },
    { type: "heading", text: "Ce que la carte montre en premier" },
  ];

  if (critiques.length) {
    blocks.push({ type: "highlight", heading: `${critiques.length} règle(s) CRITIQUES — vitales et sans protection`,
      paragraphs: critiques.map((l) => `${prefixe} ${l.numero} — ${l.titre} · ${l.garantiePourquoi}`) });
  } else {
    blocks.push({ type: "paragraph", text: "Aucune règle critique : aucune règle vitale n'est laissée sans le moindre porteur. C'est un constat, pas un blanc." });
  }

  blocks.push({ type: "heading", text: "Le détail, règle par règle" });
  blocks.push({ type: "table",
    headers: [prefixe, "Titre", "Gravité", "Garantie", "Ce qui la porte", "Verdict"],
    rows: classement.lignes.map((l) => [
      String(l.numero), l.titre, l.gravite, l.garantie,
      l.porteurExterne ? `emprunté à ${l.porteurExterne}` : (l.porteurs?.length ? l.porteurs.join(", ") : "—"),
      l.verdict,
    ]) });

  blocks.push({ type: "heading", text: "Les six niveaux de garantie, et ce que chacun ne couvre toujours pas" });
  blocks.push({ type: "table", headers: ["Niveau", "Ce qu'il garantit", "Ce qu'il coûte encore"],
    rows: NIVEAUX_GARANTIE.map((n) => [`${n.niveau} — ${n.libelle}`, n.quoi, n.cequecoute]) });

  blocks.push({ type: "note", text: classement.horsPortee });
  if (couverture) blocks.push({ type: "note", text: `Couverture déclarée : ${couverture} % du document est réellement découpé en règles numérotées — le reste est de la prose d'encadrement, que cette classification ne juge pas.` });
  if (aNiveler.length) blocks.push({ type: "note", text: `${aNiveler.length} règle(s) « à niveler » : la garantie existe mais reste loin de l'enjeu. C'est la matière du nivellement, pas une urgence.` });

  return renderHtmlReport({
    tool: "abraham-les-references",
    title: `Classification des règles — ${document}`,
    subtitle: "Deux axes croisés : la GRAVITÉ que le texte porte lui-même, et la FORCE DE GARANTIE que le dépôt lui donne réellement. Ni l'une ni l'autre n'est une opinion de l'outil.",
    dateLabel: new Date().toISOString(),
    blocks,
    footer: "ABRAHAM-LES-REFERENCES — il classe, il ne tranche jamais : ce qu'une règle enfreinte coûterait vraiment ne se lit dans aucun fichier.",
  });
}

export function classerEtEcrire(chemin, { prefixe = "Article", sortie = null, ecrire = writeFileSync } = {}) {
  let texte;
  try { texte = readFileSync(chemin, "utf8"); } catch { return { mesurable: false, pourquoi: `${chemin} est illisible ou n'existe pas` }; }
  const fichiers = fichiersDuDepot({ racine: ".", exclure: new Set([chemin]) });
  const r = analyserDocument({ texte, fichiers });
  if (!r.mesurable) return { mesurable: false, pourquoi: r.pourquoi, essais: r.essais };
  const classement = classerDocument(r.unites, fichiers, { lire: (f) => readFileSync(f, "utf8"), prefixe });
  const nom = chemin.replace(/[/\\]/g, "-").replace(/\.md$/, "");
  const cible = sortie ?? `${REGISTRE_CLASSIFICATION}/classification-${nom}.html`;
  try { mkdirSync(REGISTRE_CLASSIFICATION, { recursive: true }); } catch { /* déjà là */ }
  ecrire(cible, renderClassificationHtml(classement, { document: chemin, couverture: r.couverture?.part, prefixe }), "utf8");
  return { mesurable: true, classement, cible, forme: r.forme, couverture: r.couverture?.part };
}

function main() {
  const [, , arg1, arg2] = process.argv;
  // « classer » est une COMMANDE séparée et non un ajout au rapport par défaut : elle ÉCRIT un
  // fichier, et un outil de lecture qui se met soudain à écrire est exactement le genre d'effet de
  // bord qu'on ne remarque qu'une fois le dépôt sali.
  if (arg1 === "classer") {
    printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM-LES-REFERENCES — classification des règles (gravité × garantie)", scriptPath: "scripts/abraham-les-references.mjs" });
    printReliabilityNotice("abraham-les-references");
    recordCliUsage("abraham-les-references");
    if (!arg2) { console.log("\nUsage : node scripts/abraham-les-references.mjs classer <chemin-du-document>"); return; }
    const res = classerEtEcrire(arg2, { prefixe: arg2.endsWith("regles-de-travail.md") ? "§" : "Article" });
    if (!res.mesurable) { console.log(`\nPAS MESURÉ — ${res.pourquoi}`); return; }
    const c = res.classement;
    console.log(`\n=== ${arg2} · forme « ${res.forme} » · ${c.total} règles · couverture ${res.couverture} % ===\n`);
    for (const [verdict, n] of Object.entries(c.parVerdict).sort()) console.log(`  ${verdict} : ${n}`);
    console.log("\n--- LA CARTE (gravité ↓ × garantie →) ---");
    console.log(`${"".padEnd(12)}${NIVEAUX_GARANTIE.map((g) => g.libelle.slice(0, 7).padStart(9)).join("")}`);
    for (const ligne of c.carte) console.log(`${ligne.gravite.slice(0, 11).padEnd(12)}${ligne.cases.map((n) => String(n || "·").padStart(9)).join("")}`);
    const critiques = c.lignes.filter((l) => l.verdict.startsWith("🔴"));
    if (critiques.length) {
      console.log(`\n--- 🔴 ${critiques.length} CRITIQUE(S) : vitale(s) et sans protection ---`);
      for (const l of critiques) console.log(`· ${l.numero} — ${l.titre}`);
    }
    console.log(`\nPage HTML + carte visuelle : ${res.cible}`);
    console.log(`\nHORS PORTÉE : ${c.horsPortee}`);
    return;
  }
  const chemin = arg1;
  printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM-LES-REFERENCES — analyser un document de règles, quel qu'il soit", scriptPath: "scripts/abraham-les-references.mjs" });
  printReliabilityNotice("abraham-les-references");
  recordCliUsage("abraham-les-references");

  if (!chemin) {
    console.log("\nUsage : node scripts/abraham-les-references.mjs <chemin-du-document>");
    console.log("Formes de numérotation reconnues sans configuration :");
    for (const f of FORMES_CONNUES) console.log(`  · ${f.nom}`);
    console.log("\nUn document dont aucune forme ne ressort rend « pas mesurable » plutôt qu'un découpage inventé.");
    return;
  }

  let texte;
  try { texte = readFileSync(chemin, "utf8"); } catch { console.log(`\nPAS MESURÉ — ${chemin} est illisible ou n'existe pas.`); return; }
  const fichiers = fichiersDuDepot({ racine: ".", exclure: new Set([chemin]) });
  const r = analyserDocument({ texte, fichiers });
  if (!r.mesurable) {
    console.log(`\nPAS MESURÉ — ${r.pourquoi}`);
    for (const e of r.essais ?? []) console.log(`   · ${e.nom} : ${e.trouvees} unité(s)`);
    return;
  }

  console.log(`\n=== ${chemin} ===\n`);
  console.log(`Forme reconnue : « ${r.forme} » · ${r.unites.length} unités · couverture déclarée ${r.couverture.part} % du document`);
  console.log(`Porteurs : ${r.unites.filter((u) => u.porteur === "porté").length} porté(s), ${r.unites.filter((u) => u.porteur === "sans porteur").length} sans porteur, ${r.porteursFantomes.length} fantôme(s)`);
  console.log("");
  const parNature = {};
  for (const u of r.unites) (parNature[u.nature] ??= []).push(u.numero);
  for (const n of Object.values(NATURES)) {
    if (!parNature[n.cle]) continue;
    console.log(`· ${n.cle} — ${parNature[n.cle].length} unité(s) : ${parNature[n.cle].join(", ")}`);
    console.log(`    ${n.geste}`);
  }
  console.log(`\n--- PERTINENCE : ${r.pertinence.questions.length} unité(s) ouvrent une QUESTION (jamais un verdict) ---`);
  for (const q of r.pertinence.questions.slice(0, 12)) console.log(`· ${q.numero} — ${String(q.titre).slice(0, 50)} [${q.etat}] : ${q.signaux.map((sg) => sg.cle).join(", ")}`);
  console.log(`\n--- LOGIQUE : ${r.recouvrements.length} recouvrement(s) sans frontière déclarée ---`);
  for (const x of r.recouvrements) console.log(`· ${x.a} ↔ ${x.b} — ${(x.jaccard * 100).toFixed(0)}% de vocabulaire commun`);

  const ecarts = [];
  if (r.porteursFantomes.length) ecarts.push({ pourquoi: `${r.porteursFantomes.length} règle(s) nomment un mécanisme introuvable` });
  if (r.recouvrements.length) ecarts.push({ pourquoi: `${r.recouvrements.length} paire(s) de règles se recouvrent sans que rien ne dise laquelle prime` });
  const plan = planDactionDepuisEcarts(ecarts, { toolSlug: "abraham-les-references", tache: "porter la question à l'utilisateur — Abraham ne tranche jamais la pertinence d'une règle" });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
