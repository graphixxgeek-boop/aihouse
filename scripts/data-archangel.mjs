// DATA-ARCHANGEL (2026-09-22, nom donné par l'utilisateur). L'outil qui veille sur la CIRCULATION
// des données à l'intérieur de l'Agence Codex — et, explicitement, sur mon propre accès à elles :
// « assure-toi que l'organisation te permet d'avoir accès à toutes ces données, et qu'elles te
// soient utiles à TOI en priorité. Assure-toi que tu puises bien dans toute la data. »
//
// LE PROBLÈME QU'IL RÉSOUT. Vingt-cinq outils produisent des données : des journaux d'état, des
// registres datés, des historiques chiffrés. Chacun écrit dans son coin, et personne n'a jamais
// vérifié qui LIT quoi. Une donnée qu'on paie à produire et que rien ne relit n'existe pas
// vraiment : elle coûte son calcul, occupe son fichier, et meurt là. Symétriquement, un outil qui
// rend un verdict sans consulter une donnée disponible juste à côté juge à l'aveugle alors que la
// réponse était sur le disque.
//
// LES DEUX SENS, UN SEUL VERDICT (calibrage explicite de l'utilisateur). Il ne prend pas le
// problème par un bout mais par les deux : la donnée orpheline d'un côté, l'outil mal informé de
// l'autre — et propose le branchement qui réglerait les deux à la fois.
//
// CE QU'IL NE FAIT JAMAIS : brancher lui-même. Connecter deux outils change ce qu'un rapport
// raconte ; ça se décide, ça ne s'improvise pas. Il signale, il mesure, il propose. Même frontière
// que pure-gold-unity, et pour la même raison.
//
// ÉVOLUTIVITÉ (Article 24) : aucune liste de sources tenue à la main. Les journaux viennent de
// LOCAL_JOURNALS (doc-report), les registres de REGISTRIES, l'historique KPI de sa propre
// constante. Un nouvel outil qui déclare son journal entre dans le champ de vision sans qu'une
// ligne ne bouge ici.

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReportHeader, buildPlanDaction, PLAN_ACTION_TITRE } from "./report-template.mjs";
import { renderHtmlReport } from "./html-report.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { LOCAL_JOURNALS, REGISTRIES, DOSSIERS_QUI_NE_SONT_PAS_DES_REGISTRES } from "./doc-report.mjs";
import { KPI_HISTORY_PATH } from "./kpi-report.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// ————————————————————————————————————————————————————————————————————————
// L'INVENTAIRE — tout ce que l'Agence sait, en un seul endroit
// ————————————————————————————————————————————————————————————————————————

// Les trois natures de donnée, jamais confondues : elles ne se lisent pas au même rythme et une
// absence de lecteur ne veut pas dire la même chose pour chacune.
export const NATURES = {
  journal: "état local jamais committé — mémoire de travail des outils entre deux lancements",
  registre: "trace datée committée — l'histoire de ce qu'un outil a trouvé",
  mesure: "série chiffrée committée — ce qui permet de comparer dans le temps",
};

export function listDataSources({ journaux = LOCAL_JOURNALS, registres = REGISTRIES, kpiPath = KPI_HISTORY_PATH } = {}) {
  const sources = [];
  for (const j of journaux) sources.push({ id: j.path, nature: "journal", producteur: j.owner, contenu: j.purpose });
  for (const r of registres) sources.push({ id: r.path, nature: "registre", producteur: r.label, contenu: `registre ${r.family ?? ""}`.trim(), scriptPath: r.scriptPath });
  sources.push({ id: kpiPath, nature: "mesure", producteur: "Tableau de bord interne (KPI)", contenu: "série chiffrée des indicateurs du projet, run après run" });
  // Un même chemin déclaré deux fois (un outil avec deux entrées de registre) ne doit compter
  // qu'une fois, sans quoi le dénominateur de tous les ratios devient faux.
  const vus = new Set();
  return sources.filter((s) => (vus.has(s.id) ? false : vus.add(s.id)));
}

function scriptFiles(root) {
  try {
    return readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => `scripts/${f}`);
  } catch { return []; }
}

// DÉCLARER N'EST PAS LIRE — la correction qui a sauvé cet outil de son premier verdict.
//
// Premier passage réel : « 53 sources sur 53 relues, 100 % ». Trop propre, et faux. Cause :
// doc-report.mjs cite 52 des 53 sources parce qu'il les DÉCLARE — c'est le catalogue du paysage,
// pas un consommateur de ses données. Compter une déclaration comme une lecture rendait tout le
// réseau parfaitement branché alors que rien ne circulait. Encore une mesure adjacente présentée
// comme la mesure visée, commise dans l'outil écrit pour traquer exactement ça.
//
// LE PRINCIPE, plutôt qu'une liste de fichiers à ignorer (qui se périmerait au prochain catalogue) :
// une déclaration vit dans le corps d'une constante exportée (`export const X = [...]`), une lecture
// vit dans du code. On retire donc ces corps avant de chercher, pour tous les fichiers sans
// exception — un futur catalogue sera traité comme celui-ci sans qu'une ligne ne bouge.
export function stripExportedConstantBodies(code) {
  // On repère chaque `export const NOM = ` en début de ligne et on coupe jusqu'à la fin de sa
  // valeur, détectée par le retour en colonne 0 d'un `}` ou `]` suivi d'un point-virgule — la forme
  // qu'ont réellement toutes les grandes déclarations de ce dépôt.
  return code.replace(/^export const\s+[A-Z_][A-Z0-9_]*\s*=\s*[[{][\s\S]*?^[\]}];?$/gm, "/* déclaration retirée */");
}

// ————————————————————————————————————————————————————————————————————————
// LA LECTURE INDIRECTE (2026-09-23, tâche #490) — la faille de mesure qui punissait le bon design
// ————————————————————————————————————————————————————————————————————————
//
// CE QUI A ÉTÉ TROUVÉ EN VOULANT TRAITER LES « 18 DONNÉES QUE PERSONNE NE LIT ». Avant de câbler
// dix-huit lecteurs, j'ai regardé comment cet outil décide qu'une donnée est lue : il cherche la
// CITATION LITTÉRALE du chemin dans le code. Or l'Article 24 exige précisément l'inverse — un
// registre se LIT, il ne s'énumère pas. Un outil qui atteint dix registres en parcourant une table
// déclarée (`CIRCLE_REPORT_FOLDERS`, `GARDIENS_SACRES_REGISTRES`, `REGISTRIES`...) ne cite aucun
// chemin, et passait donc pour ne rien lire du tout.
//
// LA MESURE RÉCOMPENSAIT DONC LA LISTE RECOPIÉE À LA MAIN ET PUNISSAIT LA CONCEPTION ÉVOLUTIVE. Et
// le piège était refermé : pour « corriger » les 18, il aurait fallu écrire dix-huit chemins en dur
// — c'est-à-dire créer exactement la dette que l'Article 24 interdit, pour verdir un compteur.
// Un indicateur qui ne peut être amélioré qu'en dégradant le code n'est pas un indicateur.
//
// CE QUI EST FAIT ICI. Une constante exportée qui CONTIENT des chemins de données devient un
// intermédiaire reconnu : le script qui l'emploie (hors sa propre déclaration) est compté comme
// lecteur des chemins qu'elle porte. La déclaration elle-même ne compte toujours pas — déclarer
// n'est pas lire, c'est la règle d'origine et elle reste entière.
//
// TROIS ÉTATS, JAMAIS DEUX, parce que les deux lectures n'ont pas la même force : une citation
// directe prouve qu'on vise CETTE donnée-là ; une lecture par registre prouve qu'on traite la
// FAMILLE à laquelle elle appartient. La seconde est plus solide pour l'évolutivité (un registre de
// plus est couvert sans rien changer) et plus faible pour l'intention (personne n'a pensé à ce
// registre en particulier). Les confondre ferait perdre cette nuance, donc elles restent séparées
// dans le rapport.
export const ETATS_LECTURE = ["lue directement", "lue via un registre", "jamais lue"];

// Les constantes exportées qui portent des chemins de données, découvertes plutôt qu'énumérées :
// on relit chaque déclaration `export const NOM = [...]` ou `= {...}` et on retient celles dont le
// corps contient au moins un chemin de source connu. Aucune liste à tenir — une table de registres
// créée demain est reconnue le jour même, ce qui est le minimum pour un garde-fou dont le sujet
// EST l'évolutivité.
export function registresIndirects(texte, sources) {
  const trouvees = new Map();
  for (const m of String(texte ?? "").matchAll(/^export const\s+([A-Z_][A-Z0-9_]*)\s*=\s*[[{][\s\S]*?^[\]}];?$/gm)) {
    const [corps, nom] = [m[0], m[1]];
    const chemins = sources.filter((s) => corps.includes(s.id)).map((s) => s.id);
    if (chemins.length) trouvees.set(nom, chemins);
  }
  return trouvees;
}

// Le second cas, distinct et volontairement séparé : un chemin cité dans la SUITE DE TESTS est une
// vérification, jamais une exploitation de la donnée. Une source que seul le filet de sécurité
// mentionne ne circule pas davantage qu'une source citée nulle part.
//
// Cette constante est volontairement tenue à la main, et l'Article 24 l'autorise explicitement à
// cette condition, écrite ici : ce ne sont pas des membres de l'équipe dont la liste évolue, ce sont
// les deux fichiers d'infrastructure de vérification du dépôt, stables par nature.
export const FICHIERS_DE_VERIFICATION = ["scripts/check-house.mjs", "scripts/check-suivi-fidelity.mjs"];

