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
import { printReliabilityNotice, decouperEnUnites, sh } from "./lib-shell.mjs";
import * as A from "./abraham-les-references.mjs";
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
export function protegerLaCharte(avant = "", apres = "", { lire: lireFichier = null, operations = null } = {}) {
  if (!avant || !apres) return { mesurable: false, pourquoi: "il faut les deux versions pour comparer — sans l'avant, rien n'a été vérifié, ce qui n'est jamais la même chose que rien trouvé" };
  const lireArticles = (txt) => new Map([...txt.matchAll(/\*\*Article (\d+(?:bis)?) — ([^*]+?)\.\*\*/g)]
    .map((m, i, tous) => {
      const fin = i + 1 < tous.length ? tous[i + 1].index : txt.length;
      return [m[1], { titre: m[2].trim(), obligations: A.compterObligations(txt.slice(m.index, fin)) }];
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
  console.log(`\n=== ${PLAN_ACTION_TITRE} ===`);
  for (const l of plan.lignes) console.log(l);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
