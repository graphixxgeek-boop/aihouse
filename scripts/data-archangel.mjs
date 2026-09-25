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
import { printReportHeader } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { LOCAL_JOURNALS, REGISTRIES } from "./doc-report.mjs";
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
    l.push("", `🚨 ${r.critiques.length} donnée(s) FRAÎCHE(S) que personne ne lit — écrite il y a peu, donc elle a quelque chose à dire, et aucun outil ne l'écoute :`);
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
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