// LE CAS QUE LA CONCEPTION ÉVOLUTIVE REND INVISIBLE (2026-09-23, tâche #564).
//
// LE DÉFAUT, mesuré : dix-neuf dossiers de signaux de Ronde étaient comptés « personne ne les lit »
// alors que `tendanceDesSignauxDeRonde()` ouvre RÉELLEMENT chacun d'eux, à chaque passage, pour en
// tirer une tendance. Il ne les cite simplement pas : il ITÈRE la table `CIRCLE_REPORT_FOLDERS` et
// dérive les chemins. C'est exactement ce que l'Article 24 exige (« un registre se LIT, il ne
// s'énumère pas ») — et la mesure punissait la bonne conception pendant qu'elle aurait récompensé
// vingt chemins recopiés à la main.
//
// POURQUOI PAS SIMPLEMENT CRÉDITER L'ACCÈS PAR TABLE : c'est déjà tranché plus haut, contre-exemple
// à l'appui (find-brain importe une table pour en tirer des chemins de SCRIPTS, jamais pour ouvrir
// les registres). Passer par la table prouve qu'on touche la famille, jamais qu'on exploite ce
// contenu-là. Le crédit ne peut donc venir que d'une DÉCLARATION — et une déclaration qu'on croit
// sur parole est un porteur fantôme (L7), donc elle se corrobore.
//
// LA DOUBLE CONDITION, et aucune des deux ne suffit seule : le fichier déclare
// `export const LECTEUR_DE_TABLE = [{ table, quoi }]`, ET son code contient vraiment une lecture de
// système de fichiers. Un fichier qui déclare sans lire est signalé, jamais cru.
const MARQUEUR_LECTEUR_TABLE = /^export\s+const\s+LECTEUR_DE_TABLE\s*=\s*\[([\s\S]*?)^\];/m;
const LECTURE_DISQUE = /(readFileSync|readdirSync|existsSync|readFile\(|readdir\()/;

export function lecteursDeTableDeclares({ root = ROOT, readFileImpl = readFileSync, scripts } = {}) {
  const fichiers = scripts ?? scriptFiles(root);
  const declares = [];
  for (const f of fichiers) {
    let brut;
    try { brut = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    const m = brut.match(MARQUEUR_LECTEUR_TABLE);
    if (!m) continue;
    const tables = [...m[1].matchAll(/table:\s*["'`]([A-Z_][A-Z0-9_]*)["'`]/g)].map((x) => x[1]);
    if (!tables.length) continue;
    const corrobore = LECTURE_DISQUE.test(brut);
    for (const table of tables) declares.push({ fichier: f, table, corrobore });
  }
  return declares;
}

// QUI LIT QUOI, mesuré sur le vrai code plutôt que déclaré. Un outil "lit" une source s'il en cite
// le chemin hors déclaration — heuristique assumée : c'est une mention, jamais une preuve de
// lecture effective. Déclarée comme telle dans l'avertissement de fiabilité.
export function mapReaders({ root = ROOT, readFileImpl = readFileSync, sources, scripts } = {}) {
  const srcs = sources ?? listDataSources();
  const fichiers = scripts ?? scriptFiles(root);
  const lecteursPar = new Map(srcs.map((s) => [s.id, []]));
  const indirectsPar = new Map(srcs.map((s) => [s.id, []]));
  const verifPar = new Map(srcs.map((s) => [s.id, []]));
  const sourcesPar = new Map();
  const illisibles = [];

  // PREMIER PASSAGE — les registres qui portent des chemins, tous fichiers confondus. Il faut les
  // connaître TOUS avant de juger un seul fichier : un script peut employer une table déclarée
  // ailleurs, et l'ordre alphabétique du dossier ne garantit rien.
  const textes = new Map();
  const registres = new Map();
  for (const f of fichiers) {
    let brut;
    try { brut = readFileImpl(join(root, f), "utf8"); } catch { illisibles.push(f); continue; }
    textes.set(f, brut);
    for (const [nom, chemins] of registresIndirects(brut, srcs)) {
      // Deux fichiers qui exportent le même nom de constante : on cumule leurs chemins plutôt que
      // de laisser le dernier lu écraser le premier, ce qui ferait disparaître des lectures réelles.
      registres.set(nom, [...new Set([...(registres.get(nom) ?? []), ...chemins])]);
    }
  }

  for (const f of fichiers) {
    const texte = textes.get(f);
    if (texte === undefined) continue;
    // On retire les commentaires : un chemin cité dans une explication n'est pas une lecture. Sans
    // ça, ce fichier-ci passerait pour le lecteur universel de tout le dépôt.
    const sansCommentaires = texte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const code = stripExportedConstantBodies(sansCommentaires);
    const estVerification = FICHIERS_DE_VERIFICATION.includes(f);
    const lues = [];
    for (const s of srcs) {
      if (!code.includes(s.id)) continue;
      // Les deux natures de citation restent séparées jusqu'au bout : un lecteur de test ne compte
      // pas comme un lecteur, mais il n'est pas non plus effacé — il apparaît à part dans le
      // rapport, parce que « personne ne la lit sauf les tests » est une information utile.
      (estVerification ? verifPar.get(s.id) : lecteursPar.get(s.id)).push(f);
      if (!estVerification) lues.push(s.id);
    }
    // LA LECTURE PAR REGISTRE. Le nom de la table doit apparaître dans le CODE (déclarations et
    // commentaires déjà retirés) : l'employer, jamais seulement la déclarer ou en parler. Un chemin
    // déjà cité directement ne compte pas deux fois — la citation directe est la plus forte des deux
    // et reste celle qui s'affiche.
    if (!estVerification) {
      for (const [nom, chemins] of registres) {
        if (!new RegExp(`\\b${nom}\\b`).test(code)) continue;
        for (const chemin of chemins) {
          if (lecteursPar.get(chemin)?.includes(f)) continue;
          const liste = indirectsPar.get(chemin);
          if (liste && !liste.some((e) => e.fichier === f)) liste.push({ fichier: f, via: nom });
        }
      }
    }
    sourcesPar.set(f, lues);
  }
  return { lecteursPar, indirectsPar, verifPar, sourcesPar, illisibles, sources: srcs, scripts: fichiers };
}

// ————————————————————————————————————————————————————————————————————————
// PREMIER SENS — la donnée que personne ne relit
// ————————————————————————————————————————————————————————————————————————

// Le producteur ne compte JAMAIS comme lecteur de sa propre donnée : un outil qui relit ce qu'il
// vient d'écrire ne fait pas circuler l'information, il tient sa mémoire. Confondre les deux
// donnerait un paysage entièrement branché alors que rien ne circule.
export function findOrphanData(carte, { root = ROOT } = {}) {
  const orphelines = [];
  for (const s of carte.sources) {
    const lecteurs = (carte.lecteursPar.get(s.id) ?? []).filter((f) => f !== s.scriptPath);
    if (lecteurs.length) continue;
    // Une source jamais écrite n'est PAS une donnée orpheline : c'est une donnée qui n'existe pas
    // encore. La distinction compte — reprocher l'absence de lecteurs à un fichier vide serait
    // reprocher un silence à quelqu'un qui n'a rien dit.
    const chemin = join(root, s.id);
    const existe = existsSync(chemin);
    const testsSeuls = (carte.verifPar?.get(s.id) ?? []).length > 0;
    orphelines.push({
      ...s,
      lecteurs: [],
      existe,
      testsSeuls,
      etat: !existe
        ? "déclarée mais jamais écrite — rien à relire pour l'instant"
        : testsSeuls
          ? "écrite, et citée UNIQUEMENT par la suite de tests — vérifiée, jamais exploitée"
          : "écrite, jamais relue par un autre outil",
    });
  }
  return orphelines;
}

// ————————————————————————————————————————————————————————————————————————
// SECOND SENS — l'outil qui décide sans consulter ce qui était disponible
// ————————————————————————————————————————————————————————————————————————

// LE PRINCIPE, et pourquoi ce n'est PAS une table d'affinités écrite à la main (Article 24) : on ne
// décrète nulle part que tel outil "devrait" lire telle donnée — ce serait une opinion figée qui se
// périmerait au premier outil suivant. On regarde ce que le paysage fait DÉJÀ : si deux outils
// lisent largement les mêmes sources, ils travaillent sur le même terrain, et une source que l'un
// consulte et l'autre pas devient un candidat sérieux.
//
// Ce que ça produit est une SUGGESTION, jamais un manquement — d'où le vocabulaire (« pourrait
// gagner à »), et d'où le seuil : en dessous de deux sources communes, la ressemblance ne veut rien
// dire et ne doit rien suggérer.
export function suggestMissingConnections(carte, { minCommun = 2, maxParOutil = 3 } = {}) {
  const suggestions = [];
  const entrees = [...carte.sourcesPar.entries()].filter(([, lues]) => lues.length > 0);
  for (const [outil, lues] of entrees) {
    const miennes = new Set(lues);
    const candidats = new Map();
    for (const [autre, sesLues] of entrees) {
      if (autre === outil) continue;
      const commun = sesLues.filter((s) => miennes.has(s)).length;
      if (commun < minCommun) continue;
      for (const s of sesLues) {
        if (miennes.has(s)) continue;
        const dejaVu = candidats.get(s) ?? { source: s, appuis: [], force: 0 };
        dejaVu.appuis.push(autre);
        // La force d'une suggestion, c'est le nombre de sources en commun avec l'outil qui la
        // porte : un voisin qui partage 6 sources pèse plus qu'un qui en partage 2.
        dejaVu.force = Math.max(dejaVu.force, commun);
        candidats.set(s, dejaVu);
      }
    }
    const retenus = [...candidats.values()]
      .filter((c) => c.appuis.length >= 2)
      .sort((a, b) => b.force - a.force || b.appuis.length - a.appuis.length)
      .slice(0, maxParOutil);
    if (retenus.length) suggestions.push({ outil, manquantes: retenus });
  }
  return suggestions.sort((a, b) => b.manquantes[0].force - a.manquantes[0].force);
}

// ————————————————————————————————————————————————————————————————————————
// MON PROPRE ACCÈS — la partie que l'utilisateur a explicitement mise en avant
// ————————————————————————————————————————————————————————————————————————

// « Assure-toi que tu puises bien dans toute la data pour aider à construire ce projet. » Le
// problème réel, de mon côté, n'a jamais été l'autorisation : c'est qu'il faut SAVOIR qu'un fichier
// existe pour aller le lire. Rien ne me présente spontanément ce que l'équipe a accumulé, donc je
// lis ce dont je me souviens — c'est-à-dire ce que j'ai touché récemment, et rien d'autre.
export function agentDataBriefing(carte, { root = ROOT, now = Date.now(), lecteursDeclares } = {}) {
  const lignes = [];
  for (const s of carte.sources) {
  const declaresCorrobores = (lecteursDeclares ?? lecteursDeTableDeclares()).filter((d) => d.corrobore);
    const chemin = join(root, s.id);
    let ageJours;
    try {
      const st = statSync(chemin);
      // Un dossier de registre : on date le plus récent fichier qu'il contient, jamais le dossier
      // lui-même, dont la date de modification ne dit rien de la fraîcheur du contenu.
      if (st.isDirectory()) {
        const dates = readdirSync(chemin).map((f) => { try { return statSync(join(chemin, f)).mtimeMs; } catch { return 0; } });
        const recent = Math.max(0, ...dates);
        ageJours = recent ? Math.floor((now - recent) / 86400000) : undefined;
      } else {
        ageJours = Math.floor((now - st.mtimeMs) / 86400000);
      }
    } catch { ageJours = undefined; }
    lignes.push({
      id: s.id,
      nature: s.nature,
      producteur: s.producteur,
      contenu: s.contenu,
      // `undefined` = jamais écrite, distinct de 0 = écrite aujourd'hui. Les afficher pareil
      // ferait passer une donnée inexistante pour une donnée toute fraîche.
      ageJours,
      lecteurs: (carte.lecteursPar.get(s.id) ?? []).filter((f) => f !== s.scriptPath).length,
      // ATTEINTE PAR UNE TABLE — une ANNOTATION, jamais une absolution (2026-09-23, tâche #490).
      //
      // Ce champ ne compte PAS comme un lecteur et ne bouge aucun ratio : une donnée atteinte par
      // une table reste dans l'alerte tant que personne ne la lit pour de vrai. Le distinguer sert
      // à décider, pas à se rassurer — l'issue « un vrai lecteur » ou « une absence assumée » se
      // tranche bien mieux en sachant qui frôle déjà la donnée.
      //
      // POURQUOI PAS PLUS FORT, ET C'EST MESURÉ : crédité comme une lecture, ce signal rendait
      // « 0 donnée jamais lue » sur 59 — le « trop propre, et faux » que ce fichier dénonce déjà
      // plus haut. Contre-exemple trouvé en vérifiant : find-brain importe REGISTRIES pour en tirer
      // les chemins de SCRIPTS (`scriptPath`), jamais pour ouvrir les registres — il passait pour
      // lecteur de seize registres dont il n'ouvre aucun. Passer par la table prouve qu'on touche
      // la FAMILLE, jamais qu'on exploite CE contenu-là.
      atteinteParTable: (carte.indirectsPar?.get(s.id) ?? []).filter((e) => e.fichier !== s.scriptPath),
      // LE QUATRIÈME ÉTAT (2026-09-23, tâche #564) : atteinte par une table dont un lecteur DÉCLARÉ
      // et CORROBORÉ ouvre vraiment le contenu. Ce n'est plus un candidat, c'est un lecteur — et
      // c'est le seul moyen de ne pas punir la dérivation de chemins que l'Article 24 exige.
      lueParTableDeclaree: (carte.indirectsPar?.get(s.id) ?? [])
        .filter((e) => e.fichier !== s.scriptPath)
        .filter((e) => declaresCorrobores.some((d) => d.table === e.via && d.fichier !== s.scriptPath)),
    });
  }
  return lignes.sort((a, b) => (a.ageJours ?? 1e9) - (b.ageJours ?? 1e9));
}

// L'ALERTE RARE, celle qui a le droit de m'interrompre (calibrage : « une alerte uniquement quand
// une donnée devient VRAIMENT critique et ignorée »). Rare par construction : il faut qu'une donnée
// soit à la fois FRAÎCHE (quelqu'un vient de l'écrire, donc elle a quelque chose à dire) et SANS
// AUCUN LECTEUR. Une donnée ancienne et ignorée est une question d'hygiène, pas une urgence.
// ============================================================================================
// LA REPRISE DES NOTES — avant de commencer n'importe quel chantier (2026-09-24, tâche #759)
// ============================================================================================
// SA RÈGLE, dans ses mots : « avant de débuter n'importe quel autre chantier : on reprend d'abord
// les notes. règle importante. [...] Moi je raisonne comme si tu consultais les notes avant de
// commencer un chantier : c'est donc un process à établir fermement. »
//
// POURQUOI ÇA VIT ICI PLUTÔT QUE DANS UN 79e SCRIPT : data-archangel répond déjà à « que sait
// l'équipe sur ce sujet ? », mais sa commande `briefing` ne regarde que les SOURCES DE DONNÉES
// déclarées — les registres, les journaux, les séries chiffrées. Lancée sur « classification »
// elle a rendu ZÉRO, alors que le dépôt porte treize classifications et cinq documents sur le
// sujet. La question « qu'avons-nous DÉCIDÉ ? » n'est pas la question « quelles DONNÉES
// produisons-nous ? », et confondre les deux est ce qui a laissé le trou.
//
// LE TROU QU'IL A LUI-MÊME DÉMONTRÉ, et c'est une preuve, pas un exemple : il m'a demandé quelle
// longueur donner au code de nomenclature. J'ai répondu « trois caractères » en comptant CINQ
// axes, parce que c'est tout ce que j'avais en tête. Les notes en portaient TREIZE. La réponse
// était fausse, et rien dans ma façon de répondre ne pouvait me le dire.
//
// CE QU'IL RAPPORTE, ET CE QU'IL NE PEUT PAS. Il trouve où le sujet a déjà été traité ; il ne lit
// pas à ma place. Un chantier ouvert sans passer par là part avec les seules notes que l'agent a
// en mémoire — c'est-à-dire, à la session suivante, aucune (Article 27).
// ══════════════════════════════════════════════════════════════════════════
// L'INVENTAIRE DES RAPPORTS EN TXT (2026-09-26, tâche #921 — point 28 de son gros prompt :
// « l'inventaire des rapports en txt : combien, description, à quoi il sert, livré à la Ronde ?,
// qui le lit, connecté à quoi », suivi de son arbitrage « tu analyses le document txt produit, puis
// tu enchaînes sur la classification des DATA »).
//
// POURQUOI ICI ET PAS DANS UN OUTIL DE PLUS : data-archangel veille déjà sur la CIRCULATION des
// données — qui produit, qui lit, qui n'est lu par personne. Un rapport archivé est une donnée
// produite ; la question « qui le lit ? » est exactement la sienne. Le construire à côté aurait
// donné deux cartes de la même circulation, et deux cartes divergent (Article 3, anti-doublon).
//
// CE QUI REND CET INVENTAIRE UTILE PLUTÔT QUE DÉCORATIF : il ne compte pas des fichiers, il répond
// à la question du gaspillage. Un dossier qui accumule trois cents rapports que personne ne rouvre
// n'est pas une archive, c'est un cimetière — et il grossit à chaque commit. La distinction se
// mesure : un dossier est-il RELU (quelqu'un y lit un fichier) ou seulement ÉCRIT ?
export const MOTIF_PRODUCTEUR = /docs\/([a-z0-9-]+)\//;

// TROIS ÉTATS DE LECTURE, JAMAIS DEUX — et le troisième est celui qui coûte cher :
//   · relu par un outil        — un script ouvre les fichiers de ce dossier ;
//   · relu par un index        — un index.md les liste, donc un humain peut les retrouver ;
//   · écrit et jamais rouvert  — produit, archivé, et hors de portée de tout le monde.
export const ETATS_D_ARCHIVE = ["relu par un outil", "listé par un index", "écrit et jamais rouvert"];

export function inventaireDesRapports({ root = ROOT, racine = "docs", lireDossier = readdirSync, lire = readFileSync, exists = existsSync, scripts = null } = {}) {
  let dossiers = [];
  try {
    dossiers = lireDossier(join(root, racine), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return { mesurable: false, pourquoi: `le dossier ${racine}/ n'a pas pu être lu : aucun rapport n'a été inventorié, ce qui n'est jamais la même chose qu'aucun rapport` };
  }
  // Les sources des scripts, lues UNE fois : la question « qui lit ce dossier ? » se pose 40 fois,
  // et relire 80 fichiers à chaque fois ferait de cet inventaire un outil qu'on n'ose plus lancer.
  let sources = scripts;
  if (!sources) {
    sources = {};
    try { for (const f of lireDossier(join(root, "scripts")).filter((x) => x.endsWith(".mjs"))) { try { sources[f] = lire(join(root, "scripts", f), "utf8"); } catch { /* illisible */ } } } catch { /* pas de scripts */ }
  }
  // LE CORPUS OÙ L'ON CHERCHE LES CITATIONS, construit UNE fois : les sources des scripts plus tous
  // les .md du dépôt. Chercher 282 noms de fichiers dans 400 documents relus à chaque fois ferait
  // de cet inventaire un outil qu'on n'ose plus lancer (L2, pris par l'autre bout : un outil trop
  // lent finit par ne plus sortir du tout).
  const corpus = Object.values(sources);
  const empiler = (dossier) => {
    let noms = [];
    try { noms = lireDossier(join(root, dossier)); } catch { return; }
    for (const n of noms) {
      if (n.endsWith(".md")) { try { corpus.push(lire(join(root, dossier, n), "utf8")); } catch { /* illisible */ } }
    }
  };
  empiler("docs");
  empiler("docs/referentiel");
  empiler("docs/suivi/sessions");
  const lignes = [];
  for (const d of dossiers) {
    let fichiers = [];
    try { fichiers = lireDossier(join(root, racine, d)); } catch { continue; }
    const txt = fichiers.filter((f) => f.endsWith(".txt"));
    if (!txt.length) continue;
    const chemin = `${racine}/${d}`;
    // QUI LE LIT : un script qui NOMME ce dossier dans son code peut l'ouvrir. C'est une borne
    // haute, jamais une preuve de lecture — et c'est dit, plutôt que présenté comme un fait.
    const lecteurs = Object.entries(sources)
      .filter(([nom, src]) => nom !== "data-archangel.mjs" && new RegExp(`["'\`][^"'\`]*${d}/`).test(String(src)))
      .map(([nom]) => `scripts/${nom}`);
    const aUnIndex = exists(join(root, racine, d, "index.md"));
    const etat = lecteurs.length ? ETATS_D_ARCHIVE[0] : aUnIndex ? ETATS_D_ARCHIVE[1] : ETATS_D_ARCHIVE[2];
    let octets = 0;
    for (const f of txt) { try { octets += lire(join(root, racine, d, f), "utf8").length; } catch { /* illisible */ } }
    // LE FICHIER, PAS SEULEMENT LE DOSSIER — et c'est la mesure qui discrimine vraiment. « Un script
    // nomme ce dossier » est vrai de 38 dossiers sur 40 : ça ne sépare rien. La vraie question est
    // par FICHIER : ce rapport-ci est-il nommé quelque part ailleurs que dans son propre dossier ?
    // Un rapport que personne ne cite n'est jamais rouvert individuellement — il n'est consultable
    // qu'en ouvrant le dossier au hasard, ce que personne ne fait.
    const cites = txt.filter((f) => corpus.some((t) => t.includes(f)));
    lignes.push({ dossier: chemin, combien: txt.length, octets, lecteurs, aUnIndex, etat,
      cites: cites.length, jamaisCites: txt.length - cites.length });
  }
  lignes.sort((a, b) => b.combien - a.combien);
  const parEtat = Object.fromEntries(ETATS_D_ARCHIVE.map((e) => [e, lignes.filter((l) => l.etat === e)]));
  return {
    mesurable: true, lignes,
    total: lignes.reduce((a, l) => a + l.combien, 0),
    octets: lignes.reduce((a, l) => a + l.octets, 0),
    parEtat,
    horsPortee: "« qui le lit » est une BORNE HAUTE : un script qui nomme le dossier dans son code PEUT l'ouvrir, ce qui ne prouve pas qu'il le fait, ni qu'il lit autre chose que le dernier fichier. Un dossier sans lecteur et sans index, en revanche, est bien hors de portée de tout le monde — c'est le seul verdict ferme de cet inventaire.",
  };
}

export function formatInventaireRapportsLines(inv, { combien = 12 } = {}) {
  if (!inv?.mesurable) return [`INVENTAIRE DES RAPPORTS : PAS MESURÉ — ${inv?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== INVENTAIRE DES RAPPORTS EN TXT — ${inv.total} fichier(s), ${Math.round(inv.octets / 1024)} Ko, ${inv.lignes.length} dossier(s) ===`];
  l.push("");
  l.push(`  dossier                                   combien      Ko  état`);
  l.push(`  ----------------------------------------  -------  ------  ----------------------------`);
  for (const x of inv.lignes.slice(0, combien)) {
    l.push(`  ${x.dossier.padEnd(40)}  ${String(x.combien).padStart(7)}  ${String(Math.round(x.octets / 1024)).padStart(6)}  ${x.etat}${x.lecteurs.length ? ` (${x.lecteurs.length})` : ""}`);
  }
  if (inv.lignes.length > combien) l.push(`  … et ${inv.lignes.length - combien} autre(s) dossier(s)`);
  l.push("");
  for (const e of ETATS_D_ARCHIVE) {
    const g = inv.parEtat[e] ?? [];
    const n = g.reduce((a, x) => a + x.combien, 0);
    l.push(`  ${e.padEnd(28)} ${String(g.length).padStart(3)} dossier(s) · ${String(n).padStart(4)} fichier(s) · ${String(Math.round(g.reduce((a, x) => a + x.octets, 0) / 1024)).padStart(5)} Ko`);
  }
  const morts = inv.parEtat[ETATS_D_ARCHIVE[2]] ?? [];
  if (morts.length) l.push(`  ⚠️  DOSSIERS HORS DE PORTÉE DE TOUT LE MONDE : ${morts.map((x) => `${x.dossier} (${x.combien})`).join(" · ")}`);
  // LA MESURE PAR FICHIER, qui discrimine là où la mesure par dossier ne sépare rien.
  const jamaisCites = inv.lignes.reduce((a, x) => a + x.jamaisCites, 0);
  l.push(`  📄 PAR FICHIER : ${inv.total - jamaisCites} rapport(s) nommés quelque part · ${jamaisCites} JAMAIS CITÉS (${inv.total ? Math.round((jamaisCites / inv.total) * 100) : 0} %) — un rapport que personne ne nomme n'est rouvert qu'en ouvrant son dossier au hasard.`);
  const pires = inv.lignes.filter((x) => x.jamaisCites).sort((a, b) => b.jamaisCites - a.jamaisCites).slice(0, 6);
  for (const x of pires) l.push(`     ${x.dossier.padEnd(40)} ${String(x.jamaisCites).padStart(4)} jamais cité(s) sur ${x.combien}`);
  l.push(`  HORS PORTÉE : ${inv.horsPortee}`);
  return l;
}

export const LIEUX_DE_NOTES = [
  { cle: "decisions", quoi: "les tâches du suivi — ce qui a été décidé, et par qui", dossier: "docs/suivi", ext: /\.md$/ },
  { cle: "plans", quoi: "les plans et états des lieux d'un chantier", dossier: "docs/plans", ext: /\.(md|txt)$/ },
  { cle: "referentiel", quoi: "le référentiel — la règle telle qu'elle s'applique aujourd'hui", dossier: "docs/referentiel", ext: /\.md$/ },
  { cle: "conception", quoi: "les documents de conception et les blueprints", dossier: "docs", ext: /\.md$/ },
  { cle: "code", quoi: "les commentaires de tête des outils — le POURQUOI vit à côté du QUOI", dossier: "scripts", ext: /\.mjs$/ },
];

export const EXTRAIT_MAX = 160;

function fichiersDe(root, dossier, ext, recursif = true, profondeur = 0) {
  const out = [];
  let entrees = [];
  try { entrees = readdirSync(join(root, dossier), { withFileTypes: true }); } catch { return out; }
  for (const e of entrees) {
    const rel = `${dossier}/${e.name}`;
    if (e.isDirectory()) { if (recursif && profondeur < 3) out.push(...fichiersDe(root, rel, ext, recursif, profondeur + 1)); continue; }
    if (ext.test(e.name)) out.push(rel);
  }
  return out;
}

export function reprendreLesNotes(sujet, { root = ROOT, lieux = LIEUX_DE_NOTES, lire } = {}) {
  const motif = String(sujet ?? "").trim();
  if (motif.length < 3) return { mesurable: false, pourquoi: "un sujet de moins de trois caractères ramènerait tout le dépôt : ce n'est pas une reprise de notes, c'est du bruit" };
  // UN ESPACE DANS LE SUJET VAUT N'IMPORTE QUEL SÉPARATEUR (2026-09-25, même passage que le nom de
  // fichier ci-dessous, et c'est la MOITIÉ manquante de la même correction). Chercher
  // « gardiens donnees absentes » rendait toujours zéro une fois les noms de fichiers lus, parce
  // que le fichier s'appelle `audit-gardiens-donnees-absentes-…` : des TIRETS, jamais des espaces.
  // Un sujet se tape en mots séparés par des espaces ; un dépôt les écrit avec des tirets, des
  // soulignés ou des espaces selon l'endroit. Exiger l'espace revenait à demander à l'utilisateur
  // de deviner la convention du fichier qu'il cherche — l'inverse d'une reprise de notes.
  // Ce n'est PAS une recherche floue : chaque mot reste exigé, dans l'ordre, entier. Seul le
  // séparateur devient libre.
  // ET LES ACCENTS COMPTENT AUSSI (2026-09-25, tâche #859) — la troisième et dernière moitié de la
  // même correction, trouvée exactement comme les deux premières : en s'en servant pour de vrai.
  // « ceremonie » rendait ZÉRO là où « cérémonie » rend 16 fichiers. Un sujet se tape vite, souvent
  // sans accent ; le dépôt, lui, écrit un français correct. Exiger l'accent revenait à faire deviner
  // l'orthographe exacte du texte qu'on cherche — et un zéro obtenu comme ça se lit « on part de
  // zéro » alors que seize fichiers en parlent.
  //
  // La comparaison se fait donc SANS accents des DEUX côtés : le motif est dépouillé, et chaque
  // ligne l'est avant le test. Ce n'est toujours pas une recherche floue — chaque mot reste exigé,
  // entier, dans l'ordre ; seuls le séparateur et l'accent deviennent libres.
  const sansAccents = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const re = new RegExp(
    sansAccents(motif).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s_-]+"),
    "i",
  );
  const teste = (texte) => re.test(sansAccents(texte));
  const lecteur = lire ?? ((f) => readFileSync(join(root, f), "utf8"));
  const par = {};
  let fichiersVus = 0;
  let illisibles = 0;
  for (const l of lieux) {
    par[l.cle] = [];
    for (const f of fichiersDe(root, l.dossier, l.ext)) {
      // `docs` en entier recouvrirait `docs/suivi`, `docs/plans` et `docs/referentiel` : on laisse
      // chaque lieu à son propriétaire plutôt que de compter trois fois la même note.
      if (l.cle === "conception" && /^docs\/(suivi|plans|referentiel)\//.test(f)) continue;
      let src; fichiersVus++;
      try { src = lecteur(f); } catch { illisibles++; continue; }
      const lignes = String(src).split("\n");
      const touches = [];
      for (let i = 0; i < lignes.length; i++) if (teste(lignes[i])) touches.push({ ligne: i + 1, extrait: lignes[i].trim().slice(0, EXTRAIT_MAX) });
      // LE NOM DU FICHIER COMPTE AUSSI, et l'oublier a coûté pour de vrai (2026-09-25, Ronde) :
      // une recherche sur « gardien donnees absentes » a rendu ZÉRO alors que
      // `docs/plans/audit-gardiens-donnees-absentes-2026-09-23.md` existait et répondait
      // exactement à la question. Ce fichier ne répète simplement pas son propre titre dans son
      // corps — ce que fait tout document bien écrit. La reprise des notes concluait donc « on
      // part de zéro » sur un chantier déjà cadré et déjà tranché, soit EXACTEMENT le défaut que
      // l'Article 30 existe pour empêcher, commis par l'outil qui le porte.
      // TROIS ÉTATS, JAMAIS DEUX : le sujet est dans le TEXTE (preuve forte), seulement dans le
      // NOM (indice, plus faible mais jamais rien), ou absent. Fondre le deuxième dans le premier
      // gonflerait les occurrences d'un fichier qui ne dit peut-être rien ; le fondre dans le
      // troisième est l'erreur qu'on vient de payer.
      const parLeNom = teste(f);
      if (touches.length) par[l.cle].push({ fichier: f, occurrences: touches.length, premier: touches[0], parLeNom });
      else if (parLeNom) par[l.cle].push({ fichier: f, occurrences: 0, premier: null, parLeNom: true, nomSeulement: true });
    }
    // Un fichier trouvé par son seul NOM passe en TÊTE malgré ses zéro occurrence : c'est le cas
    // qu'on vient de manquer, et le laisser en queue le ferait retomber sous la coupe d'affichage.
    par[l.cle].sort((a, b) => (Number(Boolean(b.nomSeulement)) - Number(Boolean(a.nomSeulement))) || (b.occurrences - a.occurrences));
  }
  const total = Object.values(par).reduce((s, v) => s + v.length, 0);
  return { sujet: motif, par, total, fichiersVus, illisibles,
    // Un zéro ici ne veut jamais dire « rien à savoir » : il veut dire « ce mot-là ne ressort pas ».
    mesurable: fichiersVus > 0,
    pourquoi: fichiersVus ? null : "aucun fichier lu — la recherche n'a pas pu tourner, ce qui ne veut PAS dire qu'il n'y a pas de notes" };
}

// ============================================================================================
// LE DOSSIER D'UN SUJET (2026-09-25, tâche #742) — « rassembler, pas résumer »
// ============================================================================================
// SA DEMANDE, dans ses mots : « Tu pourras me faire un rapport complet de TOUTES les notes prises
// sur la classification ? tu dois avoir tout archivé quelquepart ». Et il a raison sur les deux
// bouts : tout EST archivé, et personne ne peut le lire, parce que c'est éparpillé sur cinq lieux
// qui ne se connaissent pas.
//
// POURQUOI CETTE COMMANDE EXISTE À CÔTÉ DE `notes`, et la frontière est nette : `notes` dit OÙ le
// sujet a déjà été traité — c'est le geste de l'Article 30, avant d'ouvrir un chantier, et il doit
// rester instantané. `dossier` RASSEMBLE : il sort les extraits réels, et surtout il lit l'ÉTAT de
// chaque ligne de suivi pour séparer ce qui est DÉCIDÉ de ce qui reste OUVERT. Les fondre aurait
// rendu le geste quotidien trop lourd pour être fait quotidiennement.
//
// CE QU'IL NE FAIT PAS, et c'est délibéré : il ne résume pas, il ne juge pas, il ne conclut pas. Un
// outil qui résumerait à ma place produirait un rapport que je n'aurais pas lu et qu'il faudrait
// croire sur parole. Ici tout extrait est verbatim, et l'analyse est écrite à côté, par moi.
// LE VOCABULAIRE EST LU DANS LE SUIVI RÉEL, jamais inventé (Article 24). Relevé le 2026-09-25 :
// « terminée — fidèle » (302), « terminée » (178), « Ouverte » (66), « TERMINÉ » (24), « à faire »
// (21), « en cours » (4), plus quelques variantes annotées. La première version ne connaissait que
// trois formes et rangeait tout le reste en « état illisible » — honnête, mais aveugle sur les
// deux tiers du registre.
const ETATS_DE_LIGNE = [
  // « terminé », « terminée », « Terminé », « TERMINÉ » : le radical suffit, et il couvre les quatre
  // formes réelles du registre. La première version exigeait « terminée » et laissait huit lignes
  // en « état illisible » pour un accent au masculin — une sonde qui ne peut pas matcher rend
  // exactement ce que rend une ligne vraiment illisible.
  { motif: /\|\s*termin[ée]/i, etat: "décidé" },
  { motif: /\|\s*(ouverte?|en cours|à faire|a faire)\b[^|]*\|?\s*$/i, etat: "ouvert" },
  { motif: /\|\s*(en attente|à trancher|a trancher)\b[^|]*\|?\s*$/i, etat: "attend une décision de l'utilisateur" },
];

export function etatDeLaLigneDeSuivi(ligne) {
  const t = String(ligne ?? "").trimEnd();
  for (const e of ETATS_DE_LIGNE) if (e.motif.test(t)) return e.etat;
  // Ni l'un ni l'autre : une ligne de suivi dont l'état ne se lit pas est un TROISIÈME état, jamais
  // rangée d'office parmi les ouvertes. La compter comme ouverte gonflerait le reste-à-faire d'un
  // travail peut-être terminé, et l'inverse le ferait disparaître.
  return "état illisible";
}

export function numeroDeLaLigneDeSuivi(ligne) {
  const m = /^\|\s*(\d{1,5})\s*\|/.exec(String(ligne ?? ""));
  return m ? Number(m[1]) : null;
}

export function dossierDuSujet(sujet, { root = ROOT, lieux = LIEUX_DE_NOTES, lire, extraitsParFichier = 4 } = {}) {
  const base = reprendreLesNotes(sujet, { root, lieux, lire });
  if (!base.mesurable) return base;
  const re = new RegExp(String(sujet).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const lecteur = lire ?? ((f) => readFileSync(join(root, f), "utf8"));
  const decisions = [];   // lignes de docs/suivi/ qui portent le sujet, avec leur état réel
  const extraits = {};    // par lieu : les vrais morceaux de texte, verbatim
  for (const l of lieux) {
    extraits[l.cle] = [];
    for (const h of base.par[l.cle] ?? []) {
      let src; try { src = lecteur(h.fichier); } catch { continue; }
      const lignes = String(src).split("\n");
      // LE PLAFOND NE S'APPLIQUE QU'AUX EXTRAITS DE PROSE, JAMAIS AUX LIGNES DE SUIVI — corrigé au
      // premier vrai passage : sur « classification », le plafond commun rendait 9 décisions là où
      // le suivi en porte bien davantage, parce que toutes vivent dans le même fichier de session
      // et que les quatre premières épuisaient le quota. Une DÉCISION perdue est exactement ce que
      // ce dossier existe pour empêcher ; un extrait de prose en moins ne coûte rien.
      let pris = 0;
      for (let i = 0; i < lignes.length; i++) {
        if (!re.test(lignes[i])) continue;
        const brut = lignes[i].trim();
        if (l.cle === "decisions" && brut.startsWith("|")) {
          const num = numeroDeLaLigneDeSuivi(brut);
          if (num !== null) { decisions.push({ numero: num, fichier: h.fichier, etat: etatDeLaLigneDeSuivi(brut), texte: brut }); continue; }
        }
        if (pris >= extraitsParFichier) continue;
        extraits[l.cle].push({ fichier: h.fichier, ligne: i + 1, texte: brut.slice(0, 400) });
        pris += 1;
      }
    }
  }
  decisions.sort((a, b) => a.numero - b.numero);
  const parEtat = {};
  for (const d of decisions) (parEtat[d.etat] ??= []).push(d.numero);
  // UN NUMÉRO PORTÉ PAR PLUSIEURS LIGNES, avec des états qui se contredisent — trouvé au premier
  // vrai passage sur « classification » : #754 existe en « En attente de sa décision » (ouverture)
  // ET en « Terminée » (clôture), et le dépôt en compte six comme lui. Ce n'est pas illégitime dans
  // un journal où l'on ajoute sans réécrire — mais un lecteur qui cherche L'ÉTAT d'une tâche en
  // trouve alors deux, et rien ne lui dit lequel fait foi. Signalé, jamais arbitré.
  const parNumero = {};
  for (const d of decisions) (parNumero[d.numero] ??= []).push(d.etat);
  const etatsContradictoires = Object.entries(parNumero)
    .filter(([, etats]) => new Set(etats).size > 1)
    .map(([numero, etats]) => ({ numero: Number(numero), etats: [...new Set(etats)] }))
    .sort((a, b) => a.numero - b.numero);
  return { ...base, decisions, parEtat, etatsContradictoires, extraits };
}

export function formatDossierMarkdown(d, { maintenant } = {}) {
  if (!d?.mesurable) return `# Dossier — NON MESURABLE\n\n${d?.pourquoi ?? "raison inconnue"}\n`;
  if (!maintenant) throw new Error("formatDossierMarkdown : une date doit être LUE et passée ici, jamais fabriquée dans la fonction (Article 32)");
  const L = [];
  L.push(`# Dossier du sujet « ${d.sujet} » — toutes les notes déjà prises`);
  L.push("");
  L.push(`> Produit par \`node scripts/data-archangel.mjs dossier ${d.sujet}\` le ${maintenant}.`);
  L.push("> **Rassemblé, jamais résumé** : chaque extrait ci-dessous est verbatim. L'outil ne juge pas et");
  L.push("> ne conclut pas — un rapport résumé par une machine serait un rapport qu'il faudrait croire");
  L.push("> sur parole. L'analyse et le plan d'action sont écrits à côté, à la main.");
  L.push("");
  L.push(`**${d.total} fichier(s)** portent ce sujet, répartis sur ${Object.values(d.par).filter((v) => v.length).length} lieu(x) sur ${Object.keys(d.par).length}.`);
  L.push("");
  L.push("## Ce qui a été DÉCIDÉ, et ce qui reste OUVERT");
  L.push("");
  if (!d.decisions.length) {
    L.push("Aucune ligne de suivi ne porte ce sujet. **Ce n'est pas « rien à décider »** : c'est « ce mot-là");
    L.push("ne ressort pas du suivi », et les deux ne se rendent pas pareil. Réessayer avec le vocabulaire");
    L.push("du sujet avant d'en conclure quoi que ce soit.");
  } else {
    for (const [etat, nums] of Object.entries(d.parEtat).sort()) L.push(`- **${etat}** : ${nums.length} — ${nums.map((n) => `#${n}`).join(" ")}`);
    if (d.etatsContradictoires?.length) {
      L.push("");
      L.push(`⚠️ **${d.etatsContradictoires.length} tâche(s) portent plusieurs lignes dont les états se contredisent.** Ce n'est pas illégitime dans un journal où l'on ajoute sans réécrire, mais un lecteur qui cherche L'ÉTAT d'une tâche en trouve deux, et rien ne lui dit lequel fait foi :`);
      for (const c of d.etatsContradictoires) L.push(`  - **#${c.numero}** — ${c.etats.join(" / ")}`);
    }
    L.push("");
    L.push("| N° | État | La ligne, verbatim |");
    L.push("|---|---|---|");
    for (const x of d.decisions) L.push(`| #${x.numero} | ${x.etat} | ${x.texte.replace(/\|/g, "\\|").slice(0, 600)} |`);
  }
  for (const l of LIEUX_DE_NOTES) {
    const ex = d.extraits[l.cle] ?? [];
    if (l.cle === "decisions" || !ex.length) continue;
    L.push("");
    L.push(`## ${l.quoi}`);
    L.push("");
    for (const e of ex) L.push(`- \`${e.fichier}:${e.ligne}\` — ${e.texte.replace(/\|/g, "\\|")}`);
  }
  L.push("");
  L.push("## Plan d'action (Article 28 — à remplir à la main, l'outil ne le fabrique jamais)");
  L.push("");
  L.push("| Constat | État (RETENU / ÉCARTÉ + raison / À TRANCHER) | Tâche dans `docs/suivi/` |");
  L.push("|---|---|---|");
  L.push("| *(à écrire)* | | |");
  return L.join("\n") + "\n";
}

export function formatReprisesLines(r, { parLieu = 6 } = {}) {
  if (!r?.mesurable) return [`⚠️ NON MESURABLE — ${r?.pourquoi ?? "raison inconnue"}`];
  const L = [`=== REPRISE DES NOTES — « ${r.sujet} » : ${r.total} fichier(s) portent déjà ce sujet ===`, ""];
  for (const l of LIEUX_DE_NOTES) {
    const hits = r.par[l.cle] ?? [];
    L.push(`${l.cle.toUpperCase().padEnd(12)} ${String(hits.length).padStart(3)} — ${l.quoi}`);
    for (const h of hits.slice(0, parLieu)) L.push(h.nomSeulement
      ? `      — ${h.fichier}   ← le NOM porte le sujet, le texte ne le répète pas : indice, jamais preuve`
      : `   ${String(h.occurrences).padStart(4)}× ${h.fichier}`);
    if (hits.length > parLieu) L.push(`        … et ${hits.length - parLieu} autre(s)`);
  }
  L.push("");
  L.push(r.total
    ? `À LIRE AVANT D'OUVRIR LE CHANTIER. Ce compte dit OÙ le sujet a déjà été traité ; il ne lit pas à votre place, et un chantier ouvert sans cette lecture repart avec les seules notes que l'agent a en mémoire — c'est-à-dire, à la session suivante, aucune.`
    : `⚠️ Aucun fichier ne porte ce mot. Ce n'est PAS la preuve qu'il n'y a rien à savoir : c'est la preuve que CE MOT-LÀ ne ressort pas. Réessayer avec le vocabulaire du sujet avant de conclure qu'on part de zéro.`);
  if (r.illisibles) L.push(`(${r.illisibles} fichier(s) illisibles, non comptés — déclaré plutôt que passé sous silence.)`);
  return L;
}

// « PERSONNE NE LIT » VOULAIT DIRE « PERSONNE D'AUTRE QUE SON PRODUCTEUR » (2026-09-26, tâche #927).
//
// CE QUE LA PHRASE A COÛTÉ, et c'est mesuré plutôt que craint : la veille, tool-learning avait jugé
// SAFE-EXPORT « apprend » sur la preuve `relit-sa-memoire`. Le lendemain, ce rapport annonçait
// `docs/safe-export/` parmi les données fraîches que « PERSONNE ne lit ». J'ai cru à une
// contradiction entre deux de mes propres mesures, et j'ai passé une demi-heure à construire un
// détecteur pour la résoudre. **Il n'y avait aucune contradiction** : tool-learning demande « l'outil
// relit-il SA PROPRE mémoire ? » (oui, `loadMemoire()`), ce compteur demande « quelqu'un d'AUTRE que
// le producteur la lit-il ? » (non). Deux questions différentes, deux réponses justes, et un seul
// mot — « personne » — qui laissait croire le contraire.
//
// LE DÉTECTEUR A ÉTÉ RETIRÉ, et son retrait vaut la leçon : lancé contre le vrai dépôt, il créditait
// 14 sources et ne changeait AUCUN chiffre (orphelines 26 → 26, branchées 39 → 39), parce que
// chacune de ses trouvailles était un producteur lisant son propre fichier — ce que toutes les
// mesures excluent déjà par construction. Du code qui ne déplace aucune mesure est une décoration
// (leçon L2), et il faisait même bouger un compteur dans le MAUVAIS sens sur un faux positif (une
// PHRASE citant un chemin prise pour une constante de chemin, leçon L28).
//
// CE QUI RESTE EST GRATUIT ET SUFFIT : dire ce que la mesure mesure vraiment.
export function criticalIgnoredData(briefing, { seuilFraicheurJours = 2 } = {}) {
  return briefing.filter((l) => l.ageJours !== undefined && l.ageJours <= seuilFraicheurJours && l.lecteurs === 0 && !(l.lueParTableDeclaree ?? []).length);
}

// LA MÊME POPULATION, MAIS L'AUTRE MOITIÉ : fraîche, sans lecteur direct, et lue par un lecteur de
// table déclaré et corroboré. Elle est montrée à part plutôt que fondue dans le silence — savoir
// QUI la lit vaut mieux que ne plus la voir du tout, et c'est ce qui permettra un jour de vérifier
// que ce lecteur-là fait vraiment son travail.
export function readViaDeclaredTable(briefing, { seuilFraicheurJours = 2 } = {}) {
  return briefing.filter((l) => l.ageJours !== undefined && l.ageJours <= seuilFraicheurJours && l.lecteurs === 0 && (l.lueParTableDeclaree ?? []).length);
}

// ————————————————————————————————————————————————————————————————————————
// LE RAPPORT
// ————————————————————————————————————————————————————————————————————————

// ————————————————————————————————————————————————————————————————————————
// LA DATA « TENDANCES » — sa circulation, et c'est le métier même de cet outil
// ————————————————————————————————————————————————————————————————————————
//
// Demandé le 2026-09-22 : « un outil existant devrait s'assurer que la data "tendances" produite
// est bien partagée et exploitée par tous les outils concernés, par toi et par moi ».
//
// POURQUOI CELUI-CI ET PAS UN NOUVEAU : data-archangel a été construit pour exactement ces deux
// questions, dans ces deux sens — une donnée produite que personne ne lit, et un outil qui devrait
// lire quelque chose et ne le lit pas —, plus l'accès de l'agent lui-même à ce que l'équipe sait.
// La data de tendance est une donnée comme une autre ; lui donner un surveillant à part aurait
// créé deux gardiens de la circulation qui divergeraient (§7ter).
//
// LE RISQUE PRÉCIS QUE CECI COUVRE, et il est plus grand que celui des données ordinaires : une
// série temporelle coûte à produire (un point à chaque passage, pendant des semaines) et ne rend
// rien tant que personne ne la lit. Une donnée orpheline ordinaire est un gâchis ponctuel ; une
// SÉRIE orpheline est un gâchis qui se répète à chaque Ronde, et dont la valeur perdue grandit
// avec le temps — c'est le pire rapport coût/retour possible.
export const NATURE_TENDANCE = "série temporelle (historique, évolutions, tendances)";

// Qui DEVRAIT lire les tendances, et de quoi. Déclaré plutôt que deviné, avec le garde-fou
// mécanique qui va avec (Article 24) : l'appartenance d'un outil à cette table est un jugement,
// mais l'existence du fichier de série, elle, se vérifie.
export const CONSOMMATEURS_DE_TENDANCE = [
  { outil: "cassandra-rh", script: "scripts/cassandra-rh.mjs", pourquoi: "gardienne des objectifs et des KPI : un objectif se juge sur une trajectoire, jamais sur un point" },
  { outil: "objectifs-vs-resultats", script: "scripts/objectifs-vs-resultats.mjs", pourquoi: "un objectif raté trois fois de suite n'est pas le même problème qu'un objectif raté une fois" },
  { outil: "kpi-report", script: "scripts/kpi-report.mjs", pourquoi: "c'est le tableau de bord : montrer un chiffre sans sa pente, c'est montrer la moitié de l'information" },
  { outil: "clean-dirty-old", script: "scripts/clean-dirty-old.mjs", pourquoi: "la stagnation EST une tendance — il la déduit aujourd'hui de dates de fichiers, jamais d'une série" },
  { outil: "angel-of-ia-process", script: "scripts/angel-of-ia-process.mjs", pourquoi: "l'évaluation de l'utilisateur se lit en trajectoire, c'est sa demande explicite du 2026-09-22" },
  { outil: "smart-conso-token", script: "scripts/smart-conso-token.mjs", pourquoi: "un rythme de consommation ne se juge que dans la durée" },
  // 2026-09-22 — les deux derniers arrivés, absents de ce registre par simple antériorité : il a été
  // écrit avant leur naissance et rien ne l'a rouvert à leur arrivée. C'est exactement le diagnostic
  // de l'Article 24 pris sur le fait : les sept registres d'intégration ont chacun réclamé leur
  // inscription en échouant, celui-ci n'a rien réclamé du tout — parce qu'aucun test ne dit ce qui
  // DEVRAIT consommer une tendance, seulement ce qui est déclaré la consommer. Un registre qui ne
  // sait pas qu'il lui manque quelqu'un est muet, pas vert.
  { outil: "safe-export", script: "scripts/safe-export.mjs", pourquoi: "l'exportabilité n'a aucun sens en instantané : 4 fuites aujourd'hui est un chiffre creux tant qu'on ne sait pas si on en réparait 10 le mois dernier ou 1" },
  { outil: "tool-learning", script: "scripts/tool-learning.mjs", pourquoi: "il juge des TRAJECTOIRES par définition (c'est sa frontière déclarée avec CASSANDRA) — un outil qui juge des pentes sans tenir de série se jugerait lui-même immobile" },
];

// findTendancesOrphelines() — une série produite et lue par personne. Le sens 1 du métier de cet
// outil, appliqué aux séries.
export function findTendancesOrphelines(carte, { consommateurs = CONSOMMATEURS_DE_TENDANCE, root = ROOT, readFileImpl = readFileSync, exists = existsSync } = {}) {
  const orphelines = [];
  for (const c of consommateurs) {
    const chemin = join(root, `docs/${c.outil}/serie.json`);
    if (!exists(chemin)) continue;
    // Lue par quelqu'un ? On cherche une vraie référence à la série dans le code des autres outils,
    // jamais une supposition tirée du fait qu'elle existe.
    let lecteurs = 0;
    for (const autre of consommateurs) {
      if (autre.outil === c.outil) continue;
      try {
        const code = readFileImpl(join(root, autre.script), "utf8");
        if (code.includes(c.outil) && /serie|tendance|Tendance/.test(code)) lecteurs++;
      } catch { /* script illisible : compté comme non-lecteur, jamais comme lecteur */ }
    }
    if (lecteurs === 0) orphelines.push({ outil: c.outil, chemin: `docs/${c.outil}/serie.json`, pourquoi: "série produite à chaque passage et relue par aucun autre outil — un gâchis qui se répète, jamais ponctuel" });
  }
  return orphelines;
}

// findOutilsPrivesDeTendance() — le sens 2 : un outil qui DEVRAIT exploiter une tendance et ne
// connaît même pas le mécanisme. Se vérifie sur le code réel (importe-t-il serie-temporelle ?),
// jamais sur une intention déclarée en commentaire.
export function findOutilsPrivesDeTendance({ consommateurs = CONSOMMATEURS_DE_TENDANCE, root = ROOT, readFileImpl = readFileSync } = {}) {
  const prives = [];
  for (const c of consommateurs) {
    let code;
    try { code = readFileImpl(join(root, c.script), "utf8"); } catch { continue; }
    if (!code.includes("serie-temporelle")) prives.push({ outil: c.outil, pourquoi: c.pourquoi });
  }
  return prives;
}

// tendanceBriefing() — le troisième sens, celui que l'utilisateur a ajouté en disant « par toi et
// par moi » : ni l'agent ni lui ne peuvent exploiter une tendance qu'on ne leur montre pas. Rend la
// liste des séries réellement disponibles, avec leur nombre de points — donc ce qui est déjà
// exploitable et ce qui est encore trop jeune pour dire quoi que ce soit.
export function tendanceBriefing({ consommateurs = CONSOMMATEURS_DE_TENDANCE, root = ROOT, readFileImpl = readFileSync, exists = existsSync, minPoints = 4 } = {}) {
  return consommateurs.map((c) => {
    const rel = `docs/${c.outil}/serie.json`;
    if (!exists(join(root, rel))) return { outil: c.outil, etat: "aucune série", points: 0, exploitable: false };
    try {
      const pts = JSON.parse(readFileImpl(join(root, rel), "utf8"));
      const n = Array.isArray(pts) ? pts.length : 0;
      // « Trop jeune » et « absente » sont deux états distincts, jamais fondus : l'un se corrige en
      // attendant, l'autre en câblant. Les confondre ferait attendre une série qui n'arrivera jamais.
      return { outil: c.outil, etat: n >= minPoints ? "exploitable" : "trop jeune pour une tendance", points: n, exploitable: n >= minPoints };
    } catch {
      return { outil: c.outil, etat: "série illisible", points: 0, exploitable: false };
    }
  });
}

export function buildDataArchangelReport({ root = ROOT, readFileImpl = readFileSync, now = Date.now() } = {}) {
  const carte = mapReaders({ root, readFileImpl });
  const orphelines = findOrphanData(carte, { root });
  const suggestions = suggestMissingConnections(carte);
  const briefing = agentDataBriefing(carte, { root, now });
  const critiques = criticalIgnoredData(briefing);
  const parTableDeclaree = readViaDeclaredTable(briefing);
  const branchees = carte.sources.length - orphelines.length;
  return {
    carte,
    orphelines,
    suggestions,
    briefing,
    critiques,
    parTableDeclaree,
    total: carte.sources.length,
    branchees,
    // Le pourcentage porte sur les sources réellement inventoriées, jamais sur un total supposé.
    pourcentage: carte.sources.length ? Math.round((branchees / carte.sources.length) * 100) : undefined,
  };
}

export function formatDataArchangelReport(r) {
  const l = [];
  l.push(`Sources de données inventoriées : ${r.total} — ${r.branchees} réellement relues par un autre outil (${r.pourcentage} %).`);
  if (r.critiques.length) {
    l.push("", `🚨 ${r.critiques.length} donnée(s) FRAÎCHE(S) qu'AUCUN OUTIL AUTRE QUE SON PRODUCTEUR ne lit — écrite il y a peu, donc elle a quelque chose à dire, et personne d'autre ne l'écoute :`);
    for (const c of r.critiques) {
      // L'annotation dit à quoi ressemble la décision à prendre : un outil qui frôle déjà la donnée
      // est un candidat évident pour la lire vraiment ; personne à proximité oriente plutôt vers
      // l'absence assumée. Elle ne retire JAMAIS la ligne de l'alerte.
      const frolent = [...new Set((c.atteinteParTable ?? []).map((e) => e.fichier.replace("scripts/", "")))];
      const via = [...new Set((c.atteinteParTable ?? []).map((e) => e.via))];
      const annotation = frolent.length
        ? ` — ⚠️ atteinte par table (${via.join(", ")}) chez ${frolent.length} outil(s) : ${frolent.slice(0, 4).join(", ")}${frolent.length > 4 ? "…" : ""}. Passer par le chemin n'est PAS exploiter le contenu : ils sont candidats à devenir de vrais lecteurs, ils n'en sont pas.`
        : " — personne ne la frôle, même par une table : l'absence assumée est ici l'issue la plus probable.";
      l.push(`  · ${c.id} (${c.producteur}, ${c.ageJours} j) — ${c.contenu}${annotation}`);
    }
  }
  if (r.parTableDeclaree?.length) {
    l.push("", `✅ ${r.parTableDeclaree.length} donnée(s) fraîche(s) sans lecteur direct, mais lue(s) par un lecteur de table DÉCLARÉ et corroboré — jamais un trou :`);
    for (const c of r.parTableDeclaree) {
      const qui = [...new Set(c.lueParTableDeclaree.map((e) => e.fichier.replace("scripts/", "")))].join(", ");
      l.push(`  · ${c.id} — lue via ${[...new Set(c.lueParTableDeclaree.map((e) => e.via))].join(", ")} par ${qui}`);
    }
    l.push("  (Un chemin DÉRIVÉ d'un registre plutôt que recopié est ce que l'Article 24 exige : le compter comme non lu punirait la bonne conception. La déclaration n'est pas crue sur parole — le fichier qui la porte doit vraiment lire le disque.)");
  }
  const jamaisEcrites = r.orphelines.filter((o) => !o.existe);
  const dejaAlertees = new Set(r.critiques.map((c) => c.id));
  // Jamais deux fois la même ligne : les fraîches-et-ignorées sont déjà nommées au-dessus, les
  // répéter ici gonflerait le rapport sans rien ajouter — et un rapport qu'on survole ne sert plus.
  const ecritesIgnorees = r.orphelines.filter((o) => o.existe && !dejaAlertees.has(o.id));
  if (ecritesIgnorees.length) {
    l.push("", `${ecritesIgnorees.length} autre(s) donnée(s) écrite(s) que seul leur producteur relit :`);
    for (const o of ecritesIgnorees) l.push(`  · [${o.nature}] ${o.id} — ${o.producteur} : ${o.contenu}${o.testsSeuls ? " (citée uniquement par la suite de tests)" : ""}`);
  }
  if (jamaisEcrites.length) {
    // État distinct, jamais mélangé au précédent : une donnée qui n'existe pas encore n'a pas de
    // lecteurs pour une raison parfaitement innocente.
    l.push("", `${jamaisEcrites.length} source(s) déclarée(s) mais jamais écrite(s) — rien à relire, jamais un reproche : ${jamaisEcrites.map((o) => o.id).join(", ")}`);
  }
  if (r.suggestions.length) {
    l.push("", `Branchements suggérés (${r.suggestions.length} outil(s)) — une suggestion, jamais un manquement :`);
    for (const s of r.suggestions.slice(0, 8)) {
      for (const m of s.manquantes) l.push(`  · ${s.outil} pourrait gagner à lire ${m.source} — ${m.appuis.length} outil(s) travaillant sur le même terrain le font déjà`);
    }
  }
  // LA NUANCE SANS LAQUELLE CE RAPPORT SE LIRAIT DE TRAVERS, et qui vaut pour la majorité des
  // orphelines trouvées : un registre écrit pour être relu PAR UN HUMAIN n'a aucun besoin d'un
  // lecteur-outil, et l'absence de lecteur n'y est donc pas une faute. Ce qu'aucun humain ne fera
  // jamais, en revanche, c'est comparer trente passages successifs pour en tirer une tendance — ça,
  // seul un outil le fait. La vraie question n'est donc pas « personne ne lit ce fichier ? » mais
  // « personne n'exploite la SÉRIE ? », et c'est à cette question-là que la liste ci-dessus répond.
  l.push("", "Comment lire ce qui précède : un registre destiné à l'œil humain n'a pas besoin d'un lecteur-outil. Ce qu'aucun humain ne fera jamais, c'est comparer trente passages pour en tirer une tendance — c'est cette exploitation-là qui manque, jamais forcément une lecture.");
  l.push("Méthode : « lire » se mesure à la citation du chemin dans le code, commentaires et déclarations retirés — une mention, jamais une preuve de lecture effective. Un catalogue qui DÉCLARE une source (doc-report) n'en est pas un lecteur, et la suite de tests qui la VÉRIFIE non plus.");
  return l.join("\n");
}

// planDactionCirculation() (2026-09-25, tâche #863) — ce rapport nommait quatre populations et
// s'arrêtait là, ce que l'Article 28 interdit : un rapport n'est fini que quand ses constats sont
// devenus des tâches.
//
// LES TROIS ÉTATS SONT ICI INDISPENSABLES, pas décoratifs, et c'est pour ça que ce plan passe par
// buildPlanDaction() plutôt que par le raccourci planDactionDepuisEcarts() qui met tout en
// « retenu ». Ce rapport produit quatre populations dont DEUX ne sont pas des écarts, et le texte
// du rapport le dit déjà noir sur blanc :
//   · les sources déclarées mais jamais écrites — « rien à relire, jamais un reproche » ;
//   · les branchements suggérés — « une suggestion, jamais un manquement ».
// Les faire remonter en « retenu » fabriquerait des tâches à partir de non-problèmes, c'est-à-dire
// exactement la formalité que l'Article 28 refuse. Le premier est ÉCARTÉ avec sa raison, le second
// est À TRANCHER parce que la décision de brancher un outil n'appartient pas à une machine.
//
// UN CONSTAT PAR POPULATION, jamais un par fichier : trente lignes « personne ne lit X » se lisent
// comme trente problèmes alors qu'il n'y en a qu'un, et le compte perd son dénominateur en route.
export function planDactionCirculation(r, { toolSlug = "data-archangel" } = {}) {
  const constats = [];
  const total = r.total;
  const ex = (liste, cle = (o) => o.id) => {
    const noms = liste.slice(0, 3).map(cle);
    return `${noms.join(", ")}${liste.length > 3 ? ` (+${liste.length - 3})` : ""}`;
  };
  if (r.critiques.length) {
    constats.push({
      etat: "retenu",
      constat: `${r.critiques.length} donnée(s) FRAÎCHE(S) sur ${total} inventoriées qu'aucun outil AUTRE QUE LEUR PRODUCTEUR ne relit — ex. ${ex(r.critiques)}`,
      // Au-delà d'une poignée, la tâche honnête n'est plus « brancher chacune » mais « décider
      // comment traiter la population » : proposer trente branchements est un plan qu'on ne suit pas.
      tache: r.critiques.length > 20
        ? "décider comment traiter cette population : brancher, ou déclarer que l'exploitation de la SÉRIE n'a pas de valeur ici — jamais fichier par fichier"
        : "pour chacune : lui donner un lecteur-outil, ou déclarer l'absence assumée avec sa raison",
    });
  }
  const dejaAlertees = new Set(r.critiques.map((c) => c.id));
  const ecritesIgnorees = r.orphelines.filter((o) => o.existe && !dejaAlertees.has(o.id));
  if (ecritesIgnorees.length) {
    constats.push({
      etat: "retenu",
      constat: `${ecritesIgnorees.length} donnée(s) écrite(s) sur ${total} que seul leur producteur relit — ex. ${ex(ecritesIgnorees)}`,
      tache: ecritesIgnorees.length > 20
        ? "décider comment traiter cette population — la vraie question n'est pas « personne ne lit ? » mais « personne n'exploite la SÉRIE ? »"
        : "vérifier pour chacune si la série mérite un lecteur, ou si l'œil humain suffit",
    });
  }
  const jamaisEcrites = r.orphelines.filter((o) => !o.existe);
  if (jamaisEcrites.length) {
    constats.push({
      etat: "ecarte",
      constat: `${jamaisEcrites.length} source(s) déclarée(s) sur ${total} jamais écrite(s) — ex. ${ex(jamaisEcrites)}`,
      pourquoi: "une donnée qui n'existe pas encore n'a pas de lecteurs pour une raison parfaitement innocente — l'absence de lecteur n'y est pas un écart",
    });
  }
  if (r.suggestions.length) {
    const nb = r.suggestions.reduce((n, s) => n + s.manquantes.length, 0);
    constats.push({
      etat: "a-trancher",
      constat: `${nb} branchement(s) suggéré(s) pour ${r.suggestions.length} outil(s) — ex. ${ex(r.suggestions, (s) => s.outil)}`,
      pourquoi: "une suggestion, jamais un manquement : brancher un outil sur une source de plus est un choix de conception, et une machine qui le déciderait fabriquerait du travail que personne n'a voulu (Article 16)",
    });
  }
  return buildPlanDaction(constats, { toolSlug });
}

// MON ÉTAT DES LIEUX — la commande que j'appelle avant un gros travail, pour savoir ce que l'équipe
// sait déjà sur le sujet plutôt que de repartir de ce dont je me souviens.
export function formatAgentBriefing(r, { filtre } = {}) {
  const lignes = filtre
    ? r.briefing.filter((b) => `${b.id} ${b.producteur} ${b.contenu}`.toLowerCase().includes(filtre.toLowerCase()))
    : r.briefing;
  const l = [`Ce que l'Agence sait, et où ça vit${filtre ? ` — filtré sur « ${filtre} »` : ""} : ${lignes.length} source(s), de la plus fraîche à la plus ancienne.`, ""];
  for (const b of lignes) {
    const age = b.ageJours === undefined ? "jamais écrite" : b.ageJours === 0 ? "aujourd'hui" : `il y a ${b.ageJours} j`;
    l.push(`  [${b.nature}] ${b.id} — ${age} · ${b.lecteurs} lecteur(s) · ${b.producteur}`);
    l.push(`      ${b.contenu}`);
  }
  if (!lignes.length) l.push("  Aucune source ne correspond — jamais une preuve qu'il n'y a rien à savoir, seulement que ce filtre ne trouve rien.");
  return l.join("\n");
}

function main() {
  const sub = process.argv[2];
  printReportHeader({
    tool: "data-archangel",
    title: "data-archangel — circulation des données dans l'Agence Codex",
    subtitle: "Ce que l'équipe produit, qui le relit, et ce que l'agent lui-même n'exploite pas encore.",
    scriptPath: "scripts/data-archangel.mjs",
  });
  recordCliUsage("data-archangel");
  // `notes <sujet>` AVANT le rapport complet, et sans le calculer : la reprise des notes se
  // consulte au moment d'ouvrir un chantier, où la circulation des données n'intéresse personne.
  // Lui faire payer le scan complet aurait fait de la règle « on reprend d'abord les notes » une
  // commande qu'on saute parce qu'elle est lente.
  if (sub === "notes") {
    for (const l of formatReprisesLines(reprendreLesNotes(process.argv[3]))) console.log(l);
    return;
  }
  // `rapports` (#921) — l'inventaire des rapports archivés : combien, qui peut les lire, et surtout
  // combien ne sont NOMMÉS nulle part. Il écrit un FICHIER, parce qu'un inventaire qui ne vit que
  // dans un terminal meurt avec la session — et parce que son sujet est précisément là (Article 31).
  if (sub === "rapports") {
    const inv = inventaireDesRapports();
    const lignes = formatInventaireRapportsLines(inv, { combien: 40 });
    for (const l of lignes) console.log(l);
    const cible = join(ROOT, "docs/data-archangel", `inventaire-rapports-${new Date().toISOString().slice(0, 10)}.txt`);
    try { mkdirSync(join(ROOT, "docs/data-archangel"), { recursive: true }); } catch { /* déjà là */ }
    writeFileSync(cible, lignes.join("\n") + "\n", "utf8");
    console.log(`\nÉcrit : ${cible}`);
    return;
  }
  // `classification` (#955/#956/#957) — LES TROIS AXES, ET LES DEUX FORMES QU'IL A CHOISIES :
  // « document généré + HTML de lecture ». Les deux, jamais l'un à la place de l'autre — le
  // document se relit dans un terminal et se compare d'une version à l'autre, la page se lit.
  // Les deux sortent du MÊME calcul : deux rendus d'un seul passage, jamais deux passages qui
  // divergeraient.
  if (sub === "classification") {
    return classificationCli();
  }
  // `dossier <sujet>` (#742) — RASSEMBLE au lieu de dire où chercher. Il produit un FICHIER, parce
  // qu'un rapport qui ne vit que dans la sortie d'un terminal meurt avec la session (Article 31 :
  // le livrable est le fichier, mon texte le commente et ne le remplace jamais).
  if (sub === "dossier") {
    const sujet = process.argv[3];
    const d = dossierDuSujet(sujet);
    if (!d.mesurable) { console.log(`⚠️ NON MESURABLE — ${d.pourquoi}`); return; }
    // La date est LUE, jamais fabriquée dans la fonction de rendu (Article 32) — et c'est pour ça
    // que formatDossierMarkdown() refuse de s'exécuter sans elle.
    let maintenant;
    try { maintenant = execSync("node scripts/agent-du-temps.mjs", { encoding: "utf8" }).match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z)/)?.[1]; } catch { /* voir ci-dessous */ }
    if (!maintenant) { console.log("⚠️ Rien écrit — l'heure n'a pas pu être LUE, et un dossier daté au jugé vaut moins qu'un dossier absent (Article 32)."); return; }
    const dossierSortie = join(ROOT, "docs/data-archangel");
    try { mkdirSync(dossierSortie, { recursive: true }); } catch { /* déjà là */ }
    const chemin = join(dossierSortie, `dossier-${String(sujet).toLowerCase().replace(/[^a-z0-9-]+/g, "-")}-${maintenant.slice(0, 10)}.md`);
    writeFileSync(chemin, formatDossierMarkdown(d, { maintenant }), "utf8");
    console.log(`\n=== DOSSIER DU SUJET « ${d.sujet} » ===\n`);
    console.log(`${d.total} fichier(s) portent ce sujet · ${d.decisions.length} ligne(s) de suivi retrouvée(s).`);
    for (const [etat, nums] of Object.entries(d.parEtat).sort()) console.log(`   ${etat.padEnd(38)} ${String(nums.length).padStart(3)} — ${nums.map((n) => "#" + n).join(" ")}`);
    if (d.etatsContradictoires?.length) console.log(`\n⚠️ ${d.etatsContradictoires.length} tâche(s) à l'état contradictoire : ${d.etatsContradictoires.map((c) => `#${c.numero} (${c.etats.join(" / ")})`).join(" · ")}`);
    console.log(`\nÉcrit : ${chemin.replace(ROOT + "/", "")}`);
    console.log("Le plan d'action y est VIDE à dessein : l'outil rassemble, il ne conclut pas — un rapport conclu par une machine serait un rapport qu'il faudrait croire sur parole.");
    return;
  }
  const r = buildDataArchangelReport();
  if (sub === "briefing") {
    console.log(formatAgentBriefing(r, { filtre: process.argv[3] }));
    console.log(`\n(« briefing » ne regarde que les SOURCES DE DONNÉES déclarées. Pour savoir ce qui a déjà été DÉCIDÉ ou NOTÉ sur un sujet, c'est « node scripts/data-archangel.mjs notes <sujet> » — deux questions différentes, et les confondre a déjà coûté un chiffre faux.)`);
    return;
  }
  console.log(formatDataArchangelReport(r));
  const plan = planDactionCirculation(r);
  console.log(`\n${PLAN_ACTION_TITRE}`);
  console.log(plan.lignes.join("\n"));
}


// ══════════════════════════════════════════════════════════════════════════
// LA CLASSIFICATION DES RAPPORTS ET DES DATAS (2026-09-26, tâches #955/#956/#957)
// ══════════════════════════════════════════════════════════════════════════
//
// SON IDÉE, EN TROIS COMMANDES LIÉES — et il a lui-même écrit le lien entre elles :
//   1. classer les rapports PAR THÈME  — « éclaircir la masse de rapports, comprendre les familles,
//      les types, créer des groupes par thème » ;
//   2. classer les rapports PAR FONCTION — « un rapport a-t-il besoin d'être lu ? par qui ?
//      qu'est-ce que ce rapport alimente comme analyse ? » ;
//   3. LA CLASSIFICATION COMPLÈTE rapports ET datas — « chez qui est-elle hébergée ? y a-t-il des
//      datas AUTRES que les rapports ? est-ce qu'un document qui la PRÉSENTE existe ? »
//
// SA RÉPONSE À MES DEUX QUESTIONS DE CALIBRAGE : l'axe thème est « les deux axes, croisés » (le
// SUJET traité × l'ÉQUIPE propriétaire), et la livraison est « document généré + HTML de lecture ».
//
// « EST-CE QUE ÇA EXISTE DÉJÀ ? » — il l'a demandé pour chacune des trois, et la réponse mesurée
// est NON pour les trois, mais pas de la même façon :
//   · les OUTILS sont classés (docs/referentiel/classification-agence.md, généré, 8 axes) — mais
//     il classe des outils, jamais leurs rapports ni les données ;
//   · les REGISTRES sont à moitié classés : les 45 entrées de `REGISTRIES` portent une FAMILLE,
//     donc l'axe « équipe propriétaire » existe déjà — c'est pour ça qu'il est LU ici, jamais
//     recopié (Article 24) — mais aucun axe de SUJET, et aucune FONCTION ;
//   · les rapports sur le disque et les sources de données ne sont classés NULLE PART ;
//   · et le document qui PRÉSENTE tout ça n'existait pas. C'est ce que cette classification produit.
//
// POURQUOI ICI PLUTÔT QUE DANS UN 80e SCRIPT : data-archangel veille déjà sur la CIRCULATION des
// données — qui produit, qui lit, qui n'est lu par personne. Il porte déjà `listDataSources()` (les
// datas déclarées) ET `inventaireDesRapports()` (les rapports réels sur le disque) : les deux
// moitiés exactes de la question 3. Le construire à côté aurait donné deux cartes de la même
// circulation, et deux cartes divergent (Article 3, anti-doublon).

// L'AXE 1 — LE SUJET TRAITÉ. Son vocabulaire est DÉRIVÉ du corpus réel des `demande` du catalogue
// PRESTATIONS (les mots qui y reviennent au moins trois fois), jamais inventé de tête — et
// `findSujetsSansTerrain()` plus bas refuse qu'un sujet survive à la disparition de ses mots du
// corpus, sans quoi un sujet qui ne peut plus rien attraper passerait pour un sujet vide (L11).
export const SUJETS_DE_RAPPORT = [
  { cle: "code", libelle: "le CODE lui-même", mots: ["code", "fonction", "doublon", "test", "couverture", "refonte", "bug", "fragil", "dette"] },
  { cle: "documents", libelle: "les DOCUMENTS et les règles", mots: ["document", "charte", "article", "regle", "reference", "referentiel", "blueprint", "philosophie"] },
  { cle: "outillage", libelle: "l'OUTILLAGE et l'équipe", mots: ["outil", "outillage", "agence", "equipe", "badge", "integration", "classification", "nom"] },
  { cle: "travail", libelle: "le TRAVAIL et les décisions", mots: ["tache", "travail", "decision", "suivi", "process", "ronde", "plan", "avancement", "objectif"] },
  { cle: "jeu", libelle: "le JEU — Lia, Noé, la maison", mots: ["personnage", "dialogue", "replique", "ton", "simulation", "narrat", "jeu", "graphique", "ecran"] },
  { cle: "consommation", libelle: "la CONSOMMATION — API, tokens, temps", mots: ["quota", "api", "token", "cout", "conso", "temps", "heure", "estimation"] },
  { cle: "donnees", libelle: "les DONNÉES et leur circulation", mots: ["donnee", "data", "rapport", "registre", "journal", "index", "archive", "memoire"] },
  // LE 8e SUJET (2026-09-26) — trouvé en traitant les six dossiers « sujet non déterminé ». Quatre
  // venaient d'outils absents du catalogue ; les deux derniers, non : leur prestation existait et
  // ne portait simplement AUCUN mot de sujet, parce qu'il manquait le thème le plus fréquent du
  // corpus. « vérifier » revient 7 fois dans les `demande`, « contrôle » 3 — c'était le trou, pas
  // l'outil. Ajouté après avoir vérifié qu'il ne vide aucun autre sujet : ce n'est pas un fourre-tout.
  { cle: "verifications", libelle: "les VÉRIFICATIONS et les contrôles", mots: ["verifier", "verification", "controle", "scan", "garde-fou", "conformite", "fiabilite", "coherence"] },
];

// normaliserPourSujet() — sans accents et en minuscules, parce que « référentiel » et
// « referentiel » sont le même mot et qu'un axe qui rate l'un des deux ne mesure rien.
export function normaliserPourSujet(texte) {
  return String(texte ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// sujetDuRapport() — rend le sujet le mieux attesté, ET rend `null` plutôt qu'un sujet par défaut
// quand rien ne ressort. Un rapport rangé de force dans une case au hasard est pire qu'un rapport
// non rangé : le premier ment, le second se voit.
export function sujetDuRapport(texte, sujets = SUJETS_DE_RAPPORT) {
  const t = normaliserPourSujet(texte);
  if (!t.trim()) return null;
  let meilleur = null;
  for (const s of sujets) {
    const score = s.mots.filter((m) => t.includes(m)).length;
    if (score > 0 && (!meilleur || score > meilleur.score)) meilleur = { cle: s.cle, libelle: s.libelle, score };
  }
  return meilleur;
}

// findSujetsSansTerrain() — LE GARDE-FOU DE L'AXE (Article 24). Un sujet dont plus aucun mot
// n'apparaît dans le corpus réel ne peut plus rien attraper : son zéro se lirait comme « aucun
// rapport sur ce thème » alors qu'il dit « ce thème ne sait plus chercher ». Les deux se
// ressemblent trait pour trait, et c'est exactement la leçon L11.
export function findSujetsSansTerrain(corpus = [], sujets = SUJETS_DE_RAPPORT) {
  const t = corpus.map(normaliserPourSujet).join(" ");
  if (!t.trim()) return { mesurable: false, pourquoi: "corpus vide — aucun sujet n'a pu être confronté au terrain, ce qui n'est jamais la même chose que « tous les sujets sont bons »" };
  return { mesurable: true, sansTerrain: sujets.filter((s) => !s.mots.some((m) => t.includes(m))).map((s) => s.cle) };
}

// L'AXE 3 — LA FONCTION (tâche #956). Ses trois questions — « a-t-il besoin d'être lu ? par qui ?
// qu'alimente-t-il ? » — trouvent chacune une réponse MESURÉE plutôt qu'attribuée :
//   · « besoin d'être lu » se lit dans la DÉCISION déjà déclarée du registre (un rapport livré en
//     HTML est écrit pour ses yeux à lui ; un rapport texte est une trace) ;
//   · « par qui » se lit dans les lecteurs réels de l'inventaire (un script qui nomme le dossier) ;
//   · « qu'alimente-t-il » se lit dans ces mêmes lecteurs : ce sont les analyses qu'il nourrit.
// QUATRE FONCTIONS, et la quatrième est celle qui coûte cher — un rapport que ni outil, ni index,
// ni livraison n'atteint est produit à chaque passage pour personne.
export const FONCTIONS_DE_RAPPORT = [
  { cle: "livre", libelle: "livré à l'utilisateur", quoi: "écrit pour être lu par lui — c'est sa décision HTML déclarée qui le dit" },
  { cle: "matiere", libelle: "matière d'un autre outil", quoi: "au moins un script le relit : il alimente une analyse en aval" },
  { cle: "trace", libelle: "trace consultable", quoi: "un index.md le liste — retrouvable à la main, jamais relu automatiquement" },
  { cle: "orphelin", libelle: "écrit et jamais rouvert", quoi: "ni livraison, ni lecteur, ni index : produit pour personne" },
];

export function fonctionDuRapport({ decision, lecteurs = [], aUnIndex = false } = {}) {
  if (/html/.test(String(decision ?? ""))) return FONCTIONS_DE_RAPPORT[0];
  if (lecteurs.length) return FONCTIONS_DE_RAPPORT[1];
  if (aUnIndex) return FONCTIONS_DE_RAPPORT[2];
  return FONCTIONS_DE_RAPPORT[3];
}

// slugDOutil() — LE RAPPROCHEMENT ENTRE DEUX REGISTRES QUI N'ÉCRIVENT PAS LES NOMS PAREIL, et
// c'est le premier vrai passage qui l'a montré : PRESTATIONS écrit « ARGUS », « MOÏSE-TABLES-DE-LOI »,
// « Smart Breaker (check-gemini-quota.mjs) », là où REGISTRIES écrit « scripts/check-argus.mjs ».
// Sans cette normalisation, DIX-HUIT dossiers sur quarante sortaient « sujet non déterminé » — un
// chiffre qui aurait parfaitement pu passer pour un constat sur le dépôt, alors qu'il ne disait que
// l'orthographe de deux registres (leçon L11, encore).
export function slugDOutil(nom) {
  return normaliserPourSujet(nom)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\.mjs\b/g, " ")
    .replace(/^scripts\//, "")
    .replace(/^check-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// classerLesRapports() — LES TROIS AXES EN UN SEUL PASSAGE, parce qu'ils décrivent les mêmes
// objets et que trois passages séparés divergeraient. Rien n'est recalculé : la famille vient de
// `REGISTRIES` (déclarée), les lecteurs et l'état viennent de `inventaireDesRapports()` (mesurés),
// le sujet se dérive du catalogue PRESTATIONS (déclaré). Cette fonction assemble et croise.
export function classerLesRapports({ registres = [], prestations = [], inventaire = null, nonRegistres = [] } = {}) {
  if (!inventaire?.mesurable) {
    return { mesurable: false, pourquoi: `l'inventaire des rapports n'est pas disponible (${inventaire?.pourquoi ?? "raison non fournie"}) — sans lui, la classification porterait sur les registres déclarés seuls, et dirait « tout est classé » d'un dépôt qu'elle n'a pas regardé` };
  }
  // Le texte qui sert à deviner le sujet d'un outil : sa prestation, si elle existe. On l'indexe
  // par slug d'outil, une fois — chercher 53 prestations pour 45 registres à chaque ligne ferait
  // de cette classification un outil qu'on n'ose plus lancer.
  const texteParOutil = new Map();
  for (const p of prestations) {
    for (const o of p.outils ?? []) {
      const k = slugDOutil(o);
      if (!k) continue;
      texteParOutil.set(k, `${texteParOutil.get(k) ?? ""} ${p.demande ?? ""} ${p.description ?? ""} ${p.nom ?? ""}`);
    }
  }
  const parChemin = new Map(registres.map((r) => [String(r.path ?? "").replace(/\/+$/, ""), r]));
  const horsRegistre = new Map((nonRegistres ?? []).map((e) => [String(e.path ?? "").replace(/\/+$/, ""), e.pourquoi]));
  const lignes = [];
  for (const l of inventaire.lignes) {
    const reg = parChemin.get(l.dossier);
    const slug = slugDOutil(reg?.scriptPath ? String(reg.scriptPath).replace(/^scripts\//, "") : l.dossier.replace(/^docs\//, ""));
    // Le sujet se cherche d'abord dans la prestation de l'outil (déclarée, écrite pour être lue),
    // puis, à défaut, dans le NOM du dossier — une borne basse honnête, jamais un sujet inventé.
    const sujet = sujetDuRapport(texteParOutil.get(slug) ?? "") ?? sujetDuRapport(`${slug} ${reg?.label ?? ""}`);
    lignes.push({
      dossier: l.dossier, combien: l.combien, octets: l.octets, jamaisCites: l.jamaisCites,
      declare: Boolean(reg),
      equipe: reg?.family ?? null,
      sujet: sujet?.cle ?? null, sujetLibelle: sujet?.libelle ?? null,
      fonction: fonctionDuRapport({ decision: reg?.decision, lecteurs: l.lecteurs, aUnIndex: l.aUnIndex }).cle,
    });
  }
  const compter = (champ) => {
    const m = new Map();
    for (const l of lignes) {
      const c = l[champ] ?? "(non déterminé)";
      const e = m.get(c) ?? { dossiers: 0, fichiers: 0 };
      e.dossiers += 1; e.fichiers += l.combien; m.set(c, e);
    }
    return [...m.entries()].map(([cle, v]) => ({ cle, ...v })).sort((a, b) => b.fichiers - a.fichiers);
  };
  // LE CROISEMENT QU'IL A DEMANDÉ — « les deux axes, croisés », jamais deux listes côte à côte.
  const croise = new Map();
  for (const l of lignes) {
    const k = `${l.sujet ?? "(sujet non déterminé)"} × ${l.equipe ?? "(équipe non déclarée)"}`;
    const e = croise.get(k) ?? { dossiers: 0, fichiers: 0 };
    e.dossiers += 1; e.fichiers += l.combien; croise.set(k, e);
  }
  return {
    mesurable: true, lignes,
    total: lignes.reduce((a, l) => a + l.combien, 0),
    parSujet: compter("sujet"), parEquipe: compter("equipe"), parFonction: compter("fonction"),
    croise: [...croise.entries()].map(([cle, v]) => ({ cle, ...v })).sort((a, b) => b.fichiers - a.fichiers),
    // UN DOSSIER QUI N'EST PAS LE REGISTRE D'UN OUTIL N'A PAS DE SUJET À DÉRIVER, et le lui
    // reprocher serait le même faux positif que pour l'équipe (corrigé le même jour, leçon L4) :
    // le sujet se lit dans la prestation de l'outil producteur, et ces dossiers n'en ont pas.
    sansSujet: lignes.filter((l) => !l.sujet && !horsRegistre.has(l.dossier)).map((l) => l.dossier),
    // TROIS ÉTATS, JAMAIS DEUX : déclaré · déclaré comme N'ÉTANT PAS un registre (avec sa raison) ·
    // ni l'un ni l'autre. Confondre les deux derniers ferait reprocher à quatre dossiers une
    // décision déjà prise et écrite, et un garde-fou qui accuse à tort cesse d'être lu (leçon L4).
    sansEquipe: lignes.filter((l) => !l.equipe && !horsRegistre.has(l.dossier)).map((l) => l.dossier),
    horsRegistreAssume: lignes.filter((l) => !l.equipe && horsRegistre.has(l.dossier))
      .map((l) => ({ dossier: l.dossier, pourquoi: horsRegistre.get(l.dossier) })),
  };
}

export function formatClassificationLines(c) {
  if (!c?.mesurable) return [`CLASSIFICATION DES RAPPORTS : PAS MESURÉ — ${c?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== CLASSIFICATION DES RAPPORTS — ${c.lignes.length} dossier(s), ${c.total} fichier(s) ===`, ""];
  l.push("  AXE 1 — LE SUJET TRAITÉ");
  for (const s of c.parSujet) l.push(`    ${String(s.cle).padEnd(22)} ${String(s.dossiers).padStart(3)} dossier(s) · ${String(s.fichiers).padStart(4)} fichier(s)`);
  l.push("", "  AXE 2 — L'ÉQUIPE PROPRIÉTAIRE (lue dans les registres déclarés, jamais recopiée)");
  for (const e of c.parEquipe) l.push(`    ${String(e.cle).padEnd(52)} ${String(e.dossiers).padStart(3)} dossier(s) · ${String(e.fichiers).padStart(4)} fichier(s)`);
  l.push("", "  AXE 3 — LA FONCTION (a-t-il besoin d'être lu ? par qui ? qu'alimente-t-il ?)");
  for (const f of FONCTIONS_DE_RAPPORT) {
    const x = c.parFonction.find((y) => y.cle === f.cle);
    l.push(`    ${f.libelle.padEnd(28)} ${String(x?.dossiers ?? 0).padStart(3)} dossier(s) · ${String(x?.fichiers ?? 0).padStart(4)} fichier(s)  — ${f.quoi}`);
  }
  l.push("", "  LES DEUX AXES CROISÉS (sujet × équipe) — les 12 premières cases");
  for (const x of c.croise.slice(0, 12)) l.push(`    ${x.cle.padEnd(62)} ${String(x.fichiers).padStart(4)} fichier(s)`);
  if (c.sansSujet.length) l.push("", `  ❓ ${c.sansSujet.length} dossier(s) SANS SUJET DÉTERMINÉ : ${c.sansSujet.join(" · ")} — rangés nulle part plutôt que rangés au hasard.`);
  if (c.sansEquipe.length) l.push(`  ❓ ${c.sansEquipe.length} dossier(s) SANS ÉQUIPE DÉCLARÉE : ${c.sansEquipe.join(" · ")} — ils existent sur le disque sans entrée dans les registres.`);
  for (const h of c.horsRegistreAssume ?? []) l.push(`  ✔️  ${h.dossier} n'a pas d'équipe, et c'est ASSUMÉ : ${h.pourquoi}`);
  return l;
}

// ══════════════════════════════════════════════════════════════════════════
// LA CLASSIFICATION COMPLÈTE — RAPPORTS **ET** DATAS (2026-09-26, tâche #957)
// ══════════════════════════════════════════════════════════════════════════
//
// SES QUATRE QUESTIONS, et chacune reçoit ici une réponse mesurée plutôt qu'affirmée :
//   · « chez qui cette classification est-elle hébergée ? » → ici, chez data-archangel, parce qu'il
//     portait déjà les deux inventaires qu'elle croise ;
//   · « y a-t-il des datas AUTRES que les rapports ? » → OUI, et c'est mesuré : les JOURNAUX locaux
//     et les SÉRIES CHIFFRÉES ne sont pas des rapports, et personne ne les comptait avec eux ;
//   · « est-ce que cette classification les INTÈGRE ? » → elle doit, sinon elle ne serait que la
//     classification des rapports sous un autre nom ;
//   · « un document qui la PRÉSENTE existe-t-il ? » → il n'existait pas. C'est ce que cette
//     commande produit, dans les deux formes qu'il a choisies.
//
// CE QU'ELLE NE FAIT PAS, déclaré plutôt que tu : elle ne range pas les données du JEU (la base D1,
// l'état d'une partie). Son périmètre est l'Agence — ce que l'outillage produit et relit. Un jour où
// les données du jeu devront être rangées, ce sera un autre axe, jamais une extension silencieuse
// de celui-ci.
export const NATURES_DE_DATA = [
  { cle: "rapport", libelle: "RAPPORTS", quoi: "les fichiers produits passage après passage par un outil, archivés dans son registre" },
  { cle: "registre", libelle: "REGISTRES", quoi: "l'index d'un outil — la mémoire de ce qu'il a déjà vu, relue au passage suivant" },
  { cle: "journal", libelle: "JOURNAUX locaux", quoi: "un journal tenu par un outil pour lui-même, jamais un rapport livré" },
  { cle: "mesure", libelle: "SÉRIES CHIFFRÉES", quoi: "les indicateurs suivis dans le temps — la seule donnée dont la valeur est de se comparer à elle-même" },
];

export async function classificationComplete({
  registres = null, prestations = null, inventaire = null, sources = null,
} = {}) {
  // Les registres sont LUS chez ceux qui les déclarent (Article 24), jamais recopiés ici. Le
  // catalogue PRESTATIONS arrive par import DYNAMIQUE, même raison qu'ailleurs dans ce paysage :
  // un import de tête ferait entrer LE-COORDINATEUR dans la chaîne du crochet post-commit. Et s'il
  // échoue, on le DIT — sans lui, l'axe du sujet ne saurait plus rien attraper, et son silence se
  // lirait comme « aucun rapport n'a de sujet » (leçon L11).
  let presta = prestations;
  let sansCatalogue = null;
  if (!presta) {
    try { ({ PRESTATIONS: presta } = await import("./le-coordinateur.mjs")); }
    catch (e) { presta = []; sansCatalogue = `le catalogue PRESTATIONS est illisible (${e?.message ?? e}) — l'axe du SUJET ne peut rien attraper, et ses zéros ne disent PAS qu'aucun rapport n'a de sujet`; }
  }
  const inv = inventaire ?? inventaireDesRapports();
  const rapports = classerLesRapports({ registres: registres ?? REGISTRIES, prestations: presta, inventaire: inv, nonRegistres: DOSSIERS_QUI_NE_SONT_PAS_DES_REGISTRES });
  if (sansCatalogue && rapports.mesurable) rapports.sujetNonMesure = sansCatalogue;
  const src = sources ?? listDataSources();
  const parNature = NATURES_DE_DATA.map((n) => ({
    ...n,
    combien: n.cle === "rapport" ? (rapports.mesurable ? rapports.total : null) : src.filter((s) => s.nature === n.cle).length,
  }));
  return { rapports, sources: src, parNature, sujets: SUJETS_DE_RAPPORT, fonctions: FONCTIONS_DE_RAPPORT, sujetNonMesure: sansCatalogue };
}

export function formatClassificationCompleteLines(c) {
  const l = ["=== LA CLASSIFICATION COMPLÈTE — RAPPORTS ET DATAS ===", ""];
  l.push("  CE QUI EST RANGÉ, PAR NATURE — et « rapport » n'est qu'une des quatre :");
  for (const n of c.parNature) {
    l.push(`    ${n.libelle.padEnd(20)} ${n.combien === null ? "PAS MESURÉ" : String(n.combien).padStart(4)}  — ${n.quoi}`);
  }
  l.push("");
  if (c.sujetNonMesure) l.push(`  ❓ AXE DU SUJET : PAS MESURÉ — ${c.sujetNonMesure}`, "");
  l.push(...formatClassificationLines(c.rapports));
  l.push("");
  l.push("  HORS PÉRIMÈTRE, déclaré plutôt que tu : les données du JEU (base D1, état d'une partie) ne sont");
  l.push("  pas rangées ici. Le périmètre est l'Agence — ce que l'outillage produit et relit.");
  return l;
}

// blocsClassificationHtml() — la page de LECTURE. Même calcul que le document texte, jamais un
// second : deux rendus qui recalculeraient chacun de leur côté finiraient par ne plus dire la même
// chose, et c'est le lecteur qui paierait la différence.
export function blocsClassificationHtml(c) {
  const r = c.rapports;
  const blocks = [
    { type: "paragraph", text: "Trois axes pour ranger ce que l'Agence produit : le SUJET traité, l'ÉQUIPE propriétaire, et la FONCTION du rapport. Les deux premiers sont croisés plus bas, comme demandé." },
    { type: "heading", text: "Ce qui est rangé, par nature" },
    { type: "table", headers: ["Nature", "Combien", "Ce que c'est"], rows: c.parNature.map((n) => [n.libelle, n.combien === null ? "PAS MESURÉ" : String(n.combien), n.quoi]) },
  ];
  if (!r?.mesurable) {
    blocks.push({ type: "note", text: `Classification des rapports : PAS MESURÉ — ${r?.pourquoi ?? "raison non fournie"}. Ce n'est pas « rien à ranger ».` });
    return { tool: "data-archangel", title: "Classification des rapports et des datas", subtitle: "Ce que l'Agence produit, rangé par sujet, par équipe et par fonction.", blocks };
  }
  blocks.push(
    ...(c.sujetNonMesure ? [{ type: "note", text: `Axe du sujet : PAS MESURÉ — ${c.sujetNonMesure}.` }] : []),
    { type: "heading", text: "Axe 1 — le sujet traité" },
    { type: "table", headers: ["Sujet", "Dossiers", "Fichiers"], rows: r.parSujet.map((x) => [String(x.cle), String(x.dossiers), String(x.fichiers)]) },
    { type: "heading", text: "Axe 2 — l'équipe propriétaire" },
    { type: "note", text: "Lue dans les registres déclarés, jamais recopiée ici : le jour où une équipe change de nom, cette page change avec elle." },
    { type: "table", headers: ["Équipe", "Dossiers", "Fichiers"], rows: r.parEquipe.map((x) => [String(x.cle), String(x.dossiers), String(x.fichiers)]) },
    { type: "heading", text: "Axe 3 — la fonction" },
    { type: "paragraph", text: "A-t-il besoin d'être lu ? Par qui ? Qu'alimente-t-il ? Les trois réponses sont mesurées : la livraison est déclarée par le registre, les lecteurs sont les scripts qui nomment le dossier, et ce qu'il alimente, ce sont ces mêmes lecteurs." },
    { type: "table", headers: ["Fonction", "Dossiers", "Fichiers", "Ce que ça veut dire"], rows: c.fonctions.map((f) => { const x = r.parFonction.find((y) => y.cle === f.cle); return [f.libelle, String(x?.dossiers ?? 0), String(x?.fichiers ?? 0), f.quoi]; }) },
    { type: "heading", text: "Les deux axes croisés" },
    { type: "table", headers: ["Sujet × équipe", "Dossiers", "Fichiers"], rows: r.croise.map((x) => [x.cle, String(x.dossiers), String(x.fichiers)]) },
    { type: "heading", text: "Le détail, dossier par dossier" },
    { type: "table", headers: ["Dossier", "Fichiers", "Sujet", "Équipe", "Fonction"], rows: r.lignes.map((x) => [x.dossier, String(x.combien), x.sujet ?? "—", x.equipe ?? "—", x.fonction]) },
  );
  if (r.sansSujet.length) blocks.push({ type: "note", text: `${r.sansSujet.length} dossier(s) sans sujet déterminé : ${r.sansSujet.join(" · ")}. Rangés nulle part plutôt que rangés au hasard — un rapport mis de force dans une case ment, un rapport non rangé se voit.` });
  if (r.sansEquipe.length) blocks.push({ type: "note", text: `${r.sansEquipe.length} dossier(s) sans équipe déclarée : ${r.sansEquipe.join(" · ")}. Ils existent sur le disque sans entrée dans les registres.` });
  if (r.horsRegistreAssume?.length) blocks.push({ type: "table", headers: ["Dossier sans équipe, et c'est assumé", "Pourquoi"], rows: r.horsRegistreAssume.map((h) => [h.dossier, h.pourquoi]) });
  blocks.push({ type: "note", text: "Hors périmètre, déclaré plutôt que tu : les données du JEU (base D1, état d'une partie) ne sont pas rangées ici. Le périmètre est l'Agence — ce que l'outillage produit et relit." });
  return { tool: "data-archangel", title: "Classification des rapports et des datas", subtitle: "Ce que l'Agence produit, rangé par sujet, par équipe et par fonction.", blocks };
}

// classificationCli() — LES DEUX FORMES QU'IL A CHOISIES, « document généré + HTML de lecture »,
// produites par un SEUL calcul. Deux rendus d'un même passage, jamais deux passages : deux calculs
// finiraient par ne plus dire la même chose, et c'est le lecteur qui paierait la différence.
async function classificationCli() {
  const c = await classificationComplete();
  // `classification ronde` — la vérification de la tâche #612, en lecture seule.
  if (process.argv[3] === "ronde") {
    let dossiers = [];
    try { const { CIRCLE_REPORT_FOLDERS } = await import("./circle-tasks.mjs"); dossiers = Object.values(CIRCLE_REPORT_FOLDERS); }
    catch (e) { console.log(`VÉRIFICATION DE LA RONDE : PAS MESURÉ — les dossiers de dépôt sont illisibles (${e?.message ?? e})`); process.exitCode = 1; return; }
    const v = verifierLesRapportsDeRonde({ classification: c, dossiersDeRonde: dossiers });
    const sortie = formatVerificationRondeLines(v);
    for (const x of sortie) console.log(x);
    if (!v.mesurable) { process.exitCode = 1; return; }
    try { mkdirSync(join(ROOT, "docs/data-archangel"), { recursive: true }); } catch { /* déjà là */ }
    const f = join(ROOT, "docs/data-archangel", `verification-ronde-${new Date().toISOString().slice(0, 10)}.txt`);
    writeFileSync(f, sortie.join("\n") + "\n", "utf8");
    console.log(`\nÉcrit : ${f}`);
    return;
  }
  const lignes = formatClassificationCompleteLines(c);
  for (const l of lignes) console.log(l);
  if (!c.rapports?.mesurable) { process.exitCode = 1; return; }
  try { mkdirSync(join(ROOT, "docs/data-archangel"), { recursive: true }); } catch { /* déjà là */ }
  const jour = new Date().toISOString().slice(0, 10);
  const txt = join(ROOT, "docs/data-archangel", `classification-${jour}.txt`);
  writeFileSync(txt, lignes.join("\n") + "\n", "utf8");
  const html = join(ROOT, "docs/data-archangel", `classification-${jour}.html`);
  writeFileSync(html, renderHtmlReport(blocsClassificationHtml(c)), "utf8");
  console.log(`\nÉcrit : ${txt}`);
  console.log(`Écrit : ${html}`);
}

// LE LANCEUR EN TOUT DERNIER, jamais au milieu du fichier : main() partirait avant les
// `const` écrits en dessous, qui seraient alors dans leur zone morte temporelle. Deux outils
// de ce dépôt l'ont payé le 2026-09-23, et findLanceursPrematures() le refuse depuis.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

// ══════════════════════════════════════════════════════════════════════════
// LA VÉRIFICATION DE LA RONDE (2026-09-26, tâche #612 — « on ne touche rien »)
// ══════════════════════════════════════════════════════════════════════════
//
// SA CONSIGNE, mot pour mot : « ok on fait juste une vérification, on ne touche rien pour
// l'instant, on regarde ensemble au cas par cas ». Cette fonction MESURE et ne propose aucune
// fusion : elle range les dossiers de dépôt de la Ronde dans les cases de la classification, et
// rend les groupes tels quels. Décider ce qui fusionne est son travail à lui, pas celui d'un
// programme — et c'est exactement la raison pour laquelle #612 attendait cette classification.
//
// CE QU'ELLE PERMET DE VOIR, et que la liste brute des 30 dossiers ne montrait pas : deux rapports
// qui partagent la même case (même SUJET, même FONCTION) sont les seuls candidats sérieux à une
// fusion. Deux rapports de cases différentes ne fusionnent pas, même s'ils se ressemblent de titre.
// C'est précisément le point 2 de la tâche : « ne jamais supposer un doublon sur la seule proximité
// de titre ».
export function verifierLesRapportsDeRonde({ classification, dossiersDeRonde = [] } = {}) {
  const r = classification?.rapports;
  if (!r?.mesurable) return { mesurable: false, pourquoi: r?.pourquoi ?? "la classification n'est pas disponible" };
  const cibles = new Set(dossiersDeRonde.map((d) => String(d).replace(/\/+$/, "")));
  const lignes = r.lignes.filter((l) => cibles.has(l.dossier));
  const absents = [...cibles].filter((c) => !r.lignes.some((l) => l.dossier === c));
  const cases = new Map();
  for (const l of lignes) {
    const k = `${l.sujet ?? "(sujet non déterminé)"} × ${l.fonction}`;
    (cases.get(k) ?? cases.set(k, []).get(k)).push(l);
  }
  const groupes = [...cases.entries()].map(([cle, membres]) => ({ cle, membres })).sort((a, b) => b.membres.length - a.membres.length);
  return {
    mesurable: true, groupes, absents,
    dossiers: lignes.length, attendus: cibles.size,
    livres: lignes.filter((l) => l.fonction === "livre").length,
    candidats: groupes.filter((g) => g.membres.length > 1).reduce((a, g) => a + g.membres.length, 0),
  };
}

export function formatVerificationRondeLines(v, { plafond = 10 } = {}) {
  if (!v?.mesurable) return [`VÉRIFICATION DE LA RONDE : PAS MESURÉ — ${v.pourquoi}`];
  const l = [`=== VÉRIFICATION — LES RAPPORTS DE LA RONDE, RANGÉS DANS LES CASES DE LA CLASSIFICATION ===`, ""];
  l.push(`  ${v.dossiers} dossier(s) de dépôt sur ${v.attendus} déclarés · ${v.groupes.length} case(s) distincte(s) · plafond souhaité : ${plafond} fichiers`);
  l.push(`  Dont ${v.livres} réellement LIVRÉ(S) à l'utilisateur ; les ${v.dossiers - v.livres} autres sont de la MATIÈRE relue par un outil.`);
  l.push(`  ${v.candidats} dossier(s) partagent une case avec au moins un autre : ce sont les SEULS candidats sérieux à une fusion.`);
  if (v.absents.length) l.push(`  ❓ ${v.absents.length} dossier(s) de dépôt déclarés mais introuvables dans l'inventaire : ${v.absents.join(" · ")} — ils n'ont peut-être jamais rien déposé.`);
  l.push("");
  for (const g of v.groupes) {
    l.push(`  ${g.cle}${g.membres.length > 1 ? "" : "   (seul dans sa case — jamais un candidat à la fusion)"}`);
    for (const m of g.membres) l.push(`      ${m.dossier.padEnd(38)} ${String(m.combien).padStart(3)} fichier(s)`);
    l.push("");
  }
  l.push("  RIEN N'A ÉTÉ TOUCHÉ — c'est une mesure, jamais une proposition de fusion. Deux rapports d'une");
  l.push("  même case sont des candidats ; ce qui fusionne réellement se décide au cas par cas, avec lui.");
  return l;
}
