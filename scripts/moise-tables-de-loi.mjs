// MOÏSE-TABLES-DE-LOI (2026-09-23, tâche #613) — l'agent dédié au SEUL périmètre de la charte.
//
// SA VOCATION, dans les mots de l'utilisateur : « je veux que tu crées un outil dédié à Claude :
// "moise-tables-de-loi". Cet agent outil appelle les autres outils dont il a besoin pour fonctionner.
// Il centralise pour les opérations propres à claude.md. Il est dédié à ce qui est UNIQUEMENT
// DÉDIÉ à Claude.md : pas de chevauchement. Ce qui peut être utile de manière générale est destiné
// à d'autres agents existants. » Et, dans le même échange : « cet agent est aussi le responsable de
// la maintenance de claude.md et de garder la mémoire des opérations réalisées sur claude.md ».
//
// LA FRONTIÈRE, ET ELLE EST LA RAISON D'ÊTRE DE CE FICHIER. Trois outils touchaient déjà CLAUDE.md,
// chacun par un bout, aucun n'en étant responsable :
//   · ecotoken pèse les documents rechargés à chaque message — question GÉNÉRIQUE, vraie pour
//     n'importe quel document toujours chargé. Reste chez lui.
//   · SMART-CONSO-TOKEN régule ma consommation avant une action coûteuse — générique. Reste chez lui.
//   · CHARTER-SPY, logé DANS smart-conso-token.mjs, découpait les Articles et classait les règles —
//     100 % spécifique à CLAUDE.md. Ses sept fonctions ont MIGRÉ ici le 2026-09-23 (décision
//     explicite de l'utilisateur en fenêtre de calibrage : « migrer ces sept fonctions dans
//     Moïse »), sans être réécrites : un déplacement, jamais une reconstruction, pour que la
//     migration ne puisse rien casser au passage. Un renvoi reste à l'ancienne adresse.
//
// CE QU'IL AJOUTE, ET POURQUOI CES QUATRE-LÀ ET PAS D'AUTRES. Ils ne sortent pas d'une liste de
// bonnes idées : ce sont EXACTEMENT les quatre gestes que j'ai dû faire à la main, en scripts
// jetables, pour produire le plan d'attaque du 2026-09-23. Chacun a une preuve de besoin :
//   1. `mesurerArticles()` — poids, citations, et surtout FICHIERS DE CODE qui citent l'Article.
//      Cette dernière colonne est celle qui dit si une règle a un porteur mécanique ou si sa prose
//      EST le mécanisme (Article 27) ; personne ne la calculait. Je l'ai obtenue par soixante greps.
//   2. `natureProposee()` — LOI / MODE D'EMPLOI D'OUTIL / DISCIPLINE SANS PORTEUR / INVENTAIRE.
//      C'est la classification qui décide ce qui peut partir ; elle était dans ma tête, donc perdue
//      à la fin de la session (Article 27, la dette de reprise).
//   3. `verifierDocumentDAccueil()` — un renvoi ne part que vers un document qui existe ET qui
//      contient déjà le contenu. Preuve de besoin immédiate : la plus grosse proposition
//      d'allègement encore au catalogue d'ecotoken (2 914 tokens) renvoie vers un document
//      INEXISTANT, et rien ne le disait avant que je le vérifie à la main.
//   4. `findArticlesAbsentsDeLaTable()` — l'instrument de décision lui-même se périme. Constaté le
//      jour même : `docs/referentiel/claude-md-regles.md`, la table qui sert à décider quoi alléger,
//      datait du 2026-09-20 et s'arrêtait à l'Article 23 — six Articles, dont trois des dix plus
//      lourds, invisibles à la mesure. Décider avec cette table, c'était décider sur un fichier qui
//      n'existait plus.
//
// LA MÉMOIRE, ET CE QUI LA REND EXPLOITABLE PLUTÔT QUE DÉCORATIVE. Calibrage explicite de
// l'utilisateur : « une mémoire (pour l'exploiter : ex : comment nous avons fait la dernière fois ?)
// utile et exploitée (pas une mémoire pour le plaisir) », au grain de l'ARTICLE TOUCHÉ. Le grain
// décide tout : une ligne par passe d'allègement sait dire « on a gagné 1 200 tokens le 20 » et ne
// sait pas dire « l'Article 18 a déjà été allégé deux fois, la seconde a été annulée parce que le
// renvoi pointait dans le vide ». Seul le second énoncé m'empêche de refaire l'erreur.
//
// CE QU'IL NE FAIT JAMAIS. Il ne modifie pas CLAUDE.md. Le fichier est classé MAITRE par tool-brain
// (score 12, cité par 169 fichiers) : au-delà du risque faible, ça se propose, jamais ça ne
// s'applique. Moïse mesure, se souvient, alerte et met en forme ; l'analyse et le plan d'action
// restent produits par l'agent, et la décision reste à l'utilisateur.

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { printReliabilityNotice, decouperEnUnites, pairesParJaccard } from "./lib-shell.mjs";
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE } from "./report-template.mjs";
import { estimateTokens } from "./smart-conso-token.mjs";
// PAS d'import statique d'ecotoken, et c'est délibéré. ecotoken a besoin de `buildClaudeMdRuleTable`
// (ci-dessous, propre à CLAUDE.md) pendant que Moïse a besoin de son compteur d'obligations
// (générique, donc à sa place là-bas) : un import statique dans les deux sens créerait un cycle.
// Node le tolère tant que l'usage est dans une fonction, mais un cycle toléré est une dette qui
// explose au premier déplacement de ligne. Le compteur est donc INJECTÉ par l'appelant
// (`mesurerObligations`), ce qui rend en prime `buildCartographie()` testable sans toucher au
// disque ni à un autre outil.

const ROOT = new URL("..", import.meta.url).pathname;

export const CHARTE = "CLAUDE.md";
// NOMS DE DOCUMENTS VOLONTAIREMENT GÉNÉRIQUES (« charte- », jamais « claude-md- »). La première
// version de cet outil s'appelait d'après un modèle d'IA précis ; l'utilisateur l'a refusée en deux
// mots — « pas exportable ». Il avait raison et la remarque vaut au-delà du nom de l'outil : un
// outil qui ne peut servir que sur ce dépôt-ci a raté la moitié de sa mission (SAFE-EXPORT,
// Article 27). Seul `TABLE_REGLES_PATH` garde son nom historique, parce qu'il existait avant et que
// le renommer casserait des renvois pour un gain nul.
export const CARTOGRAPHIE_PATH = "docs/referentiel/charte-cartographie.md";
export const OPERATIONS_PATH = "docs/referentiel/charte-operations.md";
export const TABLE_REGLES_PATH = "docs/referentiel/claude-md-regles.md";

const lire = (chemin, root = ROOT) => {
  try { return readFileSync(join(root, chemin), "utf8"); } catch { return null; }
};

// ---------------------------------------------------------------------------------------------
// PARTIE 1 — le découpage et la classification, MIGRÉS de CHARTER-SPY (smart-conso-token.mjs) le
// 2026-09-23. Code déplacé tel quel : les commentaires d'origine sont conservés parce qu'ils
// portent des calibrages réels qu'aucun diff ne redonnerait (Article 19).
// ---------------------------------------------------------------------------------------------

