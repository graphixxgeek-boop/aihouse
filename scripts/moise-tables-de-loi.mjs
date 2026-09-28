// ICEBERG: membre
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
import { printReliabilityNotice, decouperEnUnites, sh, lireLeDocumentGouvernant, ligneDocumentAbsent } from "./lib-shell.mjs";
import * as A from "./abraham-les-references.mjs";
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";
import { estimateTokens } from "./smart-conso-token.mjs";
// PAS d'import statique d'ecotoken, et c'est délibéré. ecotoken a besoin de `buildClaudeMdRuleTable`
// (ci-dessous, propre à CLAUDE.md) pendant que Moïse a besoin de son compteur d'obligations
// (générique, donc à sa place là-bas) : un import statique dans les deux sens créerait un cycle.
// Node le tolère tant que l'usage est dans une fonction, mais un cycle toléré est une dette qui
// explose au premier déplacement de ligne. Le compteur est donc INJECTÉ par l'appelant
// (`mesurerObligations`), ce qui rend en prime `buildCartographie()` testable sans toucher au
// disque ni à un autre outil.

const ROOT = new URL("..", import.meta.url).pathname;

// ══════════════════════════════════════════════════════════════════════════
// LA RÉPERCUSSION : LE SEUL TROU DU PROCESS « MODIFIER UN DOCUMENT DE RÉFÉRENCE » (#846)
// ══════════════════════════════════════════════════════════════════════════
//
// LA SURPRISE DE L'INSTRUCTION EST QUE PRESQUE TOUT EXISTAIT DÉJÀ : huit étapes sur dix sont
// exigées par la charte ET portées par un mécanisme réel — reprise des notes (Art. 30), raison
// d'être (`findRaisonsPerdues()`), heure lue (Art. 32), Article disparu ou glissé
// (`protegerLaCharte()`), chemin devenu inatteignable (`cheminsPerdus()`), sobriété d'un Article
// neuf, mémoire des opérations, ligne de suivi.
//
// LE SEUL TROU SANS AUCUN PORTEUR ÉTAIT CELUI-CI : « répercuter dans les autres documents ». La
// charte l'exige « le jour même » (Article 13) et RIEN ne vérifiait que ça avait été fait — ce qui
// est exactement la leçon L1, sur la règle qui gouverne la charte elle-même.
//
// CE QUI SE MESURE, ET LE PREMIER ESSAI ÉTAIT FAUX. J'ai d'abord compté les UNITÉS DE RÈGLE de la
// charte : elles valent 33 et n'ont pas bougé d'un iota sur 80 commits, y compris pendant les
// passes d'allègement qui ont réécrit des Articles entiers. Normal — elles comptent les ARTICLES,
// pas les obligations. Un détecteur bâti dessus n'aurait mordu qu'à la création ou à la suppression
// d'un Article, c'est-à-dire presque jamais : un motif qui ne PEUT pas matcher ressemble trait pour
// trait à un motif qui ne matche pas (leçon L11). Trouvé en mesurant, jamais en relisant.
//
// LA BONNE MESURE EST LE NOMBRE D'OBLIGATIONS (`compterObligations`, ABRAHAM) : il bouge dès qu'une
// phrase impérative est ajoutée, retirée ou reformulée. Un commit qui le fait bouger SANS toucher un
// seul document du référentiel est une dette de répercussion.
//
// POURQUOI LE COMPTE ET PAS LE TEXTE : comparer les textes dirait qu'une virgule a changé. Ce qui
// doit se répercuter n'est pas une retouche, c'est une OBLIGATION qui apparaît ou disparaît — et
// c'est précisément ce que ce compte suit.
export const DOSSIER_REFERENTIEL = "docs/referentiel/";

export function detteDeRepercussion(commit, { shImpl = sh, root = ROOT, compter = A.compterObligations, charte = "CLAUDE.md" } = {}) {
  const lire = (rev) => { try { return shImpl(`git show ${rev}:${charte}`, { cwd: root, maxBuffer: 5e7 }); } catch { return null; } };
  let fichiers;
  try { fichiers = shImpl(`git diff-tree --no-commit-id --name-only -r ${commit}`, { cwd: root }).trim().split("\n").filter(Boolean); }
  catch { return { mesurable: false, pourquoi: `le commit ${commit} est illisible — « aucune dette » et « je n'ai pas pu regarder » s'écrivent tous les deux zéro (L5)` }; }
  if (!fichiers.includes(charte)) return { mesurable: true, concerne: false, pourquoi: `ce commit ne touche pas ${charte} : il n'y a rien à répercuter` };
  const avant = lire(`${commit}~1`), apres = lire(commit);
  if (avant === null || apres === null) return { mesurable: false, pourquoi: `impossible de lire ${charte} avant et après ${commit} — sans les deux états, aucune variation n'est calculable` };
  const n = compter(apres), p = compter(avant);
  const touche = fichiers.filter((f) => f.startsWith(DOSSIER_REFERENTIEL));
  return {
    mesurable: true, concerne: true,
    obligationsAvant: p, obligationsApres: n, variation: n - p,
    referentielTouche: touche,
    // UNE CHARTE RETOUCHÉE SANS QU'UNE OBLIGATION BOUGE N'A RIEN À RÉPERCUTER : reformuler une
    // phrase, corriger une faute, déplacer un paragraphe ne change aucune règle. Accuser là ferait
    // crier le contrôle sur le travail d'entretien, donc le ferait taire pour de bon (L4).
    dette: n !== p && touche.length === 0,
    pourquoi: n === p
      ? "le nombre d'obligations n'a pas bougé : la charte a été retouchée sans qu'aucune règle apparaisse ou disparaisse, il n'y a rien à répercuter"
      : touche.length
        ? `${Math.abs(n - p)} obligation(s) ${n > p ? "ajoutée(s)" : "retirée(s)"}, et ${touche.length} document(s) du référentiel ont bougé dans le même commit — répercussion faite`
        : `${Math.abs(n - p)} obligation(s) ${n > p ? "ajoutée(s)" : "retirée(s)"} dans la charte, et AUCUN document du référentiel touché. L'Article 13 exige la répercussion « le jour même » : une règle changée d'un côté seulement s'applique en silence pendant des semaines.`,
  };
}

export function formatRepercussionLines(r) {
  if (!r?.mesurable) return ["", `🚨 RÉPERCUSSION — PAS MESURÉE : ${r?.pourquoi ?? "raison non fournie"}`];
  if (!r.concerne) return [];
  if (!r.dette) return ["", `📘 RÉPERCUSSION — ✅ ${r.pourquoi}`];
  return ["", "📘 RÉPERCUSSION — 🟠 DETTE", `   ${r.pourquoi}`,
    "   Ce trou était le SEUL du process « modifier un document de référence » à n'avoir aucun porteur :",
    "   la charte l'exigeait, et rien ne vérifiait qu'on l'avait fait (leçon L1, sur la règle qui gouverne la charte)."];
}

export const CHARTE = "CLAUDE.md";
// NOMS DE DOCUMENTS VOLONTAIREMENT GÉNÉRIQUES (« charte- », jamais « claude-md- »). La première
// version de cet outil s'appelait d'après un modèle d'IA précis ; l'utilisateur l'a refusée en deux
// mots — « pas exportable ». Il avait raison et la remarque vaut au-delà du nom de l'outil : un
// outil qui ne peut servir que sur ce dépôt-ci a raté la moitié de sa mission (SAFE-EXPORT,
// Article 27). Seul `TABLE_REGLES_PATH` garde son nom historique, parce qu'il existait avant et que
// le renommer casserait des renvois pour un gain nul.
// La mention que tout document RÉÉCRIT EN ENTIER doit porter (cf. regimeDEcriture, lib-shell).
export const MENTION_REGIME_AUTO = "<!-- RÉGIME: AUTO — ce fichier est régénéré en entier, toute note écrite à la main y sera perdue au passage suivant -->";
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

// ————————————————————————————————————————————————————————————————————————
// LE RAPPEL TOURNANT — re-présenter les obligations graves EN COURS de session
// (2026-09-28, tâche #695, volet C des « failles des IA »)
// ————————————————————————————————————————————————————————————————————————
//
// LA DÉRIVE D'ATTENTION EST MESURÉE, PAS UNE IMPRESSION : courbe en U, décrochage au-delà de 10 à
// 15 tours, et les 18 modèles de pointe testés se dégradent tous. Le symptôme décrit est mot pour
// mot celui de ce projet : « les règles sont toujours là, l'attention est ailleurs ».
//
// D'OÙ LA CONSÉQUENCE QUI SURPREND : ALLÉGER LA CHARTE NE SUFFIT PAS. Un document plus court est
// toujours lu au tour 1 et toujours oublié au tour 40 — le problème n'est pas sa taille, c'est que
// rien ne le REPRÉSENTE en cours de route. La seule réponse est un rappel qui revient.
//
// POURQUOI ICI, ET PAS DANS UN OUTIL NEUF : MOÏSE est déjà l'agent du seul périmètre de la charte,
// il lit déjà CLAUDE.md article par article, et il tourne déjà à CHAQUE commit via le crochet. Le
// canal existe ; il n'y avait qu'à s'en servir (Article 31 : étendre plutôt qu'agir à côté).
//
// ET LE RAPPEL N'EST PAS UNE ALERTE — c'est la distinction qui décide de sa forme. Lui donner ⚠️
// pour qu'il passe le filtre du crochet serait crier au loup à chaque commit, donc le condamner à
// devenir du décor (L4, L6). Il porte son propre marqueur 📜, celui que la charte emploie déjà pour
// la traçabilité (Article 16), et le filtre le laisse passer comme une catégorie DISTINCTE : ce qui
// exige une action, et ce qui doit être re-présenté.
//
// LA LISTE NE SE RECOPIE PAS (Article 24) : elle se LIT dans le « Protocole d'application » de
// l'Article 20, qui est l'endroit où la charte déclare elle-même l'ordre dans lequel ses règles
// s'appliquent. Un tableau tenu à la main ici se périmerait au premier Article ajouté.
export const MOTIF_PROTOCOLE = /\*\*Protocole d'application\*\*[\s\S]*?(?=\n\*\*Article|\n## )/;

