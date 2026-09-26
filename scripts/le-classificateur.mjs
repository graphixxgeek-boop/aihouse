// LE-CLASSIFICATEUR — le rangement de l'outillage, et lui seul.
//
// NOM PROVISOIRE, validé comme tel par l'utilisateur le 2026-09-26 : descriptif, jamais un nom
// propre, à remplacer par le sien (fournée de renommage, tâche #200).
//
// POURQUOI IL EXISTE, ET CE N'EST PAS UNE QUESTION DE TAILLE. CASSANDRA-RH portait deux métiers qui
// ne posent pas la même question : « qui va bien dans l'équipe ? » (effectif, badges, stagnation,
// KPI) et « qu'est-ce que c'est ? » (types, rangs, familles, classes, indice). Le premier juge des
// gens, le second range des choses. Le fichier avait atteint 4 300 lignes, le plus gros du dépôt,
// et l'utilisateur a préféré scinder plutôt que construire un 80e outil — décision du 2026-09-26,
// après avoir pesé la création de LE-GRAND-ARCHITECTE, qui n'existait que sur le papier.
//
// LA RÈGLE DE DÉPENDANCE, NON NÉGOCIABLE : ce fichier n'importe JAMAIS cassandra-rh.mjs. Le sens
// est unique — CASSANDRA lit le classement, le classement ne lit jamais les ressources humaines.
// Sans cette règle, les deux se rappelleraient l'un l'autre et la scission n'aurait rien séparé.
//
// COMPATIBILITÉ : cassandra-rh.mjs RÉEXPORTE tout ce qui a bougé, de sorte qu'aucun appelant
// existant n'a eu à changer une ligne. Ce n'est pas une facilité, c'est ce qui permet de déplacer
// du code sans mêler un déménagement à une modification — deux changements dans un seul commit
// sont impossibles à relire quand quelque chose casse.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { AGENT_CATEGORIES, rangDeLaCategorie, familleDeLaCategorie, printReliabilityNotice } from "./lib-shell.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage, recordRegistryWrite } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// ══════════════════════════════════════════════════════════════════════════
// ZONE A — le TYPE d'un fichier, et le recensement
// ══════════════════════════════════════════════════════════════════════════

export const MOTIF_PORTE_CLI = /import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`/;

export const TYPES_DE_SCRIPT = {
  crochet: "s'exécute automatiquement à un moment de git, jamais appelé à la main",
  "filet-de-securite": "la suite de tests elle-même — ce que le crochet lance et qui peut refuser un commit",
  // LE MOT « OUTIL » EST LIBÉRÉ (2026-09-26, sa demande : « on parle désormais de la classification
  // de l'outillage au sens large, un outil = un fichier = un script, trouve moi une autre
  // distinction pour ce qui définit actuellement outil »). Il désignait un TYPE précis tout en
  // servant, partout ailleurs, de mot générique pour n'importe quel fichier de l'Agence — la dette
  // de vocabulaire exacte que l'Article 20bis nomme. Les deux types renommés disent désormais ce
  // qu'ils SONT plutôt que ce qu'ils valent : une commande, documentée ou non.
  // NOMS PROVISOIRES, déclarés comme tels : il nomme, jamais moi (fournée #200).
  "commande-documentee": "une porte d'entrée réelle (ligne de commande, package.json, crochet ou commande écrite) ET au moins un document qui la nomme",
  "commande-sans-fiche": "lançable, mais nommée par aucun document du dépôt : soit une commande qu'on a oublié de documenter, soit un script jetable qui a survécu",
  "bibliotheque-partagee": "aucune porte d'entrée, importée par plusieurs — le vocabulaire commun de l'Agence",
  "bibliotheque-solitaire": "aucune porte d'entrée et importée par un seul : à fusionner dans son unique client, ou bien il lui manque des clients",
  "infrastructure-shell": "script shell d'installation ou de construction, hors de l'Agence",
  "execution-directe-non-documentee": "personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé qu'à la main, par quelqu'un qui sait déjà",
};

// Chaque classe est une SONDE, jamais une liste de noms. Une classe nouvelle s'ajoute ici et
// s'applique immédiatement à TOUS les scripts, y compris ceux écrits avant elle.
export const CLASSES_TRANSVERSES = [
  { cle: "scanne-le-depot", libelle: "scanne le dépôt",
    quoi: "parcourt des fichiers pour y chercher quelque chose — la classe que l'utilisateur a nommée lui-même",
    sonde: (src) => /readdirSync|walk\s*\(|globSync/.test(src) },
  { cle: "rend-du-html", libelle: "rend un rapport HTML",
    quoi: "produit une page, donc quelque chose que l'utilisateur LIT vraiment",
    sonde: (src) => /renderHtmlReport/.test(src) },
  { cle: "tient-un-registre", libelle: "tient un registre",
    quoi: "écrit une mémoire durable sur le disque — ce qui lui permet de se souvenir d'un passage à l'autre",
    sonde: (src) => /writeFileSync|appendFileSync/.test(src) },
  { cle: "coute-des-appels-api", libelle: "coûte de vrais appels API",
    quoi: "consulte un modèle ou un service distant : jamais lancé sans passer par Smart Conso API (Article 22)",
    sonde: (src) => /generativelanguage|fetch\s*\(\s*[`'"]https/.test(src) },
  { cle: "porte-un-garde-fou-devolutivite", libelle: "porte un garde-fou d'évolutivité",
    quoi: "contient une fonction qui refuse une liste recopiée à la main : elle compare une copie à sa source et crie quand les deux divergent (Article 24). C'est ce qui permet à un registre de grossir sans qu'une copie oubliée se périme en silence.",
    sonde: (src) => /function\s+find\w*(Diverg|Missing|Manquant|NonDeclar|Undeclared)\w*\s*\(/.test(src) },
  { cle: "declare-sa-fiabilite", libelle: "déclare sa marge d'erreur",
    quoi: "avertit qu'il peut se tromper avant de rendre un chiffre — l'exigence transverse de tous les outils heuristiques",
    sonde: (src) => /printReliabilityNotice/.test(src) },
  { cle: "conclut-en-plan-daction", libelle: "conclut par un plan d'action",
    quoi: "transforme ses constats en gestes (Article 28) au lieu de s'arrêter au rapport",
    sonde: (src) => /PLAN_ACTION_TITRE|buildPlanDaction|planDactionDepuisEcarts/.test(src) },
  { cle: "compte-son-usage", libelle: "enregistre son propre usage",
    quoi: "sait dire s'il a servi — sans quoi personne ne peut constater qu'un outil n'est jamais sollicité",
    sonde: (src) => /recordCliUsage/.test(src) },
  { cle: "refuse-de-mesurer", libelle: "sait répondre « pas mesuré »",
    quoi: "distingue « je n'ai rien trouvé » de « je n'ai pas pu regarder » (leçon L5) — la classe la plus discrète et la plus importante",
    sonde: (src) => /PAS MESURÉ|pas mesuré|mesurable\s*:\s*false/.test(src) },
];

// DEUX FAUX VERDICTS, TROUVÉS AU PREMIER PASSAGE RÉEL — et les garder écrits vaut mieux que de
// les refaire, parce que les deux venaient de la même paresse : mesurer ce qui était facile à
// mesurer plutôt que ce que la question posait.
//
// (1) « SANS FICHE », 22 FOIS, dont presque toutes à tort. Je cherchais `docs/referentiel/<nom du
// fichier>.md`, or la fiche d'un outil porte le nom de L'OUTIL, pas celui de son script :
// `check-argus.mjs` est documenté dans `argus.md`, `check-harmonia.mjs` dans `harmonia.md`. Et six
// outils n'ont DÉLIBÉRÉMENT aucune fiche, la charte le déclare noir sur blanc. Le rattachement se
// fait donc par la TABLE MAÎTRESSE, le registre qui dit déjà quel script appartient à quel outil —
// lu, jamais recopié (Article 24).
//
// (2) « ORPHELINE », 6 FOIS, toutes fausses. Je ne comptais qu'une seule façon d'atteindre un
// script — être importé par un autre — alors qu'il en existe quatre dans ce dépôt : la porte en
// ligne de commande, `package.json`, un crochet git, et la documentation qui écrit `node
// scripts/x.mjs` pour un outil lancé à la main. `check-spirit.mjs` tombait ainsi en « plus rien ne
// l'atteint » alors que la charte le cite comme l'outil de référence de l'Article 0. Un garde qui
// accuse à tort cesse d'être lu (leçon L4) : les quatre portes se cherchent, et l'orphelin n'est
// déclaré qu'une fois les quatre fermées.