// LA GENÈSE DE CES SEPT FONCTIONS, restaurée le 2026-09-23 — et c'est le détecteur de raisons
// perdues qui l'a réclamée, une heure après que je l'aie moi-même effacée en les déplaçant ici.
// L'ironie vaut d'être gardée : en migrant CHARTER-SPY j'ai remplacé son en-tête par une note de
// déménagement, et la demande d'origine de l'utilisateur — le POURQUOI de leur existence — n'a
// voyagé nulle part. Exactement ce que l'Article 19 redoute, commis en construisant l'outil qui
// l'empêche. Texte d'origine, mot pour mot :
//
// « CLAUDE.MD.SPY (2026-09-20, demande explicite de l'utilisateur : "une extension de suivi-conso-
//   token... évalue chaque règle de CLAUDE.md, lui donne un indice de sensibilité, mesure son
//   importance... classifie les règles... détecte les doublons/redondances"). PAS un membre de
//   l'équipe (choix explicite de l'utilisateur, confirmé) : une capacité de plus de
//   SMART-CONSO-TOKEN [...] — consulté avec LE-COORDINATEUR avant construction
//   (suggestPrestationsForTask() : liste vide, aucune prestation existante ne couvrait ce besoin).
//   S'intègre à l'étape 2 ("Identifier les candidats") de la procédure formalisée d'allègement
//   comme une TROISIÈME famille de candidats, aux côtés des gros blocs narratifs (lecture humaine)
//   et des asides datées (listDatedNarrativeMarkers). »
//
// CE QUI A CHANGÉ DEPUIS, et il faut le lire avec : le statut « PAS un membre de l'équipe » était
// vrai tant que ces fonctions vivaient DANS smart-conso-token. Elles appartiennent désormais à un
// Membre certifié à part entière, sur décision explicite de l'utilisateur du 2026-09-23. La
// citation reste telle quelle parce qu'elle explique pourquoi elles ont été écrites ; cette note
// dit ce qui a bougé depuis, sans réécrire ce qu'il a demandé.

// Granularité choisie : l'ARTICLE entier (« Article N — Titre. » et tout son corps jusqu'à
// l'article suivant), jamais chaque puce individuellement — plus robuste à ancrer, et une
// comparaison de redondance a plus de sens entre deux blocs de taille comparable qu'entre deux
// fragments courts qui partageraient trivialement des mots comme « jamais »/« toujours ». Limite
// honnête assumée : le contenu intercalé entre deux Articles est rattaché à l'article PRÉCÉDENT
// dans cette découpe — un signal approximatif, jamais une vérité absolue.
const ARTICLE_HEADING_PATTERN = /\*\*Article (\d+) — ([^*]+?)\.\*\*/g;
// Un article se termine aussi au prochain titre de niveau 1 ("## ...") — trouvaille réelle en
// calibrant sur le vrai CLAUDE.md : sans cette borne, le DERNIER article avalait tout le reste du
// fichier, 510 lignes hors-sujet qui faussaient totalement son signal. Le bug s'est REPRODUIT le
// 2026-09-23 dans un script jetable écrit à la main pour le plan d'attaque, faute d'avoir su que
// cette fonction existait : la preuve que le geste devait avoir un domicile nommé.
const TOP_HEADING_PATTERN = /^## /gm;

export function extractRuleUnits(text) {
  return decouperEnUnites(text, ARTICLE_HEADING_PATTERN, {
    motifBorneSuperieure: TOP_HEADING_PATTERN,
    champs: (m) => ({ article: Number(m[1]), titre: m[2].trim() }),
  });
}

// Compte les citations de "Article N" AILLEURS dans le dépôt (jamais dans CLAUDE.md lui-même, dont
// le texte cite trivialement son propre numéro) — un proxy honnête de combien le reste du projet
// dépend réellement de cette règle précise, jamais une lecture de son contenu.
export function countArticleCrossReferences(articleNumber, otherFilesText = {}) {
  const pattern = new RegExp(`Article\\s+${articleNumber}\\b`, "g");
  let count = 0;
  for (const content of Object.values(otherFilesText)) count += (content.match(pattern) || []).length;
  return count;
}

const SELF_FLAGGED_SENSITIVE_PATTERN = /non[- ]négociable|garde-fou non négociable|\binterdit\b/i;

// Sensibilité : un SIGNAL, jamais une certitude — sauf l'Article 0, qui reçoit une étiquette FIXE
// et automatique (choix explicite de l'utilisateur), jamais soumis au même calcul que les autres
// règles, qui pourrait à tort le sous-évaluer.
export function classifyRuleSensitivity(rule) {
  if (rule.article === 0) return "très sensible (Article 0, fixe — jamais recalculée)";
  if (SELF_FLAGGED_SENSITIVE_PATTERN.test(rule.texte)) return "sensible (se déclare non négociable)";
  return "normale";
}

// Seuils calibrés empiriquement (2026-09-20) contre le vrai CLAUDE.md de ce projet, pas des chiffres
// ronds arbitraires. À recalibrer si la distribution réelle change significativement (Article 19).
export function classifyRuleImportance(crossRefCount) {
  if (crossRefCount > 36) return "élevée";
  if (crossRefCount >= 15) return "moyenne";
  return "faible";
}

const RULE_STOPWORDS_FR = new Set([
  "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou", "à", "au", "aux", "pour", "sur",
  "dans", "en", "avec", "sans", "que", "qui", "ne", "pas", "est", "être", "ce", "cette", "son", "sa",
  "ses", "tout", "toute", "tous", "toutes", "plus", "déjà", "jamais", "cet", "article", "jusqu",
]);

function ruleSignificantWords(texte) {
  return new Set(
    String(texte ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 4 && !RULE_STOPWORDS_FR.has(w)),
  );
}

// Redondance entre deux règles : similarité de Jaccard sur les mots significatifs. Seuil STRICT par
// défaut (choix explicite de l'utilisateur : « remonter étroit ») — mieux vaut manquer une
// redondance subtile que noyer chaque passage sous des paires qui ne mènent à rien.
export function findRedundantRulePairs(rules, { threshold = 0.22 } = {}) {
  const wordSets = rules.map((r) => ruleSignificantWords(r.texte));
  return pairesParJaccard(wordSets, { seuil: threshold })
    .map(({ i, j, jaccard, motsPartages }) => ({ a: rules[i].article, b: rules[j].article, jaccard, motsPartages }))
    .sort((x, y) => y.jaccard - x.jaccard);
}

export function buildClaudeMdRuleTable(claudeMdText, otherFilesText = {}) {
  const rules = extractRuleUnits(claudeMdText);
  const rows = rules.map((r) => {
    const crossRefs = countArticleCrossReferences(r.article, otherFilesText);
    return {
      article: r.article,
      titre: r.titre,
      sensibilite: classifyRuleSensitivity(r),
      importance: classifyRuleImportance(crossRefs),
      referencesCroisees: crossRefs,
      lignes: r.texte.split("\n").length,
    };
  });
  const redondances = findRedundantRulePairs(rules);
  return { rows, redondances };
}

