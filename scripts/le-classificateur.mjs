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
  { cle: "scanne-le-depot", libelle: "(ct) 🔎 Les scanners - scanne le dépôt",
    quoi: "parcourt des fichiers pour y chercher quelque chose — la classe que l'utilisateur a nommée lui-même",
    sonde: (src) => /readdirSync|walk\s*\(|globSync/.test(src) },
  { cle: "rend-du-html", libelle: "(ct) 📄 Les rapporteurs HTML - rend un rapport HTML",
    quoi: "produit une page, donc quelque chose que l'utilisateur LIT vraiment",
    sonde: (src) => /renderHtmlReport/.test(src) },
  { cle: "tient-un-registre", libelle: "(ct) 🗃️ Les enregistreurs - tient un registre",
    quoi: "écrit une mémoire durable sur le disque — ce qui lui permet de se souvenir d'un passage à l'autre",
    sonde: (src) => /writeFileSync|appendFileSync/.test(src) },
  { cle: "coute-des-appels-api", libelle: "(ct) 💳 Les consommateurs d'API - coûte de vrais appels API",
    quoi: "consulte un modèle ou un service distant PAYANT : jamais lancé sans passer par Smart Conso API (Article 22)",
    // LA SONDE A ÉTÉ REFAITE LE 2026-09-26, sur 2 faux verdicts SUR 4 — la moitié d'une classe qui
    // commande l'Article 22. L'ancienne cherchait le mot « generativelanguage » n'importe où :
    //   · `check-house.mjs` sortait consommateur d'API parce qu'il MOQUE l'appel dans ses tests —
    //     une URL citée dans une assertion est exactement le contraire d'un appel réel ;
    //   · `le-classificateur.mjs` sortait consommateur d'API parce que la sonde SE TROUVAIT
    //     ELLE-MÊME : son propre motif contient le mot qu'elle cherche. Le bug auto-référentiel
    //     déjà payé une fois sur find-booster (tâche #182), refait à l'identique.
    // Le vrai signal est un appel AWAITÉ vers un hôte DISTANT : `await fetch(` suivi d'une URL
    // https qui ne soit pas localhost. `kpi-report` et `run-simulation` awaitent bien un fetch,
    // mais vers le serveur de dev local — ça ne coûte pas un centime d'API.
    sonde: (src) => MOTIF_APPEL_DISTANT.test(String(src)) },
  { cle: "porte-un-garde-fou-devolutivite", libelle: "(ct) 🌱 Les évolutifs - porte un garde-fou d'évolutivité",
    quoi: "contient une fonction qui refuse une liste recopiée à la main : elle compare une copie à sa source et crie quand les deux divergent (Article 24). C'est ce qui permet à un registre de grossir sans qu'une copie oubliée se périme en silence.",
    sonde: (src) => /function\s+find\w*(Diverg|Missing|Manquant|NonDeclar|Undeclared)\w*\s*\(/.test(src) },
  { cle: "declare-sa-fiabilite", libelle: "(ct) ⚠️ Les heuristiques - déclare sa marge d'erreur",
    quoi: "avertit qu'il peut se tromper avant de rendre un chiffre — l'exigence transverse de tous les outils heuristiques",
    sonde: (src) => /printReliabilityNotice/.test(src) },
  { cle: "conclut-en-plan-daction", libelle: "(ct) 🎯 Les pro-actifs - conclut par un plan d'action",
    quoi: "transforme ses constats en gestes (Article 28) au lieu de s'arrêter au rapport",
    sonde: (src) => /PLAN_ACTION_TITRE|buildPlanDaction|planDactionDepuisEcarts/.test(src) },
  { cle: "compte-son-usage", libelle: "(ct) 🪞 Les auto-conscients - enregistre son propre usage",
    quoi: "sait dire s'il a servi — sans quoi personne ne peut constater qu'un outil n'est jamais sollicité",
    sonde: (src) => /recordCliUsage/.test(src) },
  { cle: "refuse-de-mesurer", libelle: "(ct) 🧭 Les véridiques - sait répondre « pas mesuré »",
    quoi: "distingue « je n'ai rien trouvé » de « je n'ai pas pu regarder » (leçon L5) — la classe la plus discrète et la plus importante",
    sonde: (src) => /PAS MESURÉ|pas mesuré|mesurable\s*:\s*false/.test(src) },
];

// Un appel réseau RÉEL et DISTANT : `await fetch(` puis, dans la même expression, une URL https
// qui n'est pas localhost. Le `await` écarte les motifs cités dans un commentaire ou dans une
// expression régulière ; le `https` non-local écarte le serveur de développement.
export const MOTIF_APPEL_DISTANT = /await\s+fetch\s*\(\s*[`'"][^`'"\n]*https:\/\/(?!localhost|127\.0\.0\.1)/;

// CE QU'AUCUNE SONDE SUR `scripts/` NE PEUT VOIR, ET QUI SE DÉCLARE PLUTÔT QUE DE SE TAIRE.
// `check-spirit.mjs` coûte de vrais appels Gemini — la charte le dit noir sur blanc — mais il ne
// contient pas une ligne de réseau : il COMPILE `lib/lia.ts` et l'exécute, et l'appel vit là.
// Aucune lecture de `scripts/*.mjs` ne peut l'apercevoir. L'Article 24 autorise explicitement une
// liste tenue à la main quand sa nature manuelle est écrite à côté : la voici, avec la raison de
// chaque entrée. Une entrée sans raison serait un aveu déguisé, jamais une déclaration.
export const APPEL_API_DECLARE = {
  "scripts/check-spirit.mjs": "compile lib/lia.ts avec typescript puis l'exécute : l'appel Gemini vit dans lib/, hors de portée d'une sonde qui lit scripts/",
  "scripts/check-profile.mjs": "même mécanique que check-spirit, et son propre appel direct est en plus visible dans le fichier",
};

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

export function classesDuScript(source = "", classes = CLASSES_TRANSVERSES, chemin = null, declarees = APPEL_API_DECLARE) {
  const cles = classes.filter((c) => c.sonde(String(source))).map((c) => c.cle);
  // La déclaration manuelle S'AJOUTE à la sonde, elle ne la remplace jamais : sans quoi une
  // déclaration oubliée effacerait un constat mesuré, ce qui est le pire des deux mondes.
  if (chemin && declarees?.[chemin] && !cles.includes("coute-des-appels-api")) cles.push("coute-des-appels-api");
  return cles;
}

// Propage UNE classe le long du graphe d'import, jusqu'au point fixe : si A importe B et que B
// porte la classe, A la porte aussi. Le point fixe est nécessaire et pas décoratif — une chaîne
// de trois fichiers existe déjà dans ce dépôt, et s'arrêter au premier niveau raterait le bout.
export function propagerParDelegation(lignes, importeDe, cle) {
  const parChemin = new Map(lignes.map((l) => [l.chemin, l]));
  let bouge = true;
  let tours = 0;
  while (bouge && tours++ < 20) {
    bouge = false;
    for (const l of lignes) {
      if (l.classes.includes(cle)) continue;
      for (const cible of importeDe?.[l.chemin] ?? []) {
        if (parChemin.get(cible)?.classes?.includes(cle)) { l.classes.push(cle); bouge = true; break; }
      }
    }
  }
  return lignes;
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

  // Qui importe qui — dérivé des imports réels, jamais d'une carte tenue à la main. Le SENS de
  // l'arête est gardé en plus du simple compteur, parce qu'une classe peut se propager le long
  // du graphe : qui importe un consommateur d'API en consomme aussi (cf. `propagerParDelegation`).
  const importeurs = {};
  const importeDe = {};
  for (const [source, src] of Object.entries(sources)) {
    if (!src) continue;
    for (const m of String(src).matchAll(/from\s+["']\.\/([a-z0-9-]+\.mjs)["']|import\(["']\.\.\/scripts\/([a-z0-9-]+\.mjs)["']/g)) {
      const cible = `scripts/${m[1] ?? m[2]}`;
      importeurs[cible] = (importeurs[cible] ?? 0) + 1;
      (importeDe[source] ??= new Set()).add(cible);
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
      classes: src === null ? [] : classesDuScript(src, classes, c),
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
  // LA DÉLÉGATION SE PROPAGE, pour cette classe-là seulement (2026-09-26). `check-gemini-quota`
  // ne contient pas une ligne de réseau : il importe `api-providers`, qui appelle. La charte le
  // range pourtant explicitement parmi les actions coûteuses soumises à l'Article 22. Une sonde
  // qui ne regarde que le texte d'un fichier ne pouvait pas le voir — le graphe d'import, si.
  // Seule cette classe se propage : « scanne le dépôt » ou « rend un rapport HTML » restent des
  // faits locaux, et les propager rendrait la moitié du dépôt rapporteur HTML par contagion.
  propagerParDelegation(lignes, importeDe, "coute-des-appels-api");

  const parClasse = {};
  for (const cl of classes) parClasse[cl.cle] = lignes.filter((l) => l.classes.includes(cl.cle)).map((l) => l.chemin);

  return { mesurable: true, lignes, importeDe: Object.fromEntries(Object.entries(importeDe).map(([k, v]) => [k, [...v]])), parType, parClasse, total: lignes.length,
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
// LE GARDE-FOU DES FAUSSES BIBLIOTHÈQUES (2026-09-26)
// ══════════════════════════════════════════════════════════════════════════
//
// NÉ D'UNE VRAIE QUESTION, pas d'une idée : il a lu le document de classification et demandé, sur
// douze fichiers rangés en bibliothèque, « c'est normal ou on a loupé quelque chose dans leur
// conception ? ». La réponse honnête ne pouvait pas être une opinion : le type « bibliothèque »
// se CONSTATE (aucune porte d'entrée écrite + importé par d'autres), il ne juge rien. Mais parmi
// ces douze, certains portent bel et bien un `main()` en état de marche — ils ont une porte, elle
// n'est écrite nulle part. Ceux-là ne sont pas des bibliothèques : ce sont des commandes que
// personne ne peut lancer parce que personne ne sait qu'elles existent.
//
// C'est exactement la différence entre répondre une fois et pouvoir reposer la question demain
// (Article 31) : la mesure ci-dessous rend le même verdict sur les douze d'aujourd'hui et sur le
// prochain fichier qui tombera dans le même trou, sans que personne n'ait à y penser.
export const TYPES_BIBLIOTHEQUE = ["bibliotheque-partagee", "bibliotheque-solitaire"];

// Une porte RÉELLE dans le code : un `main()` défini, ou le garde de lancement qui COMPARE
// `import.meta.url` au chemin lancé — le seul motif qui distingue « lancé directement » de
// « importé ».
//
// LA PREMIÈRE VERSION CHERCHAIT `import.meta.url` TOUT COURT, ET ACCUSAIT CINQ FICHIERS À TORT :
// `report-template`, `execution-profile`, `gemini-key-health`, `memento-weight` et
// `serie-temporelle` l'emploient pour calculer un CHEMIN (`new URL("..", import.meta.url)`), ce
// que fait n'importe quelle bibliothèque honnête. Le garde a été resserré avant sa première
// livraison, parce qu'un garde qui accuse à tort cesse d'être lu (leçon L4) — et parce qu'il
// aurait répondu faux à la question même qui l'a fait naître.
export function porteDansLeCode(source = "") {
  const src = String(source);
  const aMain = /^(export\s+)?(async\s+)?function\s+main\s*\(/m.test(src) || /^const\s+main\s*=/m.test(src);
  // Le garde de lancement met TOUJOURS `import.meta.url` en regard de `process.argv` (ou de
  // `argv[1]`) : c'est la comparaison qui fait la porte, jamais la présence du mot.
  const aGardeDeLancement = /import\.meta\.url[^\n;]{0,120}argv|argv[^\n;]{0,120}import\.meta\.url/.test(src);
  return { aMain, aGardeDeLancement, lancable: aMain || aGardeDeLancement };
}

// Qui, dans le dépôt, LANCE VRAIMENT ce fichier ? On LIT les endroits où une commande peut vivre —
// jamais une liste recopiée à la main, qui se périmerait au premier outil ajouté (Article 24).
//
// LA DISTINCTION QUI FAIT TOUT, ET LE DÉPÔT L'AVAIT DÉJÀ PAYÉE UNE FOIS : une ligne de
// `docs/suivi/`, un rapport archivé, l'index d'un registre — ce sont des RÉCITS DE PASSAGES
// PASSÉS, pas des commandes. Le commentaire de tête de ce fichier raconte déjà l'erreur commise
// en construisant le typage : « il a accepté une commande de lancement trouvée dans un SUIVI,
// c'est-à-dire l'histoire d'un passage passé ». La première version de `quiLappelle()` l'a refaite
// à l'identique et l'a IMPRIMÉE dans le document : `integration-outil` y était « lancé par » une
// ligne de suivi, et `safe-export` par un dossier d'analyse daté. Deux fausses portes, dans le
// document même destiné à être gravé dans le marbre.
//
// Un LANCEUR VIVANT est donc l'un des deux, et rien d'autre :
//   · du CODE EXÉCUTÉ (`scripts/`, les crochets git, `package.json`) — il lancera encore demain ;
//   · un DOCUMENT NORMATIF (la charte, les règles de travail, le référentiel, un blueprint) — il
//     dit ce qu'il FAUT faire, au présent.
// Tout le reste de `docs/` est une mémoire : vraie, utile, et muette sur ce qui se lance encore.
export const LANCEURS_VIVANTS = [
  { prefixe: "scripts/", quoi: "code exécuté" },
  { prefixe: ".githooks/", quoi: "crochet git" },
  { prefixe: "package.json", quoi: "manifeste du projet" },
  { prefixe: "CLAUDE.md", quoi: "la charte" },
  { prefixe: "docs/regles-de-travail.md", quoi: "les règles de travail" },
  { prefixe: "docs/referentiel/", quoi: "le référentiel" },
];
export const MOTIF_BLUEPRINT = /^docs\/[a-z0-9-]+-blueprint\.md$/;

export function estLanceurVivant(chemin, lanceurs = LANCEURS_VIVANTS) {
  const c = String(chemin);
  if (MOTIF_BLUEPRINT.test(c)) return "blueprint générique";
  return lanceurs.find((l) => c === l.prefixe || c.startsWith(l.prefixe))?.quoi ?? null;
}

export function quiLappelle(chemin, { root = ROOT, lire = readFileSync, lireDossier = readdirSync, lanceurs = LANCEURS_VIVANTS } = {}) {
  const cible = `node ${String(chemin)}`;
  const vivants = [];
  const archives = [];
  const parcourir = (rel, profondeur = 0) => {
    if (profondeur > 3) return;
    let entrees = [];
    try { entrees = lireDossier(join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const sous = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { parcourir(sous, profondeur + 1); continue; }
      if (!/\.(md|mjs|json|sh)$/.test(e.name) || sous === chemin) continue;
      let contient = false;
      try { contient = lire(join(root, sous), "utf8").includes(cible); } catch { continue; }
      if (!contient) continue;
      (estLanceurVivant(sous, lanceurs) ? vivants : archives).push(sous);
    }
  };
  for (const l of [...new Set([...lanceurs.map((x) => x.prefixe.replace(/\/$/, "")), "docs"])]) {
    if (l.includes(".") && !l.includes("/")) { try { if (lire(join(root, l), "utf8").includes(cible)) vivants.push(l); } catch { /* absent */ } }
    else parcourir(l);
  }
  // Les deux listes sortent ENSEMBLE : une archive n'est pas une porte, mais l'effacer ferait
  // croire que rien n'a jamais lancé ce fichier, ce qui est une autre erreur (leçon L5).
  return { vivants: [...new Set(vivants)].sort(), archives: [...new Set(archives)].sort() };
}

export function bibliothequesLancables({ recensement = null, root = ROOT, lire = readFileSync, types = TYPES_BIBLIOTHEQUE } = {}) {
  if (!recensement?.mesurable) {
    return { mesurable: false, pourquoi: recensement?.pourquoi ?? "aucun recensement fourni — sans lire les fichiers, aucune porte n'est observable" };
  }
  const suspects = [];
  const vraies = [];
  for (const l of recensement.lignes) {
    if (!types.includes(l.type)) continue;
    let src = "";
    try { src = lire(join(root, l.chemin), "utf8"); } catch { continue; }
    const porte = porteDansLeCode(src);
    // Le VERDICT se nuance, il ne se contente pas de « suspect ». Une porte dans le code sans
    // commande écrite nulle part est un trou ; la même porte appelée par le crochet post-commit
    // ou par un autre outil est un choix de conception, pas un oubli. Confondre les deux ferait
    // exactement ce que la question demandait d'éviter : accuser une conception saine.
    const appels = porte.lancable ? quiLappelle(l.chemin, { root, lire }) : { vivants: [], archives: [] };
    const ligne = { chemin: l.chemin, type: l.type, ...porte, appelants: appels.vivants, archives: appels.archives,
      verdict: !porte.lancable ? "vraie bibliothèque"
        : appels.vivants.length ? "porte réelle, atteinte par du code ou un document normatif — simplement jamais écrite comme commande"
        : appels.archives.length ? "PORTE ORPHELINE : rien de vivant ne le lance — seules des archives gardent la trace d'un passage passé"
        : "PORTE ORPHELINE : le fichier est lançable et rien au monde ne le lance" };
    (porte.lancable ? suspects : vraies).push(ligne);
  }
  const orphelines = suspects.filter((x) => !x.appelants.length);
  return { mesurable: true, suspects, vraies, orphelines, examines: suspects.length + vraies.length };
}

// ══════════════════════════════════════════════════════════════════════════
// ZONE C — les rangs, et le croisement type × rang
// ══════════════════════════════════════════════════════════════════════════

// LA FAMILLE « HORS AGENCE » (2026-09-26, sa décision : « on devrait créer une famille "hors
// agence" juste pour couvrir tout et ranger les hors agences quelque part »). Elle REDIT le rang,
// exactement comme la famille des Gardiens sacrés, et pour la même raison assumée : une famille
// explicitement redondante se lit mieux qu'un troisième nom pour la même chose.
//
// Ce qu'elle ferme, et ce n'était pas cosmétique : la famille est le seul axe qui ne couvrait PAS
// tout le dépôt. Les six fichiers Hors Agence sortaient avec « — » dans la colonne Famille, une
// case vide qui se lit comme un oubli alors que c'est une situation déclarée. Une case vide ne dit
// jamais si personne n'a rempli ou si rien n'était à remplir (leçon L5, appliquée à une colonne).
//
// DEUX INTERDITS, énoncés par lui et portés ici plutôt que par la mémoire d'un agent :
//   · ils ne peuvent pas ÉVOLUER — `promotionVers: null` le dit déjà côté rang ;
//   · aucun outil de l'Agence ne peut les REJOINDRE — c'est `entreeInterdite`, et c'est le sens
//     même du rang : on n'est pas hors Agence parce qu'on a démérité, mais parce qu'on sert le
//     produit. Aucun mérite ni démérite n'y mène.
// ══════════════════════════════════════════════════════════════════════════
// L'ÉCHELLE DE VITALITÉ (2026-09-26, tâche #906 — sa décision en fenêtre, et ses quatre niveaux
// écrits dans ses mots : « vital (sans lui l'Agence ne tourne pas), essentiel (sans lui elle tourne
// mais perd une garantie), utile (il fait gagner du temps), optionnel (confort ou cas particulier) »).
//
// À QUOI ELLE SERT, ET CE N'EST PAS UN CLASSEMENT DE PLUS : elle répond à la question de l'export.
// Quatre-vingt-huit fichiers ne partent pas en même temps ; il faut savoir lesquels d'abord. Un
// « vital » oublié dans un export rend le paquet inutilisable au premier commit ; un « optionnel »
// emporté par habitude alourdit le paquet sans rien garantir.
//
// ELLE SE DÉRIVE, ELLE NE SE DÉCLARE PAS (Article 24). Aucun fichier ne porte son niveau écrit en
// tête : le niveau se lit sur ce que le dépôt FAIT du fichier — qui le lance, qui l'importe, ce
// qu'il garantit. Une liste écrite à la main aurait été fausse au premier script ajouté, et le
// dépôt en a gagné plusieurs cette semaine.
//
// POURQUOI L'ORDRE DES NIVEAUX EST UN ORDRE, et pas un ensemble d'étiquettes : le premier qui
// reconnaît le fichier gagne. Un garde-fou lancé par le crochet est VITAL, pas essentiel — il
// s'exécute à chaque commit, donc l'Agence s'arrête sans lui. Prendre le niveau le plus fort
// d'abord évite qu'un fichier soit rangé sous sa qualité la plus faible.
// LES QUATRE NIVEAUX SE LISENT SUR DES QUESTIONS DIFFÉRENTES, jamais sur une même échelle de
// dépendance — et c'est une correction faite après avoir MESURÉ la première version, qui rangeait
// 88 % du parc en « vital ou essentiel » et ne discriminait donc rien. La cause : « quelqu'un
// l'importe » est vrai de 71 fichiers sur 88 dans ce dépôt. Une échelle où presque tout est en
// haut ne dit pas que tout est vital, elle dit que le critère est mauvais.
//
// LE CRITÈRE QUI DISCRIMINE VRAIMENT : est-ce que ce fichier tourne DANS LA BOUCLE QUOTIDIENNE ?
// Un crochet git s'exécute à chaque commit, `package.json` à chaque build — et tout ce que ces
// points d'entrée importent, transitivement, part avec eux. C'est la chaîne sans laquelle l'Agence
// s'arrête, au sens littéral de sa définition : « sans lui l'Agence ne tourne pas ».
export const POINTS_D_ENTREE_QUOTIDIENS = ["crochet git", "package.json"];

// LE CROCHET LUI-MÊME EST UN POINT D'ENTRÉE, et l'oublier était le premier faux verdict de cette
// échelle : `hooks/pre-commit` et `hooks/post-commit` sortaient « optionnel », c'est-à-dire
// « confort ou cas particulier », alors qu'ils SONT la boucle quotidienne. La sonde cherchait qui
// est LANCÉ PAR un crochet, et un crochet n'est lancé par aucun crochet — il est lancé par git.
export const MOTIF_FICHIER_CROCHET = /^scripts\/hooks\//;

// LA SUITE DE TESTS FAUSSE LA CHAÎNE, ET IL A FALLU LA MESURER POUR LE VOIR. Première version de
// la fermeture transitive : 77 fichiers sur 88 « vitaux », 0 « essentiel ». Le coupable n'est pas
// le critère mais UN fichier : `check-house.mjs` est lancé par le crochet et importe presque tout
// le dépôt — pour le TESTER. Un import de test n'est pas une dépendance d'exécution : retirer un
// outil de l'export ne casse pas la boucle, ça retire un test de la suite.
//
// LA FRONTIÈRE EST DÉRIVÉE, PAS LISTÉE (Article 24) : est une suite de tests tout fichier qui
// importe au moins la moitié du parc. Écrire « check-house.mjs » en dur ici aurait été faux le
// jour où la suite se scinde en deux, et ce dépôt a déjà scindé plusieurs outils.
export const PART_MINIMUM_SUITE_DE_TEST = 0.5;

export function findSuitesDeTest({ importeDe = {}, total = 0, part = PART_MINIMUM_SUITE_DE_TEST } = {}) {
  if (!total) return [];
  return Object.entries(importeDe)
    .filter(([, cibles]) => (cibles?.length ?? 0) >= total * part)
    .map(([chemin, cibles]) => ({ chemin, importe: cibles.length, part: Math.round((cibles.length / total) * 100) }));
}

// La fermeture transitive du graphe d'imports, depuis les points d'entrée. On la calcule ici plutôt
// que de réutiliser `propagerParDelegation()` : celle-ci propage une classe des IMPORTÉS vers les
// IMPORTEURS (« j'appelle quelqu'un qui coûte des appels API, donc j'en coûte »), et la vitalité va
// dans l'autre sens (« je suis appelé par la boucle, donc j'en fais partie »). Deux propagations
// opposées : les confondre aurait rendu vital tout ce qui importe un fichier vital, c'est-à-dire
// presque tout le dépôt.
export function chaineQuotidienne({ lignes = [], importeDe = {}, entrees = POINTS_D_ENTREE_QUOTIDIENS, motifCrochet = MOTIF_FICHIER_CROCHET, ignorerLesSuitesDeTest = true } = {}) {
  // LA SUITE DE TESTS RESTE DANS LA CHAÎNE (elle tourne bien à chaque commit) mais ses imports NE
  // PROPAGENT PAS : elle est un point d'arrivée, jamais un relais. Sans ça, elle rend vital tout ce
  // qu'elle teste, c'est-à-dire tout.
  const graphe = { ...importeDe };
  if (ignorerLesSuitesDeTest) {
    for (const s of findSuitesDeTest({ importeDe, total: lignes.length })) delete graphe[s.chemin];
  }
  importeDe = graphe;
  const dans = new Set(lignes
    .filter((l) => motifCrochet.test(l.chemin) || (l.portes ?? []).some((p) => entrees.includes(p)))
    .map((l) => l.chemin));
  let bouge = true;
  let tours = 0;
  while (bouge && tours++ < 50) {
    bouge = false;
    for (const chemin of [...dans]) {
      for (const cible of importeDe[chemin] ?? []) {
        if (!dans.has(cible)) { dans.add(cible); bouge = true; }
      }
    }
  }
  return dans;
}

export const VITALITE = [
  { cle: "vital", icone: "🔴", quoi: "sans lui l'Agence ne tourne pas",
    pourquoi: "il est dans la boucle quotidienne : c'est un crochet git, ou il est lancé par un crochet ou par package.json, ou l'un d'eux l'importe même indirectement",
    detecte: (l, ctx) => ctx?.chaine?.has(l.chemin) ?? false },
  { cle: "essentiel", icone: "🟠", quoi: "sans lui elle tourne, mais perd une garantie",
    pourquoi: "il porte un garde-fou d'évolutivité : l'Agence continue sans lui, mais une promesse cesse d'être vérifiée",
    detecte: (l) => (l.classes ?? []).some((c) => /garde-fou/.test(c)) },
  { cle: "utile", icone: "🟡", quoi: "il fait gagner du temps, à la demande",
    pourquoi: "une commande de lancement est écrite quelque part : quelqu'un peut s'en servir, mais rien ne casse s'il disparaît",
    detecte: (l) => (l.portes ?? []).some((p) => /commande de lancement est écrite|ligne de commande/.test(p)) },
  { cle: "optionnel", icone: "⚪", quoi: "confort ou cas particulier",
    pourquoi: "personne ne le lance, aucune commande n'est écrite pour lui, et il ne garantit rien",
    detecte: () => true },
];

// UN FICHIER ILLISIBLE N'EST PAS UN FICHIER OPTIONNEL — et c'est la distinction qui empêche le pire
// verdict possible ici : « rien ne dépend de lui » rendu sur un fichier qu'on n'a pas pu ouvrir.
// Les deux se ressemblent trait pour trait dans un tableau, et l'un dit de le laisser, l'autre de
// regarder (leçon L5). Il n'y a donc pas cinq niveaux — il y a quatre niveaux et un aveu.
export function vitaliteDuFichier(ligne = {}, { echelle = VITALITE, chaine = new Set() } = {}) {
  if (ligne.illisible) {
    return { mesurable: false, niveau: null,
      pourquoi: "le fichier n'a pas pu être lu : sa vitalité n'a pas été mesurée, ce qui n'est jamais la même chose que « rien ne dépend de lui »" };
  }
  const n = echelle.find((x) => { try { return x.detecte(ligne, { chaine }); } catch { return false; } }) ?? echelle[echelle.length - 1];
  return { mesurable: true, niveau: n.cle, icone: n.icone, quoi: n.quoi, pourquoi: n.pourquoi };
}

export function vitaliteDuParc({ recensement = null, echelle = VITALITE, recenser = recenserLesScripts } = {}) {
  const rec = recensement ?? recenser();
  if (!rec?.mesurable) return { mesurable: false, pourquoi: rec?.pourquoi ?? "recensement indisponible" };
  const chaine = chaineQuotidienne({ lignes: rec.lignes, importeDe: rec.importeDe ?? {} });
  const parNiveau = Object.fromEntries(echelle.map((n) => [n.cle, []]));
  const nonMesures = [];
  for (const l of rec.lignes) {
    const v = vitaliteDuFichier(l, { echelle, chaine });
    if (!v.mesurable) { nonMesures.push({ chemin: l.chemin, pourquoi: v.pourquoi }); continue; }
    parNiveau[v.niveau].push({ chemin: l.chemin, importeurs: l.importeurs ?? 0, lignes: l.lignes ?? 0 });
  }
  const mesures = Object.values(parNiveau).reduce((a, v) => a + v.length, 0);
  return {
    mesurable: true, total: rec.lignes.length, mesures, parNiveau, nonMesures, chaine: chaine.size,
    suitesDeTest: findSuitesDeTest({ importeDe: rec.importeDe ?? {}, total: rec.lignes.length }),
    chaineAvecLesTests: chaineQuotidienne({ lignes: rec.lignes, importeDe: rec.importeDe ?? {}, ignorerLesSuitesDeTest: false }).size,
    // LE POIDS EN LIGNES PAR NIVEAU, parce que la question de l'export est « combien de code doit
    // partir en premier ? », et que compter des fichiers répond mal : un vital de 12 000 lignes et
    // un vital de 40 lignes ne coûtent pas la même chose à emporter.
    lignesParNiveau: Object.fromEntries(echelle.map((n) => [n.cle, parNiveau[n.cle].reduce((a, f) => a + (f.lignes ?? 0), 0)])),
    horsPortee: "la vitalité est DÉRIVÉE de ce que le dépôt fait du fichier (qui le lance, ce qu'il garantit) — jamais déclarée en tête de fichier. Un outil excellent que personne n'a encore branché sort « optionnel », et c'est exact : il n'est pas encore vital, il est prêt à l'être.",
  };
}

export function formatVitaliteLines(v, { echelle = VITALITE } = {}) {
  if (!v?.mesurable) return [`VITALITÉ DU PARC : PAS MESURÉE — ${v?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== VITALITÉ DU PARC — ${v.mesures} fichier(s) mesuré(s) sur ${v.total} ===`];
  for (const n of echelle) {
    const g = v.parNiveau[n.cle] ?? [];
    const part = v.mesures ? Math.round((g.length / v.mesures) * 100) : 0;
    l.push(`  ${n.icone} ${n.cle.toUpperCase().padEnd(10)} ${String(g.length).padStart(3)} fichier(s) · ${String(part).padStart(3)} % · ${String(v.lignesParNiveau[n.cle]).padStart(6)} lignes — ${n.quoi}`);
    l.push(`     ${n.pourquoi}`);
  }
  // LES DEUX LECTURES, CÔTE À CÔTE — parce que l'écart entre elles EST le résultat le plus parlant.
  if (v.suitesDeTest?.length) {
    l.push(`  ↳ Chaîne d'EXÉCUTION : ${v.chaine} fichier(s). Chaîne avec les imports de test : ${v.chaineAvecLesTests}.`);
    l.push(`     L'écart vient de ${v.suitesDeTest.map((s) => `${s.chemin} (importe ${s.part} % du parc)`).join(" · ")} — un import de TEST n'est pas une dépendance d'exécution.`);
  }
  if (v.nonMesures.length) l.push(`  ❓ NON MESURÉS : ${v.nonMesures.length} — ${v.nonMesures.map((x) => x.chemin).join(", ")} (illisibles, jamais rangés d'office en « optionnel »)`);
  l.push(`  HORS PORTÉE : ${v.horsPortee}`);
  return l;
}

export const FAMILLE_HORS_AGENCE = "(f) 🚧 Les Hors Agence - servent le produit, jamais l'outillage";

export const ORG_RANKS = {
  socle: { label: "Socle", singulier: "Socle", emoji: "🧱", population: "type", echelon: null,
    promotionVers: null, condition: "AUCUNE promotion, et ce n'est pas un plafond : il n'a jamais candidaté. Le promouvoir serait lui inventer une ambition qu'il n'a pas.",
    sens: "n'est pas membre de l'équipe : c'est le sol sur lequel tout le monde marche" },
  cadre: { label: "Agents Cadre", singulier: "Agent Cadre", emoji: "👔", population: "equipe", echelon: 6,
    promotionVers: null, condition: "SOMMET de l'échelle : il n'y a rien au-dessus. Et on n'y monte pas par mérite mesuré — c'est une décision d'organisation, donc celle de l'utilisateur. Le rang se définit par un pouvoir précis : convoquer les autres et rendre un verdict sur eux.",
    sens: "dirigent — une fonction dans l'organigramme, jamais un badge de qualité en plus" },
  gardien: { label: "Gardiens sacrés du code", singulier: "Gardien sacré du code", emoji: "🛡️", population: "equipe", echelon: 5,
    promotionVers: null, condition: "SOMMET de la qualité : aucun rang de mérite au-dessus. Le seul mouvement restant est vers Agent Cadre, qui n'est pas une promotion mais une décision d'organisation.",
    sens: "délivrent un vrai scan de qualité ET tournent automatiquement à CHAQUE commit" },
  // MEMBRE CERTIFIÉ CLASSIQUE (2026-09-26, décision de l'utilisateur sur le bloc B des 22). Ce rang
  // EXISTAIT déjà comme statut dans la table maîtresse depuis le 2026-09-21 — il n'avait simplement
  // jamais rejoint le dictionnaire des rangs, ce qui le rendait invisible à tout ce qui compte les
  // rangs. Il porte un vrai badge, et sa dispense est précise : aucune connaissance propre au projet
  // à documenter à part, donc ni fiche, ni blueprint, ni registre imposés d'office.
  membreClassique: { label: "Membres classiques", singulier: "Membre classique", emoji: "🥈", population: "equipe", echelon: 3,
    promotionVers: "membre", condition: "acquérir une connaissance propre au projet — et ça ne se décrète pas : ça se constate le jour où l'outil se met à savoir quelque chose que lui seul sait.",
    sens: "un vrai membre badgé, dont la valeur est d'APPELER et d'AGRÉGER ce que les autres disent déjà — deux obligations seulement, parce qu'il n'a rien de propre à documenter à part" },
  membre: { label: "Membres premium", singulier: "Membre premium", emoji: "🥇", population: "equipe", echelon: 4,
    promotionVers: "gardien", condition: "remplir le critère DOUBLE de l'Article 20 : un vrai scan de qualité du CODE, ET gratuit à chaque commit. Vers Agent Cadre, ce n'est pas une promotion mécanique mais une décision d'organisation, donc celle de l'utilisateur.",
    sens: "câblage complet vérifié : table maîtresse, menu, instanciation, registre, blueprint" },
  // TROIS RANGS HORS ÉQUIPE PLUTÔT QU'UN SEUL (2026-09-26, sa demande : « pourquoi pas 2 ou 3 rangs
  // à part ? pour couvrir les différents types de rangs non documentés, et distinguer ceux qui
  // pourraient évoluer »). Il avait raison, et la mesure le confirme : trois situations bien
  // distinctes se cachaient sous une seule étiquette, et elles n'appellent pas du tout le même
  // geste. Les trois sont des ÉTATS DE PASSAGE, jamais des rangs où l'on reste — c'est ce que dit
  // leur `promotionVers`. NOMS PROVISOIRES, déclarés comme tels : il nomme, jamais moi (#200).
  postulant: { label: "Postulants", singulier: "Postulant", emoji: "🚪", population: "equipe-absent", nomProvisoire: true, echelon: 2,
    promotionVers: "membre", condition: "l'inscrire au registre de l'équipe, et lui donner le poste de travail d'un Membre",
    sens: "documenté ET lançable, mais absent du registre de l'équipe : le plus proche de l'adhésion, à une décision près" },
  sansFiche: { label: "Sans fiche", singulier: "Sans fiche", emoji: "🏷️", population: "type", nomProvisoire: true, echelon: 1,
    promotionVers: "postulant", condition: "lui écrire une fiche — un document, n'importe lequel, qui le nomme",
    sens: "lançable, mais nommé par aucun document du dépôt : soit une commande qu'on a oublié de documenter, soit un script jetable qui a survécu" },
  sansPorte: { label: "Sans porte", singulier: "Sans porte", emoji: "🕳️", population: "type", nomProvisoire: true, echelon: 0,
    promotionVers: "sansFiche", condition: "lui écrire une commande de lancement quelque part, ou le supprimer",
    sens: "personne ne l'importe et aucune commande de lancement n'est écrite nulle part : il ne peut être lancé que par quelqu'un qui sait déjà — l'état le plus fragile du dépôt" },
  emetteur: { label: "Émetteurs de rapport non certifiés", singulier: "Émetteur de rapport", emoji: "📝", population: "registre", nomProvisoire: true, echelon: null,
    promotionVers: null, condition: "EN ATTENTE DE NOM (fournée #200) : sa marche suivante se décidera avec son nom, et pas avant — décider d'une promotion pour un rang qu'on ne sait pas encore nommer serait décider dans le vide.",
    sens: "produisent un vrai rapport lu par un humain sans être membres — rang en attente de nommage" },

  // HORS AGENCE (2026-09-26, décision de l'utilisateur sur le bloc A). Le §5 du référentiel
  // déclarait DÉJÀ trois catégories d'exclusion définitive (les Personnages, le Moteur du jeu, le
  // code tiers) — il en manquait une quatrième, et c'est elle qui retenait cinq scripts dans une
  // file d'attente où ils n'avaient rien à faire : ceux qui LANCENT le produit au lieu de
  // l'analyser. Liste volontairement tenue à la main, ce que l'Article 24 autorise explicitement
  // quand la nature manuelle est écrite à côté : « lance le produit » ne se lit dans aucune sonde.
  horsAgence: { label: "Hors de l'Agence", singulier: "Hors Agence", emoji: "🚧", population: "declaration", echelon: null,
    famille: FAMILLE_HORS_AGENCE, entreeInterdite: true, promotionVers: null, condition: "AUCUNE, et c'est le sens même du rang : ces scripts servent le PRODUIT, pas l'outillage qui le vérifie. Les équiper d'une fiche et d'un blueprint reviendrait à recruter le camion de livraison.",
    sens: "lance, sauvegarde ou archive le produit — testé comme n'importe quel code, mais jamais un travailleur de l'Agence (§5 du référentiel, 4e catégorie)" },
};

// L'ÉCHELLE SE LIT DANS L'ORDRE OÙ ON LA MONTE (2026-09-26, sa relecture : « assure-toi que tout
// est rangé dans l'ordre, à sa place »). Le tableau des rangs sortait dans l'ordre de déclaration
// du code, ce qui mettait le Socle en tête d'une ÉCHELLE qu'il ne monte pas et plaçait le Membre
// classique avant le Membre premium sans dire lequel est au-dessus. L'ordre se DÉRIVE désormais du
// champ `echelon` : un rang qui n'est pas sur l'échelle (`echelon: null`) sort après, groupé, parce
// que le Socle, l'Émetteur et les Hors Agence ne sont pas des marches — ce sont des situations.
export function rangsOrdonnes(rangs = ORG_RANKS) {
  const entrees = Object.entries(rangs).map(([cle, r]) => ({ cle, ...r }));
  const surLEchelle = entrees.filter((r) => Number.isInteger(r.echelon)).sort((a, b) => a.echelon - b.echelon);
  // Hors échelle, l'ordre suit celui du code — mais les Hors Agence ferment la marche, sur sa
  // décision explicite : « Les hors agence sont tout en bas de tableau des rangs ».
  const horsEchelle = entrees.filter((r) => !Number.isInteger(r.echelon));
  const dernier = horsEchelle.filter((r) => r.cle === "horsAgence");
  return [...surLEchelle, ...horsEchelle.filter((r) => r.cle !== "horsAgence"), ...dernier];
}

// QUI REMPLIT UN RANG — la traduction d'une `population` en français. Elle vivait en ligne dans le
// générateur avec un `?? "?"` au bout, et ce point d'interrogation est SORTI DANS LE DOCUMENT :
// « Hors de l'Agence | Qui le remplit : ? », parce que la population « declaration » n'y figurait
// pas. Un « ? » imprimé dans un document de référence se lit comme un trou de connaissance alors
// que c'est un trou de table de correspondance. Elle est nommée ici, et un cas non traduit le DIT.
export const QUI_REMPLIT = {
  equipe: "le registre de l'équipe",
  type: "le type du fichier",
  registre: "un registre tiers",
  "equipe-absent": "le type, en l'absence d'inscription",
  declaration: "une déclaration écrite à la main, avec sa raison",
};
export function quiRemplit(population, table = QUI_REMPLIT) {
  return table[population] ?? `population « ${population} » non traduite — à ajouter à QUI_REMPLIT`;
}

// LES ICÔNES DOIVENT ÊTRE UNIQUES DANS UNE MÊME FACETTE, sans quoi la traduction de l'indice en
// série d'icônes n'est plus réversible : deux rangs portant 🎖️ rendaient le même symbole pour
// « Agent Cadre » et « Membre classique », et deux types 🧱 pour « Socle » et « Sans porte ».
// Entre facettes, en revanche, une icône partagée est légitime — la POSITION désambiguïse, et la
// famille des Gardiens sacrés redit volontairement l'icône de leur rang (décision de l'utilisateur).
export function iconesEnCollision({ types = ICONE_PAR_TYPE, rangs = ORG_RANKS, familles = [], classes = CLASSES_TRANSVERSES } = {}) {
  const collisionsDe = (paires) => {
    const vus = new Map();
    for (const [nom, icone] of paires) {
      if (!icone) continue;
      (vus.get(icone) ?? vus.set(icone, []).get(icone)).push(nom);
    }
    return [...vus.entries()].filter(([, noms]) => noms.length > 1).map(([icone, noms]) => ({ icone, noms }));
  };
  return {
    mesurable: true,
    type: collisionsDe(Object.entries(types)),
    rang: collisionsDe(Object.values(rangs).map((r) => [r.singulier, r.emoji])),
    famille: collisionsDe(familles.map((f) => [f, emojiDuLibelle(f)])),
    classes: collisionsDe(classes.map((c) => [c.cle, emojiDuLibelle(c.libelle)])),
  };
}

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
// UN MEMBRE DU REGISTRE PEUT N'AVOIR AUCUN FICHIER À LUI, et ça s'est vu en vérifiant une addition
// qui ne tombait pas juste (2026-09-26) : le document annonçait « les 57 de l'équipe + les 6 Hors
// Agence » pour un total mesuré de 62, et 57 + 6 = 63. Un chiffre présenté comme une somme doit
// s'additionner, sinon c'est le lecteur qui découvre l'erreur — et il l'a découverte.
// Le manquant est `find-deep-booster` : un vrai membre, avec un rang et une famille, dont le code
// vit à l'intérieur de `find-booster.mjs`. Ce n'est pas un bug, c'est un fait à dire.
export function membresSansFichier({ categories = AGENT_CATEGORIES, croise = null, slugs = null } = {}) {
  if (!croise?.mesurable) return { mesurable: false, pourquoi: "aucun croisement fourni — sans les fichiers réels, l'absence d'un fichier n'est pas observable" };
  slugs ??= (() => { try { return slugsParScript(readFileSync(join(ROOT, "CLAUDE.md"), "utf8")); } catch { return {}; } })();
  const couverts = new Set();
  for (const l of croise.lignes) {
    const declare = slugs[l.chemin];
    const devine = String(l.chemin).replace(/^scripts\//, "").replace(/\.(mjs|sh)$/, "");
    if (categories[declare]) couverts.add(declare);
    else if (categories[devine]) couverts.add(devine);
  }
  const sansFichier = Object.keys(categories).filter((slug) => !couverts.has(slug));
  return { mesurable: true, inscrits: Object.keys(categories).length, avecFichier: couverts.size, sansFichier };
}

export function croiserTypeEtRang({ recensement = null, categories = AGENT_CATEGORIES, rangs = ORG_RANKS, slugs = null } = {}) {
  slugs ??= (() => { try { return slugsParScript(readFileSync(join(ROOT, "CLAUDE.md"), "utf8")); } catch { return {}; } })();
  if (!recensement?.mesurable) return { mesurable: false, pourquoi: recensement?.pourquoi ?? "aucun recensement fourni — sans lire les fichiers, aucun croisement n'est mesurable" };
  // LA FAMILLE ET L'INDICE VOYAGENT AVEC LA LIGNE (2026-09-26) : sans la famille attachée ici, la
  // troisième facette de l'indice sortait « ? » sur les 87 fichiers — un code à trou qui se lit
  // comme un code complet, ce qui est pire qu'un code absent.
  // La famille d'un rang (aujourd'hui le seul cas : Hors Agence) compte comme une famille à part
  // entière de l'indice — sans quoi la troisième facette sortirait « - » sur six fichiers qui ONT
  // une famille, ce qui est un faux « ne s'applique pas ».
  const famillesDesRangs = Object.values(rangs).map((r) => r.famille).filter(Boolean);
  // Le rang circule sous son libellé SINGULIER, jamais sous sa clé : la lookup se fait donc sur le
  // singulier, exactement comme POSTE_PAR_RANG. Un `rangs[rang]` direct rendait `undefined` en
  // silence — six familles perdues sans la moindre erreur (leçon L24 : ouvrir avant d'accuser).
  const familleDuRang = (singulier) => Object.values(rangs).find((r) => r.singulier === singulier)?.famille ?? null;
  const famillesTriees = [...new Set([...Object.values(categories).map(familleDeLaCategorie), ...famillesDesRangs].filter(Boolean))].sort();
  const familleDuChemin = (chemin) => {
    const declare = slugs[chemin];
    const devine = String(chemin).replace(/^scripts\//, "").replace(/\.(mjs|sh)$/, "");
    const cat = categories[declare] ?? categories[devine];
    return cat ? familleDeLaCategorie(cat) : null;
  };
  const lignes = recensement.lignes.map((l) => {
    const r = rangDuFichier(l, { categories, rangs, slugs });
    const famille = familleDuChemin(l.chemin) ?? familleDuRang(r.rang) ?? null;
    const base = { chemin: l.chemin, type: l.type, classes: l.classes ?? [], famille, ...r };
    return { ...base,
      indice: indiceDeClassification(base, { rangs, familles: famillesTriees, rang: r.rang }),
      icones: indiceEnIcones(base, { rangs, rang: r.rang }) };
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
// L'INDICE EN ICÔNES — la quatrième colonne qu'il a demandée (2026-09-26 : « tu n'as pas trouvé de
// solution pour ajouter une 4e colonne dans le tableau "indice" avec une traduction de l'indice en
// série d'icônes ? »). Si, et la solution est venue de SA propre décision du même message : en
// donnant un emoji à chaque famille et à chaque classe transverse, il a mis l'icône DANS le nom.
// Elle se LIT donc, elle ne se recopie pas dans une seconde table qui divergerait (Article 24) —
// seuls les types manquaient, parce que ce sont des constats de forme et non des noms choisis.
//
// À quoi ça sert, et c'est l'inverse de l'indice, jamais son remplaçant : l'indice se trie, se
// cherche et se compare ; la série d'icônes se reconnaît d'un coup d'œil sans rien décoder. Les
// deux disent la même chose et voyagent ensemble.
export const ICONE_PAR_TYPE = {
  crochet: "🪝",
  "filet-de-securite": "🕸️",
  "commande-documentee": "⌨️",
  "commande-sans-fiche": "❓",
  "bibliotheque-partagee": "📚",
  "bibliotheque-solitaire": "📕",
  "infrastructure-shell": "🐚",
  "execution-directe-non-documentee": "🔒",
};

// L'emoji d'un libellé est celui qu'il PORTE — premier caractère non alphabétique après le
// préfixe « (f) » ou « (ct) ». Rien n'est deviné : un libellé sans emoji rend une chaîne vide,
// jamais une icône inventée (leçon L5 — une absence se dit, elle ne se comble pas).
export function emojiDuLibelle(libelle = "") {
  const m = String(libelle).match(/^\s*(?:\((?:f|ct)\)\s*)?(\p{Extended_Pictographic}\uFE0F?)/u);
  return m ? m[1] : "";
}

// LE NOM COURT D'UNE FAMILLE OU D'UNE CLASSE, pour les tableaux où le libellé entier ne tient pas.
// Il se DÉRIVE du libellé (on retire le préfixe « (f) » ou « (ct) », l'emoji, et la définition pure
// qui suit le tiret) — jamais une seconde liste de noms courts, qui divergerait au premier
// renommage. Le libellé complet reste la seule source ; ceci n'en est qu'une vue.
export function nomCourtDeLibelle(libelle = "") {
  return String(libelle)
    .replace(/^\s*\((?:f|ct)\)\s*/, "")
    .replace(/^\s*\p{Extended_Pictographic}\uFE0F?\s*/u, "")
    .split(" - ")[0]
    .trim();
}
export const nomCourtDeFamille = nomCourtDeLibelle;
export const nomCourtDeClasse = nomCourtDeLibelle;

export function indiceEnIcones(ligne, { types = ICONE_PAR_TYPE, rangs = ORG_RANKS, classes = CLASSES_TRANSVERSES, rang = null } = {}) {
  const iType = types[ligne?.type] ?? "·";
  const r = rang ?? ligne?.rang ?? null;
  const iRang = Object.values(rangs).find((x) => x.singulier === r)?.emoji ?? "·";
  const iFam = emojiDuLibelle(ligne?.famille ?? "") || "·";
  const portees = new Set(ligne?.classes ?? []);
  const iCls = classes.filter((c) => portees.has(c.cle)).map((c) => emojiDuLibelle(c.libelle)).join("");
  return `${iType} ${iRang} ${iFam} ${iCls || "—"}`;
}

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
  "Agent Cadre": "tout ce qu'a un Membre premium, PLUS le droit de convoquer les autres et de rendre un verdict sur eux. UN SEUL outil aujourd'hui, CASSANDRA-RH, depuis que LE-COORDINATEUR a rendu le rang le 2026-09-26 faute de pouvoir convoquer.",
  "Membre premium": "fiche + blueprint + dossier d'historisation + ligne à la table maîtresse + entrée au menu des prestations. Le poste complet, sans le crochet.",
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
// LE RENDU MARKDOWN AVALAIT SILENCIEUSEMENT LES BLOCS « highlight » (trouvé le 2026-09-26 en
// relisant le document ligne à ligne, sur sa demande). Le rendu HTML, lui, les affiche — si bien
// que les DEUX VERSIONS DU MÊME DOCUMENT ne disaient pas la même chose, et que la version texte
// perdait au passage la phrase la plus importante de tout le document : « Le rang MÉRITÉ l'emporte
// toujours ; le type ne remplit que les cases que personne n'a remplies. »
//
// Un rendu qui ignore un type qu'il ne connaît pas est exactement le défaut que ce projet combat
// partout ailleurs : il rend la même chose qu'un rendu qui n'avait rien à dire. Il SIGNALE
// désormais, dans le document lui-même — impossible à rater, et impossible à confondre avec un
// trou de contenu.
export const TYPES_DE_BLOC = ["heading", "paragraph", "note", "highlight", "list", "table"];

export function blocsVersMarkdown(blocs = []) {
  const L = [];
  for (const b of blocs) {
    if (b.type === "heading") L.push(`${"#".repeat(b.level ?? 2)} ${b.text}`, "");
    else if (b.type === "paragraph") L.push(b.text, "");
    else if (b.type === "note") L.push(`> ${b.text}`, "");
    // Le « highlight » est un bloc PROÉMINENT côté HTML (bordure pleine, fond marqué). En texte,
    // l'équivalent le plus proche est une citation en gras : visible sans être criarde.
    // Pas de gras ajouté autour : le texte porte déjà le sien, et deux gras imbriqués rendent
    // « ****mot** » — du balisage cassé là où on voulait de l'emphase.
    else if (b.type === "highlight") L.push(`> **À RETENIR** — ${[b.heading, ...(b.paragraphs ?? [b.text])].filter(Boolean).join(" — ")}`, "");
    else if (b.type === "list") L.push(...(b.items ?? []).map((i) => `- ${i}`), "");
    else if (b.type === "table") {
      L.push(`| ${b.headers.join(" | ")} |`, `|${b.headers.map(() => "---").join("|")}|`);
      for (const r of b.rows) L.push(`| ${r.join(" | ")} |`);
      L.push("");
    }
    else L.push(`> ⚠️ **BLOC NON RENDU** — type « ${b.type} » inconnu de \`blocsVersMarkdown()\`. Son contenu existe dans la version HTML et manque ici : à corriger dans le générateur, jamais à la main.`, "");
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
  B.push({ type: "paragraph", text: `GÉNÉRÉ par \`node scripts/le-classificateur.mjs classification\`${horodatage ? `, dernier passage ${horodatage}` : ""}. **Ne jamais le modifier à la main** : la prochaine génération écraserait la correction. Ce qui doit changer se change dans le code qui le produit, et le document suit tout seul — l'Article 24 appliqué au document qui décrit la classification.` });

  B.push({ type: "heading", level: 2, text: "0. Classification ou organisation ? Les deux existent" });
  B.push({ type: "paragraph", text: "**La CLASSIFICATION décrit ce qui EST.** Elle range : quel fichier est de quelle nature, quel rang il porte, dans quelle famille il travaille. Elle se MESURE sur le dépôt." });
  B.push({ type: "paragraph", text: "**L'ORGANISATION décide ce qui DOIT ÊTRE.** Qui dirige, quel poste exige quels documents, quel process encadre quoi. Elle se TRANCHE." });
  B.push({ type: "paragraph", text: "**Est-ce que l'organisation décide de la classification ?** Sur un point précis, oui — et c'est le seul. L'organisation décide des CRITÈRES (ce qu'il faut pour être Gardien sacré) ; la classification applique ces critères aux fichiers réels et dit qui les remplit. Elle ne choisit jamais qui entre dans quelle case : elle mesure. C'est pour ça que les deux documents existent, et que ni l'un ni l'autre n'absorbe son voisin — l'un pose la règle, l'autre compte." });

  // LES QUATRE AXES PRINCIPAUX ET LES CINQ SECONDAIRES, chacun avec sa COUVERTURE RÉELLE comptée
  // ici (2026-09-26). Les cinq secondaires affichaient « — » dans cette colonne, ce qui se lit
  // comme « personne ne sait » alors que la vérité est simplement qu'ils vivent dans un autre
  // outil : ils sont DÉCLARÉS ici et MESURÉS là-bas, et le dire vaut mieux qu'un tiret.
  const avecFamille = croise.lignes.filter((l) => l.famille).length;
  const avecClasse = recensement.lignes.filter((l) => (l.classes ?? []).length).length;
  const horsAgenceAvecFamille = croise.lignes.filter((l) => l.famille && l.rang === rangs.horsAgence?.singulier).length;
  const sansFichier = membresSansFichier({ categories, croise });
  B.push({ type: "heading", level: 2, text: `1. Les ${axes.length + 2} axes, et la question à laquelle chacun répond` });
  B.push({ type: "table", headers: ["Axe", "La question", "Comment il se remplit", "Combien de fichiers il couvre, ici"], rows: [
    ["**TYPE**", "ce que le fichier EST", "se CONSTATE en lisant le fichier", `**${recensement.total} / ${recensement.total}** — aucun fichier sans type`],
    ["**RANG**", "ce que le fichier VAUT", "se MÉRITE d'abord ; ne se DÉDUIT du type qu'à défaut", `**${croise.total - croise.sansRang.length} / ${croise.total}** (${croise.couverture} %)`],
    ["**FAMILLE**", "ce sur quoi il travaille", "se décide — une par membre de l'équipe, plus celle que porte le rang Hors Agence", `**${avecFamille} / ${croise.total}** : ${avecFamille - horsAgenceAvecFamille} fichiers de l'équipe + ${horsAgenceAvecFamille} Hors Agence. Les ${croise.total - avecFamille} restants sont le Socle et les états de passage, qui n'ont pas de famille et n'en manquent pas.`],
    ["**CLASSES TRANSVERSES**", "ce qu'il sait FAIRE", "une sonde par classe sur le code ; zéro, une ou plusieurs par fichier", `**${avecClasse} / ${recensement.total}** en portent au moins une — les autres n'en portent aucune, et c'est un constat, pas un trou`],
    ...axes.filter((a) => !["type"].includes(a.cle)).map((a) => [`*${a.cle}*`, a.quoi, `porté par \`${a.porteur}\``, "*mesuré dans l'outil qui le porte, jamais recompté ici* — deux comptages du même axe finiraient par diverger"]),
  ] });
  if (sansFichier.mesurable && sansFichier.sansFichier.length) {
    B.push({ type: "note", text: `⚠️ **Le registre de l'équipe compte ${sansFichier.inscrits} inscrits, mais seulement ${sansFichier.avecFichier} ont un fichier à eux.** Le ou les manquants : ${sansFichier.sansFichier.map(code).join(" · ")} — un vrai membre, avec son rang et sa famille, dont le code vit à l'intérieur d'un autre fichier. Ce n'est pas un bug, c'est un fait : il est dit ici plutôt que noyé dans une addition qui ne tomberait pas juste.` });
  }
  B.push({ type: "note", text: "**Les quatre premiers axes sont en gras parce qu'ils composent l'indice** (§4) ; les cinq autres existent et sont mesurés, mais par d'autres outils, et n'entrent pas dans le code. C'est une décision, pas un oubli : un indice à neuf facettes ne se lirait plus." });
  B.push({ type: "paragraph", text: "**Pourquoi type et rang ne font pas doublon** : un type se constate, un rang se mérite. Une bibliothèque partagée n'a pas de rang d'équipe et n'en manque pas — elle n'a jamais candidaté." });

  B.push({ type: "heading", level: 2, text: "2. Comment type et rang se croisent — la règle, en une phrase" });
  B.push({ type: "highlight", text: "Le rang MÉRITÉ l'emporte toujours ; le type ne remplit que les cases que personne n'a remplies." });
  B.push({ type: "list", items: [
    "L'outil est inscrit au registre de l'équipe → il porte le rang qui y est écrit, quel que soit son type.",
    "Sinon, son TYPE décide : ceux qui servent sans avoir candidaté reçoivent « Socle », les autres reçoivent l'état de passage qui correspond à leur situation.",
    "Un rang par défaut, jamais : il ressemblerait trait pour trait à un rang gagné.",
  ] });
  B.push({ type: "note", text: "Cet ordre a été trouvé en faisant TOURNER la règle, pas en la relisant : le premier jet lisait le type d'abord et rétrogradait deux Gardiens sacrés en Socle parce qu'ils n'ont pas de commande à eux." });
  B.push({ type: "table", headers: ["Type de fichier", "Rang qu'il donne automatiquement"], rows: Object.keys(types).map((ty) => { const cle = RANG_PAR_TYPE[ty]; return [`${ICONE_PAR_TYPE[ty] ?? ""} ${code(ty)}`.trim(), cle ? `${rangs[cle]?.emoji ?? ""} **${rangs[cle]?.singulier ?? cle}**`.trim() : "aucun — le rang se lit dans le registre de l'équipe, et à défaut c'est un état de passage"]; }) });

  B.push({ type: "heading", level: 2, text: `3. L'échelle des rangs (${Object.keys(rangs).length}) — et comment on monte` });
  B.push({ type: "paragraph", text: "Un rang n'est pas une étiquette figée : c'est une position sur une échelle, avec une marche suivante et ce qu'il faut pour la franchir. Les trois états de passage (Sans porte, Sans fiche, Postulant) ne sont pas des rangs où l'on reste — ce sont des files d'attente avec un geste précis au bout." });
  const echelle = rangsOrdonnes(rangs);
  B.push({ type: "table", headers: ["#", "Rang", "Qui le remplit", "Ce que ça veut dire", "Marche suivante", "Ce qu'il faut pour la franchir"], rows: echelle.map((r) => [
    Number.isInteger(r.echelon) ? String(r.echelon) : "hors échelle",
    `${r.emoji} **${r.singulier}**${r.nomProvisoire ? " *(nom provisoire)*" : ""}`,
    quiRemplit(r.population),
    r.sens,
    r.promotionVers ? `${rangs[r.promotionVers]?.emoji ?? ""} ${rangs[r.promotionVers]?.singulier ?? r.promotionVers}`.trim() : "— *(sommet ou hors échelle)*",
    r.condition ?? "*(non arrêté)*",
  ]) });
  B.push({ type: "note", text: "La colonne **#** est la position sur l'échelle, de la plus fragile (0) à la plus haute (6). Les quatre derniers rangs n'ont pas de numéro : le Socle, l'Émetteur de rapport et les Hors Agence ne sont pas des marches qu'on monte, ce sont des SITUATIONS — et le dire vaut mieux que de les ranger dans une échelle où ils n'iraient nulle part." });
  B.push({ type: "table", headers: ["Rang", "Le poste de travail qui en découle"], rows: echelle.map((r) => [`${r.emoji} ${r.singulier}`, posteDuRang[r.singulier] ?? "*(non arrêté)*"]) });
  B.push({ type: "paragraph", text: "**Les pièces d'un poste complet**, pour lire la colonne de droite :" });
  B.push({ type: "list", items: poste.map((p) => `**${p.quoi}** (\`${p.ou}\`) — pour : ${p.pourQui}`) });

  B.push({ type: "heading", level: 2, text: "4. L'indice de classification à facettes" });
  B.push({ type: "paragraph", text: "**Le nom n'est pas inventé** : ranger un objet sur plusieurs axes indépendants au lieu d'un seul arbre s'appelle une *classification à facettes*, et le code composite qui en résulte est une *notation* — en français de bibliothèque, un **indice**. Chaque position est une facette, chacune indépendante des autres, et l'indice entier se lit comme une adresse." });
  // L'EXEMPLE EST TIRÉ DU DÉPÔT, jamais inventé (2026-09-26). L'ancien, `2.2.3.dh`, décrivait un
  // Gardien sacré rangé chez Les Prophètes : aucun fichier réel ne porte cet indice, et un exemple
  // qui contredit la table qu'il illustre apprend à se méfier des deux.
  const exemple = croise.lignes.find((l) => l.rang === rangs.gardien?.singulier && l.indice) ?? croise.lignes.find((l) => l.indice);
  B.push({ type: "paragraph", text: `**Format : \`${FACETTES.join(" . ")}\`** — les trois premières facettes sont un rang dans une liste ; la quatrième est un nombre en base 36 dont chaque bit allumé est une classe (une seule facette répond « lesquelles ? » plutôt que « laquelle ? »).` });
  if (exemple) {
    const d = decoderIndice(exemple.indice, { types, rangs, familles: croise.familles, classes });
    B.push({ type: "highlight", text: `**Exemple réel, pris dans le tableau du §5** : \`${court(exemple.chemin)}\` porte l'indice **\`${exemple.indice}\`**, soit ${exemple.icones}. Décodé : type *${d.type ?? "—"}* · rang *${d.rang ?? "—"}* · famille *${d.famille ? nomCourtDeFamille(d.famille) : "—"}* · ${(d.classes ?? []).length} classe(s).` });
  }
  B.push({ type: "note", text: "Trois états dans une facette, jamais deux : un chiffre (la valeur), « - » (la facette ne s'applique pas — un fichier du Socle n'a pas de famille et n'en manque pas), « ? » (la valeur existe mais n'a pas été reconnue). Confondre les deux derniers ferait lire une absence légitime comme un trou." });
  B.push({ type: "paragraph", text: "**Pourquoi un indice plutôt que des icônes** : une icône se reconnaît, elle ne se trie pas, ne se cherche pas et ne se compare pas. Un indice fait les trois. Les deux cohabitent — l'icône pour l'œil, l'indice pour la machine et le tri." });
  B.push({ type: "table", headers: ["Facette", "Position", "Valeurs possibles, dans l'ordre", "L'icône de chacune"], rows: [
    ["type", "1", Object.keys(types).map((t, i) => `${i} = ${t}`).join(" · "), Object.keys(types).map((t) => `${ICONE_PAR_TYPE[t] ?? "·"} ${t}`).join(" · ")],
    ["rang", "2", Object.values(rangs).map((r, i) => `${i} = ${r.singulier}`).join(" · "), Object.values(rangs).map((r) => `${r.emoji} ${r.singulier}`).join(" · ")],
    ["famille", "3", croise.familles.map((f, i) => `${i} = ${nomCourtDeFamille(f)}`).join(" · "), croise.familles.map((f) => `${emojiDuLibelle(f) || "·"} ${nomCourtDeFamille(f)}`).join(" · ")],
    ["classes", "4", classes.map((c, i) => `bit ${i} = ${nomCourtDeClasse(c.libelle)}`).join(" · "), classes.map((c) => `${emojiDuLibelle(c.libelle) || "·"} ${nomCourtDeClasse(c.libelle)}`).join(" · ")],
  ] });
  B.push({ type: "note", text: "**La colonne de droite est la traduction demandée le 2026-09-26.** Elle n'est recopiée nulle part : l'icône d'une famille et celle d'une classe se LISENT dans le nom que l'utilisateur leur a donné le même jour, et seuls les types ont reçu la leur ici — parce qu'un type est un constat de forme, jamais un nom choisi. Une série d'icônes se reconnaît sans décoder ; un indice se trie, se cherche et se compare. Les deux disent la même chose et voyagent ensemble." });

  B.push({ type: "heading", level: 2, text: `5. Chaque fichier : rang, famille, indice (${croise.total}, exhaustif)` });
  // L'ordre des groupes suit l'ÉCHELLE (§3), jamais la taille des populations : un lecteur qui
  // descend la liste doit retrouver la hiérarchie qu'il vient de lire, pas un classement par effectif.
  // Du plus haut mérite au plus fragile, PUIS les situations hors échelle (Socle, Émetteur, Hors
  // Agence). Un simple `.reverse()` de l'échelle montante mettait les Hors Agence en tête du
  // document, ce qui est l'inverse exact de ce que la §3 venait d'établir.
  const echelonne = rangsOrdonnes(rangs);
  const ordreDesRangs = [
    ...echelonne.filter((r) => Number.isInteger(r.echelon)).reverse(),
    ...echelonne.filter((r) => !Number.isInteger(r.echelon)),
  ].map((r) => r.singulier);
  const groupesRang = grouper(croise.lignes, (l) => l.rang ?? "(aucun)")
    .sort((a, b) => (ordreDesRangs.indexOf(a[0]) + 1 || 99) - (ordreDesRangs.indexOf(b[0]) + 1 || 99));
  for (const [rang, liste] of groupesRang) {
    B.push({ type: "heading", level: 3, text: `${rangs[Object.keys(rangs).find((k) => rangs[k].singulier === rang)]?.emoji ?? "•"} ${rang} — ${liste.length}` });
    B.push({ type: "table", headers: ["Fichier", "Famille", "Indice", "En icônes"], rows: liste.sort((a, b) => a.chemin.localeCompare(b.chemin)).map((l) => [code(court(l.chemin)), l.famille ?? "—", code(l.indice), l.icones ?? "—"]) });
  }

  const typesPresents = new Set(recensement.lignes.map((l) => l.type));
  const typesAbsents = Object.keys(types).filter((t) => !typesPresents.has(t));
  B.push({ type: "heading", level: 2, text: `6. Les types de fichier (${typesPresents.size} présents sur les ${Object.keys(types).length} du registre, exhaustif)` });
  if (typesAbsents.length) B.push({ type: "note", text: `${typesAbsents.map(code).join(" · ")} n'${typesAbsents.length > 1 ? "ont" : "a"} aucun fichier aujourd'hui, et c'est une bonne nouvelle : ${typesAbsents.map((t) => types[t]).join(" ; ")}. Le type reste déclaré — le retirer ferait disparaître le jour où un fichier y retombe.` });
  // Dans l'ordre de la FACETTE (§4), pour qu'un lecteur qui vient de lire « 0 = crochet, 1 =
  // filet-de-securite… » retrouve exactement la même suite ici. Trier par population donnerait
  // deux ordres différents pour la même liste dans le même document.
  const ordreDesTypes = Object.keys(types);
  const groupesType = grouper(recensement.lignes, (l) => l.type)
    .sort((a, b) => (ordreDesTypes.indexOf(a[0]) + 1 || 99) - (ordreDesTypes.indexOf(b[0]) + 1 || 99));
  for (const [ty, liste] of groupesType) {
    B.push({ type: "heading", level: 3, text: `${ty} — ${liste.length}` });
    B.push({ type: "note", text: types[ty] ?? "*(type non décrit dans le registre)*" });
    B.push({ type: "paragraph", text: liste.map((l) => code(court(l.chemin))).sort().join(" · ") });
  }

  // 6bis — LA SECTION NÉE DE SA QUESTION (2026-09-26). Elle vit dans le document et pas dans une
  // réponse de conversation, parce qu'une réponse ne se rejoue pas : celle-ci se recalcule à
  // chaque génération, sur le dépôt du jour (Article 31).
  const fausses = bibliothequesLancables({ recensement });
  B.push({ type: "heading", level: 2, text: "6bis. « Bibliothèque », est-ce normal ? — la vérification, pas l'avis" });
  B.push({ type: "paragraph", text: "Un fichier est rangé en **bibliothèque** quand la mesure ne trouve **aucune porte d'entrée écrite** et qu'au moins un autre fichier l'importe. C'est un CONSTAT de forme, jamais un jugement de valeur : deux Gardiens sacrés (`clone-hunter`, `safe-export`) sont des bibliothèques et restent Gardiens sacrés, parce que **le rang mérité l'emporte toujours sur le type**." });
  B.push({ type: "paragraph", text: "Mais le constat cache une vraie question : **un fichier peut porter une porte dans son code sans que personne ne l'ait écrite nulle part.** Celui-là n'est pas une bibliothèque — c'est une commande que personne ne peut lancer parce que personne ne sait qu'elle existe. La mesure ci-dessous sépare les deux." });
  if (!fausses.mesurable) {
    B.push({ type: "note", text: `🚨 PAS MESURÉ — ${fausses.pourquoi}` });
  } else {
    B.push({ type: "table", headers: ["Fichier", "Type constaté", "Une porte dans le code ?", "Qui le lance vraiment", "Verdict"], rows: [...fausses.suspects, ...fausses.vraies]
      .sort((a, b) => a.chemin.localeCompare(b.chemin))
      .map((x) => [code(court(x.chemin)), x.type, x.lancable ? (x.aMain ? "oui — un `main()`" : "oui — un garde de lancement") : "non", x.appelants?.length ? x.appelants.map(code).join(" · ") : "—", x.verdict]) });
    B.push({ type: "highlight", text: fausses.orphelines.length
      ? `${fausses.vraies.length} sur ${fausses.examines} sont de VRAIES bibliothèques : le type est juste, il n'y a rien à corriger. ${fausses.suspects.length} portent une porte que la documentation n'écrit pas, et sur ces ${fausses.suspects.length}, **${fausses.orphelines.length} n'${fausses.orphelines.length > 1 ? "ont" : "a"} strictement rien qui ${fausses.orphelines.length > 1 ? "les" : "le"} lance** : ${fausses.orphelines.map((x) => code(court(x.chemin))).join(" · ")}.`
      : `${fausses.vraies.length} sur ${fausses.examines} sont de VRAIES bibliothèques, et aucune porte n'est orpheline aujourd'hui.` });
    B.push({ type: "note", text: "La sonde a été resserrée avant sa première livraison : sa première version cherchait `import.meta.url` tout court et accusait à tort cinq fichiers qui s'en servent pour calculer un CHEMIN. Un garde qui accuse à tort cesse d'être lu (leçon L4) — et celui-ci aurait répondu faux à la question même qui l'a fait naître." });
  }

  B.push({ type: "heading", level: 2, text: `7. Les familles (${croise.familles.length}, exhaustif)` });
  B.push({ type: "paragraph", text: "Une famille dit **ce sur quoi on travaille**, jamais ce qu'on vaut. Les Gardiens sacrés ont désormais la leur, sur décision de l'utilisateur : le nom répète leur rang, et c'est assumé — une famille explicitement redondante se lit mieux qu'un troisième nom pour la même chose, et c'est l'endroit où on les cherche quand on ouvre l'organigramme. **Les Hors Agence ont reçu la leur le 2026-09-26, sur le même principe et pour une raison mesurée** : la famille était le seul axe qui ne couvrait pas tout le dépôt, et six fichiers sortaient avec une case vide — or une case vide ne dit jamais si personne n'a rempli ou si rien n'était à remplir. Deux interdits vont avec ce rang, et ils ne sont pas symétriques d'un manque de mérite : ces fichiers **ne peuvent pas évoluer**, et **aucun outil de l'Agence ne peut les rejoindre** — on n'est pas hors Agence parce qu'on a démérité, mais parce qu'on sert le produit." });
  const membresParFamille = Object.entries(categories).map(([slug, cat]) => ({ slug, f: familleDeLaCategorie(cat) ?? "(sans famille)" }));
  for (const l of croise.lignes) {
    const fr = Object.values(rangs).find((r) => r.singulier === l.rang)?.famille;
    if (fr) membresParFamille.push({ slug: court(l.chemin).replace(/\.(mjs|sh)$/, ""), f: fr });
  }
  const groupesFamille = grouper(membresParFamille, (x) => x.f)
    .sort((a, b) => (croise.familles.indexOf(a[0]) + 1 || 99) - (croise.familles.indexOf(b[0]) + 1 || 99));
  for (const [f, liste] of groupesFamille) {
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

  // § 9 — LE PLAN D'ACTION, pas seulement la liste des trous (Article 28 : un rapport n'est pas fini
  // quand il est écrit, il l'est quand ses constats sont devenus des tâches). Cette section
  // n'énumérait que les Postulants et fermait sur un avertissement ; tout le reste de ce que le
  // document venait de mesurer — les portes orphelines, le membre sans fichier — mourait dans sa
  // propre page. Chaque ligne porte donc désormais son GESTE, et le geste est précis.
  B.push({ type: "heading", level: 2, text: "9. Ce qui reste ouvert — et le geste que chaque point appelle" });
  const pluriel = (n, singulier, plur) => `${n} ${n > 1 ? plur : singulier}`;
  const constats = [];

  const postulants = croise.lignes.filter((l) => l.rang === rangs.postulant?.singulier);
  if (postulants.length) constats.push([
    `**${pluriel(postulants.length, "fichier est Postulant", "fichiers sont Postulants")}** — ${postulants.map((l) => code(court(l.chemin))).join(" · ")}`,
    "documenté et lançable, mais absent du registre de l'équipe",
    "l'inscrire au registre, ou déclarer par écrit qu'il n'a pas vocation à entrer",
  ]);

  const orphelines = (bibliothequesLancables({ recensement })?.orphelines) ?? [];
  if (orphelines.length) constats.push([
    `**${pluriel(orphelines.length, "porte orpheline", "portes orphelines")}** — ${orphelines.map((x) => code(court(x.chemin))).join(" · ")}`,
    "le fichier est lançable et rien de vivant dans le dépôt ne le lance",
    "lui écrire sa commande dans la table maîtresse, ou le supprimer",
  ]);

  if (sansFichier.mesurable && sansFichier.sansFichier.length) constats.push([
    `**${pluriel(sansFichier.sansFichier.length, "membre du registre n'a", "membres du registre n'ont")} pas de fichier à lui** — ${sansFichier.sansFichier.map(code).join(" · ")}`,
    "il porte un rang et une famille, mais son code vit à l'intérieur d'un autre fichier",
    "rien d'urgent : le noter ici suffit, tant que l'addition du §1 le dit au lieu de le masquer",
  ]);

  const provisoires = Object.values(rangs).filter((r) => r.nomProvisoire);
  if (provisoires.length) constats.push([
    `**${pluriel(provisoires.length, "rang porte un nom provisoire", "rangs portent un nom provisoire")}** — ${provisoires.map((r) => `${r.emoji} ${r.singulier}`).join(" · ")}`,
    "l'agent les a nommés faute de mieux, et c'est l'utilisateur qui nomme",
    "les trancher dans la fournée de nommage (tâche #200)",
  ]);

  if (divergenceAxes.mesure !== "mesuré") constats.push([
    "**Les axes du référentiel : 🚨 PAS MESURÉ**",
    divergenceAxes.pourquoi,
    "rendre le référentiel lisible par le garde-fou avant de conclure quoi que ce soit sur les axes",
  ]);
  else if (divergenceAxes.divergent) constats.push([
    "**Le référentiel et le code ne déclarent pas le même nombre d'axes**",
    divergenceAxes.pourquoi,
    "réécrire à la main le §1 de `docs/referentiel/organisation-agence.md` — la prose est humaine, seul l'écart est mécanique",
  ]);

  if (constats.length) {
    B.push({ type: "table", headers: ["Ce qui reste ouvert", "Pourquoi c'en est un", "Le geste"], rows: constats });
    B.push({ type: "note", text: "Chaque ligne porte son geste, jamais seulement son constat (Article 28) : un rapport qui s'arrête au constat ressemble à un problème traité, et c'est exactement ce qui rend l'oubli invisible." });
  } else {
    B.push({ type: "highlight", text: "Rien d'ouvert à cette génération : tous les fichiers portent un type et un rang, aucune porte n'est orpheline, aucun nom n'est provisoire, et le référentiel s'accorde avec le code." });
  }

  return { mesurable: true, blocs: B, croise, divergenceAxes, constatsOuverts: constats.length };
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
  // LA VITALITÉ, joignable en une commande : un mécanisme que personne ne peut lancer n'existe pas
  // (Article 31). Elle sert à l'export — savoir ce qui doit partir en premier.
  if (sub === "vitalite") {
    for (const l of formatVitaliteLines(vitaliteDuParc())) console.log(l);
    return;
  }
  console.log("\nUsage : node scripts/le-classificateur.mjs [classification [chemin] | vitalite]");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