export function obligationsLesPlusGraves(texteCharte = "") {
  const bloc = String(texteCharte).match(MOTIF_PROTOCOLE)?.[0];
  if (!bloc) return { mesurable: false, pourquoi: "le « Protocole d'application » de l'Article 20 est introuvable dans la charte — la liste se LIT là, elle ne se recopie pas ici (Article 24), donc sans lui il n'y a rien à rappeler plutôt qu'une liste inventée" };
  // Chaque « Article N (…) » du protocole, dans l'ordre où la charte les enchaîne. Le libellé entre
  // parenthèses est la QUESTION que l'Article pose — c'est elle qu'on rappelle, jamais le numéro nu,
  // qui n'apprend rien à quelqu'un qui a justement cessé d'y penser.
  const obligations = [];
  const vus = new Set();
  for (const m of bloc.matchAll(/Articles?\s+([0-9]+(?:\s*(?:et|,)\s*[0-9]+)*)\s*\(([^)]{10,400})\)/g)) {
    const cle = `${m[1]}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    obligations.push({ articles: m[1].replace(/\s+/g, " ").trim(), question: m[2].replace(/\s+/g, " ").trim() });
  }
  if (!obligations.length) return { mesurable: false, pourquoi: "le protocole a été trouvé mais aucune obligation n'a pu en être lue — un format qui a changé, jamais une charte sans obligations" };
  return { mesurable: true, obligations };
}

// rappelTournant() — UNE obligation par passage, jamais la liste entière. Rappeler douze règles
// d'un coup est exactement ce qui ne marche pas : c'est la charte au tour 1, une seconde fois.
// Le rang tourne sur le NOMBRE DE COMMITS, donc il avance tout seul et ne dépend d'aucune mémoire
// d'agent (Article 27).
export function rappelTournant(etat, compteurDeCommits) {
  if (!etat?.mesurable) return { ligne: null, pourquoi: etat?.pourquoi };
  const n = etat.obligations.length;
  const o = etat.obligations[((Number(compteurDeCommits) || 0) % n + n) % n];
  return {
    ligne: `📜 RAPPEL DE CHARTE (${((Number(compteurDeCommits) || 0) % n) + 1}/${n}) — Article ${o.articles} : ${o.question}`,
    obligation: o,
  };
}

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
  return A.citationsDeLUnite(articleNumber, "Article", otherFilesText).citations;
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

// Le découpage des mots significatifs et la comparaison de Jaccard vivaient ici en double :
// Abraham les porte pour tous ses clients (`motsSignificatifs`, `findPairesRedondantes`). La
// spécialisation « Article » est ré-exportée plus bas ; le corps a déménagé avec ses raisons.

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

// TOUT CE QUI SUIT EST DÉLÉGUÉ À ABRAHAM-LES-REFERENCES (2026-09-23, tâche #619).
//
// POURQUOI CE FICHIER NE CONTIENT PLUS CES FONCTIONS : elles ne dépendaient d'aucune particularité
// de la charte. Les garder ici faisait de l'agent d'UN document le propriétaire d'un savoir-faire
// qui vaut pour TOUS — exactement l'erreur de découpage que l'utilisateur a nommée : « c'est
// charter-spy qui aurait dû être étoffé, et moïse qui peut l'appeler et compléter avec ses propres
// fonctions utiles à claude.md spécifiquement ».
//
// LES COMMENTAIRES ONT VOYAGÉ AVEC LE CODE, pas le récit du déménagement (leçon L20, payée ce
// matin même) : l'histoire du porteur en trois états, du seuil dérivé, de la ligne rouge sur la
// pertinence vit désormais dans `scripts/abraham-les-references.mjs`, là où le code vit.
//
// CE QUE MOÏSE GARDE EN PROPRE, et c'est tout ce qui suit dans ce fichier : le motif de titre des
// Articles, l'exception de l'Article 0, les seuils calibrés sur CETTE charte, ses trois chemins de
// documents, ses deux garde-fous de fraîcheur, et son process. Rien d'autre.

// Ré-exports SPÉCIALISÉS : même nom qu'avant pour que rien ne casse chez les appelants, mais le
// corps vit chez Abraham. Les tests n'ont pas changé d'une assertion — c'est la preuve que c'était
// un déplacement et pas une réécriture.
export const NATURES = A.NATURES;
export const GESTES = A.GESTES;
export const RESULTATS = A.RESULTATS;
export const SIGNAUX_DE_PERTINENCE = A.SIGNAUX_DE_PERTINENCE;
export const seuilRendementFaible = A.seuilRendementFaible;
export const porteursDeclares = A.porteursDeclares;
export const empreinteDeRaison = A.empreinteDeRaison;

export const fichiersDuDepot = ({ root = ROOT } = {}) => A.fichiersDuDepot({ racine: root, exclure: new Set([CHARTE]) });

// Articles que l'utilisateur a placés hors périmètre, nommément et définitivement. Ce n'est PAS
// une liste figée au sens de l'Article 24 (rien à synchroniser avec un autre système) : c'est une
// décision humaine écrite, et l'Article 24 dispense explicitement le contenu curaté à la main dont
// la nature manuelle est déclarée à côté. Elle l'est, ici même.
export const ARTICLES_HORS_PERIMETRE = new Set([0]);

// L'ADAPTATEUR, ET IL TIENT EN UNE LIGNE DE PLUS QUE LA DÉLÉGATION : Abraham parle de `numero`
// parce qu'il ne sait pas ce qu'il compte ; cette charte parle d'`article`. On traduit ici, une
// seule fois, plutôt que d'imposer le vocabulaire de la charte à tous ses futurs clients.
const enArticle = (m) => ({ ...m, article: m.numero });

export function mesurerArticles(claudeMdText, fichiers = {}) {
  return A.mesurerUnites({
    texte: claudeMdText,
    motifUnite: ARTICLE_HEADING_PATTERN,
    motifBorneSuperieure: TOP_HEADING_PATTERN,
    champs: (m) => ({ numero: Number(m[1]), titre: m[2].trim() }),
    prefixeCitation: "Article",
    fichiers,
    estimerTokens: estimateTokens,
  }).map((m) => ({ ...enArticle(m), sensibilite: classifyRuleSensitivity({ article: m.numero, texte: m.texte }) }));
}

export const natureProposee = (mesure) => A.natureProposee({ ...mesure, numero: mesure.article ?? mesure.numero }, { horsPerimetre: ARTICLES_HORS_PERIMETRE });
// Même traduction que pour la mémoire : Abraham dit « règles », la charte dit « Articles ». Le
// libellé rendu à l'appelant reste celui du document qu'il lit, jamais celui de l'outil générique.
export const mesurerSections = (texte) => A.mesurerSections(texte, { motifUnite: /\*\*Article \d+ — /, estimerTokens: estimateTokens })
  .map((s) => ({ ...s, articles: s.unites, nature: s.nature.replace("contient des règles", "contient des Articles") }));
export const naturesDejaDecidees = (texte) => A.naturesDejaDecidees(texte);
export const verifierDocumentDAccueil = (chemin, sujets = [], { root = ROOT } = {}) => A.verifierDocumentDAccueil(chemin, sujets, { racine: root });
export const analyserPertinence = (mesures = []) => {
  const r = A.analyserPertinence(mesures.map((m) => ({ ...m, numero: m.article ?? m.numero })), { horsPerimetre: ARTICLES_HORS_PERIMETRE });
  return { ...r, questions: r.questions.map((q) => ({ ...q, article: q.numero })) };
};
export const findRecouvrementsNonDeclares = (mesures = [], opts = {}) =>
  A.findRecouvrementsNonDeclares(mesures.map((m) => ({ ...m, numero: m.article ?? m.numero })), { prefixe: "Article", ...opts });
export const findRedundantRulePairs = (rules, opts = {}) =>
  A.findPairesRedondantes(rules.map((r) => ({ ...r, numero: r.article ?? r.numero })), opts);
// Même traduction qu'ailleurs, et elle est sans risque : la lecture d'une opération se fait par
// POSITION de colonne, jamais par son intitulé — changer l'en-tête n'a donc aucun effet sur le
// parseur, seulement sur ce que lit un humain.
export const enteteOperations = () => A.enteteOperations("Mémoire des opérations sur la charte (CLAUDE.md)").replace("| Date | Règle |", "| Date | Article |");
export const lireOperations = ({ root = ROOT } = {}) => A.lireOperations(lire(OPERATIONS_PATH, root));
// L'ADAPTATEUR TRADUIT LE VOCABULAIRE DANS LES DEUX SENS. Abraham dit « règle » parce qu'il ne
// sait pas ce qu'il compte ; cette charte dit « Article ». Une mémoire lue du disque porte donc
// `regle`, une mémoire fournie par un appelant de Moïse peut porter `article` — les deux sont
// légitimes, et c'est ici, au point de contact, que la traduction se fait. La faire chez Abraham
// lui imposerait le vocabulaire d'un seul de ses clients.
export const commentOnAFaitLaDerniereFois = (article, { root = ROOT, operations = null } = {}) => {
  const memoire = operations ?? A.lireOperations(lire(OPERATIONS_PATH, root));
  const normalisee = memoire?.mesurable
    ? { ...memoire, operations: memoire.operations.map((o) => ({ ...o, regle: o.regle ?? o.article })) }
    : memoire;
  const r = A.commentOnAFaitLaDerniereFois(article, normalisee);
  return r.connu ? { ...r, operations: r.operations.map((o) => ({ ...o, article: o.regle })) } : r;
};

export function enregistrerOperation(op, { root = ROOT, ecrire = writeFileSync } = {}) {
  const ligne = A.ligneOperation({ ...op, regle: op.regle ?? op.article });
  const existant = lire(OPERATIONS_PATH, root) ?? enteteOperations();
  ecrire(join(root, OPERATIONS_PATH), `${existant.replace(/\n+$/, "")}\n${ligne}\n`, "utf8");
  recordRegistryWrite(OPERATIONS_PATH, { par: "moise-tables-de-loi" });
  return ligne;
}

// ============================================================================================
// L'IMPOSSIBILITÉ DÉCLARÉE — ce que l'Article 27 EXIGE, et que rien ne vérifiait (2026-09-25, #658)
// ============================================================================================
// L'ARTICLE 27 EST FORMEL, et c'est lui qui rend cette mesure obligatoire : « Quand un mécanisme est
// impossible [...] l'écrire noir sur blanc EST la protection — et cette impossibilité se déclare,
// elle ne se tait pas. » Une règle sans porteur n'est donc pas fautive en soi : elle l'est quand
// elle se TAIT là-dessus. Un lecteur qui tombe sur une règle sans mécanisme ne peut pas savoir si
// personne n'y a pensé ou si personne ne le peut — et les deux appellent des gestes opposés.
//
// LA TÂCHE #658 DISAIT « les deux Articles rouges sont le 7 et le 23 ». La mesure dit autre chose,
// et c'est pour ça qu'on mesure : l'Article 7 porte une nature DÉCIDÉE par l'utilisateur et sort du
// compte, tandis que TREIZE Articles sans porteur ne déclarent aucune impossibilité. Le constat de
// départ n'était pas faux quand il a été écrit ; il a vieilli, et personne ne le relançait.
//
// CE QU'ELLE NE FAIT PAS : elle ne dit jamais qu'un Article DEVRAIT avoir un mécanisme. Certains ne
// peuvent pas en avoir, et c'est précisément la raison d'être de la déclaration. Elle ne juge que
// le SILENCE.
export const MOTIF_IMPOSSIBILITE_DECLAREE = /aucun m[ée]canisme|aucune m[ée]canique|ne se mesure pas|impossib|(?:la|le) d[ée]clarer EST la protection|hors de toute m[ée]canique|ne se lit pas m[ée]caniquement|seule protection possible|refuse d'[êe]tre au vert/i;

export function findImpossibilitesNonDeclarees(articles = []) {
  if (!articles.length) {
    return { mesurable: false, pourquoi: "aucun Article mesuré — rendre « zéro silence » sur un document non lu dirait exactement ce que dirait une charte parfaitement déclarée" };
  }
  const sansPorteur = articles.filter((a) => /SANS PORTEUR/i.test(String(a.nature ?? "")));
  const declarent = [], silencieux = [];
  for (const a of sansPorteur) {
    (MOTIF_IMPOSSIBILITE_DECLAREE.test(String(a.texte ?? "")) ? declarent : silencieux)
      .push({ numero: a.article ?? a.numero, titre: a.titre });
  }
  return { mesurable: true, total: articles.length, sansPorteur: sansPorteur.length,
    declarent: declarent.sort((x, y) => x.numero - y.numero),
    silencieux: silencieux.sort((x, y) => x.numero - y.numero) };
}

export function formatImpossibilitesLines(r) {
  if (!r?.mesurable) return [`⚠️ NON MESURÉ — ${r?.pourquoi ?? "raison inconnue"}`];
  const L = [`${r.sansPorteur} Article(s) sans porteur mécanique, sur ${r.total}.`];
  L.push(`   ${r.declarent.length} DÉCLARENT leur impossibilité — c'est exactement ce que l'Article 27 demande, et ça suffit : ${r.declarent.map((a) => `Art.${a.numero}`).join(" · ") || "aucun"}`);
  if (!r.silencieux.length) { L.push("   ✅ Aucun Article sans porteur ne reste silencieux."); return L; }
  L.push("");
  L.push(`🔴 ${r.silencieux.length} Article(s) SANS PORTEUR ET SANS UN MOT sur cette absence :`);
  for (const a of r.silencieux) L.push(`   Art.${String(a.numero).padStart(2)} — ${a.titre}`);
  L.push("");
  L.push("CE QUE ÇA COÛTE : un lecteur qui tombe sur une règle sans mécanisme ne peut pas savoir si");
  L.push("personne n'y a pensé ou si personne ne le peut. Les deux appellent des gestes opposés —");
  L.push("construire le garde-fou manquant, ou écrire pourquoi il ne peut pas exister.");
  L.push("HORS PORTÉE : cet outil ne dit JAMAIS qu'un Article devrait avoir un mécanisme. Certains ne");
  L.push("peuvent pas en avoir, et c'est justement pour ça que la déclaration existe. Il juge le silence.");
  return L;
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
    // Jamais un zéro déguisé en mesure : sans compteur fourni, on le DIT.
    obligations: mesurerObligations ? mesurerObligations(charte) : { mesurable: false, pourquoi: "compteur d'obligations non fourni par l'appelant (ecotoken)", instructions: "?", disponible: "?", verdict: "pas mesuré" },
    articles: lignes,
    sections: mesurerSections(charte),
    redondances: findRedundantRulePairs(mesures),
    impossibilites: findImpossibilitesNonDeclarees(lignes),
  };
}


// LE RENDU DE LA CARTOGRAPHIE reste ici, et c'est délibéré : c'est le seul endroit du système qui
// parle « Articles », « charte » et « CLAUDE.md » à un lecteur humain. Abraham ne doit jamais
// apprendre le vocabulaire d'un de ses clients — sinon il cesse d'être générique au premier
// document servi.
export function renderCartographie(carto, { date = new Date().toISOString().slice(0, 10) } = {}) {
  if (!carto.mesurable) return `# Cartographie de la charte (CLAUDE.md)\n\nPAS MESURÉ — ${carto.pourquoi}.\n`;
  const out = [
    "# Cartographie de la charte (CLAUDE.md)",
    "",
    `*(Généré le ${date} par \`node scripts/moise-tables-de-loi.mjs cartographie\`. Document de TRAVAIL de l'agent, jamais destiné à l'utilisateur — sa vision à lui est la synthèse stratégique, \`node scripts/moise-tables-de-loi.mjs synthese\`. Régénérable à volonté : les natures marquées « décidé » sont relues et reprises telles quelles, jamais écrasées.)*`,
    "",
    "**FRONTIÈRE AVEC `docs/referentiel/claude-md-regles.md`, ÉCRITE ICI PLUTÔT QUE SUPPOSÉE** *(2026-09-26, tâche #978)* : les deux documents parcourent CLAUDE.md Article par Article, et aucun des deux ne citait l'autre — deux inventaires du même document qui divergent en silence sont le risque que l'Article 24 nomme. **Celui-ci dit ce qu'il FAUT FAIRE de chaque Article** (sa nature, et le geste qu'elle commande : intouchable, réductible, remplaçable). **L'autre dit ce que chaque Article EST** (sensibilité, importance, nombre de références croisées, nombre de lignes). On lit celui-ci avant de décider d'un allègement, l'autre pour savoir à quoi on touche. Les deux sont générés par le même outil et se régénèrent ensemble.",
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
// PARTIE 4 — les deux garde-fous de fraîcheur, gratuits, à chaque commit qui touche CLAUDE.md.
// ---------------------------------------------------------------------------------------------

// LE DÉFAUT QU'IL FERME, et il est constaté, pas craint : la table de classification servant à
// décider quoi alléger datait de trois jours et s'arrêtait à l'Article 23, six Articles derrière la
// réalité. Un instrument périmé ne se signale pas tout seul — il rend des chiffres, et ils ont
// l'air justes.
// DEUX SONDES COMPARAIENT LA CHARTE À UNE TABLE DE LA MÊME FAÇON (2026-09-28, tâche #997, signalé
// par CLONE-HUNTER) : la table des règles et la cartographie. Ce qui était recopié n'est pas une
// boucle, c'est une DÉFINITION — « un article présent dans un document généré, c'est un nombre en
// première cellule d'une ligne de table ». Une définition écrite deux fois se met à dire deux choses
// le jour où la forme des tables bouge, et les deux sondes rendraient alors des verdicts opposés
// sur le même dépôt sans que rien ne le signale.
export function articlesAttendusEtPresents(charte, documentGenere) {
  const attendus = extractRuleUnits(charte).map((u) => u.article);
  const presents = new Set();
  for (const ligne of String(documentGenere ?? "").split("\n")) {
    const m = ligne.match(/^\|\s*(\d+)\s*\|/);
    if (m) presents.add(Number(m[1]));
  }
  return { attendus, presents };
}

export function findArticlesAbsentsDeLaTable({ root = ROOT, cheminTable = TABLE_REGLES_PATH } = {}) {
  const charte = lire(CHARTE, root);
  const table = lire(cheminTable, root);
  if (charte == null) return { mesurable: false, pourquoi: `${CHARTE} introuvable` };
  if (table == null) return { mesurable: false, pourquoi: `${cheminTable} n'existe pas — rien à comparer, et ce silence ne dit pas que tout va bien` };
  const { attendus, presents } = articlesAttendusEtPresents(charte, table);
  const absents = attendus.filter((a) => !presents.has(a));
  return { mesurable: true, attendus: attendus.length, presents: presents.size, absents };
}

export function cartographiePerimee({ root = ROOT } = {}) {
  const charte = lire(CHARTE, root);
  const carto = lire(CARTOGRAPHIE_PATH, root);
  if (charte == null) return { mesurable: false, pourquoi: `${CHARTE} introuvable` };
  if (carto == null) return { mesurable: true, perimee: true, pourquoi: "la cartographie n'a jamais été générée" };
  const { attendus, presents } = articlesAttendusEtPresents(charte, carto);
  const manquants = attendus.filter((a) => !presents.has(a));
  const enTrop = [...presents].filter((a) => !attendus.includes(a));
  if (manquants.length || enTrop.length) {
    return { mesurable: true, perimee: true, manquants, enTrop, pourquoi: `${manquants.length} Article(s) absent(s) de la cartographie, ${enTrop.length} en trop` };
  }
  return { mesurable: true, perimee: false, pourquoi: `les ${attendus.length} Articles de la charte sont dans la cartographie` };
}

// Le verrou « document d'accueil » vit chez Abraham avec sa preuve de besoin : il vaut pour
// n'importe quel document qui reçoit un renvoi, pas seulement pour la charte.

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
  const pertinence = analyserPertinence(carto.articles);
  const recouvrements = findRecouvrementsNonDeclares(carto.articles);

  return {
    mesurable: true,
    etat: { lignes: carto.lignesCharte, tokens: carto.tokens, obligations: carto.obligations },
    parNature,
    sections: carto.sections ?? [],
    inventaires,
    couverture: { tokensArticles, tokensDocument: carto.tokens, part: carto.tokens ? Math.round((tokensArticles / carto.tokens) * 100) : 0 },
    pertinence,
    recouvrements,
    fantomes,
    sansPorteur,
    aTrancher,
    redondances: carto.redondances,
    impossibilites: carto.impossibilites,
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
  // L'IMPOSSIBILITÉ DÉCLARÉE arrive AVANT le détail par nature (#658) : « sans porteur » est un
  // constat, « sans porteur et sans un mot » est un défaut, et les enterrer ensemble sous la même
  // rubrique laisse le second invisible — exactement le sort qu'il a connu pendant treize Articles.
  if (d.impossibilites) { for (const l of formatImpossibilitesLines(d.impossibilites)) L.push(l); L.push(""); }
  L.push("--- Par nature, avec le geste que chacune commande ---");
  for (const n of Object.values(NATURES)) {
    const g = d.parNature[n.cle];
    if (!g) { L.push(`· ${n.cle} : aucun Article`); continue; }
    L.push(`· ${n.cle} — ${g.articles.length} Article(s), ${g.lignes} lignes, ~${g.tokens} tokens`);
    L.push(`    Articles : ${g.articles.join(", ")}`);
    L.push(`    Geste : ${n.geste}`);
  }
  L.push("");
  // LA CARTE DES OBLIGATIONS, dans le diagnostic plutôt que dans une commande à part : c'est elle
  // qui dit OÙ FRAPPER, et une mesure qu'il faut penser à demander n'est demandée qu'une fois.
  const carteObl = obligationsParArticle();
  if (carteObl.mesurable) {
    L.push("--- Où vivent les obligations (la cible se juge en obligations, jamais en tokens) ---");
    L.push(`${carteObl.total} au total : ${carteObl.dansLesArticles} dans les Articles, ${carteObl.horsArticles} dans des sections que le découpage par Article ne voit pas.`);
    L.push(`Les 5 plus gros gisements : ${carteObl.articles.slice(0, 5).map((a) => `Art.${a.numero} (${a.obligations})`).join(" · ")}`);
    L.push("");
  }
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
  L.push("--- PERTINENCE : les Articles qui OUVRENT UNE QUESTION (jamais un verdict) ---");
  L.push("Aucun de ces signaux ne conclut. Chacun pose une question dont la réponse appartient à");
  L.push("l'utilisateur, et à lui seul — l'outil n'a aucun vocabulaire pour dire « à retirer ».");
  if (!d.pertinence?.questions.length) L.push("Aucun Article ne déclenche de signal de pertinence.");
  else {
    L.push(`Seuil de rendement DÉRIVÉ de la charte elle-même : ${d.pertinence.seuilRendement.toFixed(2)} citation(s) par ligne.`);
    for (const q of d.pertinence.questions) {
      L.push(`· Art.${q.article} — ${q.titre.replace(/\n/g, " ").slice(0, 55)} [${q.etat}, ${q.signaux.length} signal/aux]`);
      for (const sg of q.signaux) L.push(`    ${sg.question}\n      constat : ${sg.constat}`);
    }
  }
  L.push("");
  L.push("--- LOGIQUE : deux Articles qui se recouvrent SANS déclarer leur frontière ---");
  if (!d.recouvrements?.length) L.push("Aucun : chaque paire au vocabulaire proche déclare explicitement sa frontière.");
  else for (const r of d.recouvrements) L.push(`· Article ${r.a} ↔ Article ${r.b} — ${(r.jaccard * 100).toFixed(0)}% de vocabulaire commun, ${r.motsPartages} mots partagés, et AUCUN des deux ne dit lequel prime`);
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

// LA CARTE DES OBLIGATIONS, Article par Article puis section par section (2026-09-23, tâche #628).
//
// POURQUOI ELLE EST ICI PLUTÔT QUE DANS UN SCRIPT JETABLE : je l'ai écrite trois fois en ligne de
// commande pendant une seule analyse, et à chaque fois elle m'a dit où frapper — les deux plus gros
// gisements de la charte ne sont PAS ceux qu'on devine (l'Article 16 à lui seul en porte 17, et
// 56 obligations vivent hors de tout Article, dans des sections que personne n'avait mesurées).
// Une mesure qui change la décision et qui disparaît avec la commande qui l'a produite est une
// perte sèche : l'utilisateur l'a dit en une phrase — « pense bien à injecter toute la donnée
// intéressante dans tes analyses dans moïse et abraham, pour que tes exploits soient rentabilisés
// encore une prochaine fois ».
//
// Elle rend les DEUX vues, jamais une seule : le total par Article ne dit rien des 56 obligations
// qui vivent ailleurs, et un allègement qui ne regarde que les Articles passe à côté de 29 % du
// problème en ayant l'air complet (même piège que la couverture déclarée, cf. `mesurerSections`).
export function obligationsParArticle({ root = ROOT } = {}) {
  const texte = lire(CHARTE, root);
  if (!texte) return { mesurable: false, pourquoi: `${CHARTE} illisible — rien n'a été mesuré` };
  const articles = [];
  const positions = [...texte.matchAll(/\*\*Article (\d+(?:bis)?) — ([^*]+?)\.\*\*/g)];
  const finDesArticles = texte.indexOf("## Règles de travail");
  for (let i = 0; i < positions.length; i++) {
    const debut = positions[i].index;
    const fin = i + 1 < positions.length ? positions[i + 1].index : (finDesArticles > 0 ? finDesArticles : texte.length);
    const bloc = texte.slice(debut, fin);
    articles.push({ numero: positions[i][1], titre: positions[i][2].trim(), obligations: A.compterObligations(bloc), lignes: bloc.split("\n").length });
  }
  articles.sort((a, b) => b.obligations - a.obligations);
  const dansLesArticles = articles.reduce((n, a) => n + a.obligations, 0);
  const total = A.compterObligations(texte);
  return {
    mesurable: true, articles, dansLesArticles, total,
    horsArticles: total - dansLesArticles,
    // Jamais un verdict : c'est une carte pour décider où frapper, et la décision reste humaine.
    pourquoi: `${total} obligations au total, dont ${dansLesArticles} dans les Articles et ${total - dansLesArticles} dans des sections — la cible se juge en obligations, jamais en tokens`,
  };
}

// --- LA CHARTE SE PROTÈGE ELLE-MÊME (2026-09-23, tâche #631) ------------------------------------
//
// LA QUESTION DE L'UTILISATEUR, ET ELLE TOMBAIT JUSTE : « un article dans la charte devrait
// protéger la charte elle-même tu penses pas ? ». La réponse honnête était : ça existe à MOITIÉ.
// L'Article 13 porte déjà le garde-fou en toutes lettres — « un allègement de CLAUDE.md ne doit
// JAMAIS entamer la qualité ou les fonctionnalités du projet [...] en cas de doute, NE PAS
// couper » — et le préambule interdit de renuméroter un Article. **Aucun des deux n'avait le
// moindre mécanisme.** La charte ordonnait sa propre protection et rien ne la vérifiait, pendant
// qu'on l'allégeait activement : la seule chose entre une règle perdue et le dépôt était la
// vigilance d'un agent, c'est-à-dire exactement ce que l'Article 27 dit de ne jamais supposer.
//
// CE QUE CETTE FONCTION EST, ET CE QU'ELLE N'EST PAS : elle compare un AVANT à un APRÈS et ouvre
// des questions. Elle ne bloque rien (même posture que god-of-all-process) et ne juge jamais
// qu'une coupe est bonne — aucun programme ne sait lire le sens d'une règle. Elle vérifie ce qui
// est VÉRIFIABLE, et déclare le reste hors de sa portée plutôt que de le passer sous silence.
//
// LES CINQ CONTRÔLES, chacun né d'un risque réel de cette campagne :
//   1. un Article DISPARU — son numéro est cité dans ~169 fichiers, le perdre les casse tous ;
//   2. un Article RENUMÉROTÉ — le préambule l'interdit, et rien ne le vérifiait ;
//   3. un Article VIDÉ de plus de la moitié de ses obligations — une QUESTION, jamais un verdict :
//      c'est parfois exactement le geste voulu (l'Article 19 en a perdu 60 % à dessein) ;
//   4. un CHEMIN devenu inatteignable — délégué à Abraham, qui sait distinguer « perdu » de
//      « atteignable en un saut » ;
//   5. l'opération NON ENREGISTRÉE dans la mémoire — le quoi survit dans git, le POURQUOI non.
// ===========================================================================================
// LE DIAGNOSTIC COMPLET DE LA CHARTE  (2026-09-24, demande explicite de l'utilisateur)
// ===========================================================================================
//
// SA DEMANDE : « pour la charte je veux plus de contrôles au moment de son scan que simplement son
// poids [...] un diagnostic complet à chaque ronde, pour que tu puisses le lire [...] une fois que
// tu as lu ce rapport tu es capable d'analyser si une révision de CLAUDE.md est envisageable,
// nécessaire, importante ou critique ».
//
// CE QUI EXISTAIT, ET POURQUOI C'ÉTAIT INSUFFISANT : la Ronde n'appelait qu'UN contrôle sur la
// charte — son poids en tokens. Or le poids est le moins informatif des signaux : une charte légère
// peut avoir une règle vitale sans protection, un Article que rien ne cite, deux règles qui se
// contredisent. Tout cela était déjà mesurable par les outils ; rien ne l'appelait au bon moment.
//
// RIEN N'EST RECALCULÉ ICI : chaque signal vient de la fonction qui le détient déjà (Article 24 —
// un registre se LIT, il ne se recopie pas). Cette fonction ne fait qu'ASSEMBLER et CONCLURE.
//
// LES QUATRE NIVEAUX SONT LES SIENS, mot pour mot. Un cinquième, « aucune », a été ajouté pour une
// raison que toute cette nuit a illustrée : sans lui, une charte en parfait état sortirait quand
// même « révision envisageable », ce qui est un signal faux dans l'autre sens. Une échelle dont le
// plancher n'est jamais atteint ne mesure rien.
export const NIVEAUX_REVISION = [
  { cle: "critique", rang: 4, icone: "🔴", quoi: "à traiter avant tout autre chantier" },
  { cle: "importante", rang: 3, icone: "🟠", quoi: "à programmer dans les jours qui viennent" },
  { cle: "nécessaire", rang: 2, icone: "🟡", quoi: "à faire, sans urgence particulière" },
  { cle: "envisageable", rang: 1, icone: "🟢", quoi: "rien ne l'oblige — à faire si l'occasion se présente" },
  { cle: "aucune", rang: 0, icone: "⚪", quoi: "rien ne l'appelle aujourd'hui" },
];

// CHAQUE SIGNAL DÉCLARE LE NIVEAU QU'IL APPELLE, et le verdict final est le PLUS HAUT des niveaux
// atteints. Jamais une moyenne : une seule règle vitale sans protection ne se compense pas par
// trente Articles en bon état.
export const SIGNAUX_DE_REVISION = [
  { cle: "regle-vitale-sans-porteur", niveau: "critique",
    pourquoi: "une règle que le texte déclare vitale, et que rien dans le dépôt ne fait respecter : elle ne tiendra pas à la prochaine session" },
  { cle: "chemin-mort", niveau: "critique",
    pourquoi: "la charte renvoie vers un document qui n'existe plus : la règle pointe dans le vide, et personne ne s'en apercevra en la lisant" },
  { cle: "recouvrement-non-declare", niveau: "importante",
    pourquoi: "deux règles se chevauchent sans qu'on ait dit laquelle prime : au premier conflit réel, c'est l'humeur du moment qui tranchera" },
  { cle: "saturation-obligations", niveau: "importante",
    pourquoi: "le nombre d'obligations dépasse ce qu'un modèle suit de façon fiable : au-delà, ce ne sont plus les règles qui décident, c'est l'attention disponible" },
  { cle: "cartographie-perimee", niveau: "nécessaire",
    pourquoi: "la table qui décrit la charte ne correspond plus à la charte : qui lit la table lit un document qui n'existe pas" },
  { cle: "article-jamais-cite", niveau: "envisageable",
    pourquoi: "un Article que rien ne cite nulle part : peut-être inutile, peut-être simplement jamais appliqué — ça se regarde, ça ne se tranche pas seul" },
  { cle: "poids-eleve", niveau: "envisageable",
    pourquoi: "le document coûte cher à recharger — le moins grave des signaux, et c'était pourtant le seul mesuré jusqu'ici" },
];

// Le seuil d'obligations. Il n'est pas choisi : la littérature publique ET la mesure propre à ce
// projet s'accordent sur 150 à 200 instructions suivies de façon fiable par un modèle de pointe.
// C'est le chiffre déjà retenu par l'allègement de la charte, lu ici plutôt que recopié.
export const SEUIL_OBLIGATIONS = 200;

export function verdictDeRevision(signauxTrouves = [], catalogue = SIGNAUX_DE_REVISION) {
  const connus = new Map(catalogue.map((s) => [s.cle, s]));
  const retenus = signauxTrouves.map((c) => connus.get(c)).filter(Boolean);
  const rangs = new Map(NIVEAUX_REVISION.map((n) => [n.cle, n.rang]));
  const haut = retenus.reduce((max, s) => Math.max(max, rangs.get(s.niveau) ?? 0), 0);
  const niveau = NIVEAUX_REVISION.find((n) => n.rang === haut) ?? NIVEAUX_REVISION.at(-1);
  return { niveau: niveau.cle, icone: niveau.icone, quoi: niveau.quoi, signaux: retenus,
    pourquoi: retenus.length
      ? `le plus haut des ${retenus.length} signal(aux) trouvé(s) — jamais une moyenne : une règle vitale sans protection ne se compense pas par trente Articles en bon état`
      : "aucun des sept signaux ne s'est déclenché" };
}

// LE DIAGNOSTIC LUI-MÊME. Il prend des MESURES DÉJÀ FAITES plutôt que de les refaire, et il rend
// `mesurable: false` quand il n'a rien pu lire — la distinction qui a coûté huit corrections dans
// la nuit du 2026-09-24 : un contrôle qui n'a pas pu regarder ne doit jamais ressembler à un
// ============================================================================================
// LA FRAÎCHEUR DES FAITS (2026-09-27, tâche #1022)
// ============================================================================================
// DEMANDE EXPLICITE DE L'UTILISATEUR : « moise ou abraham doivent garantir la fraicheur de
// claude.md ». MOÏSE a été choisi en fenêtre dédiée parce qu'il est déjà l'agent du seul périmètre
// de la charte, qu'il tourne déjà à chaque commit qui la touche, et qu'il en refuse déjà les
// déformations de STRUCTURE. Lui ajouter la fraîcheur des FAITS complète un poste existant.
//
// LE COÛT MESURÉ, et il est ce qui rend cette fonction nécessaire : le 2026-09-27, HUIT affirmations
// chiffrées de la charte étaient fausses, et la moitié se contredisaient À L'INTÉRIEUR du même
// fichier — « les six tournent automatiquement » quarante lignes avant un texte qui dit qu'ils sont
// sept, « les fiches des 22 outils » juste sous un tableau qui en compte trente-neuf.
//
// LE PRINCIPE, ET C'EST LUI QU'IL A RETENU : un nombre énoncé dans la charte se DÉRIVE du dépôt,
// ou bien un garde-fou refuse l'écart. Corriger les huit chiffres n'aurait rien réglé — ils
// auraient repéri à la prochaine arrivée d'outil, ce que ce dépôt a vu arriver QUATRE fois dans la
// seule journée du 2026-09-27 (Article 24, leçon L37).
//
// CE QUI EST CURATÉ À LA MAIN ICI, ET POURQUOI C'EST LÉGITIME (Article 24, exception écrite) : la
// LISTE des sondes. Aucune mécanique ne peut deviner qu'une phrase parle du nombre de scripts. En
// revanche chaque sonde CALCULE sa vérité depuis le dépôt réel — aucun chiffre attendu n'est
// recopié, donc aucune sonde ne peut se périmer en silence. Seule son absence est possible, et une
// sonde manquante ne ment jamais : elle ne dit simplement rien.
export const SONDES_DE_FRAICHEUR = [
  {
    cle: "scripts",
    quoi: "le nombre de scripts de l'Agence",
    motif: /(?:~|environ\s+)?(\d+)\s+scripts\b/gi,
    reel: ({ lister }) => lister("scripts").filter((f) => f.endsWith(".mjs")).length,
  },
  {
    cle: "fiches-referentiel",
    quoi: "le nombre de fiches du référentiel",
    motif: /(\d+)\s+(?:fiches?|documents?)\s+(?:de\s+)?référentiel/gi,
    reel: ({ lister }) => lister("docs/referentiel").filter((f) => f.endsWith(".md")).length,
  },
  {
    cle: "outils-inventaire",
    quoi: "le nombre d'outils de l'inventaire documentaire",
    // LE MOTIF EST RESSERRÉ, et il l'a été au premier passage réel : « (\\d+) outils » attrapait
    // « 8 outils protégés de cette façon », une phrase qui ne parle pas du tout de l'inventaire.
    // Un garde-fou qui accuse à tort cesse d'être lu (L4). Ne comptent que les formulations qui
    // prétendent VRAIMENT dénombrer l'inventaire.
    motif: /(?:fiches? des|inventaire de[s]?|catalogue de[s]?)\s+(\d+)\s+outils\b/gi,
    reel: ({ charte }) => (String(charte).match(/^\|\s+[A-Za-zÀ-ÿ].*\|\s+`docs\/[^`]+`\s+\|/gm) ?? []).length,
  },
];

// UN ÉCART SE MESURE, IL NE SE DEVINE PAS : sans lecteur de dépôt, la fonction rend PAS MESURÉ
// plutôt qu'une liste vide, qui se lirait comme « tous les chiffres sont justes » (leçons L5/L11).
export function findFaitsPerimes(charte = "", { lister = null, sondes = SONDES_DE_FRAICHEUR, tolerance = 0 } = {}) {
  if (typeof lister !== "function") {
    return { mesurable: false, pourquoi: "aucun lecteur de dépôt fourni — sans lui on ne peut comparer aucun chiffre au réel, ce qui n'est jamais la même chose qu'une charte à jour" };
  }
  const ecarts = [];
  let sondesActives = 0;
  for (const sonde of sondes) {
    let reel;
    try { reel = sonde.reel({ lister, charte }); } catch { continue; }
    if (!Number.isFinite(reel)) continue;
    sondesActives++;
    for (const m of String(charte).matchAll(sonde.motif)) {
      const annonce = Number(m[1]);
      if (!Number.isFinite(annonce)) continue;
      if (Math.abs(annonce - reel) <= tolerance) continue;
      ecarts.push({
        cle: sonde.cle, quoi: sonde.quoi, annonce, reel, extrait: m[0],
        pourquoi: `la charte annonce ${annonce}, le dépôt en porte ${reel} — un chiffre recopié se périme à la prochaine arrivée, c'est pourquoi la bonne correction est de le RETIRER plutôt que de l'ajuster (Article 24)`,
      });
    }
  }
  return { mesurable: true, sondesActives, ecarts };
}

export function formatFraicheurLines(r) {
  if (!r?.mesurable) return [`PAS MESURÉ — ${r?.pourquoi ?? "aucune donnée"}`];
  if (!r.ecarts.length) return [`✅ Fraîcheur des faits : aucun écart sur ${r.sondesActives} sonde(s) — chaque chiffre annoncé correspond au dépôt réel.`];
  const L = [`⚠️  ${r.ecarts.length} chiffre(s) de la charte ne correspondent plus au dépôt :`];
  for (const e of r.ecarts) L.push(`   · ${e.quoi} — « ${e.extrait.trim()} » alors que le dépôt en porte ${e.reel}. ${e.pourquoi}`);
  L.push("", "   La bonne correction est presque toujours de RETIRER le chiffre, jamais de le mettre à jour :",
    "   un nombre recopié dans un document re-périra, et ce dépôt en a vu quatre punir une arrivée",
    "   dans la seule journée du 2026-09-27.");
  return L;
}

// contrôle qui n'a rien trouvé.
export function diagnosticCharte({ classement = null, obligations = null, jamaisCites = [],
  recouvrements = [], cheminsMorts = [], cartoPerimee = false, tokens = null,
  seuilObligations = SEUIL_OBLIGATIONS, seuilTokens = 25000 } = {}) {
  // LA CONDITION SE LIT SUR LE NOMBRE DE RÈGLES RÉELLEMENT CLASSÉES, jamais sur la présence d'un
  // champ (corrigé au premier vrai passage, 2026-09-24). Mon premier jet testait `classement.mesurable`,
  // un champ que `classerDocument()` ne rend pas — il refusait donc TOUJOURS, pour la mauvaise
  // raison. Écrit dans l'autre sens (`!== false`), il aurait rendu un verdict « aucune révision »
  // sur zéro règle lue : le faux vert parfait. Ce qui compte est qu'il y ait des règles classées.
  const reglesClassees = classement?.lignes ?? [];
  if (!reglesClassees.length) {
    return { mesurable: false, verdict: null,
      pourquoi: "aucune règle n'a pu être classée : sans classification, aucun verdict de révision n'a de sens, et en rendre un quand même serait exactement le faux vert que ce projet traque" };
  }
  const faits = [];
  const vitalesSansPorteur = reglesClassees.filter((u) => String(u.verdict ?? "").startsWith("🔴"));
  if (vitalesSansPorteur.length) faits.push({ cle: "regle-vitale-sans-porteur", combien: vitalesSansPorteur.length,
    lesquels: vitalesSansPorteur.map((u) => u.numero) });
  if (cheminsMorts.length) faits.push({ cle: "chemin-mort", combien: cheminsMorts.length, lesquels: cheminsMorts });
  if (recouvrements.length) faits.push({ cle: "recouvrement-non-declare", combien: recouvrements.length });
  if (Number.isFinite(obligations) && obligations > seuilObligations) faits.push({ cle: "saturation-obligations", combien: obligations });
  if (cartoPerimee) faits.push({ cle: "cartographie-perimee", combien: 1 });
  if (jamaisCites.length) faits.push({ cle: "article-jamais-cite", combien: jamaisCites.length, lesquels: jamaisCites });
  if (Number.isFinite(tokens) && tokens > seuilTokens) faits.push({ cle: "poids-eleve", combien: tokens });
  const verdict = verdictDeRevision(faits.map((f) => f.cle));
  return { mesurable: true, faits, verdict,
    horsPortee: "ce diagnostic dit si la charte APPELLE une révision, jamais ce qu'il faudrait y changer : ça se lit, et ça se tranche avec l'utilisateur (Article 16)." };
}

export function formatDiagnosticCharte(d) {
  if (!d?.mesurable) return [`Diagnostic charte : NON MESURÉ — ${d?.pourquoi ?? "raison inconnue"}`];
  const L = [`${d.verdict.icone} RÉVISION DE LA CHARTE : ${d.verdict.niveau.toUpperCase()} — ${d.verdict.quoi}`, ""];
  if (!d.faits.length) { L.push("Aucun des sept signaux ne s'est déclenché. La charte n'appelle aucune révision aujourd'hui."); return L; }
  L.push(`${d.faits.length} signal(aux) sur 7 :`);
  for (const f of d.faits) {
    const s = SIGNAUX_DE_REVISION.find((x) => x.cle === f.cle);
    L.push(`  ${NIVEAUX_REVISION.find((n) => n.cle === s.niveau)?.icone ?? "·"} ${f.cle} (${f.combien})${f.lesquels ? ` — ${f.lesquels.slice(0, 8).join(", ")}` : ""}`);
    L.push(`      ${s.pourquoi}`);
  }
  L.push("", `Verdict : ${d.verdict.pourquoi}.`);
  return L;
}

export function protegerLaCharte(avant = "", apres = "", { lire: lireFichier = null, operations = null } = {}) {
  if (!avant || !apres) return { mesurable: false, pourquoi: "il faut les deux versions pour comparer — sans l'avant, rien n'a été vérifié, ce qui n'est jamais la même chose que rien trouvé" };
  const lireArticles = (txt) => new Map([...txt.matchAll(/\*\*Article (\d+(?:bis)?) — ([^*]+?)\.\*\*/g)]
    .map((m, i, tous) => {
      const fin = i + 1 < tous.length ? tous[i + 1].index : txt.length;
      const corps = txt.slice(m.index, fin);
      return [m[1], { titre: m[2].trim(), obligations: A.compterObligations(corps), tokens: estimateTokens(corps) }];
    }));
  const av = lireArticles(avant), ap = lireArticles(apres);
  const alertes = [];

  for (const [num, a] of av) {
    if (!ap.has(num)) { alertes.push({ gravite: "BLOQUANT", quoi: `Article ${num} (« ${a.titre} ») a DISPARU`, pourquoi: "son numéro est cité tel quel dans tout le dépôt — le retirer casse chaque renvoi, et le préambule l'interdit" }); continue; }
    const n = ap.get(num);
    if (n.titre !== a.titre) alertes.push({ gravite: "QUESTION", quoi: `Article ${num} a changé de titre`, pourquoi: `« ${a.titre} » → « ${n.titre} » — voulu, ou le numéro a-t-il glissé sur un autre contenu ?` });
    if (a.obligations >= 4 && n.obligations < a.obligations / 2) alertes.push({ gravite: "QUESTION", quoi: `Article ${num} perd ${a.obligations - n.obligations} de ses ${a.obligations} obligations`, pourquoi: "parfois exactement le geste voulu, parfois une règle partie sans qu'on le veuille — à relire avant de valider" });
  }
  // Un numéro NOUVEAU au milieu de la suite est un signe de renumérotation, jamais un ajout : un
  // Article neuf rejoint toujours la fin de la liste (règle du préambule).
  const maxAvant = Math.max(0, ...[...av.keys()].map((k) => parseInt(k, 10)));
  for (const num of ap.keys()) if (!av.has(num) && parseInt(num, 10) < maxAvant) alertes.push({ gravite: "BLOQUANT", quoi: `Article ${num} apparaît AU MILIEU de la numérotation`, pourquoi: "un nouvel Article rejoint toujours la fin de la liste — inséré au milieu, il a renuméroté ses voisins et cassé leurs renvois" });

  // LA VEILLE PRÉVENTIVE D'ÉCRITURE (2026-09-25, tâche #828 — constat DEEP-READER 5, TaskList #231).
  //
  // SA DEMANDE, DU 2026-09-21 (intervention #514) : « charter spy veille à ce que lorsqu'une regle
  // est redigée dans claude.md, elle est toujours redigée de maniere optimisée pour la conso de
  // token (smart conso plugged) ». Ce qui existait n'en était que la moitié : ecotoken et MOÏSE
  // mesurent le poids APRÈS COUP, et ont servi la campagne d'allègement. La veille au MOMENT où la
  // règle s'écrit n'avait jamais été construite — et c'est la seule qui évite le travail de
  // découpage plus tard.
  //
  // LE SEUIL EST DÉRIVÉ DE LA CHARTE ELLE-MÊME, jamais choisi. « 800 tokens, c'est trop » ne veut
  // rien dire dans l'absolu ; « deux fois la médiane des Articles existants » se recalcule tout
  // seul à chaque passage et vieillit avec le document (Article 24, même patron que le seuil de
  // rentabilité déjà dérivé ailleurs dans ce fichier).
  //
  // ELLE NE BLOQUE JAMAIS, et c'est le garde-fou non négociable de l'Article 13 : « un allègement
  // de CLAUDE.md ne doit JAMAIS entamer la qualité ou les fonctionnalités du projet », et « en cas
  // de doute, NE PAS couper ». Un Article long peut être exactement le bon Article. La question est
  // POSÉE — jamais un verdict, jamais un refus de commit : sinon l'outil pousserait à écrire court
  // plutôt qu'à écrire juste, c'est-à-dire l'inverse exact de ce que la charte protège.
  const medianeTokens = (() => {
    const t = [...av.values()].map((a) => a.tokens).filter((n) => Number.isFinite(n) && n > 0).sort((x, y) => x - y);
    return t.length >= 3 ? t[Math.floor(t.length / 2)] : null;
  })();
  for (const [num, n] of ap) {
    if (av.has(num)) continue;
    if (medianeTokens === null) {
      alertes.push({ gravite: "QUESTION", quoi: `Article ${num} est nouveau, et son économie de rédaction n'est PAS MESURÉE`, pourquoi: "moins de 3 Articles préexistants : aucune médiane ne tient sur si peu, et un seuil inventé vaudrait moins que pas de seuil du tout" });
      continue;
    }
    if (n.tokens > medianeTokens * 2) {
      alertes.push({
        gravite: "QUESTION",
        quoi: `Article ${num} (« ${n.titre} ») pèse ${n.tokens} tokens, soit ${(n.tokens / medianeTokens).toFixed(1)}× la médiane des Articles existants (${medianeTokens})`,
        pourquoi: "il l'avait demandé : une règle neuve se rédige d'emblée économiquement, plutôt que d'être allégée six semaines plus tard. Ce n'est PAS un reproche — un Article long peut être exactement le bon : relire une fois en se demandant si le récit du POURQUOI pourrait vivre dans le référentiel (progressive disclosure), et garder tel quel si la réponse est non. JAMAIS couper une obligation pour faire du chiffre (Article 13).",
      });
    }
  }

  const chemins = A.cheminsPerdus(avant, apres, { lire: lireFichier });
  for (const c of chemins.filter((x) => x.etat === "PERDU")) alertes.push({ gravite: "BLOQUANT", quoi: `${c.chemin} n'est plus atteignable`, pourquoi: "aucun document encore cité par la charte ne le mentionne — un renvoi qui ne mène nulle part est pire qu'une absence" });

  const memoire = operations ?? A.lireOperations(lire(OPERATIONS_PATH));
  const nbAvant = memoire?.mesurable ? memoire.operations.length : 0;
  if (A.compterObligations(avant) !== A.compterObligations(apres) && !nbAvant) alertes.push({ gravite: "QUESTION", quoi: "la charte a changé et la mémoire des opérations est vide", pourquoi: "git garde le QUOI, jamais le POURQUOI — sans cette ligne, la raison du changement est perdue dès demain" });

  return {
    mesurable: true,
    alertes,
    bloquants: alertes.filter((a) => a.gravite === "BLOQUANT").length,
    questions: alertes.filter((a) => a.gravite === "QUESTION").length,
    cheminsRattrapes: chemins.filter((x) => x.etat === "atteignable en un saut").map((x) => x.chemin),
    // LA LIMITE, DÉCLARÉE PLUTÔT QUE TUE (Article 27) : rien ici ne dit qu'une coupe est BONNE.
    // Qu'une règle retirée soit vraiment devenue inutile ne se lit pas mécaniquement — ça se lit,
    // et ça se valide avec l'utilisateur.
    horsPortee: "aucun programme ne peut juger qu'une règle retirée était devenue inutile — ce contrôle protège la STRUCTURE, jamais le sens",
  };
}

// --- LE RAPPORT DE CAMPAGNE (2026-09-23, tâche #638) ------------------------------------------
//
// DEMANDE EXPLICITE DE L'UTILISATEUR : « ce type de rapport doit exister concrètement chez Moïse :
// résultats obtenus en token, en nombre, analyse détaillée des résultats ». Il avait déjà posé la
// règle des DEUX indicateurs plus tôt le même jour — « les 2 indicateurs doivent toujours
// apparaître (process) » — et un rapport que seul l'agent sait produire meurt avec la session.
//
// CE QU'IL LIT, ET C'EST TOUT L'INTÉRÊT : il ne stocke aucun chiffre. Il relit git pour l'état
// d'AVANT et le disque pour l'état d'APRÈS, puis croise avec la mémoire des opérations qui dit ce
// qui a été fait et POURQUOI. Un rapport qui recopierait ses propres chiffres se périmerait au
// commit suivant, ce qui est exactement ce que l'Article 24 interdit.
//
// LES DEUX INDICATEURS NE SONT PAS INTERCHANGEABLES, et le rapport le dit à chaque passage : les
// TOKENS mesurent ce que le document coûte, les OBLIGATIONS mesurent ce qu'il sature. Couper trois
// mille tokens de récit ne libère aucune attention ; retirer dix ordres redondants, si. Un rapport
// qui n'afficherait que le premier laisserait croire à un progrès qui n'a pas eu lieu.
export function rapportDeCampagne({ depuis = null, root = ROOT, shImpl = sh } = {}) {
  const apres = lire(CHARTE, root);
  if (!apres) return { mesurable: false, pourquoi: `${CHARTE} illisible — rien n'a été mesuré` };
  // La borne se DÉRIVE : le premier commit où la mémoire des opérations enregistre un geste, sinon
  // celle qu'on donne. Recopier une date de départ en dur l'aurait périmée à la campagne suivante.
  let ref = depuis;
  if (!ref) {
    try { ref = shImpl(`git log --format=%h --reverse -- ${OPERATIONS_PATH}`).trim().split("\n")[0] + "~1"; }
    catch { return { mesurable: false, pourquoi: "impossible de dériver la borne de départ depuis git — rien n'a été comparé" }; }
  }
  let avant = "";
  try { avant = shImpl(`git show ${ref}:${CHARTE}`); }
  catch (e) { return { mesurable: false, pourquoi: `impossible de lire ${CHARTE} à ${ref} : ${e.message.split("\n")[0]}` }; }

  const mesure = (txt) => ({ lignes: txt.split("\n").length, tokens: estimateTokens(txt), obligations: A.compterObligations(txt) });
  const av = mesure(avant), ap = mesure(apres);
  const delta = (k) => ({ avant: av[k], apres: ap[k], gain: av[k] - ap[k], pct: av[k] ? Math.round(((av[k] - ap[k]) / av[k]) * 1000) / 10 : 0 });

  // Le détail par Article : ce qui a fondu, ce qui n'a pas bougé, ce qui a grossi — les trois sont
  // dits, parce qu'un Article qui GROSSIT pendant une campagne d'allègement est l'information la
  // plus utile du rapport et la plus facile à ne pas voir.
  // LA BORNE DU DERNIER ARTICLE EST EXPLICITE, et l'oublier fait MENTIR le rapport : sans elle, le
  // dernier Article avale toutes les sections qui le suivent et s'affiche à 40 obligations au lieu
  // de 7. Trouvé au premier passage réel de ce rapport, sur ses propres chiffres — un rapport faux
  // est pire qu'un rapport absent, puisqu'on le croit (Article 25).
  const parArticle = (txt) => {
    const finDesArticles = txt.indexOf("## Règles de travail");
    const borne = finDesArticles > 0 ? finDesArticles : txt.length;
    return new Map([...txt.matchAll(/\*\*Article (\d+(?:bis)?) — ([^*]+?)\.\*\*/g)]
      .map((m, i, tous) => [m[1], A.compterObligations(txt.slice(m.index, i + 1 < tous.length ? tous[i + 1].index : borne))]));
  };
  const oAv = parArticle(avant), oAp = parArticle(apres);
  const mouvements = [];
  for (const [n, o] of oAv) {
    const apresO = oAp.get(n);
    if (apresO === undefined) { mouvements.push({ article: n, avant: o, apres: null, sens: "DISPARU" }); continue; }
    if (apresO !== o) mouvements.push({ article: n, avant: o, apres: apresO, gain: o - apresO, sens: apresO < o ? "allégé" : "GROSSI" });
  }
  mouvements.sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0));

  const memoire = A.lireOperations(lire(OPERATIONS_PATH, root));
  const gestes = memoire?.mesurable ? memoire.operations : [];
  return {
    mesurable: true, ref,
    lignes: delta("lignes"), tokens: delta("tokens"), obligations: delta("obligations"),
    mouvements,
    intouches: [...oAv.keys()].filter((n) => oAp.get(n) === oAv.get(n)).length,
    gestes: gestes.length,
    annules: gestes.filter((g) => /annul/i.test(g.resultat ?? "")).length,
    // JAMAIS UN VERDICT DE RÉUSSITE : le rapport compte, il ne juge pas si c'était assez.
    horsPortee: "ce rapport compte ce qui a bougé ; il ne dit jamais si la charte est devenue MEILLEURE — ça se lit, et ça se tranche avec l'utilisateur",
  };
}

export function renderRapportDeCampagne(r) {
  if (!r.mesurable) return [`PAS MESURÉ — ${r.pourquoi}.`];
  const L = [`=== RAPPORT DE CAMPAGNE SUR LA CHARTE — depuis ${r.ref} ===`, ""];
  L.push("LES DEUX INDICATEURS, jamais l'un sans l'autre :");
  L.push(`  Lignes      : ${r.lignes.avant} → ${r.lignes.apres}   (${r.lignes.gain >= 0 ? "-" : "+"}${Math.abs(r.lignes.gain)}, ${r.lignes.pct} %)`);
  L.push(`  TOKENS      : ${r.tokens.avant} → ${r.tokens.apres}   (${r.tokens.gain >= 0 ? "-" : "+"}${Math.abs(r.tokens.gain)}, ${r.tokens.pct} %)   ← ce que le document COÛTE`);
  L.push(`  OBLIGATIONS : ${r.obligations.avant} → ${r.obligations.apres}   (${r.obligations.gain >= 0 ? "-" : "+"}${Math.abs(r.obligations.gain)}, ${r.obligations.pct} %)   ← ce qu'il SATURE`);
  L.push("");
  L.push("Les deux ne sont pas interchangeables : couper du récit fait tomber les tokens sans libérer");
  L.push("la moindre attention. Un gain en tokens sans gain en obligations n'est pas un progrès.");
  L.push("");
  L.push(`--- Détail par Article : ${r.mouvements.length} ont bougé, ${r.intouches} sont restés identiques ---`);
  for (const m of r.mouvements) {
    if (m.sens === "DISPARU") { L.push(`  ⛔ Art.${m.article} A DISPARU (${m.avant} obligations perdues)`); continue; }
    L.push(`  ${m.sens === "GROSSI" ? "⚠️ " : "  "}Art.${m.article} : ${m.avant} → ${m.apres} obligation(s) — ${m.sens}`);
  }
  L.push("");
  L.push(`--- Mémoire des opérations : ${r.gestes} geste(s) enregistré(s), dont ${r.annules} annulé(s) ---`);
  L.push(`(chacun porte sa raison et son résultat — git garde le QUOI, cette mémoire garde le POURQUOI)`);
  L.push("");
  L.push(`HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

export const ETAPES_ANALYSE = [
  { cle: "memoire", libelle: "relire la mémoire des opérations — qu'a-t-on déjà tenté sur ces Articles, et qu'est-ce qui n'a pas tenu ?", preuve: OPERATIONS_PATH },
  { cle: "fraicheur", libelle: "vérifier que l'instrument n'est pas périmé avant de mesurer avec lui", preuve: null },
  { cle: "cartographie", libelle: "régénérer la cartographie (poids, citations, porteur mécanique, nature)", preuve: CARTOGRAPHIE_PATH },
  { cle: "table-regles", libelle: "régénérer la table de classification (sensibilité, importance, redondances)", preuve: TABLE_REGLES_PATH },
  { cle: "accueil", libelle: "vérifier chaque document d'accueil avant de proposer le moindre renvoi", preuve: null },
  { cle: "pertinence", libelle: "passer les signaux de PERTINENCE et de LOGIQUE — et porter chacun à l'utilisateur comme une QUESTION, jamais comme un constat à appliquer (« sur ce type de choix, toujours me consulter »)", preuve: null },
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

async function corpsPrincipal() {
  const [, , commande = "rapport", ...args] = process.argv;
  // L'outil en APPELLE un autre plutôt que de recopier sa mesure (demande explicite de
  // l'utilisateur : « cet agent outil appelle les autres outils dont il a besoin »). Import
  // dynamique, pour la raison écrite en tête de fichier.
  const { budgetInstructions } = await import("./ecotoken.mjs");
  printReportHeader({ tool: "moise-tables-de-loi", title: "MOÏSE-TABLES-DE-LOI — le périmètre de la charte, et lui seul", scriptPath: "scripts/moise-tables-de-loi.mjs" });
  printReliabilityNotice("moise-tables-de-loi");
  recordCliUsage("moise-tables-de-loi");

  // LA FRAÎCHEUR DES FAITS (2026-09-27, tâche #1022) tourne à CHAQUE passage, jamais sur une
  // sous-commande qu'il faudrait penser à taper : une garantie qu'on doit demander n'en est pas
  // une (Article 27). Elle est gratuite — trois lectures de dossier.
  {
    const { readdirSync } = await import("node:fs");
    const lister = (d) => { try { return readdirSync(join(ROOT, d)); } catch { return []; } };
    // MÊME CORRECTION QUE SES DEUX VOISINS (2026-09-27, tâche #1034) : MOÏSE est l'agent de la
    // charte, donc sans charte il n'a rien à dire — mais « rien à dire » se dit, il ne se plante pas.
    const docLoi = lireLeDocumentGouvernant("CLAUDE.md", { root: ROOT });
    if (!docLoi.trouve) {
      for (const l of ligneDocumentAbsent(docLoi, { outil: "MOÏSE-TABLES-DE-LOI", aQuoiCaSert: "tout son périmètre est la charte : sans elle il n'a littéralement rien à inspecter" })) console.log(l);
      return;
    }
    const fraicheur = findFaitsPerimes(docLoi.texte, { lister });
    for (const l of formatFraicheurLines(fraicheur)) console.log(l);
    console.log("");
    // LE DÉPÔT AU REGISTRE PARTAGÉ (2026-09-27, organisation tranchée par l'utilisateur) : Abraham
    // est le point d'entrée de l'assainissement à grande échelle, et c'est par ce registre qu'il
    // « veille » même quand on ne l'appelle pas. MOÏSE n'y dépose que ce qu'il a mesuré sur SON
    // périmètre — la charte — et jamais un mot du filet ni d'un autre document.
    try {
      const { deposerAlertes } = await import("./abraham-les-references.mjs");
      const ecarts = (fraicheur?.perimes ?? []).map((f) => ({
        cle: `fait-perime:${f.cle ?? f.annonce ?? ""}`.slice(0, 80), objet: "CLAUDE.md", gravite: "à surveiller",
        constat: `la charte annonce « ${f.annonce} » là où le dépôt en compte ${f.reel} — un chiffre recopié re-périra, il se retire plutôt qu'il ne s'ajuste`,
      }));
      deposerAlertes("moise-tables-de-loi", ecarts);
    } catch (err) {
      console.log(`⚠️  Alertes NON déposées au registre partagé : ${err?.message ?? err}. Abraham ne les verra pas.\n`);
    }
  }

  if (commande === "cartographie") {
    const carto = buildCartographie({ mesurerObligations: budgetInstructions });
    // LE RÉGIME D'ÉCRITURE EST ÉMIS PAR LE GÉNÉRATEUR, jamais posé à la main dans le fichier
    // (2026-09-28, tâche #711) : un fichier réécrit EN ENTIER effacerait une mention qu'on y aurait
    // écrite, donc la seule place où elle survit est ici, dans ce qui l'écrit. Sans elle, quelqu'un
    // peut ajouter une note de bonne foi et la perdre au passage suivant — sans erreur, sans
    // message, sans trace.
    const texte = `${MENTION_REGIME_AUTO}\n${renderCartographie(carto)}`;
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
      "**FRONTIÈRE AVEC `docs/referentiel/charte-cartographie.md`** *(2026-09-26, tâche #978)* : cette table dit ce que chaque Article EST (sensibilité, importance, références croisées, lignes) ; la cartographie dit ce qu'il FAUT EN FAIRE (sa nature, et le geste qu'elle commande). Aucun des deux ne citait l'autre, et deux inventaires du même document qui divergent en silence sont exactement le risque de l'Article 24.",
      "",
      `*(Régénéré le ${new Date().toISOString().slice(0, 10)} par \`node scripts/moise-tables-de-loi.mjs table\`. Fichier de référence UNIQUE tenu à jour — jamais un dossier+index séparé (calibrage explicite du 2026-09-20). À régénérer AVANT toute décision d'allègement : la version précédente datait du 2026-09-20 et s'arrêtait à l'Article 23, six Articles derrière la réalité, et un instrument périmé ne rend pas une erreur — il rend des chiffres qui ont l'air justes.)*`,
      "",
    ].join("\n");
    writeFileSync(join(ROOT, TABLE_REGLES_PATH), `${MENTION_REGIME_AUTO}\n${entete}${renderClaudeMdRuleTable(table)}\n`, "utf8");
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
    imprimerPlanDaction(plan);
    return;
  }

  // « protection » — la charte relue contre son état d'AVANT, automatiquement à chaque commit qui
  // la touche. Sans argument elle compare au commit précédent : c'est le cas qui sert vraiment,
  // et un contrôle qu'il faut penser à paramétrer n'est lancé qu'une fois (leçon L2).
  if (commande === "rapport") {
    const r = rapportDeCampagne({ depuis: process.argv[3] || null });
    console.log("");
    for (const l of renderRapportDeCampagne(r)) console.log(l);
    return;
  }

  if (commande === "protection") {
    const ref = process.argv[3] || "HEAD~1";
    let avant = "";
    // UN CATCH MUET EST UN FAUX VERT (leçon L5) : sans cette ligne, une erreur de lecture se serait
    // présentée comme « pas d'avant à comparer », et le contrôle aurait eu l'air d'avoir tourné.
    try { avant = sh(`git show ${ref}:${CHARTE}`); }
    catch (e) { console.log(`\nPAS MESURÉ — impossible de lire ${CHARTE} à la révision ${ref} : ${e.message.split("\n")[0]}`); return; }
    const r = protegerLaCharte(avant, lire(CHARTE), { lire: (f) => lire(f) });
    if (!r.mesurable) { console.log(`\nPAS MESURÉ — ${r.pourquoi}.`); return; }
    console.log(`\n=== LA CHARTE RELUE CONTRE ${ref} — ${r.bloquants} bloquant(s), ${r.questions} question(s) ===\n`);
    if (!r.alertes.length) console.log("Rien à signaler : aucun Article disparu, renuméroté ou vidé, aucun chemin devenu inatteignable.");
    for (const a of r.alertes) console.log(`[${a.gravite}] ${a.quoi}\n   → ${a.pourquoi}`);
    if (r.cheminsRattrapes.length) console.log(`\nℹ️  ${r.cheminsRattrapes.length} chemin(s) sortis de la charte mais rattrapés en un saut — c'est le BUT du renvoi : ${r.cheminsRattrapes.join(", ")}`);
    console.log(`\nHORS PORTÉE : ${r.horsPortee}`);
    return;
  }

  if (commande === "pertinence") {
    const carto = buildCartographie({ mesurerObligations: budgetInstructions });
    if (!carto.mesurable) { console.log(`\nPAS MESURÉ — ${carto.pourquoi}.`); return; }
    const p = analyserPertinence(carto.articles);
    const r = findRecouvrementsNonDeclares(carto.articles);
    console.log(`\n=== PERTINENCE — ${p.questions.length} Article(s) ouvrent une question ===\n`);
    console.log("RIEN ICI N'EST UN VERDICT. Chaque ligne ouvre une question dont la réponse appartient");
    console.log("à l'utilisateur (calibrage explicite : « sur ce type de choix, toujours me consulter »).\n");
    for (const q of p.questions) {
      console.log(`Art.${q.article} — ${q.titre.replace(/\n/g, " ").slice(0, 60)} [${q.etat}]`);
      for (const sg of q.signaux) console.log(`   ${sg.question}\n     constat : ${sg.constat}`);
    }
    console.log(`\n=== LOGIQUE — recouvrements non déclarés : ${r.length} ===`);
    for (const x of r) console.log(`· Article ${x.a} ↔ ${x.b} — ${(x.jaccard * 100).toFixed(0)}% de vocabulaire commun sans frontière écrite`);
    if (!r.length) console.log("Aucun : chaque paire proche déclare sa frontière.");
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
  imprimerPlanDaction(plan);
}

// imprimerLeRappelTournant() — appelé APRÈS le corps, quelle que soit la sous-commande. Le premier
// jet le mettait à la fin du corps, et il ne sortait JAMAIS : la sous-commande par défaut rend la
// main avant d'y arriver. C'est très exactement la leçon L2 — un mécanisme qui ne sort pas du
// script est une intention — et elle a été payée ici en dix minutes, sur le volet qui l'invoque.
export function imprimerLeRappelTournant({ log = console.log, root = ROOT, shImpl = sh } = {}) {
  let charte = "";
  try { charte = readFileSync(join(root, CHARTE), "utf8"); } catch { /* il se tait plutôt que d'inventer */ }
  const etat = obligationsLesPlusGraves(charte);
  let commits = 0;
  try { commits = Number(shImpl("git rev-list --count HEAD", { cwd: root }).trim()); } catch { commits = 0; }
  const r = rappelTournant(etat, Number.isFinite(commits) ? commits : 0);
  // Il s'imprime MÊME QUAND TOUT EST VERT, et c'est le coeur du volet C : c'est très exactement
  // quand tout est vert depuis quarante tours que l'attention est ailleurs.
  if (r.ligne) log(`\n${r.ligne}`);
  else if (r.pourquoi) log(`\n⚪ PAS MESURÉ — le rappel de charte n'a pas pu être produit : ${r.pourquoi}.`);
  return r;
}

async function main() {
  await corpsPrincipal();
  imprimerLeRappelTournant();
}

if (import.meta.url === `file://${process.argv[1]}`) main();