export function renderClaudeMdRuleTable({ rows, redondances }) {
  const lines = [
    "| Article | Titre | Sensibilité | Importance | Réf. croisées | Lignes |",
    "|---|---|---|---|---|---|",
  ];
  for (const r of rows) {
    lines.push(`| ${r.article} | ${r.titre.replace(/\n/g, " ")} | ${r.sensibilite} | ${r.importance} | ${r.referencesCroisees} | ${r.lignes} |`);
  }
  lines.push("");
  if (redondances.length) {
    lines.push("**Redondances possibles détectées (à vérifier, jamais une certitude) :**");
    for (const p of redondances) lines.push(`- Article ${p.a} ↔ Article ${p.b} (similarité ${(p.jaccard * 100).toFixed(0)}%, ${p.motsPartages} mots partagés)`);
  } else {
    lines.push("Aucune redondance forte détectée à ce passage (seuil strict — cf. `findRedundantRulePairs`).");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------------------------
// PARTIE 2 — ce que Moïse APPORTE, et que rien ne faisait avant lui.
// ---------------------------------------------------------------------------------------------

const EXT_CODE = new Set([".mjs", ".ts", ".tsx", ".js"]);
const IGNORE_DIR = new Set(["node_modules", ".git", ".next", "dist", "build", ".wrangler"]);

// Balaye le dépôt une SEULE fois et rend le texte de chaque fichier. Ce balayage est la partie
// coûteuse de tout ce qui suit : le faire une fois et le passer en paramètre, plutôt que de le
// refaire par Article, est la différence entre une seconde et une minute (mesuré : 30 Articles ×
// 2 balayages, c'est ce que mes greps à la main coûtaient le 2026-09-23).
export function fichiersDuDepot({ root = ROOT, exclure = new Set([CHARTE]) } = {}) {
  const out = {};
  const walk = (dir) => {
    let entrees;
    try { entrees = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      if (IGNORE_DIR.has(e.name)) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      const rel = relative(root, p);
      if (exclure.has(rel)) continue;
      if (!/\.(mjs|ts|tsx|js|md|txt)$/.test(e.name)) continue;
      try { if (statSync(p).size > 2_000_000) continue; out[rel] = readFileSync(p, "utf8"); } catch { /* illisible : ignoré */ }
    }
  };
  walk(root);
  return out;
}

const estDuCode = (chemin) => EXT_CODE.has(chemin.slice(chemin.lastIndexOf(".")));

// LE PORTEUR, ET POURQUOI « CITÉ PAR DU CODE » NE SUFFISAIT PAS. Première version de cette mesure :
// un Article cité par au moins un fichier .mjs/.ts avait un porteur mécanique. Lancée pour de vrai
// sur le dépôt (Article 25), elle a répondu « oui » pour les TRENTE Articles — donc elle ne
// distinguait rien. La cause est simple et elle vaut d'être écrite : ce projet cite « Article N »
// abondamment dans ses commentaires, et une MENTION dans un commentaire n'est pas un mécanisme.
// C'était exactement le défaut que cette session a traqué toute la journée — une déclaration prise
// pour un fait.
//
// LA MESURE HONNÊTE qui la remplace tient en deux temps, et aucun des deux ne devine :
//   1. l'Article NOMME-t-il lui-même son porteur ? (`maFonction()` ou `scripts/mon-outil.mjs`)
//   2. ce porteur nommé EXISTE-t-il réellement dans le dépôt ?
// Trois états en sortent, jamais deux : porté (nommé et trouvé) · sans porteur (rien de nommé — sa
// prose EST le mécanisme, Article 27) · FANTÔME (nommé et introuvable). Le troisième est le pire
// des trois et c'est pour lui que la mesure existe : un porteur fantôme rassure à tort, là où une
// absence assumée laisse au moins la vigilance en éveil.
const MOTIF_FONCTION_CITEE = /`([a-zA-Z][a-zA-Z0-9_]{3,})\(\)`/g;
const MOTIF_SCRIPT_CITE = /`(scripts\/[a-z0-9-]+\.mjs)`/g;

export function porteursDeclares(texteArticle = "", fichiers = {}) {
  const nommes = new Set();
  for (const m of String(texteArticle).matchAll(MOTIF_FONCTION_CITEE)) nommes.add({ type: "fonction", nom: m[1] });
  for (const m of String(texteArticle).matchAll(MOTIF_SCRIPT_CITE)) nommes.add({ type: "script", nom: m[1] });
  const trouves = []; const fantomes = [];
  for (const n of nommes) {
    const existe = n.type === "script"
      ? Object.prototype.hasOwnProperty.call(fichiers, n.nom)
      : Object.entries(fichiers).some(([chemin, contenu]) => estDuCode(chemin) && new RegExp(`function\\s+${n.nom}\\b|const\\s+${n.nom}\\s*=`).test(contenu));
    (existe ? trouves : fantomes).push(n.nom);
  }
  if (!nommes.size) return { etat: "sans porteur", trouves: [], fantomes: [], pourquoi: "l'Article ne nomme aucun mécanisme — sa prose est son seul mécanisme (Article 27)" };
  if (fantomes.length) return { etat: "fantôme", trouves, fantomes, pourquoi: `nomme ${fantomes.length} mécanisme(s) INTROUVABLE(S) : ${fantomes.join(", ")} — pire qu'une absence, puisque ça rassure à tort` };
  return { etat: "porté", trouves, fantomes: [], pourquoi: `nomme ${trouves.length} mécanisme(s) et tous existent : ${trouves.slice(0, 3).join(", ")}${trouves.length > 3 ? "…" : ""}` };
}

// LA MESURE QUI MANQUAIT. Trois colonnes par Article, dont la troisième est la seule qui réponde à
// « cette règle a-t-elle un porteur mécanique ? » : un Article cité par des FICHIERS DE CODE est
// tenu par un mécanisme ; un Article cité seulement par des documents n'est tenu que par sa prose,
// et l'Article 27 en fait alors une règle intouchable en substance.
export function mesurerArticles(claudeMdText, fichiers = {}) {
  const unites = extractRuleUnits(claudeMdText);
  return unites.map((u) => {
    const motif = new RegExp(`Article\\s+${u.article}\\b`, "g");
    let citations = 0; const fichiersCitants = []; const fichiersDeCode = [];
    for (const [chemin, contenu] of Object.entries(fichiers)) {
      const n = (contenu.match(motif) || []).length;
      if (!n) continue;
      citations += n; fichiersCitants.push(chemin);
      if (estDuCode(chemin)) fichiersDeCode.push(chemin);
    }
    const lignes = u.texte.split("\n").length;
    const porteur = porteursDeclares(u.texte, fichiers);
    return {
      article: u.article,
      titre: u.titre,
      lignes,
      tokens: estimateTokens(u.texte),
      citations,
      fichiersCitants: fichiersCitants.length,
      fichiersDeCode: fichiersDeCode.length,
      porteur: porteur.etat,
      porteurPourquoi: porteur.pourquoi,
      porteurFantomes: porteur.fantomes,
      porteurMecanique: porteur.etat === "porté",
      sensibilite: classifyRuleSensitivity(u),
      texte: u.texte,
    };
  });
}

// LE HORS-ARTICLES, ET POURQUOI IL A FALLU L'AJOUTER. Premier vrai passage du diagnostic
// (Article 25) : la nature INVENTAIRE ressortait à « aucun Article ». C'était exact et trompeur —
// les deux plus gros inventaires de la charte ne sont pas des Articles mais des SECTIONS de niveau
// deux, donc invisibles à un découpage qui ne connaît que « **Article N — …** ». Un diagnostic qui
// couvre 19 876 tokens sur 25 771 et ne le dit pas laisse croire qu'il a tout regardé : c'est
// précisément le défaut que cet outil existe pour empêcher.
const SECTION_HEADING_PATTERN = /^## (.+)$/gm;

export function mesurerSections(claudeMdText = "") {
  const lignes = String(claudeMdText).split("\n");
  const bornes = [];
  lignes.forEach((l, i) => { if (/^## /.test(l)) bornes.push({ titre: l.slice(3).trim(), debut: i }); });
  if (!bornes.length) return [];
  return bornes.map((b, k) => {
    const fin = k + 1 < bornes.length ? bornes[k + 1].debut : lignes.length;
    const texte = lignes.slice(b.debut, fin).join("\n");
    const lignesTableau = texte.split("\n").filter((l) => l.trim().startsWith("|")).length;
    const articles = (texte.match(/\*\*Article \d+ — /g) || []).length;
    return {
      titre: b.titre,
      lignes: fin - b.debut,
      tokens: estimateTokens(texte),
      articles,
      lignesTableau,
      // Une section est un INVENTAIRE quand elle est faite de lignes de tableau ou de puces citant
      // des chemins, et qu'elle ne porte aucun Article. Le critère est mécanique et se trompe vers
      // la prudence : une section qui contient ne serait-ce qu'un Article n'est jamais classée
      // inventaire, parce qu'un inventaire ne porte jamais de règle.
      nature: articles > 0
        ? "contient des Articles — voir le détail Article par Article"
        : (lignesTableau > 4 || (texte.match(/`(docs|scripts|lib)\//g) || []).length > 8)
          ? NATURES.INVENTAIRE.cle
          : "prose de cadrage",
    };
  });
}

// LES QUATRE NATURES. Elles ne sont pas des catégories de rangement : chacune commande un geste
// différent, et c'est pour ça qu'elles existent.
export const NATURES = {
  LOI: { cle: "LOI", geste: "intouchable — doit rester sous les yeux en permanence" },
  OUTIL: { cle: "MODE D'EMPLOI D'OUTIL", geste: "réductible à un aiguillage : le déclencheur + un renvoi vérifié" },
  DISCIPLINE: { cle: "DISCIPLINE SANS PORTEUR", geste: "substance intouchable (la prose EST le mécanisme, Article 27) ; seule la genèse datée peut partir" },
  INVENTAIRE: { cle: "INVENTAIRE", geste: "remplaçable par une convention, à condition d'un garde-fou mécanique (Article 24)" },
};

// Articles que l'utilisateur a placés hors périmètre, nommément et définitivement. Ce n'est PAS une
// liste figée au sens de l'Article 24 (rien à synchroniser avec un autre système) : c'est une
// décision humaine écrite, et l'Article 24 dispense explicitement le contenu curaté à la main dont
// la nature manuelle est déclarée à côté. Elle l'est, ici même.
export const ARTICLES_HORS_PERIMETRE = new Set([0]);

const MOTIF_CITE_UN_OUTIL = /`scripts\/[a-z0-9-]+\.mjs`|docs\/referentiel\/[a-z0-9-]+\.md/i;
const MOTIF_INVENTAIRE = /^\s*\|.*\|.*\|/m;

// Proposition mécanique, jamais un verdict. La décision finale est humaine et elle SURVIT à la
// régénération (cf. naturesDejaDecidees ci-dessous) : un outil qui écraserait un arbitrage de
// l'utilisateur à chaque passage serait pire qu'inutile, il serait nuisible.
export function natureProposee(mesure) {
  if (ARTICLES_HORS_PERIMETRE.has(mesure.article)) return { nature: NATURES.LOI.cle, pourquoi: "hors périmètre par décision explicite de l'utilisateur" };
  if (MOTIF_INVENTAIRE.test(mesure.texte) && mesure.texte.split("\n").filter((l) => l.trim().startsWith("|")).length > 4) {
    return { nature: NATURES.INVENTAIRE.cle, pourquoi: "contient un tableau de plus de quatre lignes — un inventaire, pas une règle" };
  }
  if (MOTIF_CITE_UN_OUTIL.test(mesure.texte) && mesure.porteurMecanique) {
    return { nature: NATURES.OUTIL.cle, pourquoi: `nomme un outil et ${mesure.porteurPourquoi} — la règle est déjà servie ailleurs` };
  }
  if (mesure.lignes <= 8 && mesure.citations >= 30) {
    return { nature: NATURES.LOI.cle, pourquoi: `court (${mesure.lignes} lignes) et très cité (${mesure.citations}) — le rendement d'une loi` };
  }
  if (!mesure.porteurMecanique) {
    return { nature: NATURES.DISCIPLINE.cle, pourquoi: "aucun fichier de code ne le cite — sa prose est son seul mécanisme" };
  }
  return { nature: NATURES.DISCIPLINE.cle, pourquoi: "aucun signal net — à trancher à la lecture, jamais par défaut" };
}

// La décision humaine survit à la régénération. C'est le point qui sépare un document généré utile
// d'un document généré qui efface le travail : on relit l'ancienne cartographie AVANT d'en écrire
// une neuve, et toute nature marquée « décidé » y est reprise telle quelle.
export function naturesDejaDecidees(texteExistant = "") {
  const decidees = new Map();
  for (const ligne of String(texteExistant).split("\n")) {
    const m = ligne.match(/^\|\s*(\d+)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|\s*décidé\s*\|/i);
    if (m) decidees.set(Number(m[1]), m[2].trim());
  }
  return decidees;
}

export function buildCartographie({ root = ROOT, fichiers = null, mesurerObligations = null } = {}) {
  const charte = lire(CHARTE, root);
  if (charte == null) return { mesurable: false, pourquoi: `${CHARTE} introuvable` };
  const depot = fichiers ?? fichiersDuDepot({ root });
  const mesures = mesurerArticles(charte, depot);
  const decidees = naturesDejaDecidees(lire(CARTOGRAPHIE_PATH, root) ?? "");
  const lignes = mesures.map((m) => {
    const proposee = natureProposee(m);
    const decidee = decidees.get(m.article);
    return { ...m, nature: decidee ?? proposee.nature, pourquoi: decidee ? "décision de l'utilisateur, reprise telle quelle" : proposee.pourquoi, statut: decidee ? "décidé" : "proposé" };
  });
  return {
    mesurable: true,
    lignesCharte: charte.split("\n").length,
    tokens: estimateTokens(charte),
    // Jamais un zéro déguisé en mesure : sans compteur fourni, on le DIT (même discipline
    // « mesuré / pas mesuré / pas mesurable » que le reste du paysage).
    obligations: mesurerObligations ? mesurerObligations(charte) : { mesurable: false, pourquoi: "compteur d'obligations non fourni par l'appelant (ecotoken)", instructions: "?", disponible: "?", verdict: "pas mesuré" },
    articles: lignes,
    sections: mesurerSections(charte),
    redondances: findRedundantRulePairs(extractRuleUnits(charte)),
  };
}

export function renderCartographie(carto, { date = new Date().toISOString().slice(0, 10) } = {}) {
  if (!carto.mesurable) return `# Cartographie de la charte (CLAUDE.md)\n\nPAS MESURÉ — ${carto.pourquoi}.\n`;
  const out = [
    "# Cartographie de la charte (CLAUDE.md)",
    "",
    `*(Généré le ${date} par \`node scripts/moise-tables-de-loi.mjs cartographie\`. Document de TRAVAIL de l'agent, jamais destiné à l'utilisateur — sa vision à lui est la synthèse stratégique, \`node scripts/moise-tables-de-loi.mjs synthese\`. Régénérable à volonté : les natures marquées « décidé » sont relues et reprises telles quelles, jamais écrasées.)*`,
    "",
    `**État mesuré** : ${carto.lignesCharte} lignes · ~${carto.tokens} tokens estimés · ${carto.obligations.instructions} obligations pour ${carto.obligations.disponible} réellement suivables (${carto.obligations.verdict}).`,
    "",
    "## Les quatre natures, et le geste que chacune commande",
    "",
    ...Object.values(NATURES).map((n) => `- **${n.cle}** — ${n.geste}`),
    "",
    "## Article par Article",
    "",
    "| Art. | Titre | Lignes | Tokens | Citations | Porteur | Nature | Statut | Pourquoi |",
    "|---|---|---|---|---|---|---|---|---|",
  ];
  for (const a of [...carto.articles].sort((x, y) => y.tokens - x.tokens)) {
    out.push(`| ${a.article} | ${a.titre.replace(/\n/g, " ").slice(0, 60)} | ${a.lignes} | ${a.tokens} | ${a.citations} | ${a.porteur} | ${a.nature} | ${a.statut} | ${a.pourquoi} |`);
  }
  out.push("", "## Redondances possibles (signal, jamais une certitude)", "");
  if (carto.redondances.length) {
    for (const p of carto.redondances) out.push(`- Article ${p.a} ↔ Article ${p.b} — similarité ${(p.jaccard * 100).toFixed(0)}%, ${p.motsPartages} mots partagés`);
  } else out.push("Aucune au seuil strict.");
  out.push("", "*Pour faire d'une nature « proposé » une nature « décidé » : remplacer le mot dans la colonne Statut. La régénération la conservera.*", "");
  return out.join("\n");
}

// ---------------------------------------------------------------------------------------------
// PARTIE 3 — la mémoire, au grain de l'Article (calibrage explicite de l'utilisateur).
// ---------------------------------------------------------------------------------------------

export const GESTES = ["allègement", "aiguillage", "déplacement", "ajout", "réorganisation", "annulation"];
export const RESULTATS = ["tenu", "annulé", "à revoir"];

export function lireOperations({ root = ROOT } = {}) {
  const texte = lire(OPERATIONS_PATH, root);
  if (texte == null) return { mesurable: false, operations: [], pourquoi: `${OPERATIONS_PATH} n'existe pas encore` };
  const operations = [];
  for (const ligne of texte.split("\n")) {
    const cells = ligne.split("|").map((c) => c.trim());
    if (cells.length < 9 || !/^\d{4}-\d{2}-\d{2}/.test(cells[1] ?? "")) continue;
    operations.push({ date: cells[1], article: cells[2], geste: cells[3], avant: cells[4], apres: cells[5], decidePar: cells[6], resultat: cells[7], pourquoi: cells[8] });
  }
  return { mesurable: true, operations };
}

// LA QUESTION QU'IL FAUT POUVOIR POSER, dans les mots de l'utilisateur : « comment nous avons fait
// la dernière fois ? ». Une mémoire qui ne sait pas y répondre est une mémoire pour le plaisir.
export function commentOnAFaitLaDerniereFois(article, { root = ROOT, operations = null } = {}) {
  const m = operations ?? lireOperations({ root });
  if (!m.mesurable) return { mesurable: false, pourquoi: m.pourquoi };
  const miennes = m.operations.filter((o) => String(o.article) === String(article));
  if (!miennes.length) return { mesurable: true, connu: false, resume: `Aucune opération enregistrée sur l'Article ${article} — terrain neuf.` };
  const derniere = miennes[miennes.length - 1];
  const annulees = miennes.filter((o) => o.resultat === "annulé");
  const resume = [
    `Article ${article} : ${miennes.length} opération(s) enregistrée(s).`,
    `Dernière — ${derniere.date}, ${derniere.geste}, ${derniere.avant} → ${derniere.apres}, décidé par ${derniere.decidePar}, résultat « ${derniere.resultat} ».`,
    annulees.length ? `⚠️ ${annulees.length} opération(s) ANNULÉE(S) sur cet Article : ${annulees.map((o) => `${o.date} (${o.pourquoi})`).join(" · ")} — ne pas refaire le même geste sans savoir pourquoi il n'a pas tenu.` : "Aucune annulation : les gestes passés ont tenu.",
  ].join("\n");
  return { mesurable: true, connu: true, operations: miennes, derniere, annulees, resume };
}

export function enregistrerOperation(op, { root = ROOT, ecrire = writeFileSync } = {}) {
  const manquants = ["date", "article", "geste", "decidePar", "resultat", "pourquoi"].filter((c) => !op?.[c]);
  if (manquants.length) throw new Error(`enregistrerOperation : champ(s) obligatoire(s) manquant(s) : ${manquants.join(", ")}`);
  if (!GESTES.includes(op.geste)) throw new Error(`enregistrerOperation : geste inconnu « ${op.geste} » (attendus : ${GESTES.join(", ")})`);
  if (!RESULTATS.includes(op.resultat)) throw new Error(`enregistrerOperation : résultat inconnu « ${op.resultat} » (attendus : ${RESULTATS.join(", ")})`);
  const chemin = join(root, OPERATIONS_PATH);
  const existant = lire(OPERATIONS_PATH, root) ?? enteteOperations();
  const ligne = `| ${op.date} | ${op.article} | ${op.geste} | ${op.avant ?? "—"} | ${op.apres ?? "—"} | ${op.decidePar} | ${op.resultat} | ${op.pourquoi} |`;
  ecrire(chemin, `${existant.replace(/\n+$/, "")}\n${ligne}\n`, "utf8");
  recordRegistryWrite(OPERATIONS_PATH, { par: "moise-tables-de-loi" });
  return ligne;
}

export function enteteOperations() {
  return [
    "# Mémoire des opérations sur la charte (CLAUDE.md)",
    "",
    "*(Tenu par moise-tables-de-loi — `enregistrerOperation()`. Grain : l'ARTICLE TOUCHÉ, calibrage explicite de l'utilisateur le 2026-09-23. Une ligne par passe d'ensemble saurait dire combien on a gagné ; seule une ligne par Article sait dire qu'un geste précis a déjà été tenté sur CET Article et n'a pas tenu. C'est la seconde qui empêche de refaire une erreur.)*",
    "",
    "| Date | Article | Geste | Avant | Après | Décidé par | Résultat | Pourquoi |",
    "|---|---|---|---|---|---|---|---|",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------
// PARTIE 4 — les deux garde-fous de fraîcheur, gratuits, à chaque commit qui touche CLAUDE.md.
// ---------------------------------------------------------------------------------------------

// LE DÉFAUT QU'IL FERME, et il est constaté, pas craint : la table de classification servant à
// décider quoi alléger datait de trois jours et s'arrêtait à l'Article 23, six Articles derrière la
// réalité. Un instrument périmé ne se signale pas tout seul — il rend des chiffres, et ils ont
// l'air justes.
export function findArticlesAbsentsDeLaTable({ root = ROOT, cheminTable = TABLE_REGLES_PATH } = {}) {
  const charte = lire(CHARTE, root);
  const table = lire(cheminTable, root);
  if (charte == null) return { mesurable: false, pourquoi: `${CHARTE} introuvable` };
  if (table == null) return { mesurable: false, pourquoi: `${cheminTable} n'existe pas — rien à comparer, et ce silence ne dit pas que tout va bien` };
  const attendus = extractRuleUnits(charte).map((u) => u.article);
  const presents = new Set();
  for (const ligne of table.split("\n")) {
    const m = ligne.match(/^\|\s*(\d+)\s*\|/);
    if (m) presents.add(Number(m[1]));
  }
  const absents = attendus.filter((a) => !presents.has(a));
  return { mesurable: true, attendus: attendus.length, presents: presents.size, absents };
}

export function cartographiePerimee({ root = ROOT } = {}) {
  const charte = lire(CHARTE, root);
  const carto = lire(CARTOGRAPHIE_PATH, root);
  if (charte == null) return { mesurable: false, pourquoi: `${CHARTE} introuvable` };
  if (carto == null) return { mesurable: true, perimee: true, pourquoi: "la cartographie n'a jamais été générée" };
  const attendus = extractRuleUnits(charte).map((u) => u.article);
  const presents = new Set();
  for (const ligne of carto.split("\n")) {
    const m = ligne.match(/^\|\s*(\d+)\s*\|/);
    if (m) presents.add(Number(m[1]));
  }
  const manquants = attendus.filter((a) => !presents.has(a));
  const enTrop = [...presents].filter((a) => !attendus.includes(a));
  if (manquants.length || enTrop.length) {
    return { mesurable: true, perimee: true, manquants, enTrop, pourquoi: `${manquants.length} Article(s) absent(s) de la cartographie, ${enTrop.length} en trop` };
  }
  return { mesurable: true, perimee: false, pourquoi: `les ${attendus.length} Articles de la charte sont dans la cartographie` };
}

// VERROU N°4 DU PLAN D'ATTAQUE, rendu mécanique. Un renvoi ne part JAMAIS vers un document qui
// n'existe pas, ni vers un document qui existe mais ne contient pas encore ce qu'on lui confie.
// Preuve de besoin, mesurée le 2026-09-23 : la plus grosse proposition d'allègement au catalogue
// (2 914 tokens) renvoyait vers un document inexistant, et rien ne le disait.
export function verifierDocumentDAccueil(chemin, sujets = [], { root = ROOT } = {}) {
  const texte = lire(chemin, root);
  if (texte == null) return { peutPartir: false, existe: false, pourquoi: `${chemin} n'existe pas — le contenu partirait dans le vide` };
  const absents = sujets.filter((s) => !texte.toLowerCase().includes(String(s).toLowerCase()));
  if (absents.length) return { peutPartir: false, existe: true, absents, pourquoi: `${chemin} existe mais ne contient pas encore : ${absents.join(" · ")}` };
  return { peutPartir: true, existe: true, pourquoi: `${chemin} existe et porte déjà les ${sujets.length} sujet(s) vérifié(s)` };
}

// ---------------------------------------------------------------------------------------------
// PARTIE 5 — les deux sorties, volontairement séparées (calibrage explicite de l'utilisateur :
// « les docs sont pour toi, pas pour moi. Moi j'ai besoin d'avoir une vision résumée, stratégique
// sur les points sensibles »).
// ---------------------------------------------------------------------------------------------

export function syntheseStrategique({ root = ROOT, carto = null, fichiers = null, mesurerObligations = null } = {}) {
  const c = carto ?? buildCartographie({ root, fichiers, mesurerObligations });
  if (!c.mesurable) return { mesurable: false, pourquoi: c.pourquoi };
  const sensibles = c.articles.filter((a) => a.sensibilite !== "normale");
  const sansPorteur = c.articles.filter((a) => a.porteur === "sans porteur");
  const fantomes = c.articles.filter((a) => a.porteur === "fantôme");
  const lourdsPeuCites = c.articles.filter((a) => a.lignes >= 25 && a.citations < 30);
  const fraicheur = cartographiePerimee({ root });
  const aTrancher = c.articles.filter((a) => a.statut === "proposé" && a.nature !== NATURES.LOI.cle);
  return {
    mesurable: true,
    points: [
      { titre: "Ce que le document pèse", texte: `${c.lignesCharte} lignes, ~${c.tokens} tokens rechargés à chaque message. Mais le chiffre qui compte est l'autre : ${c.obligations.instructions} obligations pour ${c.obligations.disponible} réellement suivables.` },
      { titre: "Ce qui est intouchable", texte: `${sensibles.length} Article(s) se déclarent non négociables ou portent l'esprit des personnages : ${sensibles.map((a) => a.article).join(", ")}.` },
      { titre: "Ce qui ne tient que par sa prose", texte: `${sansPorteur.length} Article(s) ne nomment aucun mécanisme — rien ne les fait respecter que leur propre texte : ${sansPorteur.map((a) => a.article).join(", ") || "aucun"}.` },
      { titre: "Porteurs fantômes", texte: fantomes.length ? `⚠️ ${fantomes.length} Article(s) nomment un mécanisme qui n'existe pas : ${fantomes.map((a) => `${a.article} (${a.porteurFantomes.join(", ")})`).join(" · ")}. Un porteur fantôme rassure à tort — c'est pire qu'une absence assumée.` : "Aucun : tout mécanisme nommé par un Article existe réellement." },
      { titre: "Ce qui coûte plus qu'il ne rend", texte: `${lourdsPeuCites.length} Article(s) longs et peu cités : ${lourdsPeuCites.map((a) => `${a.article} (${a.lignes} l., ${a.citations} cit.)`).join(" · ") || "aucun"}. Un rendement bas n'est jamais un ordre de couper.` },
      { titre: "Ce qui attend ta décision", texte: `${aTrancher.length} Article(s) portent une nature seulement PROPOSÉE par la mesure, jamais tranchée par toi.` },
      { titre: "Fiabilité de l'instrument", texte: fraicheur.perimee ? `⚠️ la cartographie est périmée — ${fraicheur.pourquoi}. Rien ne doit être décidé dessus avant régénération.` : `✅ ${fraicheur.pourquoi}.` },
    ],
  };
}

// ---------------------------------------------------------------------------------------------
// PARTIE 5bis — LE DIAGNOSTIC COMPLET, et c'est le cœur du métier de cet outil.
//
// Demande explicite de l'utilisateur : « vérifie que Moïse t'aide à faire un diagnostic complet et
// utile : ça fait partie de son boulot ! » Ce n'est pas une sortie de plus : c'est la raison pour
// laquelle il existe. Le 2026-09-23, produire le diagnostic de la charte m'a demandé une douzaine
// de scripts jetables, soixante greps, et j'ai reproduit au passage un bug déjà corrigé un an plus
// tôt dans une fonction dont j'ignorais l'existence. Tout ce qui suit est ce travail-là, rendu
// répétable.
//
// CE QU'IL NE FAIT PAS, ET LA FRONTIÈRE EST NETTE : il n'écrit pas l'analyse, et il n'écrit pas le
// plan d'attaque. Il rassemble les FAITS et nomme ce qui appelle une décision ; l'analyse et le
// plan restent produits par l'agent, la décision reste à l'utilisateur. Un outil qui conclurait à
// ma place produirait un jugement que personne n'a porté.
// ---------------------------------------------------------------------------------------------

export function diagnosticComplet({ root = ROOT, fichiers = null, mesurerObligations = null } = {}) {
  const carto = buildCartographie({ root, fichiers, mesurerObligations });
  if (!carto.mesurable) return { mesurable: false, pourquoi: carto.pourquoi };
  const memoire = lireOperations({ root });

  // Regroupement par nature, avec le poids que chacune représente : c'est ce total qui dit où le
  // gain est réellement possible, là où une liste d'Articles triée par poids ne le dit pas.
  const parNature = {};
  for (const a of carto.articles) {
    (parNature[a.nature] ??= { articles: [], tokens: 0, lignes: 0 });
    parNature[a.nature].articles.push(a.article);
    parNature[a.nature].tokens += a.tokens;
    parNature[a.nature].lignes += a.lignes;
  }

  const fantomes = carto.articles.filter((a) => a.porteur === "fantôme");
  const sansPorteur = carto.articles.filter((a) => a.porteur === "sans porteur");
  const aTrancher = carto.articles.filter((a) => a.statut === "proposé");
  const dejaTentes = carto.articles
    .map((a) => ({ article: a.article, histoire: commentOnAFaitLaDerniereFois(a.article, { root, operations: memoire }) }))
    .filter((x) => x.histoire.connu);
  const annulesAvant = dejaTentes.filter((x) => x.histoire.annulees?.length);

  // LE GAIN POSSIBLE, et il est volontairement borné par ce que la charte s'interdit elle-même :
  // une LOI ne rend rien (intouchable), une DISCIPLINE ne rend que sa genèse datée. Annoncer le
  // total brut du document serait un chiffre vrai et un conseil faux.
  const gainOutil = parNature[NATURES.OUTIL.cle]?.tokens ?? 0;
  const inventaires = (carto.sections ?? []).filter((s) => s.nature === NATURES.INVENTAIRE.cle);
  const gainInventaire = (parNature[NATURES.INVENTAIRE.cle]?.tokens ?? 0) + inventaires.reduce((n, s) => n + s.tokens, 0);
  // La couverture se DÉCLARE, elle ne se suppose pas : dire quelle part du document le diagnostic a
  // réellement regardée est ce qui distingue « j'ai tout vu » de « j'ai vu les Articles ».
  const tokensArticles = carto.articles.reduce((n, a) => n + a.tokens, 0);

  return {
    mesurable: true,
    etat: { lignes: carto.lignesCharte, tokens: carto.tokens, obligations: carto.obligations },
    parNature,
    sections: carto.sections ?? [],
    inventaires,
    couverture: { tokensArticles, tokensDocument: carto.tokens, part: carto.tokens ? Math.round((tokensArticles / carto.tokens) * 100) : 0 },
    fantomes,
    sansPorteur,
    aTrancher,
    redondances: carto.redondances,
    memoire: { mesurable: memoire.mesurable, operations: memoire.operations.length, articlesConnus: dejaTentes.length, annulesAvant },
    gainTheorique: {
      aiguillages: Math.round(gainOutil * 0.8),
      inventaires: Math.round(gainInventaire * 0.8),
      pourquoi: "80 % du poids d'un Article réductible : un aiguillage garde toujours son déclencheur et son renvoi, jamais zéro ligne",
    },
    fraicheur: cartographiePerimee({ root }),
  };
}

export function renderDiagnostic(d) {
  if (!d.mesurable) return [`PAS MESURÉ — ${d.pourquoi}.`];
  const L = [];
  L.push("=== DIAGNOSTIC COMPLET DE LA CHARTE ===", "");
  L.push(`État : ${d.etat.lignes} lignes · ~${d.etat.tokens} tokens · ${d.etat.obligations.instructions} obligations pour ${d.etat.obligations.disponible} suivables (${d.etat.obligations.verdict}).`);
  L.push("");
  L.push("--- Par nature, avec le geste que chacune commande ---");
  for (const n of Object.values(NATURES)) {
    const g = d.parNature[n.cle];
    if (!g) { L.push(`· ${n.cle} : aucun Article`); continue; }
    L.push(`· ${n.cle} — ${g.articles.length} Article(s), ${g.lignes} lignes, ~${g.tokens} tokens`);
    L.push(`    Articles : ${g.articles.join(", ")}`);
    L.push(`    Geste : ${n.geste}`);
  }
  L.push("");
  L.push("--- Le hors-Articles, que le découpage par Article ne voit pas ---");
  L.push(`Les Articles portent ~${d.couverture.tokensArticles} tokens sur ~${d.couverture.tokensDocument} (${d.couverture.part} %). Le reste vit dans des sections.`);
  if (d.inventaires.length) {
    L.push(`${d.inventaires.length} section(s) sont des INVENTAIRES — des listes de chemins, pas des règles :`);
    for (const s of d.inventaires) L.push(`    · « ${s.titre} » — ${s.lignes} lignes, ~${s.tokens} tokens`);
    L.push("    Geste : remplaçable par une convention, à condition d'un garde-fou mécanique (Article 24).");
  } else L.push("Aucune section d'inventaire détectée.");
  L.push("");
  L.push("--- Porteurs ---");
  L.push(d.fantomes.length ? `⚠️  ${d.fantomes.length} porteur(s) FANTÔME(S) — un mécanisme nommé qui n'existe pas rassure à tort : ${d.fantomes.map((a) => `Art.${a.article} (${a.porteurFantomes.join(", ")})`).join(" · ")}` : "✅ Aucun porteur fantôme : tout mécanisme nommé existe réellement.");
  L.push(`· ${d.sansPorteur.length} Article(s) sans aucun mécanisme nommé — leur prose EST le mécanisme (Article 27), donc intouchables en substance : ${d.sansPorteur.map((a) => a.article).join(", ")}`);
  L.push("");
  L.push("--- Ce que la mémoire sait déjà ---");
  if (!d.memoire.mesurable) L.push("PAS MESURÉ — aucune opération n'a encore été enregistrée. Ce silence ne dit pas que rien n'a été fait, il dit qu'on ne le sait pas.");
  else {
    L.push(`${d.memoire.operations} opération(s) enregistrée(s), sur ${d.memoire.articlesConnus} Article(s).`);
    if (d.memoire.annulesAvant.length) {
      L.push(`⚠️  ${d.memoire.annulesAvant.length} Article(s) portent une opération DÉJÀ ANNULÉE — ne pas refaire le même geste sans savoir pourquoi il n'a pas tenu :`);
      for (const x of d.memoire.annulesAvant) L.push(`    Art.${x.article} — ${x.histoire.annulees.map((o) => `${o.date} : ${o.pourquoi}`).join(" · ")}`);
    } else L.push("Aucune opération annulée : les gestes passés ont tenu.");
  }
  L.push("");
  L.push("--- Gain théorique, borné par ce que la charte s'interdit ---");
  L.push(`Aiguillages possibles (MODE D'EMPLOI D'OUTIL) : ~${d.gainTheorique.aiguillages} tokens`);
  L.push(`Inventaires remplaçables par une convention : ~${d.gainTheorique.inventaires} tokens`);
  L.push(`(${d.gainTheorique.pourquoi}. Les LOIS rendent zéro par construction, et les DISCIPLINES ne rendent que leur genèse datée.)`);
  L.push("");
  L.push("--- Redondances possibles (signal, jamais une certitude) ---");
  if (d.redondances.length) for (const p of d.redondances) L.push(`· Article ${p.a} ↔ Article ${p.b} — ${(p.jaccard * 100).toFixed(0)}% de vocabulaire commun`);
  else L.push("Aucune au seuil strict.");
  L.push("");
  L.push(`--- Ce qui attend une décision humaine : ${d.aTrancher.length} Article(s) ---`);
  L.push("Leur nature est PROPOSÉE par la mesure, jamais tranchée. Aucun geste ne part d'une nature proposée.");
  return L;
}

// ---------------------------------------------------------------------------------------------
// PARTIE 6 — le process « analyse et plan d'action CLAUDE.md », déclaré plutôt que refait de tête
// à chaque fois (demande explicite : « on relance tout le process [...] qui doit être un process
// bien établi »). Les preuves sont des FICHIERS : une étape sans trace sur le disque ne peut pas
// être vérifiée, et elle est déclarée telle quelle plutôt que comptée au vert.
// ---------------------------------------------------------------------------------------------

export const PROCESS_DOC = "docs/analyse-charte-process-detail.md";

export const ETAPES_ANALYSE = [
  { cle: "memoire", libelle: "relire la mémoire des opérations — qu'a-t-on déjà tenté sur ces Articles, et qu'est-ce qui n'a pas tenu ?", preuve: OPERATIONS_PATH },
  { cle: "fraicheur", libelle: "vérifier que l'instrument n'est pas périmé avant de mesurer avec lui", preuve: null },
  { cle: "cartographie", libelle: "régénérer la cartographie (poids, citations, porteur mécanique, nature)", preuve: CARTOGRAPHIE_PATH },
  { cle: "table-regles", libelle: "régénérer la table de classification (sensibilité, importance, redondances)", preuve: TABLE_REGLES_PATH },
  { cle: "accueil", libelle: "vérifier chaque document d'accueil avant de proposer le moindre renvoi", preuve: null },
  { cle: "analyse", libelle: "l'analyse elle-même — produite par l'agent, jamais par l'outil", preuve: null },
  { cle: "plan-action", libelle: "le plan d'action, avec l'état de chaque constat : retenu / écarté avec sa raison / à trancher (Article 28)", preuve: null },
  { cle: "questions", libelle: "poser les questions de calibrage en fenêtre dédiée avant toute application (Article 16)", preuve: null },
  { cle: "taches", libelle: "inscrire dans docs/suivi/ les tâches issues des constats retenus (Article 28 — sans ce maillon, le rapport a coûté son temps et n'a rien changé)", preuve: "docs/suivi/sessions" },
  { cle: "synthese", libelle: "livrer à l'utilisateur la vision stratégique courte, jamais le dossier technique", preuve: null },
  { cle: "enregistrement", libelle: "enregistrer chaque geste réellement appliqué, Article par Article, dans la mémoire", preuve: OPERATIONS_PATH },
];

export function etatDuProcess({ root = ROOT } = {}) {
  return ETAPES_ANALYSE.map((e) => {
    if (!e.preuve) return { ...e, mesurable: false, etat: "pas mesurable — aucune trace disque ne peut l'attester" };
    return { ...e, mesurable: true, etat: existsSync(join(root, e.preuve)) ? "trace présente" : "aucune trace" };
  });
}

// ---------------------------------------------------------------------------------------------

async function main() {
  const [, , commande = "rapport", ...args] = process.argv;
  // L'outil en APPELLE un autre plutôt que de recopier sa mesure (demande explicite de
  // l'utilisateur : « cet agent outil appelle les autres outils dont il a besoin »). Import
  // dynamique, pour la raison écrite en tête de fichier.
  const { budgetInstructions } = await import("./ecotoken.mjs");
  printReportHeader({ tool: "moise-tables-de-loi", title: "MOÏSE-TABLES-DE-LOI — le périmètre de la charte, et lui seul", scriptPath: "scripts/moise-tables-de-loi.mjs" });
  printReliabilityNotice("moise-tables-de-loi");
  recordCliUsage("moise-tables-de-loi");

  if (commande === "cartographie") {
    const carto = buildCartographie({ mesurerObligations: budgetInstructions });
    const texte = renderCartographie(carto);
    writeFileSync(join(ROOT, CARTOGRAPHIE_PATH), texte, "utf8");
    // L'écriture s'enregistre AU MOMENT où elle a lieu, jamais par un rappel à l'agent : le
    // compteur d'usage doit pouvoir dire qu'un registre a été alimenté sans que quiconque s'en
    // souvienne (Article 27).
    recordRegistryWrite(CARTOGRAPHIE_PATH, { par: "moise-tables-de-loi" });
    console.log(`\nCartographie régénérée : ${CARTOGRAPHIE_PATH} (${carto.articles.length} Articles).`);
    const decidees = carto.articles.filter((a) => a.statut === "décidé").length;
    console.log(`${decidees} nature(s) déjà décidée(s) par l'utilisateur, reprise(s) telle(s) quelle(s) ; ${carto.articles.length - decidees} seulement proposée(s) par la mesure.`);
    return;
  }

  if (commande === "table") {
    // LA COMMANDE QUI MANQUAIT, et son absence est la CAUSE du défaut trouvé la veille. Régénérer
    // cette table demandait jusqu'ici une incantation écrite à la main (un `node -e` de quinze
    // lignes recopié depuis un document) : personne ne la relance, et elle a tourné trois jours en
    // ignorant six Articles. Un geste qui n'a pas de commande n'est pas un geste, c'est une
    // intention — corriger l'instrument sans lui donner de bouton aurait laissé la cause intacte
    // (Article 3).
    const charte = lire(CHARTE);
    if (charte == null) { console.log(`\nPAS MESURÉ — ${CHARTE} introuvable.`); return; }
    const table = buildClaudeMdRuleTable(charte, fichiersDuDepot());
    const entete = [
      "# Référentiel des règles de la charte (CHARTER-SPY, porté par MOÏSE-TABLES-DE-LOI)",
      "",
      `*(Régénéré le ${new Date().toISOString().slice(0, 10)} par \`node scripts/moise-tables-de-loi.mjs table\`. Fichier de référence UNIQUE tenu à jour — jamais un dossier+index séparé (calibrage explicite du 2026-09-20). À régénérer AVANT toute décision d'allègement : la version précédente datait du 2026-09-20 et s'arrêtait à l'Article 23, six Articles derrière la réalité, et un instrument périmé ne rend pas une erreur — il rend des chiffres qui ont l'air justes.)*`,
      "",
    ].join("\n");
    writeFileSync(join(ROOT, TABLE_REGLES_PATH), `${entete}${renderClaudeMdRuleTable(table)}\n`, "utf8");
    recordRegistryWrite(TABLE_REGLES_PATH, { par: "moise-tables-de-loi" });
    console.log(`\nTable de classification régénérée : ${TABLE_REGLES_PATH} (${table.rows.length} Articles, ${table.redondances.length} redondance(s) possible(s)).`);
    return;
  }

  if (commande === "memoire") {
    const article = args[0];
    if (article) { console.log(`\n${commentOnAFaitLaDerniereFois(article).resume ?? "PAS MESURÉ"}`); return; }
    const m = lireOperations();
    console.log(m.mesurable ? `\n${m.operations.length} opération(s) enregistrée(s) sur CLAUDE.md.` : `\nPAS MESURÉ — ${m.pourquoi}.`);
    return;
  }

  if (commande === "synthese") {
    const s = syntheseStrategique({ mesurerObligations: budgetInstructions });
    if (!s.mesurable) { console.log(`\nPAS MESURÉ — ${s.pourquoi}.`); return; }
    console.log("\n=== Vision stratégique — les points sensibles, et eux seuls ===\n");
    for (const p of s.points) console.log(`· ${p.titre}\n  ${p.texte}\n`);
    return;
  }

  if (commande === "diagnostic") {
    const d = diagnosticComplet({ mesurerObligations: budgetInstructions });
    console.log("");
    for (const l of renderDiagnostic(d)) console.log(l);
    const ecarts = [];
    if (d.mesurable && d.fantomes.length) ecarts.push({ pourquoi: `${d.fantomes.length} Article(s) nomment un mécanisme introuvable` });
    if (d.mesurable && d.fraicheur.perimee) ecarts.push({ pourquoi: `instrument périmé — ${d.fraicheur.pourquoi}` });
    if (d.mesurable && !d.memoire.mesurable) ecarts.push({ pourquoi: "aucune mémoire d'opération : le diagnostic ne peut pas dire ce qui a déjà été tenté" });
    const plan = planDactionDepuisEcarts(ecarts, { toolSlug: "moise-tables-de-loi", fausseUneMesure: true, tache: "traiter avant de décider quoi que ce soit sur la charte" });
    console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
    for (const l of plan.lignes) console.log(l);
    return;
  }

  if (commande === "process") {
    console.log("\n=== Process « analyse et plan d'action CLAUDE.md » ===\n");
    for (const e of etatDuProcess()) console.log(`${e.mesurable ? (e.etat === "trace présente" ? "✅" : "⚠️ ") : "· "} ${e.libelle}\n     ${e.etat}`);
    return;
  }

  // Rapport par défaut : les deux garde-fous de fraîcheur, gratuits.
  const fraicheur = cartographiePerimee();
  const table = findArticlesAbsentsDeLaTable();
  console.log("\n=== Fraîcheur des instruments du périmètre CLAUDE.md ===\n");
  console.log(fraicheur.mesurable ? (fraicheur.perimee ? `⚠️  Cartographie PÉRIMÉE — ${fraicheur.pourquoi}` : `✅ Cartographie à jour — ${fraicheur.pourquoi}`) : `PAS MESURÉ — ${fraicheur.pourquoi}`);
  console.log(table.mesurable ? (table.absents.length ? `⚠️  Table de classification PÉRIMÉE — ${table.absents.length} Article(s) absent(s) : ${table.absents.join(", ")}` : `✅ Table de classification à jour — ${table.presents}/${table.attendus} Articles`) : `PAS MESURÉ — ${table.pourquoi}`);

  // `fausseUneMesure: true` est déclaré ici et il est exact : un instrument périmé ne rend pas une
  // erreur, il rend des chiffres qui ont l'air justes. C'est la pire forme d'écart et le gabarit
  // commun sait la marquer comme telle.
  const ecarts = [];
  if (fraicheur.mesurable && fraicheur.perimee) ecarts.push({ pourquoi: `la cartographie de CLAUDE.md est périmée — ${fraicheur.pourquoi}` });
  if (table.mesurable && table.absents.length) ecarts.push({ pourquoi: `${table.absents.length} Article(s) absent(s) de la table de classification : ${table.absents.join(", ")}` });
  const plan = planDactionDepuisEcarts(ecarts, {
    toolSlug: "moise-tables-de-loi",
    fausseUneMesure: true,
    tache: "régénérer l'instrument AVANT toute décision d'allègement — jamais décider sur une mesure périmée",
  });
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