export function inventaireDeLaCharte(charteMarkdown = "") {
  // L'inventaire documentaire de CLAUDE.md : une ligne par outil, avec sa colonne Script et sa
  // colonne Instanciation. Il se LIT, il ne se recopie pas — un outil ajouté demain y sera.
  const out = [];
  for (const ligne of String(charteMarkdown).split("\n")) {
    if (!ligne.trim().startsWith("|")) continue;
    const cells = ligne.split("|").slice(1, -1).map((c) => c.trim().replace(/`/g, ""));
    const script = cells.find((c) => /^scripts\/[a-z0-9-]+\.mjs$/.test(c));
    const instanciation = cells.find((c) => /^docs\/referentiel\/[a-z0-9-]+\.md$/.test(c));
    if (script) out.push({ script, instanciation: instanciation ?? null });
  }
  return out;
}

// CINQ PORTES, PAS QUATRE — et la cinquième est arrivée par un troisième faux verdict. Après la
// correction précédente, `check-spirit.mjs` restait « orphelin » : la charte le cite abondamment,
// mais elle n'écrit nulle part `node scripts/check-spirit.mjs`, seulement la commande de Smart
// Conso API qu'il faut lancer AVANT lui. Être nommé par un document normatif est donc une porte à
// part entière — et le vrai constat, celui qui sert, est ailleurs : un outil que la charte dit de
// lancer à la main sans jamais écrire comment se lance mal. C'est devenu un écart nommé plutôt
// qu'une accusation d'inexistence (BP3 : fournir le FAIT qui manque, jamais adoucir le constat).
export function portesDEntree(chemin, source = "", { importeurs = 0, packageJson = "", sourcesCrochets = "", documentation = "", instructions = null } = {}) {
  const base = chemin.replace(/^scripts\//, "");
  const echappe = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // LE SCRIPT DOIT ÊTRE L'ARGUMENT DIRECT DU LANCEUR — sinon la sonde attrape de la prose. Trois
  // faux positifs mesurés avec la version large `node\s+[^|\n]*<nom>` : la commande d'un AUTRE
  // outil qui prend ce nom en paramètre (`node scripts/smart-conso-api.mjs check-spirit`), et une
  // phrase de compte rendu qui citait une ligne d'import. Un lanceur suivi d'options puis du
  // chemin, et rien d'autre. Le guillemet et la parenthèse comptent comme début : dans
  // package.json la commande est une valeur JSON, donc précédée d'un `"` et de rien d'autre —
  // l'oublier faisait sortir `run-framework.mjs`, lancé par `pnpm dev`, en « lançable par personne ».
  const motifLancement = new RegExp(`(?:^|[\\s\`"'(])(?:node|bash)\\s+(?:--?[\\w-]+(?:=\\S+)?\\s+)*(?:\\./)?scripts/(?:hooks/)?${echappe}(?![\\w.-])`, "m");
  // `--import` PRÉCHARGE un module, il ne lance rien : `sites-env.mjs`, chargé ainsi par
  // package.json, sortait « outil » alors qu'il n'est qu'une bibliothèque branchée au démarrage.
  const motifPrechargement = new RegExp(`--import\\s+(?:\\./)?scripts/${echappe}(?![\\w.-])`);
  const motifCitation = new RegExp(`scripts/${echappe}`);
  const portes = [];
  if (MOTIF_PORTE_CLI.test(source)) portes.push("ligne de commande");
  if (motifLancement.test(packageJson)) portes.push("package.json");
  if (motifLancement.test(sourcesCrochets)) portes.push("crochet git");
  // LA COMMANDE SE CHERCHE DANS LES INSTRUCTIONS, JAMAIS DANS L'HISTORIQUE — troisième
  // sur-correction, attrapée en vérifiant un verdict plutôt qu'en le croyant. `check-spirit.mjs`
  // ressortait « une commande est écrite » grâce à une ligne de SUIVI, c'est-à-dire le récit d'un
  // travail passé. Une commande pour lancer quelque chose vit dans un document qui dit quoi faire,
  // jamais dans un journal de ce qui a été fait — et la confondre effaçait précisément le constat
  // utile : la charte ordonne de lancer cet outil à la main sans jamais écrire comment.
  if (motifPrechargement.test(packageJson)) portes.push("préchargé comme module par package.json, jamais lancé");
  if (motifLancement.test(instructions ?? documentation)) portes.push("une commande de lancement est écrite");
  else if (motifCitation.test(documentation)) portes.push("nommé par la documentation, sans commande de lancement écrite");
  if (importeurs > 0) portes.push(`importé par ${importeurs} fichier(s)`);
  return portes;
}

export function typeDeScript(chemin, source = "", { fiches = new Set(), importeurs = 0, portes = null, scriptsDeLInventaire = new Set(), documente = false } = {}) {
  if (/^scripts\/hooks\//.test(chemin)) return "crochet";
  if (/\.sh$/.test(chemin)) return "infrastructure-shell";
  if (chemin === "scripts/check-house.mjs") return "filet-de-securite";
  // ÊTRE NOMMÉ PAR UN DOCUMENT N'EST PAS UNE PORTE D'EXÉCUTION — la sur-correction immédiate de la
  // correction précédente, et elle valait d'être attrapée : en comptant la mention documentaire
  // comme une porte, `html-report.mjs`, importé par dix-huit fichiers et lançable par aucun, est
  // sorti « outil ». Les deux questions sont distinctes et se posent séparément : peut-on le
  // LANCER (sinon c'est une bibliothèque), et reste-t-il ATTEIGNABLE par quoi que ce soit (sinon
  // c'est du code mort).
  const lancePar = (portes ?? []).filter((p) => p === "ligne de commande" || p === "package.json" || p === "crochet git" || p === "une commande de lancement est écrite");
  // Un .mjs que PERSONNE n'importe et qui n'expose aucune porte ne peut faire quelque chose que
  // lancé directement — c'est le cas de `check-spirit.mjs`, qui travaille au niveau du module sans
  // garde `import.meta.url`. Le déduire par élimination vaut mieux que de le déclarer mort.
  const executableParElimination = importeurs === 0 && /\.mjs$/.test(chemin);
  if (lancePar.length || executableParElimination) {
    if (!lancePar.length) return "execution-directe-non-documentee";
    // Appartenir à l'inventaire de la charte VAUT documentation, même sans fiche séparée : six
    // outils y figurent en déclarant explicitement n'en avoir aucune, et les traiter en oubliés
    // serait reprocher une décision écrite (Article 19).
    if (fiches.has(chemin) || scriptsDeLInventaire.has(chemin)) return "commande-documentee";
    return documente ? "commande-documentee" : "commande-sans-fiche";
  }
  return importeurs >= 2 ? "bibliotheque-partagee" : "bibliotheque-solitaire";
}

export function classesDuScript(source = "", classes = CLASSES_TRANSVERSES) {
  return classes.filter((c) => c.sonde(String(source))).map((c) => c.cle);
}

// LE RECENSEMENT COMPLET. Il refuse de répondre plutôt que de rendre un tableau vide quand il n'a
// rien pu lire (leçon L5) : une population de zéro script se lit exactement comme un dépôt propre.
export function recenserLesScripts({ root = ROOT, lireDossier = readdirSync, lire = readFileSync, classes = CLASSES_TRANSVERSES } = {}) {
  let noms = [];
  try { noms = lireDossier(join(root, "scripts")); } catch { return { mesurable: false, pourquoi: "le dossier scripts/ est illisible — aucune population mesurée, ce qui n'est jamais la même chose qu'une population vide" }; }
  const chemins = [];
  for (const n of noms) {
    if (/\.(mjs|sh)$/.test(n)) chemins.push(`scripts/${n}`);
    else if (n === "hooks") {
      let sousNoms = [];
      try { sousNoms = lireDossier(join(root, "scripts/hooks")); } catch { continue; }
      for (const sn of sousNoms) chemins.push(`scripts/hooks/${sn}`);
    }
  }
  if (!chemins.length) return { mesurable: false, pourquoi: "aucun script trouvé dans scripts/ — un dépôt sans outillage serait une anomalie, pas un résultat" };

  const sources = {};
  for (const c of chemins) { try { sources[c] = lire(join(root, c), "utf8"); } catch { sources[c] = null; } }

  // Le rattachement script → fiche se LIT dans l'inventaire de la charte (colonne Script ×
  // colonne Instanciation), jamais déduit du nom du fichier — c'est l'erreur qui accusait 22 outils.
  let inventaire = [];
  try { inventaire = inventaireDeLaCharte(lire(join(root, "CLAUDE.md"), "utf8")); } catch { /* sans inventaire : tout exécutable sera « sans fiche », et le recensement le dit */ }
  const fiches = new Set(inventaire.filter((l) => l.instanciation).map((l) => l.script));
  const scriptsDeLInventaire = new Set(inventaire.map((l) => l.script));

  // Les quatre portes d'entrée réelles de ce dépôt, lues là où elles vivent.
  let packageJson = ""; try { packageJson = lire(join(root, "package.json"), "utf8"); } catch { /* absent */ }
  let sourcesCrochets = "";
  for (const c of chemins) if (/^scripts\/hooks\//.test(c) && sources[c]) sourcesCrochets += sources[c];
  // TOUTE la documentation, jamais deux fichiers choisis à la main : un outil documenté par son
  // seul blueprint (god-of-all-process, tool-brain) sortait « sans fiche » alors qu'il est décrit
  // en long et en large — l'accusation portait sur l'endroit où j'avais regardé, pas sur le dépôt.
  let documentation = "";
  try { documentation += lire(join(root, "CLAUDE.md"), "utf8"); } catch { /* absent */ }
  const lireDocs = (dossier, profondeur = 0) => {
    if (profondeur > 2) return;
    let entrees = [];
    try { entrees = lireDossier(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const nom = e.name ?? e;
      const estDossier = typeof e.isDirectory === "function" ? e.isDirectory() : false;
      if (estDossier) { lireDocs(`${dossier}/${nom}`, profondeur + 1); continue; }
      if (!/\.(md|txt)$/.test(nom)) continue;
      try { documentation += lire(join(root, `${dossier}/${nom}`), "utf8"); } catch { /* illisible */ }
    }
  };
  lireDocs("docs");
  // Le corpus d'INSTRUCTIONS : ce qui dit quoi faire, par opposition à ce qui raconte ce qui a été
  // fait. La frontière se dérive du chemin — un registre d'outil et le suivi sont de l'historique.
  let instructions = "";
  try { instructions += lire(join(root, "CLAUDE.md"), "utf8"); } catch { /* absent */ }
  try { instructions += lire(join(root, "package.json"), "utf8"); } catch { /* absent */ }
  const lireInstructions = (dossier, profondeur = 0) => {
    if (profondeur > 1) return;
    let entrees = [];
    try { entrees = lireDossier(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const nom = e.name ?? e;
      const estDossier = typeof e.isDirectory === "function" ? e.isDirectory() : false;
      if (estDossier) { if (dossier === "docs" && nom === "referentiel") lireInstructions(`${dossier}/${nom}`, profondeur + 1); continue; }
      if (!/\.(md|txt)$/.test(nom)) continue;
      try { instructions += lire(join(root, `${dossier}/${nom}`), "utf8"); } catch { /* illisible */ }
    }
  };
  lireInstructions("docs");

  // Qui importe qui — dérivé des imports réels, jamais d'une carte tenue à la main.
  const importeurs = {};
  for (const [, src] of Object.entries(sources)) {
    if (!src) continue;
    for (const m of String(src).matchAll(/from\s+["']\.\/([a-z0-9-]+\.mjs)["']|import\(["']\.\.\/scripts\/([a-z0-9-]+\.mjs)["']/g)) {
      const cible = `scripts/${m[1] ?? m[2]}`;
      importeurs[cible] = (importeurs[cible] ?? 0) + 1;
    }
  }

  const lignes = chemins.map((c) => {
    const src = sources[c];
    const nb = importeurs[c] ?? 0;
    const portes = src === null ? [] : portesDEntree(c, src, { importeurs: nb, packageJson, sourcesCrochets, documentation, instructions });
    return {
      chemin: c,
      illisible: src === null,
      type: src === null ? "illisible" : typeDeScript(c, src, { fiches, importeurs: nb, portes, scriptsDeLInventaire, documente: new RegExp(`scripts/${c.replace(/^scripts\//, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(documentation) }),
      fiche: fiches.has(c) ? "fiche dédiée" : (scriptsDeLInventaire.has(c) ? "à l'inventaire de la charte" : null),
      classes: src === null ? [] : classesDuScript(src, classes),
      importeurs: nb,
      portes,
      // LE POIDS, demandé explicitement (#744, « indiquer le nombre de lignes de code, le poids
      // qu'il pèse dans le projet »). Compté ici plutôt que recalculé ailleurs : le recensement lit
      // déjà chaque fichier, et une seconde lecture pour la même question serait deux mesures
      // faites à deux instants différents. Un fichier illisible pèse `null`, jamais zéro — zéro
      // ligne se lit comme un fichier vide, et les deux ne veulent pas dire la même chose.
      lignes: src === null ? null : String(src).split("\n").length,
    };
  });

  const parType = {};
  for (const l of lignes) (parType[l.type] ??= []).push(l.chemin);
  const parClasse = {};
  for (const cl of classes) parClasse[cl.cle] = lignes.filter((l) => l.classes.includes(cl.cle)).map((l) => l.chemin);

  return { mesurable: true, lignes, parType, parClasse, total: lignes.length,
    illisibles: lignes.filter((l) => l.illisible).map((l) => l.chemin),
    horsPortee: "le TYPE se dérive de la forme du fichier et les CLASSES de sondes sur son texte : un outil qui scanne le dépôt sans jamais appeler readdirSync échappe à sa classe, et aucune sonde ne sait ce qu'un script fait VRAIMENT. Ce recensement dit ce qui se voit, jamais ce qui se comprend." };
}

// LES ÉCARTS QUE CE RECENSEMENT REND VISIBLES — et c'est là qu'il sert à quelque chose, pas dans le
// tableau lui-même. Chacun est une question, jamais un verdict : Abraham a posé cette règle pour les
// documents et elle vaut ici (un outil capable d'écrire « ce script est inutile » verrait un jour ce
// jugement appliqué par personne en particulier).
// ————————————————————————————————————————————————————————————————————————
// LA VERSION ET LA RICHESSE D'UN OUTIL (2026-09-24, chantier 3.4)
// ————————————————————————————————————————————————————————————————————————
//
// DEMANDE DE L'UTILISATEUR : « des numéros de version par outil, rétroactifs si possible, plus une
// échelle de richesse séparée ». Calibré en fenêtre dédiée : « **dérive-les de l'historique git** ».
//
// POURQUOI DEUX ÉCHELLES ET NON UNE SEULE, parce que c'est lui qui a demandé de les séparer et que
// la raison est bonne : une VERSION dit ce qui s'est PASSÉ (combien de fois cet outil a changé, et
// combien de fois il a changé de CAPACITÉS) ; une RICHESSE dit ce qu'il EST aujourd'hui. Un outil
// écrit d'un jet et jamais retouché a une version basse et peut être très riche ; un outil repris
// vingt fois peut rester pauvre. Les fondre en un seul chiffre effacerait exactement la différence
// qui rend chacun utile.
//
// CE QUI REND LA VERSION HONNÊTE, et c'est le seul choix qui compte ici : le MAJEUR ne compte pas
// les commits, il compte les commits qui ont TOUCHÉ LA SURFACE EXPORTÉE — un `export` ajouté ou
// retiré. C'est-à-dire les fois où l'outil a gagné ou perdu une capacité, et non les fois où on a
// corrigé une faute de frappe dedans. Compter tous les commits aurait rendu un numéro qui grandit
// avec l'agitation plutôt qu'avec les capacités, et un chiffre pareil se lit pourtant comme une
// mesure. Rétroactif par construction : tout est déjà dans git, rien n'est à saisir à la main.

// ══════════════════════════════════════════════════════════════════════════
// ZONE C — les rangs, et le croisement type × rang
// ══════════════════════════════════════════════════════════════════════════

export const ORG_RANKS = {
  socle: { label: "Socle", singulier: "Socle", emoji: "🧱", population: "type",
    promotionVers: null, condition: "AUCUNE promotion, et ce n'est pas un plafond : il n'a jamais candidaté. Le promouvoir serait lui inventer une ambition qu'il n'a pas.",
    sens: "n'est pas membre de l'équipe : c'est le sol sur lequel tout le monde marche" },
  cadre: { label: "Agents Cadre", singulier: "Agent Cadre", emoji: "🎖️", population: "equipe",
    sens: "dirigent — une fonction dans l'organigramme, jamais un badge de qualité en plus" },
  gardien: { label: "Gardiens sacrés du code", singulier: "Gardien sacré du code", emoji: "🛡️", population: "equipe",
    sens: "délivrent un vrai scan de qualité ET tournent automatiquement à CHAQUE commit" },
  // MEMBRE CERTIFIÉ CLASSIQUE (2026-09-26, décision de l'utilisateur sur le bloc B des 22). Ce rang
  // EXISTAIT déjà comme statut dans la table maîtresse depuis le 2026-09-21 — il n'avait simplement
  // jamais rejoint le dictionnaire des rangs, ce qui le rendait invisible à tout ce qui compte les
  // rangs. Il porte un vrai badge, et sa dispense est précise : aucune connaissance propre au projet
  // à documenter à part, donc ni fiche, ni blueprint, ni registre imposés d'office.
  membreClassique: { label: "Membres certifiés classiques", singulier: "Membre classique", emoji: "🎖️", population: "equipe",
    promotionVers: "membre", condition: "acquérir une connaissance propre au projet — et ça ne se décrète pas : ça se constate le jour où l'outil se met à savoir quelque chose que lui seul sait.",
    sens: "un vrai membre badgé, dont la valeur est d'APPELER et d'AGRÉGER ce que les autres disent déjà — deux obligations seulement, parce qu'il n'a rien de propre à documenter à part" },
  // HORS AGENCE (2026-09-26, décision de l'utilisateur sur le bloc A). Le §5 du référentiel
  // déclarait DÉJÀ trois catégories d'exclusion définitive (les Personnages, le Moteur du jeu, le
  // code tiers) — il en manquait une quatrième, et c'est elle qui retenait cinq scripts dans une
  // file d'attente où ils n'avaient rien à faire : ceux qui LANCENT le produit au lieu de
  // l'analyser. Liste volontairement tenue à la main, ce que l'Article 24 autorise explicitement
  // quand la nature manuelle est écrite à côté : « lance le produit » ne se lit dans aucune sonde.
  horsAgence: { label: "Hors de l'Agence", singulier: "Hors Agence", emoji: "🚧", population: "declaration",
    promotionVers: null, condition: "AUCUNE, et c'est le sens même du rang : ces scripts servent le PRODUIT, pas l'outillage qui le vérifie. Les équiper d'une fiche et d'un blueprint reviendrait à recruter le camion de livraison.",
    sens: "lance, sauvegarde ou archive le produit — testé comme n'importe quel code, mais jamais un travailleur de l'Agence (§5 du référentiel, 4e catégorie)" },
  membre: { label: "Membres certifiés", singulier: "Membre", emoji: "🎖️", population: "equipe",
    promotionVers: "gardien", condition: "remplir le critère DOUBLE de l'Article 20 : un vrai scan de qualité du CODE, ET gratuit à chaque commit. Vers Agent Cadre, ce n'est pas une promotion mécanique mais une décision d'organisation, donc celle de l'utilisateur.",
    sens: "câblage complet vérifié : table maîtresse, menu, instanciation, registre, blueprint" },
  // TROIS RANGS HORS ÉQUIPE PLUTÔT QU'UN SEUL (2026-09-26, sa demande : « pourquoi pas 2 ou 3 rangs
  // à part ? pour couvrir les différents types de rangs non documentés, et distinguer ceux qui
  // pourraient évoluer »). Il avait raison, et la mesure le confirme : trois situations bien
  // distinctes se cachaient sous une seule étiquette, et elles n'appellent pas du tout le même
  // geste. Les trois sont des ÉTATS DE PASSAGE, jamais des rangs où l'on reste — c'est ce que dit
  // leur `promotionVers`. NOMS PROVISOIRES, déclarés comme tels : il nomme, jamais moi (#200).
  postulant: { label: "Postulants", singulier: "Postulant", emoji: "🚪", population: "equipe-absent", nomProvisoire: true,
    promotionVers: "membre", condition: "l'inscrire au registre de l'équipe, et lui donner le poste de travail d'un Membre",
    sens: "documenté ET lançable, mais absent du registre de l'équipe : le plus proche de l'adhésion, à une décision près" },
  sansFiche: { label: "Sans fiche", singulier: "Sans fiche", emoji: "📄", population: "type", nomProvisoire: true,
    promotionVers: "postulant", condition: "lui écrire une fiche — un document, n'importe lequel, qui le nomme",
    sens: "lançable, mais nommé par aucun document du dépôt : soit une commande qu'on a oublié de documenter, soit un script jetable qui a survécu" },
  sansPorte: { label: "Sans porte", singulier: "Sans porte", emoji: "🧱", population: "type", nomProvisoire: true,
    promotionVers: "sansFiche", condition: "lui écrire une commande de lancement quelque part, ou le supprimer",
    sens: "personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé que par quelqu'un qui sait déjà — l'état le plus fragile du dépôt" },
  emetteur: { label: "Émetteurs de rapport non certifiés", singulier: "Émetteur de rapport", emoji: "📝", population: "registre", nomProvisoire: true,
    sens: "produisent un vrai rapport lu par un humain sans être membres — rang en attente de nommage" },
};

// LE CROISEMENT TYPE × RANG, la question qu'il a posée mot pour mot : « comment se croisent les
// deux données ? ». La réponse tient en une phrase : **le TYPE décide si un RANG est possible, et
// lequel.** Un type se constate sur le fichier ; un rang se mérite ou se déduit du type.
//   · les types qui SERVENT sans postuler (bibliothèques, crochets, filet de sécurité, shell)
//     reçoivent « Socle » automatiquement — ils n'ont jamais candidaté et ne manquent de rien ;
//   · les types LANÇABLES MAIS NON DOCUMENTÉS reçoivent le rang provisoire ci-dessus ;
//   · le type « outil » est le seul dont le rang ne se déduit PAS : il se lit dans le registre de
//     l'équipe, parce qu'il dépend de ce que l'outil a prouvé, jamais de ce qu'il est.
export const HORS_AGENCE = {
  "run-framework": "lance le serveur de développement du jeu",
  "run-simulation": "lance une simulation du jeu de bout en bout",
  "sauvegarde-projet": "sauvegarde le dépôt, une opération d'exploitation",
  "sites-env": "décrit les environnements de déploiement du site",
  "summarize-simulation-log": "résume le journal brut d'une simulation avant archivage",
};

export const RANG_PAR_TYPE = {
  crochet: "socle",
  "filet-de-securite": "socle",
  "bibliotheque-partagee": "socle",
  "bibliotheque-solitaire": "socle",
  "infrastructure-shell": "socle",
  "commande-sans-fiche": "sansFiche",
  "execution-directe-non-documentee": "sansPorte",
  "commande-documentee": null,
};

// LE SLUG SE LIT DANS L'INVENTAIRE DE LA CHARTE, JAMAIS SUR LE NOM DU FICHIER (leçon L24 : ce qui
// dit à quoi sert un outil est son offre DÉCLARÉE, pas son code — ici, ce qui dit COMMENT il
// s'appelle est la fiche que la charte lui donne, pas son nom de fichier). Le premier jet devinait
// le slug en retirant « check- » ; il ratait deux Gardiens sacrés sur sept, silencieusement, parce
// que `scripts/check-argus.mjs` porte la fiche `docs/referentiel/argus.md`.
export function slugsParScript(texteCharte, { inventaire = null } = {}) {
  const lignes = inventaire ?? inventaireDeLaCharte(texteCharte ?? "");
  const m = {};
  for (const l of lignes) {
    if (!l?.script) continue;
    const slug = String(l.instanciation ?? "").match(/([^/]+)\.md$/)?.[1];
    if (slug) m[l.script] = slug;
  }
  return m;
}

// UN RANG MÉRITÉ BAT TOUJOURS UN RANG DÉDUIT, et cet ordre a été trouvé en faisant tourner la
// règle plutôt qu'en la relisant. Le premier jet lisait le TYPE d'abord : CLONE-HUNTER et
// SAFE-EXPORT, deux Gardiens sacrés dépourvus de porte d'entrée propre (ils tournent via le crochet
// post-commit), étaient donc typés « bibliothèque partagée » et rétrogradés en Socle — un rang
// mérité effacé par un rang automatique. Le registre de l'équipe passe donc EN PREMIER ; le type
// ne fait que remplir les cases que personne n'a remplies.
export function rangDuFichier(ligne, { categories = AGENT_CATEGORIES, rangs = ORG_RANKS, rangDe = rangDeLaCategorie, slugs = {}, horsAgence = HORS_AGENCE } = {}) {
  const chemin = String(ligne?.chemin ?? "");
  // UNE EXCLUSION DÉCLARÉE PRIME SUR TOUT (2026-09-26) : inutile de chercher un rang à quelqu'un
  // qui n'a jamais postulé, et le chercher quand même est précisément ce qui gardait ces cinq-là
  // dans une file d'attente.
  const nom = chemin.replace(/^scripts\//, "").replace(/\.(mjs|sh)$/, "");
  if (horsAgence[nom]) return { rang: rangs.horsAgence?.singulier ?? "Hors Agence", source: "declaration", cle: "horsAgence", pourquoi: horsAgence[nom] };
  const declare = slugs[chemin];
  const devine = chemin.replace(/^scripts\//, "").replace(/\.(mjs|sh)$/, "");
  const cat = categories[declare] ?? categories[devine];
  const merite = cat ? rangDe(cat) : null;
  if (merite) return { rang: merite, source: declare && categories[declare] ? "equipe" : "equipe (nom de fichier)", cle: null };
  const cle = RANG_PAR_TYPE[ligne?.type];
  if (cle) return { rang: rangs[cle]?.singulier ?? cle, source: "type", cle };
  if (cle === null) return { rang: rangs.postulant?.singulier ?? "Postulant", source: "type", cle: "postulant",
    pourquoi: "documenté et lançable, mais absent du registre de l'équipe — un état de passage, pas un manque de rang" };
  return { rang: null, source: "aucune", cle: null, pourquoi: `type « ${ligne?.type ?? "?"} » absent de RANG_PAR_TYPE — un type nouveau doit y déclarer ce qu'il permet` };
}

// CHAQUE FICHIER, SON TYPE ET SON RANG — la vue exhaustive qu'il a demandée, jamais deux exemples.
export function croiserTypeEtRang({ recensement = null, categories = AGENT_CATEGORIES, rangs = ORG_RANKS, slugs = null } = {}) {
  slugs ??= (() => { try { return slugsParScript(readFileSync(join(ROOT, "CLAUDE.md"), "utf8")); } catch { return {}; } })();
  if (!recensement?.mesurable) return { mesurable: false, pourquoi: recensement?.pourquoi ?? "aucun recensement fourni — sans lire les fichiers, aucun croisement n'est mesurable" };
  // LA FAMILLE ET L'INDICE VOYAGENT AVEC LA LIGNE (2026-09-26) : sans la famille attachée ici, la
  // troisième facette de l'indice sortait « ? » sur les 87 fichiers — un code à trou qui se lit
  // comme un code complet, ce qui est pire qu'un code absent.
  const famillesTriees = [...new Set(Object.values(categories).map(familleDeLaCategorie).filter(Boolean))].sort();
  const familleDuChemin = (chemin) => {
    const declare = slugs[chemin];
    const devine = String(chemin).replace(/^scripts\//, "").replace(/\.(mjs|sh)$/, "");
    const cat = categories[declare] ?? categories[devine];
    return cat ? familleDeLaCategorie(cat) : null;
  };
  const lignes = recensement.lignes.map((l) => {
    const r = rangDuFichier(l, { categories, rangs, slugs });
    const famille = familleDuChemin(l.chemin);
    const base = { chemin: l.chemin, type: l.type, classes: l.classes ?? [], famille, ...r };
    return { ...base, indice: indiceDeClassification(base, { rangs, familles: famillesTriees, rang: r.rang }) };
  });
  const parRang = {};
  for (const l of lignes) parRang[l.rang ?? "(aucun)"] = (parRang[l.rang ?? "(aucun)"] ?? 0) + 1;
  const sansRang = lignes.filter((l) => !l.rang);
  return { mesurable: true, lignes, parRang, total: lignes.length, sansRang, familles: famillesTriees,
    couverture: lignes.length ? Math.round(((lignes.length - sansRang.length) / lignes.length) * 100) : 0 };
}

// ══════════════════════════════════════════════════════════════════════════
// ZONE B — les axes, l'indice, le poste, le document
// ══════════════════════════════════════════════════════════════════════════

export function couvertureDesAxes({ recensement = null, categories = AGENT_CATEGORIES } = {}) {
  if (!recensement?.mesurable) {
    return { mesurable: false, pourquoi: "aucun recensement fourni : sans lire les fichiers, on ne peut pas dire ce qui est couvert — et un pourcentage rendu sans lecture ressemblerait trait pour trait à une mesure" };
  }
  const parType = {};
  for (const l of recensement.lignes) parType[l.type ?? "?"] = (parType[l.type ?? "?"] ?? 0) + 1;
  const total = recensement.lignes.length;
  const avecRang = Object.keys(categories).length;
  return {
    mesurable: true, total, avecRang, parType,
    pourquoiLEcart: "un TYPE se constate sur le fichier, donc tout le monde en a un ; un RANG se mérite — il dit qu'on est membre de l'équipe. Une bibliothèque partagée n'a pas de rang et n'en manque pas : elle n'a jamais postulé.",
  };
}

// LES DEUX REGISTRES DE RANGS NE SE PARLENT PAS (constaté le 2026-09-25, sur son intuition
// « j'ai l'impression qu'il manque des RANGS » — elle était juste).
//
// MESURE EXACTE, pas un rapprochement approximatif : les rangs RÉELLEMENT PORTÉS par les outils
// (`AGENT_CATEGORIES`, dans lib-shell) et les rangs DÉCLARÉS (`ORG_RANKS`, ici) ne coïncident sur
// AUCUN libellé. L'un dit « Membre », l'autre « Membres certifiés » ; « Agent Spécial » est porté
// par deux outils et déclaré nulle part ; « Socle » et « Émetteurs de rapport non certifiés » sont
// déclarés et portés par personne.
//
// POURQUOI ÇA A PU DURER : les deux listes servent à des choses différentes (l'une range, l'autre
// explique), personne ne les a jamais confrontées, et chacune prise seule est parfaitement
// cohérente. C'est exactement la forme de dette que l'Article 24 vise — deux sources qui décrivent
// la même chose et ne disent plus pareil, sans qu'aucune erreur ne se produise jamais.
export function rangsQuiDivergent({ categories = AGENT_CATEGORIES, rangs = ORG_RANKS, rangDe = rangDeLaCategorie } = {}) {
  const portes = [...new Set(Object.values(categories).map(rangDe).filter(Boolean))];
  // ON NE COMPARE QUE CE QUI EST COMPARABLE (2026-09-25, tâche #890). Deux corrections, et la
  // seconde est la vraie : (1) le dictionnaire écrit le PLURIEL (le groupe) là où un outil porte le
  // SINGULIER (le titulaire) — comparer les deux rendait « zéro libellé commun » sur une simple
  // différence de nombre ; (2) surtout, trois rangs ne se peuplent PAS dans le registre de l'équipe,
  // et les y chercher revenait à compter la mauvaise population. C'est #888 qui se rejoue : le
  // chiffre était juste, il ne regardait pas la bonne chose. Seuls les rangs dont la population est
  // « equipe » doivent avoir un titulaire ici ; les autres se lisent ailleurs, et le dire vaut mieux
  // que de les accuser d'être vides.
  const dEquipe = Object.entries(rangs).filter(([, v]) => v.population === "equipe").map(([cle, v]) => ({ cle, singulier: v.singulier, label: v.label }));
  const singuliers = new Set(dEquipe.map((d) => d.singulier));
  return {
    portes,
    declares: Object.values(rangs).map((v) => v.label),
    declaresDEquipe: dEquipe.map((d) => d.singulier),
    ailleurs: Object.values(rangs).filter((v) => v.population !== "equipe").map((v) => `${v.label} (se lit dans : ${v.population})`),
    portesNonDeclares: portes.filter((p) => !singuliers.has(p)),
    declaresNonPortes: dEquipe.filter((d) => !portes.includes(d.singulier)).map((d) => d.singulier),
    pourquoi: "chaque rang déclare désormais OÙ se lisent ses titulaires — un rang peuplé par le type du fichier n'a jamais à figurer dans le registre de l'équipe, et l'y chercher fabriquait une dette qui n'existait pas",
  };
}

export function carteDesAxes({ categories = AGENT_CATEGORIES, rangDe = rangDeLaCategorie, familleDe = familleDeLaCategorie } = {}) {
  const parRang = new Map();
  const parFamille = new Map();
  for (const [slug, v] of Object.entries(categories)) {
    const r = rangDe(v) ?? "?";
    const f = familleDe(v) ?? "—";
    if (!parRang.has(r)) parRang.set(r, []);
    parRang.get(r).push(slug);
    if (!parFamille.has(f)) parFamille.set(f, []);
    parFamille.get(f).push(slug);
  }
  // LES EXEMPLES SONT LUS, JAMAIS CHOISIS À LA MAIN (Article 24) : un outil ajouté demain change la
  // carte tout seul, et deux exemples recopiés ici auraient cité des outils disparus dans six mois.
  const deux = (l) => l.slice(0, AXES_EXEMPLES_MAX).join(", ");
  return {
    rangs: [...parRang.entries()].map(([rang, outils]) => ({ rang, combien: outils.length, exemples: deux(outils) })),
    familles: [...parFamille.entries()].map(([famille, outils]) => ({ famille, combien: outils.length, exemples: deux(outils) })),
    collision: {
      constat: "l'axe nommé `type` ne porte PAS le rang",
      ceQueTypeRange: Object.keys(TYPES_DE_SCRIPT).join(", "),
      ceQueLeRangRange: [...parRang.keys()].join(", "),
      pourquoiCaCompte: "deux choses différentes portent le même mot selon qu'on lit le référentiel ou le code — c'est la dette de vocabulaire que l'Article 20bis nomme, et elle envoie chercher une distinction là où elle n'est pas",
    },
  };
}

// LE 6e AXE, TROUVÉ EN CROISANT DEUX CARTES QUI NE S'ÉTAIENT JAMAIS PARLÉ (2026-09-26, sa demande :
// « croise les 7 critères transverses avec les classes, c'est important pour toute la
// classification »). Il avait raison, et pour une raison qu'aucun de nous deux n'avait formulée :
// les deux cartes ne mesurent pas la même chose. Une CLASSE dit ce qu'un outil SAIT FAIRE (rendre
// du HTML, tenir un registre) ; un CRITÈRE dit ce qu'il CHERCHE (une déclaration sans réalité, deux
// sources qui divergent). Ce sont deux axes, pas deux versions d'un axe — et le second existait,
// mesuré depuis le 2026-09-23 sur 34 outils réels, sans que la classification l'ait jamais ramassé.
export const AXES_DE_CLASSIFICATION = [
  { cle: "iceberg", quoi: "à quel groupe il appartient (membre, oublié, infrastructure, plomberie)", porteur: "classerIceberg()" },
  { cle: "type", quoi: "ce que le fichier EST", porteur: "typeDuScript()" },
  { cle: "moment", quoi: "QUAND il intervient", porteur: "momentsDeLOutil()" },
  { cle: "domaine", quoi: "SUR QUOI il regarde", porteur: "domainesDeLOutil()" },
  { cle: "destinataire", quoi: "À QUI le résultat sert", porteur: "destinatairesDeLOutil()" },
  { cle: "cherche", quoi: "QUELLE QUESTION il pose au dépôt (déclaré-mais-absent, deux-sources-divergent, duplication…)", porteur: "cartographieCriteresTransverses() — HARMONIA" },
];

// L'INDICE DE CLASSIFICATION À FACETTES (2026-09-26). Sa demande : « on pourrait remplacer ces
// icônes par un code axe1=un chiffre, axe2=un chiffre… ce qui donnerait pour chaque outil : rang,
// famille, + code. Quel est le nom de ce code ? (pas le nom inventé, le nom qui le définit) ».
//
// LE NOM EXISTE DÉJÀ, ET IL N'EST PAS DE MOI : en sciences de la documentation, ranger un objet sur
// plusieurs axes indépendants au lieu d'un seul arbre s'appelle une CLASSIFICATION À FACETTES, et
// le code composite qui en résulte s'appelle une NOTATION — ou, en français de bibliothèque, un
// INDICE. Donc : un indice de classification à facettes. Chaque position est une facette, chaque
// facette est indépendante des autres, et l'indice entier se lit comme une adresse.
//
// POURQUOI UN INDICE PLUTÔT QUE DES ICÔNES : une icône se reconnaît, elle ne se trie pas, ne se
// cherche pas et ne se compare pas. Un indice fait les trois. Les icônes restent utiles à l'œil,
// l'indice sert à la machine et au tri — les deux cohabitent sans se remplacer.
export const FACETTES = ["type", "rang", "famille", "classes"];

export function indiceDeClassification(ligne, { types = TYPES_DE_SCRIPT, rangs = ORG_RANKS, familles = [], classes = CLASSES_TRANSVERSES, rang = null } = {}) {
  const posType = Object.keys(types).indexOf(ligne?.type);
  const cleRang = Object.entries(rangs).find(([, v]) => v.singulier === rang)?.[0] ?? null;
  const posRang = cleRang ? Object.keys(rangs).indexOf(cleRang) : -1;
  const posFam = familles.indexOf(ligne?.famille ?? null);
  // Les classes sont MULTIPLES : elles tiennent dans un seul nombre, un bit par classe, rendu en
  // base 36 pour rester court. C'est la seule facette qui ne soit pas un simple rang dans une liste,
  // et c'est normal : les autres répondent « laquelle ? », celle-ci répond « lesquelles ? ».
  let bits = 0;
  (ligne?.classes ?? []).forEach((c) => { const i = classes.findIndex((x) => x.cle === c); if (i >= 0) bits |= (1 << i); });
  // TROIS ÉTATS DANS UNE FACETTE, JAMAIS DEUX : un chiffre (la valeur), « - » (la facette ne
  // s'applique pas — un fichier du Socle n'a pas de famille et n'en manque pas), « ? » (la valeur
  // existe mais n'a pas été reconnue). Confondre les deux derniers ferait lire une absence
  // légitime comme un trou, et un vrai trou comme une absence légitime.
  const chiffre = (n, applicable = true) => (n >= 0 ? String(n) : applicable ? "?" : "-");
  return `${chiffre(posType)}.${chiffre(posRang)}.${chiffre(posFam, ligne?.famille != null)}.${bits.toString(36)}`;
}

export function decoderIndice(indice, { types = TYPES_DE_SCRIPT, rangs = ORG_RANKS, familles = [], classes = CLASSES_TRANSVERSES } = {}) {
  const parts = String(indice ?? "").split(".");
  if (parts.length !== 4) return { lisible: false, pourquoi: `un indice compte exactement ${FACETTES.length} facettes séparées par un point — « ${indice} » n'en a pas` };
  const [a, b, c, d] = parts;
  const lire = (v, liste) => (v === "?" || v === "-" ? null : (liste[Number(v)] ?? null));
  const bits = parseInt(d, 36);
  return {
    lisible: true,
    type: lire(a, Object.keys(types)),
    rang: lire(b, Object.values(rangs).map((r) => r.singulier)),
    famille: lire(c, familles),
    classes: Number.isNaN(bits) ? [] : classes.filter((_, i) => bits & (1 << i)).map((x) => x.cle),
  };
}

// LE RENDU DE LA CARTE (2026-09-25, tâche #439) — une page, pas un tableau de plus dans un rapport.
//
// SA DEMANDE : « une page qui montre tout d'abord », et « 2 exemples par axe afin d'éclaircir ». Un
// axe nommé `iceberg` ou `domaine` ne dit rien à qui n'a pas le code sous les yeux ; deux outils
// réels le disent en une seconde. **Les exemples sont LUS dans les registres réels** (Article 24) :
// un outil ajouté demain change la page tout seul, et deux noms recopiés ici auraient cité des
// outils disparus dans six mois.
//
// LES DEUX CORRECTIONS QU'IL A APPORTÉES LE 2026-09-25, et elles changent la structure de la page :
//   A. « quel dossier ce poste a-t-il ? » n'est PAS un axe de classement — c'est une CONSÉQUENCE
//      du rang. Dans ses mots : « ah, ce fichier est un gardien sacré, donc son poste de travail
//      est le suivant. Ce n'est pas un critère de classement. » La page le présente donc comme un
//      tableau DÉRIVÉ, jamais comme une colonne de rangement.
//   B. « à quel niveau travaille l'outil, c'est la typologie de l'outil aussi », et « dans TYPE il
//      y a toutes les catégories, découpage fin : au sein des membres par exemple, il y a des
//      sous-catégories ». Le découpage fin existe : rang (4 valeurs) × famille (9 valeurs).
export const POSTE_DE_TRAVAIL = [
  { quoi: "une fiche d'instanciation", ou: "docs/referentiel/<outil>.md", pourQui: "tout rang sauf ceux qui n'ont aucune connaissance propre au projet" },
  { quoi: "un blueprint générique", ou: "docs/<outil>-blueprint.md", pourQui: "tout rang sauf cousin déclaré d'un autre Agent" },
  { quoi: "un dossier d'historisation", ou: "docs/<outil>/ avec son index.md", pourQui: "tout outil qui produit un rapport ou garde une mémoire" },
  { quoi: "une ligne à la table maîtresse", ou: "docs/regles-de-travail.md §7ter", pourQui: "tous, sans exception" },
  { quoi: "une entrée au menu PRESTATIONS", ou: "scripts/le-coordinateur.mjs", pourQui: "ceux qu'on lance à la demande ou qui coûtent de l'API" },
  { quoi: "un item de Ronde", ou: "scripts/circle-tasks.mjs", pourQui: "les périodiques — jamais les Gardiens sacrés, qui tournent à chaque commit" },
];

// LE POSTE DE TRAVAIL PAR RANG (2026-09-25, sa demande : « un tableau mis à jour avec les rangs et
// les différents postes de travail qui en découlent »). À lire dans ce sens et jamais l'inverse :
// on connaît le rang, on en DÉDUIT le poste — c'est sa formule mot pour mot.
export const POSTE_PAR_RANG = {
  "Gardien sacré du code": "fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + câblage au crochet post-commit. JAMAIS d'item de Ronde : il tourne à chaque commit, un item ferait doublon.",
  "Agent Cadre": "tout ce qu'a un Membre, PLUS le droit de convoquer les autres et de rendre un verdict sur eux. Deux outils seulement.",
  "Membre": "fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + entrée au menu des prestations. Le poste complet, sans le crochet.",
  Socle: "AUCUN poste, et ce n'est pas un manque : une bibliothèque, un crochet ou le filet de sécurité servent tout le monde sans avoir jamais candidaté. Leur exigence est ailleurs — être importés proprement et testés.",
  "Membre classique": "DEUX obligations seulement : la ligne à la table maîtresse et l'entrée au menu des prestations. Ni fiche, ni blueprint, ni registre imposés d'office — il n'a rien de propre au projet à documenter à part. Tout le reste de son poste se DÉRIVE de ce qu'il fait réellement (cf. OBLIGATIONS_DERIVEES).",
  "Hors Agence": "AUCUN poste d'Agence, par nature : il sert le produit, pas l'outillage. Il reste tenu par le filet de sécurité et le typage, comme n'importe quel code du dépôt.",
  "Sans fiche": "poste NON ARRÊTÉ — et c'est le signal : la question n'est pas quel poste lui donner, mais lui écrire une fiche ou le supprimer.",
  "Sans porte": "poste NON ARRÊTÉ — la question est encore en amont : lui donner une commande de lancement, ou le supprimer.",
  Postulant: "poste NON ARRÊTÉ, et c'est justement ce que le rang signale : lançable, mais nommé par aucun document. La question n'est pas « quel poste lui donner » mais « le documente-t-on, ou le supprime-t-on ».",
};

// LE §1 DU RÉFÉRENTIEL DÉCLARE DEUX AXES, LE CODE EN DÉRIVE SEPT (2026-09-25, sa décision : « un
// garde-fou qui ALERTE dès que les deux ne disent plus la même chose — la prose reste écrite à la
// main, on perd seulement le droit de diverger en silence »). Le garde-fou ne réécrit rien : il
// compte les titres « ### Axe … » du document et les compare au nombre d'axes que le code publie.
export const REFERENTIEL_ORGANISATION = "docs/referentiel/organisation-agence.md";
export const MOTIF_AXE_DECLARE = /^###\s+Axe\s+([A-Z])\s*[—-]\s*(.+)$/gm;

export function axesDivergentDuReferentiel({ texte = null, root = ROOT, lire = readFileSync, axes = AXES_DE_CLASSIFICATION, rangs = true, familles = true } = {}) {
  let src = texte;
  if (src == null) { try { src = lire(join(root, REFERENTIEL_ORGANISATION), "utf8"); } catch { src = null; } }
  if (src == null) return { mesure: "pas mesuré", pourquoi: `${REFERENTIEL_ORGANISATION} est illisible — sans le document, aucune divergence ne peut être constatée, et un vert rendu ici ressemblerait à un accord` };
  const declares = [...src.matchAll(MOTIF_AXE_DECLARE)].map((m) => ({ lettre: m[1], titre: m[2].trim() }));
  if (!declares.length) return { mesure: "pas mesuré", pourquoi: `aucun titre « ### Axe X — … » trouvé dans ${REFERENTIEL_ORGANISATION} : le document a changé de forme, et compter zéro axe déclaré serait une mesure fabriquée par le lecteur` };
  // Les axes réellement publiés par le code : les cinq de AXES_DE_CLASSIFICATION, plus le rang et
  // la famille, qui sont des axes à part entière même s'ils vivent dans un autre registre.
  const publies = [...axes.map((a) => a.cle), ...(rangs ? ["rang"] : []), ...(familles ? ["famille"] : [])];
  return {
    mesure: "mesuré",
    declares: declares.map((d) => `Axe ${d.lettre} — ${d.titre}`),
    publies,
    divergent: declares.length !== publies.length,
    pourquoi: declares.length !== publies.length
      ? `le référentiel déclare ${declares.length} axe(s), le code en publie ${publies.length} (${publies.join(", ")}) — la prose se rédige à la main, mais elle ne peut plus s'écarter en silence`
      : null,
  };
}

// LE DOCUMENT OFFICIEL DE LA CLASSIFICATION (2026-09-25, sa demande : « je veux le doc officiel de
// la classification générale de l'agence, à créer s'il n'existe pas »). Il est GÉNÉRÉ, jamais
// rédigé à la main — c'est la seule façon qu'il ne se périme pas (Article 24), et c'est aussi ce
// qui permet les listes EXHAUSTIVES qu'il a réclamées à la place des deux exemples.
export const CLASSIFICATION_PATH = "docs/referentiel/classification-agence.md";
export const CLASSIFICATION_HTML = "docs/le-classificateur/classification-agence.html";

// UNE SEULE SOURCE, DEUX RENDUS (2026-09-26, sa demande : « ce doc doit m'être livré en HTML, mais
// il peut être enregistré en txt dans les dossiers »). Le générateur ne produit plus du Markdown :
// il produit des BLOCS, que le gabarit partagé rend en HTML et qu'une petite fonction rend en
// Markdown. Écrire les deux à la main aurait garanti qu'ils divergent — c'est exactement le défaut
// que ce document décrit par ailleurs.
export function blocsVersMarkdown(blocs = []) {
  const L = [];
  for (const b of blocs) {
    if (b.type === "heading") L.push(`${"#".repeat(b.level ?? 2)} ${b.text}`, "");
    else if (b.type === "paragraph") L.push(b.text, "");
    else if (b.type === "note") L.push(`> ${b.text}`, "");
    else if (b.type === "list") L.push(...(b.items ?? []).map((i) => `- ${i}`), "");
    else if (b.type === "table") {
      L.push(`| ${b.headers.join(" | ")} |`, `|${b.headers.map(() => "---").join("|")}|`);
      for (const r of b.rows) L.push(`| ${r.join(" | ")} |`);
      L.push("");
    }
  }
  return L.join("\n") + "\n";
}

// LE POSTE DE TRAVAIL SE DÉRIVE, IL NE SE RECOPIE PAS (2026-09-26, sa décision : « pas un rang :
// dériver les obligations »).
//
// CE QUI CLOCHAIT AVANT, ET C'EST EXACTEMENT LE DÉFAUT QUE L'ARTICLE 24 NOMME : le poste était une
// liste fixe par rang. Un outil qui grossissait — qui se mettait à garder une mémoire, à produire
// une page, à appeler une API — gardait le poste de son rang d'origine jusqu'à ce que quelqu'un
// pense à le promouvoir. Personne n'y pensait jamais, parce que rien ne le signalait.
//
// LE PRINCIPE : le RANG donne la BASE, ce que l'outil FAIT ajoute le reste. Et « ce qu'il fait » ne
// se déclare pas — ça se MESURE, par les classes transverses, qui sont des sondes sur son code.
// Conséquence directe, et c'est tout l'intérêt : le jour où un outil écrit sa première ligne de
// registre, l'obligation d'avoir un dossier d'historisation apparaît toute seule au commit suivant.
//
// CE QUE CE MÉCANISME NE FAIT JAMAIS, ET LA DISTINCTION EST DÉLIBÉRÉE : il ne promeut pas le RANG.
// Un rang se mérite et se décide ; un outil qui se promouvrait lui-même se décernerait un titre. Ce
// qui suit une machine, c'est l'ÉQUIPEMENT — ce qu'on doit à un outil devenu plus gros. Le titre
// reste une décision humaine, l'équipement suit le fait.
export const OBLIGATIONS_DERIVEES = [
  { classe: "tient-un-registre", doit: "un dossier d'historisation", ou: "docs/<nom>/ avec son index.md",
    pourquoi: "il écrit une mémoire durable : sans dossier déclaré, cette mémoire n'est protégée par rien et personne ne sait qu'elle existe" },
  { classe: "rend-du-html", doit: "une décision de remise HTML déclarée", ou: "le registre de Doc-Report",
    pourquoi: "il produit une page que quelqu'un LIT vraiment — donc quelqu'un doit avoir décidé comment elle est remise" },
  { classe: "coute-des-appels-api", doit: "une entrée au menu PRESTATIONS et une consultation Smart Conso API",
    ou: "scripts/le-coordinateur.mjs, puis l'Article 22", pourquoi: "il coûte de l'argent réel : on ne le lance jamais sans avoir regardé le quota" },
  { classe: "porte-un-garde-fou-devolutivite", doit: "un test dans les DEUX sens", ou: "scripts/check-house.mjs",
    pourquoi: "un détecteur qu'on n'a jamais vu mordre ne prouve rien, et un détecteur qui accuse à tort cesse d'être lu (BP4, L4)" },
  { classe: "declare-sa-fiabilite", doit: "sa marge d'erreur écrite dans son propre rapport", ou: "printReliabilityNotice()",
    pourquoi: "un chiffre heuristique rendu sans réserve se lit comme un fait mesuré" },
  { classe: "conclut-en-plan-daction", doit: "des tâches réelles dans le suivi", ou: "docs/suivi/",
    pourquoi: "l'Article 28 : un rapport n'est pas fini quand il est écrit, mais quand ses constats sont devenus des tâches" },
];

export function posteDeTravail(ligne, rang, { posteDuRang = POSTE_PAR_RANG, derivees = OBLIGATIONS_DERIVEES, base = POSTE_DE_TRAVAIL, rangs = ORG_RANKS } = {}) {
  const cleRang = Object.keys(rangs).find((k) => rangs[k].singulier === rang) ?? null;
  const socle = posteDuRang[rang] ?? null;
  const acquises = (ligne?.classes ?? []);
  const ajouts = derivees.filter((o) => acquises.includes(o.classe));
  // LES TROIS ÉTATS, encore une fois : un rang sans poste ARRÊTÉ n'est pas un rang sans poste.
  return {
    rang, cleRang,
    base: socle ?? null,
    baseMesuree: socle != null,
    pourquoiPasDeBase: socle == null ? `le poste de base du rang « ${rang} » n'a jamais été arrêté — ce n'est pas la même chose qu'un rang sans obligations` : null,
    ajouts,
    total: (socle ? 1 : 0) + ajouts.length,
    piecesPossibles: base.length,
  };
}

// CE QUE CHAQUE OUTIL DOIT AUJOURD'HUI, ET CE QU'IL DEVRA S'IL GROSSIT — la vue qui rend le
// mécanisme lisible plutôt que théorique.
export function postesDeTousLesOutils({ croise = null, derivees = OBLIGATIONS_DERIVEES } = {}) {
  croise ??= croiserTypeEtRang({ recensement: recenserLesScripts() });
  if (!croise?.mesurable) return { mesurable: false, pourquoi: croise?.pourquoi ?? "aucun croisement disponible" };
  const lignes = croise.lignes.map((l) => ({ chemin: l.chemin, rang: l.rang, ...posteDeTravail(l, l.rang, { derivees }) }));
  const parObligation = {};
  for (const o of derivees) parObligation[o.classe] = lignes.filter((l) => l.ajouts.some((a) => a.classe === o.classe)).length;
  return { mesurable: true, lignes, parObligation, total: lignes.length };
}

export function blocsDeClassification({
  recensement = null, categories = AGENT_CATEGORIES, rangs = ORG_RANKS, types = TYPES_DE_SCRIPT,
  classes = CLASSES_TRANSVERSES, posteDuRang = POSTE_PAR_RANG, poste = POSTE_DE_TRAVAIL,
  axes = AXES_DE_CLASSIFICATION, divergenceAxes = null, horodatage = null,
} = {}) {
  recensement ??= recenserLesScripts();
  divergenceAxes ??= axesDivergentDuReferentiel();
  if (!recensement?.mesurable) return { mesurable: false, pourquoi: recensement?.pourquoi ?? "recensement impossible", blocs: [] };
  const croise = croiserTypeEtRang({ recensement, categories, rangs });
  const court = (c) => String(c).replace(/^scripts\//, "");
  const code = (n) => `\`${n}\``;
  const grouper = (liste, cle) => {
    const m = new Map();
    for (const l of liste) { const k = cle(l); (m.get(k) ?? m.set(k, []).get(k)).push(l); }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  };

  const B = [];
  B.push({ type: "paragraph", text: `GÉNÉRÉ par \`node scripts/cassandra-rh.mjs classification\`${horodatage ? `, dernier passage ${horodatage}` : ""}. **Ne jamais le modifier à la main** : la prochaine génération écraserait la correction. Ce qui doit changer se change dans le code qui le produit, et le document suit tout seul — l'Article 24 appliqué au document qui décrit la classification.` });

  B.push({ type: "heading", level: 2, text: "0. Classification ou organisation ? Les deux existent" });
  B.push({ type: "paragraph", text: "**La CLASSIFICATION décrit ce qui EST.** Elle range : quel fichier est de quelle nature, quel rang il porte, dans quelle famille il travaille. Elle se MESURE sur le dépôt." });
  B.push({ type: "paragraph", text: "**L'ORGANISATION décide ce qui DOIT ÊTRE.** Qui dirige, quel poste exige quels documents, quel process encadre quoi. Elle se TRANCHE." });
  B.push({ type: "paragraph", text: "**Est-ce que l'organisation décide de la classification ?** Sur un point précis, oui — et c'est le seul. L'organisation décide des CRITÈRES (ce qu'il faut pour être Gardien sacré) ; la classification applique ces critères aux fichiers réels et dit qui les remplit. Elle ne choisit jamais qui entre dans quelle case : elle mesure. C'est pour ça que les deux documents existent, et que ni l'un ni l'autre n'absorbe son voisin — l'un pose la règle, l'autre compte." });

  B.push({ type: "heading", level: 2, text: `1. Les ${axes.length + 2} axes, et la question à laquelle chacun répond` });
  B.push({ type: "table", headers: ["Axe", "La question", "Comment il se remplit", "Couvre"], rows: [
    ["**TYPE**", "ce que le fichier EST", "se CONSTATE en lisant le fichier", `tous (${croise.total})`],
    ["**RANG**", "ce que le fichier VAUT", "se MÉRITE, ou se DÉDUIT du type", `${croise.couverture} % des fichiers`],
    ["**FAMILLE**", "ce sur quoi il travaille", "se décide, une par membre de l'équipe", `les ${Object.keys(categories).length} de l'équipe`],
    ["**CLASSES TRANSVERSES**", "ce qu'il sait FAIRE", "sonde sur le code, plusieurs par fichier", "tous"],
    ...axes.filter((a) => !["type"].includes(a.cle)).map((a) => [`*${a.cle}*`, a.quoi, `porté par \`${a.porteur}\``, "—"]),
  ] });
  B.push({ type: "paragraph", text: "**Pourquoi type et rang ne font pas doublon** : un type se constate, un rang se mérite. Une bibliothèque partagée n'a pas de rang d'équipe et n'en manque pas — elle n'a jamais candidaté." });

  B.push({ type: "heading", level: 2, text: "2. Comment type et rang se croisent — la règle, en une phrase" });
  B.push({ type: "highlight", text: "Le rang MÉRITÉ l'emporte toujours ; le type ne remplit que les cases que personne n'a remplies." });
  B.push({ type: "list", items: [
    "L'outil est inscrit au registre de l'équipe → il porte le rang qui y est écrit, quel que soit son type.",
    "Sinon, son TYPE décide : ceux qui servent sans avoir candidaté reçoivent « Socle », les autres reçoivent l'état de passage qui correspond à leur situation.",
    "Un rang par défaut, jamais : il ressemblerait trait pour trait à un rang gagné.",
  ] });
  B.push({ type: "note", text: "Cet ordre a été trouvé en faisant TOURNER la règle, pas en la relisant : le premier jet lisait le type d'abord et rétrogradait deux Gardiens sacrés en Socle parce qu'ils n'ont pas de commande à eux." });
  B.push({ type: "table", headers: ["Type de fichier", "Rang qu'il donne automatiquement"], rows: Object.entries(RANG_PAR_TYPE).map(([ty, cle]) => [code(ty), cle ? `**${rangs[cle]?.singulier ?? cle}**` : "aucun — le rang se lit dans le registre de l'équipe, et à défaut c'est un état de passage"]) });

  B.push({ type: "heading", level: 2, text: `3. L'échelle des rangs (${Object.keys(rangs).length}) — et comment on monte` });
  B.push({ type: "paragraph", text: "Un rang n'est pas une étiquette figée : c'est une position sur une échelle, avec une marche suivante et ce qu'il faut pour la franchir. Les trois états de passage (Sans porte, Sans fiche, Postulant) ne sont pas des rangs où l'on reste — ce sont des files d'attente avec un geste précis au bout." });
  B.push({ type: "table", headers: ["Rang", "Qui le remplit", "Ce que ça veut dire", "Marche suivante", "Ce qu'il faut pour la franchir"], rows: Object.values(rangs).map((r) => [
    `${r.emoji} **${r.label}**${r.nomProvisoire ? " *(nom provisoire)*" : ""}`,
    ({ equipe: "le registre de l'équipe", type: "le type du fichier", registre: "un registre tiers", "equipe-absent": "le type, en l'absence d'inscription" })[r.population] ?? "?",
    r.sens,
    r.promotionVers ? (rangs[r.promotionVers]?.singulier ?? r.promotionVers) : "—",
    r.condition ?? "*(non arrêté)*",
  ]) });
  B.push({ type: "table", headers: ["Rang", "Le poste de travail qui en découle"], rows: Object.values(rangs).map((r) => [r.singulier, posteDuRang[r.singulier] ?? "*(non arrêté)*"]) });
  B.push({ type: "paragraph", text: "**Les pièces d'un poste complet**, pour lire la colonne de droite :" });
  B.push({ type: "list", items: poste.map((p) => `**${p.quoi}** (\`${p.ou}\`) — pour : ${p.pourQui}`) });

  B.push({ type: "heading", level: 2, text: "4. L'indice de classification à facettes" });
  B.push({ type: "paragraph", text: "**Le nom n'est pas inventé** : ranger un objet sur plusieurs axes indépendants au lieu d'un seul arbre s'appelle une *classification à facettes*, et le code composite qui en résulte est une *notation* — en français de bibliothèque, un **indice**. Chaque position est une facette, chacune indépendante des autres, et l'indice entier se lit comme une adresse." });
  B.push({ type: "paragraph", text: `**Format : \`${FACETTES.join(" . ")}\`** — par exemple \`2.2.3.dh\`. Les trois premières facettes sont un rang dans une liste ; la quatrième est un nombre en base 36 dont chaque bit allumé est une classe (une seule facette répond « lesquelles ? » plutôt que « laquelle ? »).` });
  B.push({ type: "note", text: "Trois états dans une facette, jamais deux : un chiffre (la valeur), « - » (la facette ne s'applique pas — un fichier du Socle n'a pas de famille et n'en manque pas), « ? » (la valeur existe mais n'a pas été reconnue). Confondre les deux derniers ferait lire une absence légitime comme un trou." });
  B.push({ type: "paragraph", text: "**Pourquoi un indice plutôt que des icônes** : une icône se reconnaît, elle ne se trie pas, ne se cherche pas et ne se compare pas. Un indice fait les trois. Les deux cohabitent — l'icône pour l'œil, l'indice pour la machine et le tri." });
  B.push({ type: "table", headers: ["Facette", "Position", "Valeurs possibles, dans l'ordre"], rows: [
    ["type", "1", Object.keys(types).map((t, i) => `${i}=${t}`).join(" · ")],
    ["rang", "2", Object.values(rangs).map((r, i) => `${i}=${r.singulier}`).join(" · ")],
    ["famille", "3", croise.familles.map((f, i) => `${i}=${f}`).join(" · ")],
    ["classes", "4", classes.map((c, i) => `bit ${i}=${c.cle}`).join(" · ")],
  ] });

  B.push({ type: "heading", level: 2, text: `5. Chaque fichier : rang, famille, indice (${croise.total}, exhaustif)` });
  for (const [rang, liste] of grouper(croise.lignes, (l) => l.rang ?? "(aucun)")) {
    B.push({ type: "heading", level: 3, text: `${rangs[Object.keys(rangs).find((k) => rangs[k].singulier === rang)]?.emoji ?? "•"} ${rang} — ${liste.length}` });
    B.push({ type: "table", headers: ["Fichier", "Famille", "Indice"], rows: liste.sort((a, b) => a.chemin.localeCompare(b.chemin)).map((l) => [code(court(l.chemin)), l.famille ?? "—", code(l.indice)]) });
  }

  B.push({ type: "heading", level: 2, text: `6. Les types de fichier (${new Set(recensement.lignes.map((l) => l.type)).size}, exhaustif)` });
  for (const [ty, liste] of grouper(recensement.lignes, (l) => l.type)) {
    B.push({ type: "heading", level: 3, text: `${ty} — ${liste.length}` });
    B.push({ type: "note", text: types[ty] ?? "*(type non décrit dans le registre)*" });
    B.push({ type: "paragraph", text: liste.map((l) => code(court(l.chemin))).sort().join(" · ") });
  }

  B.push({ type: "heading", level: 2, text: `7. Les familles (${croise.familles.length}, exhaustif)` });
  B.push({ type: "paragraph", text: "Une famille dit **ce sur quoi on travaille**, jamais ce qu'on vaut. Les Gardiens sacrés ont désormais la leur, sur décision de l'utilisateur : le nom répète leur rang, et c'est assumé — une famille explicitement redondante se lit mieux qu'un troisième nom pour la même chose, et c'est l'endroit où on les cherche quand on ouvre l'organigramme." });
  for (const [f, liste] of grouper(Object.entries(categories).map(([slug, cat]) => ({ slug, f: familleDeLaCategorie(cat) ?? "(sans famille)" })), (x) => x.f)) {
    B.push({ type: "paragraph", text: `**${f}** — ${liste.length} : ${liste.map((x) => code(x.slug)).sort().join(" · ")}` });
  }

  B.push({ type: "heading", level: 2, text: `8. Les classes transverses (${classes.length}, exhaustif)` });
  B.push({ type: "paragraph", text: "Une classe dit **ce qu'un fichier sait faire**. Elle se cumule librement et traverse les rangs : un Gardien sacré et une bibliothèque peuvent porter la même." });
  for (const c of classes) {
    const liste = (recensement.parClasse?.[c.cle] ?? []).map(court).sort();
    B.push({ type: "heading", level: 3, text: `${c.libelle} — ${liste.length}` });
    B.push({ type: "note", text: c.quoi });
    B.push({ type: "paragraph", text: liste.length ? liste.map(code).join(" · ") : "*(aucun fichier ne porte cette classe aujourd'hui)*" });
  }

  B.push({ type: "heading", level: 2, text: "9. Ce qui reste ouvert" });
  const postulants = croise.lignes.filter((l) => l.rang === rangs.postulant?.singulier);
  if (postulants.length) B.push({ type: "paragraph", text: `**${postulants.length} fichiers sont Postulants** : documentés, lançables, et absents du registre de l'équipe. Ce n'est plus une case vide — c'est une file d'attente avec un geste connu au bout (les inscrire, ou déclarer qu'ils n'ont pas vocation à entrer).` });
  if (divergenceAxes.mesure !== "mesuré") B.push({ type: "note", text: `Axes du référentiel : 🚨 PAS MESURÉ — ${divergenceAxes.pourquoi}` });
  else if (divergenceAxes.divergent) B.push({ type: "note", text: `⚠️ Le référentiel et le code ne déclarent pas le même nombre d'axes — ${divergenceAxes.pourquoi}.` });
  else B.push({ type: "note", text: "Le référentiel et le code déclarent le même nombre d'axes." });

  return { mesurable: true, blocs: B, croise, divergenceAxes };
}

export function documentDeClassification(options = {}) {
  const r = blocsDeClassification(options);
  if (!r.mesurable) return { ...r, markdown: null };
  return { ...r, markdown: `# Classification générale de l'Agence Codex — le document officiel\n\n` + blocsVersMarkdown(r.blocs) };
}


// L'HEURE SE LIT, JAMAIS NE SE TAPE (Article 32).
function lireLHeure() {
  try { return new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC"; } catch { return null; }
}

function main() {
  printReliabilityNotice("le-classificateur");
  recordCliUsage("le-classificateur");
  const sub = process.argv[2];
  if (sub === "classification" || !sub) {
    const doc = documentDeClassification({ horodatage: lireLHeure() });
    if (!doc.mesurable) { console.log(`\n🚨 PAS MESURÉ — ${doc.pourquoi}`); return; }
    const cible = process.argv[3] ?? CLASSIFICATION_PATH;
    writeFileSync(join(ROOT, cible), doc.markdown, "utf8");
    try { mkdirSync(join(ROOT, "docs/le-classificateur"), { recursive: true }); } catch { /* déjà là */ }
    writeFileSync(join(ROOT, CLASSIFICATION_HTML), renderHtmlReport({
      tool: "le-classificateur",
      title: "Classification générale de l'Agence Codex",
      subtitle: "Le document officiel du rangement — types, rangs, familles, classes et indice à facettes, listes exhaustives",
      blocks: doc.blocs,
    }), "utf8");
    console.log(`\nÉcrit : ${cible}`);
    console.log(`Écrit : ${CLASSIFICATION_HTML}  ← la version de remise`);
    console.log(`${doc.croise.total} fichier(s) classés — couverture du rang : ${doc.croise.couverture} %, ${doc.croise.sansRang.length} sans rang.`);
    if (doc.divergenceAxes.divergent) console.log(`⚠️  ${doc.divergenceAxes.pourquoi}`);
    recordRegistryWrite?.("le-classificateur", cible);
    return;
  }
  console.log("\nUsage : node scripts/le-classificateur.mjs [classification] [chemin]");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
