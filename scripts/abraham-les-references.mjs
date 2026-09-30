// ICEBERG: membre
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

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { decouperEnUnites, pairesParJaccard, printReliabilityNotice, sansLeBlocGenere, lireFichierPartage, dernieresTouchesPartagees, MARQUEUR_NEGATION, MARQUEUR_ABSOLU } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader, planDactionDepuisEcarts, PLAN_ACTION_TITRE, imprimerPlanDaction } from "./report-template.mjs";
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
      // LE DÉCOR PARTAGÉ (2026-09-27) : ce balayage coûtait 4 083 lectures et 18,3 Mo, et un
      // second appel en recoûtait autant. Le contenu est désormais mis en commun, invalidé par
      // mtime+taille+inode — donc un fichier modifié est bien relu (cf. lib-shell).
      try { if (statSync(p).size > 2_000_000) continue; out[rel] = lireFichierPartage(p); } catch { /* illisible : ignoré */ }
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

// ————————————————————————————————————————————————————————————————————————
// UN OUTIL CITÉ PAR SON NOM EST AUSSI UN PORTEUR (2026-09-28, tâche #659)
// ————————————————————————————————————————————————————————————————————————
//
// LE DÉFAUT ÉTAIT MESURABLE ET IL ACCUSAIT À TORT. La classification ne reconnaissait un porteur
// que sous deux formes : `uneFonction()` ou `scripts/un-fichier.mjs`. Or cette charte nomme ses
// mécanismes comme l'équipe les appelle — ALWAYS-NEW-CODE, SAFE-EXPORT, CASSANDRA-RH — et ces
// vingt noms-là étaient invisibles. Conséquence directe : l'Article 7 sortait comme la SEULE règle
// « vitale et sans protection » de tout le document, alors qu'il nomme ALWAYS-NEW-CODE deux fois
// en six lignes. Un garde-fou qui accuse la règle la mieux documentée cesse d'être lu (leçon L4).
//
// LA CORRECTION PORTE SUR LA CLASSE, JAMAIS SUR L'OCCURRENCE (leçon L37) : on ne réécrit pas
// l'Article 7 pour qu'il plaise au détecteur — ce serait corriger le symptôme (Article 3). C'est
// le détecteur qui apprend la troisième forme.
//
// ELLE NE PEUT PAS CRÉER DE FAUX FANTÔME, et c'est la précaution qui la rend sûre. Un nom en
// capitales n'est PAS une promesse de mécanisme : « PROCESS INTEGRATION » ou « LUI-MÊME » n'en
// sont pas. Un tel nom compte donc comme porteur quand un script lui correspond, et est IGNORÉ
// sinon — jamais rangé en « fantôme », contrairement à `uneFonction()` qui, elle, promet
// explicitement l'existence d'un mécanisme. Sur le vrai dépôt : 27 candidats, 20 vrais outils.
const MOTIF_OUTIL_NOMME = /\b([A-ZÉÈÀÎÔ][A-ZÉÈÀÎÔ0-9]*(?:-[A-ZÉÈÀÎÔ0-9]+)+)\b/g;

export function sansAccent(texte = "") {
  return String(texte).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Le nom se RÉSOUT contre les fichiers réellement présents, jamais contre une liste d'outils
// recopiée qui se périmerait au prochain venu (Article 24). Deux formes acceptées : le script
// exact, et le script unique qui commence par ce nom (`THE-SCREENER` → `the-screener-capture.mjs`)
// — « unique » parce que deux candidats rendraient le renvoi ambigu, et un renvoi ambigu vaut
// moins que pas de renvoi.
export function scriptDeLOutilNomme(nom = "", fichiers = {}) {
  const slug = sansAccent(nom).toLowerCase();
  const exact = `scripts/${slug}.mjs`;
  if (Object.prototype.hasOwnProperty.call(fichiers, exact)) return exact;
  const candidats = Object.keys(fichiers).filter((c) => c.startsWith(`scripts/${slug}-`) && c.endsWith(".mjs"));
  return candidats.length === 1 ? candidats[0] : null;
}

// UN MÉCANISME VOLONTAIREMENT MANUEL N'EST PAS UN MÉCANISME MANQUANT (2026-09-27, tâche #1023).
// Demande explicite de l'utilisateur : « Abraham doit distinguer "aucun mécanisme n'existe" de
// "le mécanisme est volontairement manuel, et c'est écrit à côté" ».
//
// LE CAS QUI L'A PAYÉE, et il est instructif : Abraham dénonçait un porteur fantôme sur l'Article 13
// de la charte. Vérification faite avant de rien corriger (Article 19) : les neuf chemins et la
// fonction que cet Article nomme EXISTENT TOUS. Le « fantôme » était `check-profile.mjs`, qu'aucun
// test ne lance — parce que la charte ORDONNE de le lancer à la main, puisqu'il coûte de vrais
// appels payants. Abraham accusait donc la charte d'un défaut qu'elle déclare et justifie
// elle-même, sur l'Article qui gouverne toute la documentation. Patron exact de la leçon L4.
export const MOTIF_MANUEL_DECLARE = /à lancer à la main|lancer à la main|jamais en continu|jamais dans un crochet|sur demande (?:explicite|uniquement)|à la demande, jamais|jamais automatique/i;

export function mecanismeDeclareManuel(texte = "") {
  return MOTIF_MANUEL_DECLARE.test(String(texte));
}

// LE SECOND DÉFAUT, ET C'EST LE VRAI : le fantôme se décidait sur un corpus de fichiers FOURNI PAR
// L'APPELANT. Un fichier simplement absent de ce corpus se lisait comme un fichier inexistant —
// une non-mesure prise pour une preuve (leçons L5/L11). Sans déclaration explicite que le corpus
// est complet, un mécanisme introuvable devient « à confirmer », jamais « fantôme ».
// UN CHEMIN SE VÉRIFIE SUR LE DISQUE, JAMAIS SEULEMENT DANS LE CORPUS FOURNI (2026-09-28, tâche
// #1066, trouvé à la Ronde). Le résolveur cherchait `scripts/check-house.mjs` parmi les clés de
// l'objet `fichiers` reçu ; quand l'appelant ne passe que les DOCUMENTS, le fichier le plus
// évident du dépôt sortait « fantôme ». Résultat : l'Article 13 — **la règle qui exige que les
// documents reflètent le code réel** — était accusé de nommer un mécanisme introuvable, alors que
// ses seize noms existent tous.
//
// **Un outil qui accuse à tort la règle qu'il sert décrédibilise cette règle**, et c'est plus cher
// qu'un faux positif ordinaire (leçon L4).
//
// LA CORRECTION NE DESSERRE RIEN, et c'est la condition : un nom qui a la FORME D'UN CHEMIN se
// tranche sur le disque, où la réponse est définitive ; un nom de FONCTION continue d'exiger le
// corpus de code, parce que seul le corpus peut dire où elle est définie. Un chemin qui n'existe
// vraiment pas reste donc un fantôme — vérifié dans les deux sens, sans quoi on aurait échangé un
// faux positif contre un faux négatif.
export function porteursDeclares(texteUnite = "", fichiers = {}, { corpusComplet = false, existeSurLeDisque = null } = {}) {
  // Abraham travaille depuis la racine du dépôt, comme le reste de ce fichier — il n'a pas de
  // constante ROOT, et lui en inventer une ici la ferait diverger de la sienne. LE `catch` A FAILLI
  // ME COÛTER CHER : ma première version écrivait `join(ROOT, chemin)` avec un ROOT qui n'existe
  // pas dans ce fichier, et le try/catch avalait la ReferenceError en rendant `false` — le
  // correctif avait l'air posé et ne corrigeait rien. Un catch muet sur une erreur de PROGRAMMATION
  // est exactement le faux vert que ce dépôt traque ailleurs ; c'est le contre-test qui l'a montré,
  // pas la relecture.
  const surLeDisque = existeSurLeDisque ?? ((chemin) => existsSync(chemin));
  const nommes = new Set();
  for (const m of String(texteUnite).matchAll(MOTIF_FONCTION_CITEE)) nommes.add({ type: "fonction", nom: m[1] });
  for (const m of String(texteUnite).matchAll(MOTIF_SCRIPT_CITE)) nommes.add({ type: "script", nom: m[1] });
  // Les outils nommés rejoignent les porteurs TROUVÉS directement : ils ont déjà été résolus
  // contre le disque, et un nom non résolu n'entre jamais dans la liste (cf. le commentaire de
  // MOTIF_OUTIL_NOMME — il ne peut donc pas produire de fantôme).
  const parLeNom = [];
  for (const m of String(texteUnite).matchAll(MOTIF_OUTIL_NOMME)) {
    const chemin = scriptDeLOutilNomme(m[1], fichiers);
    if (chemin && !parLeNom.includes(chemin)) parLeNom.push(chemin);
  }
  const trouves = [...parLeNom]; const fantomes = [];
  for (const n of nommes) {
    const existe = n.type === "script"
      ? (Object.prototype.hasOwnProperty.call(fichiers, n.nom) || surLeDisque(n.nom))
      : Object.entries(fichiers).some(([chemin, contenu]) => estDuCode(chemin) && new RegExp(`function\\s+${n.nom}\\b|const\\s+${n.nom}\\s*=`).test(contenu));
    (existe ? trouves : fantomes).push(n.nom);
  }
  if (!nommes.size && !parLeNom.length) return { etat: "sans porteur", trouves: [], fantomes: [], pourquoi: "ne nomme aucun mécanisme — sa prose est son seul mécanisme (Article 27)" };
  if (fantomes.length && !corpusComplet) {
    return { etat: "a-confirmer", trouves, fantomes, pourquoi: `${fantomes.length} mécanisme(s) n'ont pas été trouvés DANS LE CORPUS FOURNI (${fantomes.join(", ")}) — ce qui ne prouve pas qu'ils n'existent pas, seulement qu'on ne les a pas cherchés partout. Relancer avec corpusComplet: true pour trancher` };
  }
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
// SANS LES COMMENTAIRES SEULS — les chaînes RESTENT (2026-09-29, tâche #1168). Née d'un vrai faux
// positif : le garde-fou des écrivains de registre (`findEcrivainsDeRegistreSansContribution`)
// cherche un chemin `docs/x/` DANS les arguments d'un appel d'écriture. Son propre commentaire
// annonçait que « citer un chemin dans un commentaire n'est pas écrire dedans » — mais rien ne
// retirait les commentaires, et un commentaire qui MONTRE la forme du code déclenchait l'accusation.
//
// POURQUOI PAS `sansChainesNiCommentaires` : il retire aussi les chaînes, donc le chemin littéral
// que ce garde-fou doit justement trouver. Deux besoins voisins, deux fonctions — les fondre
// casserait l'un des deux.
export function sansLesCommentaires(code = "") {
  return String(code)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

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
  // UN MÉCANISME QUI EXISTE, QUE RIEN NE LANCE, ET DONT LA RÈGLE DIT QU'IL EST MANUEL n'est pas un
  // mécanisme oublié : c'est une décision assumée, et la reprocher à chaque passage est exactement
  // ce qui fait cesser de lire un garde-fou (leçon L4, et Article 24 sur le contenu curaté à la
  // main qui reste légitime tant que sa nature est écrite noir sur blanc à côté).
  if (porteur.etat === "porté" && mecanismeDeclareManuel(t)) {
    return { ...NIVEAUX_GARANTIE[4], porteur: nommes, manuelDeclare: true, pourquoi: `nomme ${nommes.length} mécanisme(s) qui existent et que la règle déclare EXPRESSÉMENT manuels (${nommes.slice(0, 2).join(", ")}) — ce n'est pas un oubli, c'est un choix écrit, le plus souvent parce que les lancer en continu coûterait de vrais appels payants` };
  }
  if (porteur.etat === "a-confirmer") return { ...NIVEAUX_GARANTIE[4], porteur: nommes, aConfirmer: true, pourquoi: porteur.pourquoi };
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
      const p = porteursDeclares(ph, fichiers, { corpusComplet: true });
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
  let porteur = porteursDeclares(texte, fichiers, { corpusComplet: true });
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
    const porteur = porteursDeclares(u.texte, fichiers, { corpusComplet: true });
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
      // L'ESPACE APRÈS LE PRÉFIXE EST FACULTATIF (2026-09-28, tâche #623). Le motif exigeait
      // « § 8 » alors que la typographie française écrit « §8 » — une frontière parfaitement écrite
      // restait donc invisible, et le recouvrement continuait d'être signalé. Un garde-fou qu'aucune
      // écriture normale ne peut satisfaire est un garde-fou qu'on finit par ignorer (leçon L6).
      const motif = (n) => new RegExp(`(?:frontière|distinct|jamais confondu|à ne pas confondre)[^.]{0,120}${prefixe}\\s*${n}\\b`, "i");
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
      // LE TEXTE DE LA SECTION EST RENDU (2026-09-28, tâche #1057) : le croisement process ↔ règles
      // de travail en a besoin pour comparer les vocabulaires. Un champ ajouté ne casse aucun
      // appelant, là où un second découpage du même document aurait créé deux lectures qui
      // divergeraient (Article 24).
      titre: b.titre, texte: bloc, lignes: fin - b.debut, tokens: estimerTokens(bloc), unites, lignesTableau,
      // Le critère est mécanique et se trompe vers la PRUDENCE : une section qui contient ne
      // serait-ce qu'une règle n'est jamais classée inventaire, parce qu'un inventaire ne porte
      // jamais de règle.
      nature: unites > 0 ? "contient des règles — voir le détail unité par unité"
        : (lignesTableau > 4 || (bloc.match(/`(docs|scripts|lib)\//g) || []).length > 8) ? NATURES.INVENTAIRE.cle : "prose de cadrage",
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// 7bis. LE CROISEMENT PROCESS ↔ RÈGLES DE TRAVAIL (2026-09-28, tâche #1057)
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// SA QUESTION, mot pour mot, dans son gros prompt du 2026-09-28 : « est-ce qu'on a aujourd'hui des
// process qui ne sont pas portés par des règles de travail et inversement des règles de travail
// non portées par des process, et est-ce qu'il y a des conflits entre les 2 ? »
//
// POURQUOI ICI ET PAS DANS UN OUTIL DE PLUS. Abraham est déjà l'outil MAÎTRE des documents à règles
// numérotées : il découpe en unités, nomme le porteur réel de chacune, mesure les redondances. Il
// savait faire tout ça sur UN document. Ce qui manquait est le CROISEMENT de deux registres —
// les process déclarés chez god-of-all-process ↔ les sections de docs/regles-de-travail.md. On
// l'ÉTEND, jamais un script jetable à côté (Article 31, obligation 2).
//
// TROIS SORTIES, JAMAIS UNE SEULE, parce qu'elles appellent trois gestes différents et que les
// confondre ferait réparer le mauvais défaut :
//   1. un PROCESS que rien, côté règles de travail, ne porte  → écrire la règle, ou dire pourquoi
//      le process se suffit à lui-même ;
//   2. une RÈGLE DE TRAVAIL qu'aucun process n'exécute        → lui donner un process, ou accepter
//      qu'elle ne repose que sur la mémoire de qui la lit (leçon L1) ;
//   3. une PAIRE QUI SE CONTREDIT                             → arbitrer, et c'est une décision
//      humaine (Article 16), jamais un correctif d'agent.
//
// LES DEUX REGISTRES SE LISENT, ils ne se recopient pas (Article 24) : la liste des process arrive
// de `PROCESSES`, celle des règles du découpage réel du document. Un treizième process demain, ou
// une section de plus, entre sans qu'on touche à cette fonction.
//
// LA LIMITE, DÉCLARÉE PLUTÔT QUE TUE, et elle est la même que partout où ce dépôt compare des
// textes : le vocabulaire partagé est un SIGNAL, jamais une preuve. Une règle qui porte un process
// sans employer un seul de ses mots restera invisible ici, et deux règles peuvent se contredire
// avec des mots entièrement différents. C'est pourquoi la sortie 1 distingue « NOMMÉ » de
// « TERRAIN COMMUN SANS NOM » : le second est une question posée, jamais un verdict rendu.

// LA MESURE N'EST PAS JACCARD ICI, ET LE PREMIER PASSAGE L'A PROUVÉ (2026-09-28).
//
// Jaccard compare deux ensembles de taille comparable. Un process se décrit en une douzaine de
// mots ; une section de règles de travail en compte plusieurs centaines. Sur cette paire-là,
// Jaccard est écrasé par l'union : la paire la PLUS proche de tout le document rendait 0,069, si
// bien qu'aucun seuil raisonnable ne pouvait jamais se déclencher. Un état qu'aucune donnée réelle
// ne peut atteindre est du décor (leçon L6) — il aurait rangé les douze process en « ABSENT » et
// cette unanimité se serait lue comme un résultat.
//
// LA BONNE QUESTION EST ASYMÉTRIQUE : « quelle PART du vocabulaire du process se retrouve dans
// cette section ? » — donc intersection sur la taille du PLUS PETIT des deux, jamais sur l'union.
// Mesurée ainsi, la même comparaison s'étale de 0 à 0,93 et devient lisible.
export function couvertureDuVocabulaire(petit, grand) {
  if (!petit?.size) return 0;
  return [...petit].filter((w) => grand.has(w)).length / petit.size;
}

// LE SEUIL SE DÉRIVE, IL NE SE CHOISIT PAS (Article 24), sur le patron déjà éprouvé par
// `protegerLaCharte()` : DEUX FOIS LA MÉDIANE des couvertures réellement observées. Il vieillit
// donc avec les deux registres — un process ou une section de plus le déplace tout seul, là où un
// 0,10 écrit à la main se serait périmé au premier ajout. Sous quatre paires il REFUSE de conclure
// plutôt que d'inventer un seuil : un seuil inventé vaut moins que pas de seuil.
export const PAIRES_MINIMUM_POUR_UN_SEUIL = 4;

// LES PAIRES À COUVERTURE NULLE SORTENT DU CALCUL, et ce n'est pas un détail de confort : c'est
// un défaut REL trouvé par le contre-test de cette fonction. Deux textes qui ne partagent pas un
// mot ne disent rien de l'endroit où passe la frontière du « terrain commun » — ils disent
// seulement qu'ils n'ont rien à voir. Sur une population majoritairement nulle, la médiane vaut 0,
// le seuil dérivé vaut 0, et alors TOUT franchit le seuil : chaque section devient un catalogue,
// la population éligible tombe à zéro, et l'outil rend « aucun conflit » sur zéro paire examinée.
// Un seuil à zéro n'est pas un seuil permissif — c'est un interrupteur qui éteint la mesure en se
// faisant passer pour elle.
export function seuilDeTerrainCommun(couvertures = []) {
  const valeurs = [...couvertures].filter((c) => c > 0).sort((a, b) => a - b);
  if (valeurs.length < PAIRES_MINIMUM_POUR_UN_SEUIL) return null;
  const mediane = valeurs.length % 2
    ? valeurs[(valeurs.length - 1) / 2]
    : (valeurs[valeurs.length / 2 - 1] + valeurs[valeurs.length / 2]) / 2;
  return Math.min(0.95, 2 * mediane);
}

// UNE SECTION CATALOGUE N'EST PAS UNE PREUVE, et sans cette distinction le résultat entier serait
// faux. « §7ter — Le paysage des outils de vigilance » nomme TOUS les outils du dépôt : elle couvre
// donc le vocabulaire de chacun des douze process à plus de 70 %. Conclure qu'elle « porte » un
// process en particulier serait absurde — elle les énumère, elle n'en exécute aucun. Le critère est
// mécanique et dérivé, jamais une liste de titres tenue à la main : une section qui couvre plus de
// la MOITIÉ des process est un catalogue, et son recouvrement ne compte pas comme un porteur.
export const PART_POUR_ETRE_UN_CATALOGUE = 0.5;

export function sectionsCatalogue(couverturesParSection = [], nbProcess = 0, seuil = null) {
  if (!nbProcess || seuil === null) return new Set();
  const out = new Set();
  couverturesParSection.forEach((couvs, j) => {
    const combien = couvs.filter((c) => c >= seuil).length;
    if (combien / nbProcess > PART_POUR_ETRE_UN_CATALOGUE) out.add(j);
  });
  return out;
}

// Une section de prose qui ne pose AUCUNE obligation n'a pas à être exécutée par un process — lui
// en réclamer un fabriquerait du travail. Le partage se fait sur le compteur d'obligations déjà
// construit ici, jamais sur une liste de titres tenue à la main qui se périmerait à la première
// section ajoutée.
export function sectionPorteUneObligation(section = {}, motif = MOTIF_OBLIGATION_FR) {
  return compterObligations(String(section.texte ?? ""), motif) > 0;
}

export function nommeLeProcess(texte = "", p = {}) {
  const t = String(texte).toLowerCase();
  return [p.slug, p.nom, p.doc, p.gardien].filter(Boolean).map(String)
    .some((c) => t.includes(c.toLowerCase()));
}

// LE SEUIL PEUT ÊTRE IMPOSÉ, ET ALORS LE RAPPORT LE DIT — jamais en silence. La dérivation reste
// le défaut, et c'est ce que la commande utilise ; un seuil passé en argument sert à éprouver le
// détecteur sur un cas dont on connaît la réponse (leçon de la tâche #836 : une sonde qu'on n'a
// jamais vue trouver quelque chose ne prouve rien par son zéro). Comme pour la SOURCE d'une heure
// (Article 32), ce qui compte n'est pas que la valeur soit bonne mais qu'on sache d'où elle vient :
// un seuil imposé présenté comme dérivé serait la pire des deux erreurs, parce qu'invisible.
// =============================================================================================
// LE TROISIÈME REGISTRE : LES RÈGLES SURVEILLÉES D'ANGEL (2026-09-28, tâche #1069)
// =============================================================================================
// LE CROISEMENT SUR-ACCUSAIT, ET C'EST LA MÊME FAMILLE D'ERREUR QUE TOUTES CELLES DE LA NUIT :
// un signal ADJACENT lu comme le signal lui-même. Il comparait les process de `god-of-all-process`
// aux sections des règles de travail, et concluait « 13 règles que rien n'exécute ». Or un process
// n'est pas le seul porteur possible : une règle de CONDUITE est portée par `angel-of-ia-process`,
// qui la DEMANDE à chaque passage et refuse d'être au vert sans réponse. Compter ces règles-là
// comme orphelines accusait le dispositif de ne pas faire ce qu'il fait — et un garde-fou qui
// accuse à tort cesse d'être lu (leçon L4).
//
// LE LIEN EST EXACT, JAMAIS DEVINÉ, et c'est ce qui le rend meilleur que la couverture de
// vocabulaire employée partout ailleurs ici : chaque règle surveillée porte un champ `source` qui
// NOMME sa section (« docs/regles-de-travail.md §0bis »). On lit la référence écrite au lieu de
// mesurer une ressemblance — quand la donnée exacte existe, l'approximation n'a plus d'excuse.
//
// ET LE REGISTRE SE LIT, IL NE SE RECOPIE PAS (Article 24) : une règle surveillée ajoutée demain
// est prise en compte le jour même, sans que personne touche à cette fonction.
export const MOTIF_SECTION_CITEE = /\u00a7\s*([0-9]+(?:bis|ter|quater|quinquies)?)/gi;
export const MOTIF_TITRE_CITE = /\u00ab\s*([^\u00bb]{6,120}?)\s*\u00bb/g;

// DEUX FORMES DE RÉFÉRENCE EXACTE, ET PAS UNE DE PLUS : le numéro de section (§0bis) et le titre cité
// entre guillemets (« OPTIMISER et FIABILISER »). La seconde existe parce que TOUTES LES SECTIONS NE
// SONT PAS NUMÉROTÉES — « OPTIMISER et FIABILISER » n'a pas de numéro, donc un matcher qui ne
// connaîtrait que le § la déclarerait orpheline pour toujours, alors que deux règles surveillées la
// portent. LES DEUX FORMES SONT EXACTES : on lit une référence ÉCRITE, jamais une ressemblance de
// vocabulaire. C'est délibéré — l'approximation a sa place ailleurs dans ce fichier ; ici la donnée
// exacte existe, et s'en passer serait un choix, pas une contrainte.
export function sectionsCiteesParAngel(regles = [], cheminDesRegles = "docs/regles-de-travail.md") {
  const parSection = new Map();
  const ajouter = (cle, id) => {
    if (!cle) return;
    if (!parSection.has(cle)) parSection.set(cle, []);
    if (!parSection.get(cle).includes(id)) parSection.get(cle).push(id);
  };
  for (const r of regles) {
    const src = String(r?.source ?? "");
    if (!src.includes(cheminDesRegles)) continue;   // une règle qui ne cite que la charte ne porte pas une règle de travail
    for (const m of src.matchAll(new RegExp(MOTIF_SECTION_CITEE.source, "gi"))) ajouter(m[1].toLowerCase(), r.id);
    for (const m of src.matchAll(new RegExp(MOTIF_TITRE_CITE.source, "g"))) ajouter(cleDeTitre(m[1]), r.id);
  }
  return parSection;
}

// LA CLÉ D'UN TITRE : sans accents, sans casse, sans ponctuation, et tronquée à sa TÊTE — la partie
// avant le tiret long. Un titre se cite rarement en entier, et exiger le sous-titre complet aurait
// rendu cette forme inutilisable en pratique, donc jamais employée.
export function cleDeTitre(titre = "") {
  return sansAccent(String(titre).split(/\s+\u2014\s+/)[0])
    .toLowerCase().replace(/^\s*[0-9]+(?:bis|ter|quater|quinquies)?\s*\.\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

// Le numéro d'une section, lu sur son titre : « 0bis. AVANT D'OUVRIR… » → « 0bis ».
export function numeroDeSection(titre = "") {
  const m = /^\s*([0-9]+(?:bis|ter|quater|quinquies)?)\s*\./i.exec(String(titre));
  return m ? m[1].toLowerCase() : null;
}

// Les clés sous lesquelles une section peut être citée : son numéro s'il en a un, ET la clé de son
// titre dans tous les cas. Une section non numérotée reste donc atteignable, au lieu d'être
// orpheline par accident de mise en forme.
export function clesDeSection(titre = "") {
  const n = numeroDeSection(titre);
  return [n, cleDeTitre(titre)].filter(Boolean);
}

// LA RÉFÉRENCE MORTE EST UNE TROUVAILLE, PAS UN DÉCHET DE CALCUL. Une règle surveillée qui cite une
// section INEXISTANTE ressemble à un porteur et n'en est pas un — pire qu'une absence, parce qu'elle
// rassure. Elle est donc rendue à part, jamais silencieusement ignorée.
export function citationsMortesDAngel(regles = [], sections = [], cheminDesRegles = "docs/regles-de-travail.md") {
  const reels = new Set(sections.flatMap((s) => clesDeSection(s.titre)));
  const mortes = [];
  for (const [num, ids] of sectionsCiteesParAngel(regles, cheminDesRegles)) {
    if (reels.has(num)) continue;
    mortes.push({ section: num, regles: ids,
      pourquoi: `la r\u00e8gle surveill\u00e9e cite ${cheminDesRegles} \u00a7${num}, qui n'existe pas dans ce document : un renvoi mort ressemble \u00e0 un lien, ce qui est pire qu'une absence` });
  }
  return mortes;
}

export function croiserProcessEtRegles({ processes = [], sections = [], seuil: seuilImpose = null, docsDesProcess = new Map(), cheminDesRegles = "docs/regles-de-travail.md", reglesSurveillees = [] } = {}) {
  if (!processes.length || !sections.length) {
    return { mesurable: false,
      pourquoi: `croisement impossible : ${processes.length} process et ${sections.length} section(s) lues — un registre vide ne dit pas « aucun écart », il dit qu'il n'y avait rien à confronter` };
  }
  const motsProcess = processes.map((p) => motsSignificatifs([p.nom, p.quand, (p.motsCles ?? []).join(" "), (p.etapes ?? []).join(" ")].filter(Boolean).join(" ")));
  const motsSections = sections.map((s) => motsSignificatifs(s.texte ?? s.titre ?? ""));
  const texteDesRegles = sections.map((s) => s.texte ?? "").join("\n");

  // La matrice complète, calculée UNE fois : les trois sorties la relisent, aucune ne la recompte.
  const couv = processes.map((_, i) => sections.map((__, j) => couvertureDuVocabulaire(motsProcess[i], motsSections[j])));
  const toutes = couv.flat();
  const seuil = seuilImpose ?? seuilDeTerrainCommun(toutes);
  const seuilDerive = seuilImpose === null;
  const catalogues = sectionsCatalogue(sections.map((_, j) => processes.map((__, i) => couv[i][j])), processes.length, seuil);

  const plusProcheParProcess = (i) => {
    let best = null;
    sections.forEach((s, j) => {
      if (catalogues.has(j)) return;
      if (!best || couv[i][j] > best.couverture) best = { titre: s.titre, couverture: Math.round(couv[i][j] * 1000) / 1000 };
    });
    return best;
  };
  const plusProcheParSection = (j) => {
    let best = null;
    processes.forEach((p, i) => {
      if (!best || couv[i][j] > best.couverture) best = { process: p.slug ?? p.nom, couverture: Math.round(couv[i][j] * 1000) / 1000 };
    });
    return best;
  };

  // ── SORTIE 1 : un process que rien ne nomme côté règles de travail.
  const processSansRegle = [];
  processes.forEach((p, i) => {
    if (nommeLeProcess(texteDesRegles, p)) return;
    const proche = plusProcheParProcess(i);
    const surSeuil = seuil !== null && proche && proche.couverture >= seuil;
    processSansRegle.push({
      process: p.slug ?? p.nom, nom: p.nom, doc: p.doc, proche,
      etat: seuil === null ? "PAS MESURÉ" : surSeuil ? "TERRAIN COMMUN SANS NOM" : "ABSENT",
      pourquoi: seuil === null
        ? "trop peu de paires pour dériver un seuil : on ne sait pas si un terrain commun existe, ce qui n'est pas la même chose que « il n'y en a pas »"
        : surSeuil
          ? `aucune section ne le NOMME, mais « ${proche.titre} » reprend ${Math.round(proche.couverture * 100)} % de son vocabulaire — une règle le porte peut-être sans le dire, et c'est une question, jamais un verdict`
          : "aucune section ne le nomme, et aucune (hors sections catalogue) ne reprend son vocabulaire : côté règles de travail, ce process n'est porté par personne",
    });
  });

  // ── SORTIE 2 : une règle de travail qu'aucun process n'exécute.
  const reglesSansProcess = [];
  const sectionsExaminees = [];
  const porteesParAngel = [];
  const citeesParAngel = sectionsCiteesParAngel(reglesSurveillees, cheminDesRegles);
  sections.forEach((s, j) => {
    if (!sectionPorteUneObligation(s)) return;   // prose sans obligation : rien à exécuter
    sectionsExaminees.push(s.titre);
    if (processes.some((p) => nommeLeProcess(s.texte ?? "", p))) return;
    // UN PROCESS N'EST PAS LE SEUL PORTEUR POSSIBLE (#1069). Une règle de CONDUITE est portée par
    // `angel-of-ia-process`, qui la demande à chaque passage et refuse d'être au vert sans réponse.
    // La compter comme orpheline accusait le dispositif de ne pas faire ce qu'il fait (L4). Le lien
    // se LIT sur le champ `source` de la règle surveillée, jamais sur une ressemblance de mots.
    const parAngel = clesDeSection(s.titre).flatMap((c) => citeesParAngel.get(c) ?? []);

    if (parAngel && parAngel.length) {
      porteesParAngel.push({ section: s.titre, obligations: compterObligations(s.texte ?? ""), regles: parAngel,
        pourquoi: `aucun process ne l'exécute, et c'est normal : ${parAngel.join(", ")} la surveille${parAngel.length > 1 ? "nt" : ""} comme règle de conduite — angel la DEMANDE et refuse d'être au vert sans réponse` });
      return;
    }
    const proche = plusProcheParSection(j);
    const surSeuil = seuil !== null && proche && proche.couverture >= seuil;
    const n = compterObligations(s.texte ?? "");
    reglesSansProcess.push({
      section: s.titre, obligations: n, lignes: s.lignes, proche,
      etat: seuil === null ? "PAS MESURÉ" : surSeuil ? "TERRAIN COMMUN SANS NOM" : "ABSENT",
      pourquoi: surSeuil
        ? `porte ${n} obligation(s) et ne nomme aucun process ; « ${proche.process} » en reprend ${Math.round(proche.couverture * 100)} % du vocabulaire — le lien existe peut-être, il n'est simplement écrit nulle part`
        : `porte ${n} obligation(s) qu'aucun process n'exécute et dont aucun ne reprend le vocabulaire — elle ne repose que sur la mémoire de qui la lit (leçon L1)`,
    });
  });

  // ── SORTIE 3 : une paire qui se contredit — terrain commun ET polarité opposée. Les deux
  // marqueurs viennent du sol partagé, jamais recopiés (Article 24).
  const conflits = [];
  if (seuil !== null) {
    processes.forEach((p, i) => {
      const texteP = [p.nom, p.quand, (p.etapes ?? []).join(" ")].filter(Boolean).join(" ");
      const pNeg = MARQUEUR_NEGATION.test(texteP), pAbs = MARQUEUR_ABSOLU.test(texteP);
      if (!pNeg && !pAbs) return;
      sections.forEach((s, j) => {
        if (couv[i][j] < seuil || catalogues.has(j)) return;
        const sNeg = MARQUEUR_NEGATION.test(s.texte ?? ""), sAbs = MARQUEUR_ABSOLU.test(s.texte ?? "");
        if ((pNeg && sAbs && !sNeg) || (pAbs && sNeg && !sAbs)) {
          conflits.push({ process: p.slug ?? p.nom, section: s.titre, couverture: Math.round(couv[i][j] * 1000) / 1000 });
        }
      });
    });
  }

  // ── SORTIE 4 : LE LIEN DANS L'AUTRE SENS (2026-09-28, tâche #1059). Sa demande : « Assure-toi que
  // le fichier regles de travail et process sont bien linkés. » Les sorties ① et ② regardent un
  // seul sens — ce que les RÈGLES disent des process. Celle-ci regarde ce que le DOCUMENT d'un
  // process dit des règles de travail, et le défaut n'est pas le même : un process qui ne cite pas
  // les règles qui le gouvernent fait travailler sans elles, là où une règle qui ne cite aucun
  // process ne dit pas QUAND elle s'applique. Les additionner en un seul chiffre effacerait la
  // distinction, donc ils restent deux sorties.
  //
  // TROIS ÉTATS, jamais deux : un document qu'on n'a pas pu lire n'est PAS un document muet.
  const processMuetsSurLesRegles = [];
  for (const p of processes) {
    if (!p.doc) continue;
    const texte = docsDesProcess.get(p.doc) ?? docsDesProcess.get(p.slug);
    if (texte === undefined || texte === null) {
      processMuetsSurLesRegles.push({ process: p.slug ?? p.nom, doc: p.doc, etat: "PAS LU",
        pourquoi: `son document (${p.doc}) n'a pas pu être lu — ce n'est PAS « il ne cite rien », les deux appellent des gestes opposés` });
      continue;
    }
    // Un process DONT le document EST le fichier des règles n'a évidemment rien à citer : il y est.
    if (p.doc === cheminDesRegles) continue;
    if (String(texte).includes(cheminDesRegles.replace(/^docs\//, "").replace(/\.md$/, ""))) continue;
    processMuetsSurLesRegles.push({ process: p.slug ?? p.nom, doc: p.doc, etat: "MUET",
      pourquoi: `son document ne cite jamais ${cheminDesRegles} : qui suit ce process ne saura pas quelles règles de conduite s'y appliquent` });
  }

  // LE DÉNOMINATEUR DU ZÉRO (leçon de la tâche #836) : « aucun conflit » ne se lit pas sans savoir
  // combien de paires ont été comparées, ni à quelle distance se tenait la plus proche.
  //
  // IL PORTE SUR LES PAIRES RÉELLEMENT ÉLIGIBLES, jamais sur toutes. La toute première version
  // annonçait « la plus proche à 0,929 » alors que cette paire-là est une section CATALOGUE, donc
  // exclue de la recherche de conflits : le dénominateur décrivait une population que la mesure
  // n'avait pas examinée, ce qui est exactement le défaut que ce dénominateur existe pour éviter.
  const eligibles = [];
  let plusProche = null;
  processes.forEach((p, i) => sections.forEach((s, j) => {
    if (catalogues.has(j)) return;
    eligibles.push(1);
    if (!plusProche || couv[i][j] > plusProche.couverture) plusProche = { process: p.slug ?? p.nom, section: s.titre, couverture: Math.round(couv[i][j] * 1000) / 1000 };
  }));

  return {
    mesurable: true,
    processes: processes.length, sections: sections.length,
    sectionsAvecObligation: sectionsExaminees.length,
    sectionsSansObligation: sections.length - sectionsExaminees.length,
    processSansRegle, reglesSansProcess, conflits, processMuetsSurLesRegles,
    porteesParAngel, citationsMortesDAngel: citationsMortesDAngel(reglesSurveillees, sections, cheminDesRegles),
    reglesSurveilleesLues: reglesSurveillees.length,
    pairesComparees: eligibles.length, pairesTotales: processes.length * sections.length, plusProche, seuil, seuilDerive,
    catalogues: [...catalogues].map((j) => sections[j].titre),
    horsPortee: "Le vocabulaire partagé est un SIGNAL, jamais une preuve. Une règle qui porte un process sans employer un seul de ses mots reste invisible ici, et deux textes peuvent se contredire avec des mots entièrement différents. Les conflits se lisent sur DEUX mots français (« jamais » face à « toujours ») : c'est une question posée, jamais un arbitrage rendu — l'arbitrage est humain (Article 16).",
  };
}

export function formatCroisementLines(r = {}) {
  if (!r.mesurable) return [`🚨 CROISEMENT PROCESS ↔ RÈGLES : PAS MESURÉ — ${r.pourquoi}`];
  const L = [`=== CROISEMENT PROCESS ↔ RÈGLES DE TRAVAIL — ${r.processes} process, ${r.sections} section(s) ===`, ""];
  L.push(`Seuil de terrain commun : ${r.seuil === null
    ? "NON CALCULÉ — moins de quatre paires partagent le moindre mot, donc aucune médiane ne tient. Ce n'est PAS « aucun terrain commun »."
    : `${Math.round(r.seuil * 1000) / 1000} (${r.seuilDerive ? "DÉRIVÉ : deux fois la médiane des couvertures NON NULLES observées, donc il vieillit avec les deux registres" : "IMPOSÉ par l'appelant — ce chiffre n'a PAS été mesuré sur ces données"})`}`);
  if (r.catalogues?.length) L.push(`Section(s) CATALOGUE, écartées comme preuve de portage : ${r.catalogues.join(" · ")} — elles couvrent plus de la moitié des process parce qu'elles les ÉNUMÈRENT, ce qui n'est pas les exécuter.`);
  L.push("");

  L.push(`① ${r.processSansRegle.length} process sur ${r.processes} que RIEN ne nomme dans les règles de travail`);
  if (!r.processSansRegle.length) L.push("   ✅ chaque process déclaré est nommé au moins une fois côté règles de travail.");
  for (const p of r.processSansRegle) {
    L.push(`   ${p.etat === "ABSENT" ? "🚨" : "🟠"} ${p.etat.padEnd(24)} ${p.process}`);
    L.push(`          ${p.pourquoi}`);
  }
  L.push("");

  L.push(`② ${r.reglesSansProcess.length} règle(s) de travail sur ${r.sectionsAvecObligation} porteuse(s) d'obligation qu'AUCUN process n'exécute`);
  L.push(`   (${r.sectionsSansObligation} section(s) ne posent aucune obligation : de la prose de cadrage, à qui réclamer un process fabriquerait du travail — écarté exprès, jamais oublié)`);
  if (!r.reglesSansProcess.length) L.push("   ✅ chaque règle porteuse d'obligation nomme un process qui l'exécute.");
  for (const s of r.reglesSansProcess) {
    L.push(`   ${s.etat === "ABSENT" ? "🚨" : "🟠"} ${s.etat.padEnd(24)} ${s.section}`);
    L.push(`          ${s.pourquoi}`);
  }
  // LE TROISIÈME REGISTRE EST AFFICHÉ À PART, jamais fondu dans ② (#1069) : une règle portée par
  // angel n'est PAS une règle orpheline, et la ranger dans le même compte referait exactement
  // l'erreur que ce registre vient de corriger. Elle ne disparaît pas du rapport pour autant :
  // on dit QUI la porte, parce qu'une protection réelle mais invisible est supprimable sans que
  // personne s'en aperçoive.
  if (r.reglesSurveilleesLues) {
    L.push(`   ↳ ${r.porteesParAngel?.length ?? 0} autre(s) section(s) sans process sont portées par une RÈGLE SURVEILLÉE d'angel-of-ia-process (${r.reglesSurveilleesLues} règle(s) lues) — un process n'est pas le seul porteur possible.`);
    for (const a of r.porteesParAngel ?? []) L.push(`      ✅ ${a.section}  ←  ${a.regles.join(", ")}`);
  } else {
    L.push("   ⚠️  AUCUNE règle surveillée ne lui a été passée : le compte ② ci-dessus SUR-ACCUSE mécaniquement, puisqu'un porteur possible n'a pas été regardé.");
  }
  if (r.citationsMortesDAngel?.length) {
    L.push(`   🚨 ${r.citationsMortesDAngel.length} référence(s) MORTE(S) : une règle surveillée cite une section qui n'existe pas — ça ressemble à un lien, ce qui est pire qu'une absence.`);
    for (const m of r.citationsMortesDAngel) L.push(`      §${m.section} cité par ${m.regles.join(", ")} — introuvable dans le document`);
  }
  L.push("");

  L.push(`③ ${r.conflits.length} paire(s) en CONFLIT possible — terrain commun et polarité opposée`);
  if (!r.conflits.length) {
    L.push(`   ✅ aucune, sur ${r.pairesComparees} paire(s) réellement ÉLIGIBLES (sur ${r.pairesTotales} possibles ; les sections catalogue sont écartées), seuil dérivé ${r.seuil === null ? "NON CALCULÉ" : Math.round(r.seuil * 1000) / 1000}.`);
    if (r.plusProche) L.push(`      La paire la plus proche reste « ${r.plusProche.process} » ↔ « ${r.plusProche.section} » à ${r.plusProche.couverture} — le zéro est donc mérité, pas un silence.`);
  }
  for (const c of r.conflits) L.push(`   🚨 « ${c.process} » ↔ « ${c.section} » (${c.couverture}) — à ARBITRER, jamais à corriger seul`);
  L.push(`④ ${(r.processMuetsSurLesRegles ?? []).length} process dont le DOCUMENT ne cite jamais les règles de travail`);
  L.push("   (l'autre sens du lien : ① et ② disent ce que les RÈGLES savent des process ; celle-ci dit ce qu'un PROCESS dit des règles — deux défauts distincts, jamais additionnés)");
  if (!(r.processMuetsSurLesRegles ?? []).length) L.push("   ✅ chaque document de process renvoie aux règles de travail.");
  for (const m of r.processMuetsSurLesRegles ?? []) {
    L.push(`   ${m.etat === "PAS LU" ? "⬜" : "🟠"} ${m.etat.padEnd(8)} ${m.process.padEnd(24)} ${m.doc}`);
    L.push(`          ${m.pourquoi}`);
  }
  L.push("");
  L.push(`HORS PORTÉE : ${r.horsPortee}`);
  return L;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// UNE FICHE ATTEIGNABLE PAR CONVENTION N'EST PAS ORPHELINE (2026-09-28, tâche #629)
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// LE VERDICT D'ORIGINE ÉTAIT FAUX, ET LA TÂCHE LE SOUPÇONNAIT DÉJÀ. Trois documents étaient dits
// « orphelins » — `charte-cartographie.md`, `organisation-globale-projet.md`, `process-calibres.md` —
// parce que le balayage n'explorait qu'un seul dossier. Mesurés sur le dépôt ENTIER, ils sont cités
// par 10, 8 et 4 fichiers. Un balayage trop étroit ne rend pas une réponse incomplète : il rend une
// réponse FAUSSE, avec l'air d'être juste.
//
// LE BALAYAGE CORRECT EN TROUVE 19 AUTRES, ET AUCUNE N'EST ORPHELINE NON PLUS. Ce sont des fiches
// d'outils que rien ne cite nommément — et c'est exactement ce que la charte a décidé : « une règle
// énoncée une fois vaut mieux qu'autant de chemins recopiés ». La fiche d'un outil vit dans
// `docs/referentiel/<outil>.md`, et cette CONVENTION est le lien. Les recopier partout serait la
// redondance que le 2026-09-22 a justement retirée.
//
// D'OÙ LA RÈGLE EN DEUX TEMPS, et c'est elle qui rend la mesure utile plutôt qu'alarmiste :
// une fiche est orpheline si RIEN ne la cite **ET** qu'aucun outil ne porte son nom. Sans le second
// critère, le contrôle dénoncerait dix-huit fiches parfaitement atteignables — et un garde-fou qui
// accuse la conformité cesse d'être lu (leçon L4).
export const INDEX_DE_DOSSIER = /(^|\/)index\.md$/;

export function findFichesOrphelines({ fiches = [], textesDuDepot = new Map(), existeOutil = () => false } = {}) {
  if (!fiches.length || !textesDuDepot.size) {
    return { mesurable: false, orphelines: [], parConvention: [],
      pourquoi: "aucune fiche ou aucun texte lu : rien n'a été confronté, ce qui n'est jamais la même chose que « aucune orpheline »" };
  }
  const orphelines = [], parConvention = [];
  for (const fiche of fiches) {
    if (INDEX_DE_DOSSIER.test(fiche)) continue;   // la table des matières d'un dossier n'est pas une fiche
    const citee = [...textesDuDepot].some(([chemin, texte]) => chemin !== fiche && String(texte).includes(fiche));
    if (citee) continue;
    const slug = fiche.replace(/^.*\//, "").replace(/\.md$/, "");
    if (existeOutil(slug)) parConvention.push({ fiche, slug });
    else orphelines.push({ fiche, slug, pourquoi: `rien ne cite « ${fiche} » et aucun outil ne porte le nom « ${slug} » : ni lien écrit, ni lien par convention — cette fiche n'est atteignable par personne (Article 27)` });
  }
  return {
    mesurable: true, orphelines, parConvention, examinees: fiches.length,
    pourquoi: orphelines.length
      ? `${orphelines.length} fiche(s) qu'aucun lien ni aucune convention n'atteint`
      : `aucune orpheline sur ${fiches.length} fiche(s) : ${parConvention.length} ne sont citées nulle part mais portent le nom d'un outil réel, donc la convention les atteint`,
    horsPortee: "Elle vérifie qu'une fiche est ATTEIGNABLE, jamais qu'elle est à jour ni qu'elle sert : une fiche fausse et bien citée lui paraît saine.",
  };
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

// ════════════════════════════════════════════════════════════════════════════════════════════
// UN DOCUMENT QUI PARLE DE RÈGLES N'EST PAS UN DOCUMENT QUI PORTE DES RÈGLES (2026-09-25, #873)
// ════════════════════════════════════════════════════════════════════════════════════════════
//
// CE QUI S'EST PASSÉ, et c'est le faux positif le plus coûteux rencontré jusqu'ici parce que son
// résultat ressemble trait pour trait à une analyse valide. Lancé sur `scripts/check-house.mjs` —
// la suite de tests, 12 795 lignes, 227 blocs de test — Abraham a annoncé :
//     « Forme reconnue : Article N — Titre · 17 unités · couverture déclarée 59 % du document »
// puis a rendu leur nature, leurs recouvrements de vocabulaire et un plan d'action.
//
// LES 17 UNITÉS N'EXISTENT PAS. Les 15 occurrences qui les ont fait naître sont des FIXTURES : des
// bouts de charte inventés à l'intérieur de chaînes de caractères, écrits là pour tester d'autres
// outils. Le fichier ne porte aucune règle ; il en CITE, pour les donner à manger à un test.
//
// POURQUOI SON REFUS EXISTANT N'A PAS JOUÉ : il déclare refuser « un document dont aucune forme ne
// ressort ». Ici une forme ressort — par accident. Le garde-fou était écrit contre l'absence de
// signal, jamais contre un signal d'emprunt, et les deux se ressemblent parfaitement vus du motif.
//
// DEUX SIGNAUX PLUTÔT QU'UN, parce qu'aucun des deux seul ne suffirait :
//
//   1. LE FICHIER EST-IL DU CODE ? Un .mjs/.ts/.js/.tsx n'est pas un document de règles. C'est net,
//      mécanique, et ça ne peut pas se tromper. Mais seul, ce signal raterait un .md qui cite
//      longuement une charte (une archive, un blueprint, un extrait de conversation).
//
//   2. LES OCCURRENCES SONT-ELLES CITÉES ? Une occurrence entourée de guillemets ou de backticks
//      sur sa propre ligne est un exemple, jamais une règle en vigueur. Au-delà d'une majorité de
//      citations, la forme est empruntée. Ce signal-ci attrape le .md et ignore le langage.
//
// ET LE REFUS NOMME LAQUELLE DES DEUX CAUSES, jamais un « pas mesurable » nu : « c'est du code » et
// « ce document cite au lieu de porter » appellent des gestes opposés — le premier veut un autre
// outil, le second veut qu'on lise la vraie source.
export const EXTENSIONS_DE_CODE = [".mjs", ".js", ".cjs", ".ts", ".tsx", ".jsx"];
export const PART_DE_CITATIONS_REFUSEE = 0.5;

// Une occurrence est « citée » si sa ligne porte un délimiteur de chaîne autour d'elle. Volontairement
// grossier : on cherche le cas général, pas la perfection syntaxique (un analyseur qui prétendrait
// parser le JavaScript ici serait plus faux que celui-ci, et beaucoup plus long).
export function partDeCitations(texte = "", motif) {
  const lignes = String(texte).split("\n");
  const re = new RegExp(motif.source, motif.flags.replace("g", "") + "g");
  let total = 0; let citees = 0;
  for (const ligne of lignes) {
    re.lastIndex = 0;
    if (!re.test(ligne)) continue;
    total += 1;
    if (/['"`]/.test(ligne)) citees += 1;
  }
  return { total, citees, part: total ? citees / total : 0 };
}

export function detecterForme(texte = "", { formes = FORMES_CONNUES, minimum = UNITES_MINIMUM, chemin = "", partRefusee = PART_DE_CITATIONS_REFUSEE } = {}) {
  // Le refus le plus net passe en premier : inutile d'essayer des formes sur un fichier de code.
  const estDuCode = EXTENSIONS_DE_CODE.some((e) => String(chemin).toLowerCase().endsWith(e));
  if (estDuCode) {
    return { mesurable: false, cause: "code",
      pourquoi: `« ${chemin} » est un fichier de CODE (${EXTENSIONS_DE_CODE.join(", ")}), pas un document de règles. Les formes qu'on y reconnaîtrait seraient des exemples cités dans des chaînes de caractères, jamais des règles en vigueur — c'est exactement ce qui a produit « 17 unités sur 59 % du document » sur la suite de tests, dont aucune n'existait. Un autre outil convient (find-booster pour naviguer, AXA-CHECK pour la couverture, CLONE-HUNTER pour les doublons).`,
      essais: [] };
  }
  const essais = formes.map((f) => ({ forme: f, trouvees: (String(texte).match(new RegExp(f.motif.source, f.motif.flags.replace("g", "") + "g")) || []).length }));
  const meilleur = essais.sort((a, b) => b.trouvees - a.trouvees)[0];
  if (!meilleur || meilleur.trouvees < minimum) {
    return { mesurable: false, cause: "aucune-forme", pourquoi: `aucune forme de numérotation reconnue (au mieux ${meilleur?.trouvees ?? 0} unité(s), minimum ${minimum}) — découper quand même reviendrait à inventer une structure`, essais: essais.map((e) => ({ nom: e.forme.nom, trouvees: e.trouvees })) };
  }
  const cit = partDeCitations(texte, meilleur.forme.motif);
  if (cit.part > partRefusee) {
    return { mesurable: false, cause: "citations",
      pourquoi: `la forme « ${meilleur.forme.nom} » ressort ${cit.total} fois, mais ${cit.citees} de ces occurrences (${Math.round(cit.part * 100)} %) sont CITÉES entre guillemets ou backticks : ce document parle de règles, il n'en porte pas. Lire la vraie source plutôt que celui-ci.`,
      essais: essais.map((e) => ({ nom: e.forme.nom, trouvees: e.trouvees })), citations: cit };
  }
  return { mesurable: true, ...meilleur.forme, trouvees: meilleur.trouvees, citations: cit };
}

// L'ANALYSE COMPLÈTE D'UN DOCUMENT QUELCONQUE, en un appel. C'est ce que Moïse fait pour la charte
// avec ses spécificités en plus ; c'est ce que n'importe quel autre document peut désormais obtenir
// sans qu'on lui construise un agent dédié.
export function analyserDocument({ texte, chemin = "", fichiers = {}, horsPerimetre = new Set(), forme = null, estimerTokens = (t) => Math.round(t.length / 3.6) }) {
  // `chemin` transmis jusqu'ici (2026-09-25, #873) : sans lui, le refus « c'est du code » ne peut
  // pas se prononcer, et c'est précisément le cas qui a produit dix-sept règles inexistantes.
  const f = forme ?? detecterForme(texte, { chemin });
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
  const r = analyserDocument({ texte, chemin, fichiers });
  if (!r.mesurable) return { mesurable: false, pourquoi: r.pourquoi, essais: r.essais };
  const classement = classerDocument(r.unites, fichiers, { lire: (f) => readFileSync(f, "utf8"), prefixe });
  const nom = chemin.replace(/[/\\]/g, "-").replace(/\.md$/, "");
  const cible = sortie ?? `${REGISTRE_CLASSIFICATION}/classification-${nom}.html`;
  try { mkdirSync(REGISTRE_CLASSIFICATION, { recursive: true }); } catch { /* déjà là */ }
  ecrire(cible, renderClassificationHtml(classement, { document: chemin, couverture: r.couverture?.part, prefixe }), "utf8");
  return { mesurable: true, classement, cible, forme: r.forme, couverture: r.couverture?.part };
}

// --- 9. DEUX DOCUMENTS QUI DISENT LA MÊME CHOSE ------------------------------------------------
// (2026-09-26, tâche #978, deuxième des trois trous qu'il a demandé de traiter : « il y a des
// doublons dans les documents ? ».)
//
// POURQUOI ICI ET PAS AILLEURS. Personne ne répondait : CLONE-HUNTER traque le CODE dupliqué,
// pure-gold-unity vérifie la FORME des rapports, et le détecteur de rapports jumeaux
// (doc-report) compare une substance EXACTE — il déclare lui-même hors portée « deux rapports qui
// disent la même chose avec des mots différents ». Or c'est exactement ce qu'est une redondance
// entre documents : le même terrain couvert deux fois, jamais les mêmes phrases. Abraham porte
// déjà la mécanique qu'il faut — motsSignificatifs(), pairesParJaccard(), et surtout la notion de
// FRONTIÈRE DÉCLARÉE : deux règles peuvent légitimement parler du même sujet si l'une dit où
// s'arrête l'autre. On l'étend des règles d'un document aux documents du dépôt (Article 31 :
// étendre plutôt que construire à côté).
//
// LE BRUIT STRUCTUREL EST ÉCRASANT, ET IL A FALLU LE MESURER AVANT DE FIXER QUOI QUE CE SOIT. Sur
// 382 documents, la mesure brute rend 2 886 paires — parce que ce dépôt produit des SÉRIES (un
// catalogue horodaté déposé à chaque passage) et des INDEX RÉPLIQUÉS (le même `index.md` généré
// dans le dossier de chaque outil). Ces familles sont légitimes PAR CONSTRUCTION, et elles se
// DÉRIVENT du nommage plutôt que de se lister (Article 24) : un outil créé demain hérite du
// classement sans qu'on touche à ce fichier. Une fois les quatre familles écartées, il reste une
// trentaine de paires à instruire — un nombre qu'un humain peut lire.
export const HORS_PORTEE_DOCUMENTS = [
  // Le suivi est un JOURNAL de tâches, pas un document qui affirme quelque chose : il cite par
  // construction le vocabulaire de tout le projet, donc il ressemble à tout. L'y inclure noyait la
  // mesure sous des paires qui ne mènent nulle part.
  { motif: /^docs\/suivi\//, pourquoi: "journal de tâches : il cite tout le projet par construction, donc il ressemble à tout" },
  // Les simulations sont des ARCHIVES de conversations. Deux transcripts se ressemblent parce que
  // c'est le même jeu, et c'est doc-report qui les compare, sur leur substance exacte.
  { motif: /^docs\/simulations\//, pourquoi: "archives de conversations : leur ressemblance est normale, et doc-report les compare déjà" },
  // CE QU'IL DÉPOSE N'EST PAS CE QUE NOUS ENTRETENONS (2026-09-28, tâche #1111). Ce dossier porte
  // les sources du grand chantier telles qu'il nous les a données : ses deux commandes, et sept
  // lots d'audits produits ailleurs. Ce détecteur cherche la redondance que le PROJET entretient —
  // deux documents que nous maintenons tous les deux, dont l'un pourrait donc être fondu dans
  // l'autre. Ici il n'y a rien à entretenir : ce sont des ENTRÉES figées, que personne ne réécrira.
  // Et la paire trouvée au premier passage est exactement ce qu'il a voulu donner : un résumé À
  // CÔTÉ de sa version longue (« Target Architecture v1 PRESENTATION » et le document complet).
  // La signaler reviendrait à proposer de fusionner deux documents dont ni l'un ni l'autre ne nous
  // appartient — une alerte qu'on ne peut pas éteindre finit par ne plus être lue (leçon L6).
  // L'exclusion porte sur le seul dossier des SOURCES : tout ce que nous écrivons ailleurs dans le
  // chantier reste comparé, et c'est là que ce détecteur sert le plus.
  { motif: /^docs\/grand-projet\/00-sources\//, pourquoi: "sources déposées par l'utilisateur : des entrées figées que le projet n'entretient pas, et dont un résumé à côté de sa version longue est voulu" },
  // LE REGISTRE DES DÉCISIONS EN ATTENTE, MÊME MOTIF QUE LE SUIVI (2026-09-29, tâche #1210), et il
  // a fallu une démonstration en direct pour le voir. Ce document tient les choix ouverts du
  // projet : par construction, chaque entrée parle du sujet d'un autre document — un outil, une
  // règle, un référentiel — et en emprunte le vocabulaire. Il ressemble donc à tout, exactement
  // comme le journal de tâches exclu en tête de cette liste.
  //
  // CE QUI L'A DÉMONTRÉ, ET C'EST UNE COURSE QU'ON NE GAGNE PAS : ce soir-là, deux paires ont été
  // signalées. Écrire les deux frontières demandées — une note par paire, dans ce document — en a
  // aussitôt créé DEUX AUTRES, avec deux référentiels dont la note venait d'emprunter le
  // vocabulaire. Le document grossit à chaque décision qu'on y pose, donc il franchit le seuil avec
  // un voisin de plus à chaque fois. Ce n'est pas une redondance à corriger : c'est la mesure qui
  // compare des mots là où la nature du document veut qu'il les partage tous.
  //
  // L'EXCLUSION PORTE SUR CE SEUL FICHIER, jamais sur un dossier : tout le reste de docs/ continue
  // d'être comparé. Et elle ne clôt pas la question de fond — celle de savoir si ce détecteur
  // rapproche les sujets ou l'écriture — qui reste ouverte en décision #1193, désormais avec cette
  // démonstration à l'appui.
  { motif: /^docs\/idees-a-trancher\.md$/, pourquoi: "registre des décisions en attente : chaque entrée parle du sujet d'un autre document et en emprunte le vocabulaire, donc il ressemble à tout — même motif que le journal de tâches" },
];

export const TAILLE_MINIMALE_DOCUMENT = 800;
// Seuil MESURÉ, jamais choisi : à 0,25 la mesure rend une trentaine de paires sur 382 documents,
// c'est-à-dire une liste lisible. Plus bas, elle noie ; plus haut, elle ne rend que les séries
// déjà écartées comme légitimes.
export const SEUIL_DOCUMENTS_JUMEAUX = 0.25;

export const FAMILLES_LEGITIMES = {
  "index-replique": "le même nom de fichier dans deux dossiers différents — un index généré chez chaque outil, jamais deux documents concurrents",
  "serie-datee": "deux instantanés datés du même dossier — c'est une histoire, pas une redondance",
  "kit-du-meme-outil": "le blueprint, la fiche et le registre d'un même outil — ils couvrent le même sujet PAR DESIGN, sous trois angles",
  "ensemble-declare": "deux documents d'un ensemble que son NOMMAGE déclare (au moins trois fichiers du dossier partagent leur préfixe ou leur suffixe)",
  "instantane-date": "un état des lieux DATÉ face au document vivant qu'il photographie — un instantané dit forcément ce que disait sa cible ce jour-là, et le lui reprocher reviendrait à reprocher à une photo de ressembler à son sujet",
};

// UN ÉTAT DES LIEUX DATÉ EST UNE PHOTOGRAPHIE, jamais un document concurrent (2026-09-26,
// tâche #978, troisième des trois paires instruites au premier passage). `docs/plans/
// etat-des-lieux-classification-2026-09-24.md` recouvrait le registre vivant d'Abraham à 25 % —
// évidemment, puisqu'il le photographie. Même logique que `serie-datee`, appliquée à un instantané
// SEUL plutôt qu'à une série : on ne compare pas une photo à son sujet.
export const MOTIF_INSTANTANE_DATE = /^docs\/plans\/.*\d{4}-\d{2}-\d{2}/;

export function slugDuDocument(chemin) {
  const parts = String(chemin).split("/");
  const base = parts.pop().replace(/\.md$/, "");
  return (base === "index" ? (parts.pop() ?? base) : base).replace(/-blueprint$/, "").replace(/-conception$/, "");
}

// UN ENSEMBLE SE JUGE SUR LA PAIRE, PAS SUR LA PURETÉ DU DOSSIER — et c'est une correction faite
// au premier vrai passage, quelques minutes après avoir écrit la première version. Celle-ci
// exigeait que TOUS les documents du dossier partagent le même préfixe ou le même suffixe. Un
// seul intrus suffisait à la faire échouer : `docs/el-professor/` contient quatorze fiches
// `full_simN.md` et UN `synthese-2026-09-19.md`, et cet unique fichier faisait retomber les
// quatorze autres dans les accusations — HUIT paires accusées à tort, sur des notes qui se
// ressemblent parce qu'elles appliquent la même grille à des simulations différentes. Un
// garde-fou qui accuse à tort cesse d'être lu (leçon L4).
//
// LA RÈGLE RETENUE : deux documents appartiennent au même ensemble si leurs noms partagent un
// préfixe (ou un suffixe) d'au moins quatre caractères QUE PARTAGENT AU MOINS TROIS fichiers du
// dossier. Trois, parce que deux fichiers qui se ressemblent sont justement ce qu'on cherche —
// c'est à partir du troisième qu'on tient une collection. Rien n'est listé : le nommage déclare
// l'ensemble, et un dossier créé demain est classé sans qu'on touche à ce fichier (Article 24).
export const LONGUEUR_MINIMALE_D_AFFIXE = 4;
export const MEMBRES_MINIMUM_D_UN_ENSEMBLE = 3;

export function affixesCommuns(nomA, nomB, mini = LONGUEUR_MINIMALE_D_AFFIXE) {
  const a = String(nomA).replace(/\.md$/, ""), b = String(nomB).replace(/\.md$/, "");
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let sfx = 0;
  while (sfx < a.length - p && sfx < b.length - p && a[a.length - 1 - sfx] === b[b.length - 1 - sfx]) sfx++;
  return {
    prefixe: p >= mini ? a.slice(0, p) : null,
    suffixe: sfx >= mini ? a.slice(a.length - sfx) : null,
  };
}

export function membresDuMemeEnsemble(cheminA, cheminB, { listDirImpl = readdirSync, cache = new Map(), minMembres = MEMBRES_MINIMUM_D_UN_ENSEMBLE } = {}) {
  const dossier = String(cheminA).split("/").slice(0, -1).join("/");
  const { prefixe, suffixe } = affixesCommuns(String(cheminA).split("/").pop(), String(cheminB).split("/").pop());
  if (!prefixe && !suffixe) return false;
  if (!cache.has(dossier)) {
    let noms = [];
    try { noms = listDirImpl(dossier).filter((n) => String(n).endsWith(".md")); } catch { /* illisible : pas d'ensemble, et on ne le devine pas */ }
    cache.set(dossier, noms);
  }
  const noms = cache.get(dossier);
  const partagent = (test) => noms.filter(test).length >= minMembres;
  if (prefixe && partagent((n) => String(n).startsWith(prefixe))) return true;
  if (suffixe && partagent((n) => String(n).replace(/\.md$/, "").endsWith(suffixe))) return true;
  return false;
}

export function familleDeLaPaire(a, b, options = {}) {
  const dossier = (c) => String(c).split("/").slice(0, -1).join("/");
  const nom = (c) => String(c).split("/").pop();
  const DATE = /\d{4}-\d{2}-\d{2}/;
  if (nom(a) === nom(b) && dossier(a) !== dossier(b)) return "index-replique";
  if (dossier(a) === dossier(b) && DATE.test(nom(a)) && DATE.test(nom(b))) return "serie-datee";
  if (slugDuDocument(a) === slugDuDocument(b)) return "kit-du-meme-outil";
  if (dossier(a) === dossier(b) && membresDuMemeEnsemble(a, b, options)) return "ensemble-declare";
  if (MOTIF_INSTANTANE_DATE.test(a) !== MOTIF_INSTANTANE_DATE.test(b)) return "instantane-date";
  return null;
}

// LA FRONTIÈRE DÉCLARÉE, REPRISE DE findRecouvrementsNonDeclares() ET APPLIQUÉE AUX DOCUMENTS.
// Deux documents peuvent parfaitement couvrir le même terrain si l'un dit où s'arrête l'autre :
// c'est même la bonne pratique de ce dépôt. Un document qui cite le CHEMIN de l'autre sait qu'il
// existe — le recouvrement est alors assumé, jamais un doublon ignoré.
// SA LIMITE EST DÉCLARÉE PLUTÔT QU'ÉLARGIE (2026-09-28, tâche #1116). Il ne reconnaît qu'un chemin
// écrit DEPUIS LA RACINE (`docs/x/y.md`). Un lien RELATIF entre deux documents voisins
// (`../02-strategie/y.md`) est une citation tout aussi réelle, et il ne la voit pas : deux documents
// qui se renvoient l'un à l'autre relativement continuent donc d'être comptés comme un recouvrement
// non déclaré. Le cas est arrivé pour de vrai le soir même, sur la vue globale et le plan d'action
// du grand chantier. ÉLARGIR AURAIT ÉTÉ LE MAUVAIS GESTE À CETTE HEURE-LÀ : résoudre les chemins
// relatifs change ce que le détecteur voit sur TOUT le dépôt, et rien ne dit qu'il ne se mettrait
// pas à taire une vraie paire. La frontière a donc été écrite avec le chemin canonique des deux
// côtés, ce qui est de toute façon meilleur pour qui lit le fichier seul (Article 27). Élargir reste
// possible, mesure à l'appui, le jour où quelqu'un le décide.
export function citeLAutre(texteA, cheminB) {
  return String(texteA).includes(String(cheminB));
}

export function trouverDocumentsJumeaux(documents = [], { seuil = SEUIL_DOCUMENTS_JUMEAUX, listDirImpl = readdirSync } = {}) {
  if (documents.length < 2) {
    return { mesurable: false, pourquoi: "moins de deux documents fournis : il n'y a rien à comparer, et rendre « aucun doublon » sur rien serait un satisfecit sur du vide" };
  }
  const cache = new Map();
  // LE SOMMAIRE GÉNÉRÉ N'EST PAS DE LA SUBSTANCE (2026-09-27, tâche #1004, et c'est le premier
  // passage après le rattrapage des index qui l'a prouvé). `data-archangel` pose sous la prose de
  // chaque index un tableau des fichiers du dossier, entre deux marqueurs. Ce bloc partage son
  // GABARIT — les mêmes en-têtes, la même forme — d'un index à l'autre, si bien que deux index
  // parfaitement différents finissaient par se ressembler assez pour franchir le seuil.
  //
  // MESURÉ : 1 paire à instruire avant le rattrapage, **26 après**, et aucune des vingt-cinq
  // nouvelles ne disait vraiment la même chose. Un détecteur qui accuse à tort cesse d'être lu
  // (leçon L4), et celui-ci venait de multiplier ses accusations par vingt-six sans qu'aucun
  // document n'ait changé de contenu — seule leur mise en page avait bougé.
  //
  // LA CORRECTION EST AU BON ENDROIT : on ne relève pas le seuil (ce qui aurait rendu le détecteur
  // aveugle aux vrais cas), on retire ce qui n'aurait jamais dû être compté.
  const ensembles = documents.map((d) => motsSignificatifs(sansLeBlocGenere(d.texte)));
  const familles = {};
  const paires = [];
  for (const { i, j, jaccard, motsPartages } of pairesParJaccard(ensembles, { seuil })) {
    const a = documents[i], b = documents[j];
    const f = familleDeLaPaire(a.chemin, b.chemin, { listDirImpl, cache });
    if (f) { familles[f] = (familles[f] ?? 0) + 1; continue; }
    const declaree = citeLAutre(a.texte, b.chemin) || citeLAutre(b.texte, a.chemin);
    paires.push({
      a: a.chemin, b: b.chemin, jaccard: +jaccard.toFixed(3), motsPartages,
      nature: declaree ? "voisinage-declare" : "meme-terrain-non-declare",
    });
  }
  paires.sort((x, y) => y.jaccard - x.jaccard);
  return {
    mesurable: true, examines: documents.length, seuil, familles, paires,
    aInstruire: paires.filter((p) => p.nature === "meme-terrain-non-declare"),
    horsPortee: "elle mesure un RECOUVREMENT DE VOCABULAIRE, jamais un sens. Deux documents qui disent la même chose sans partager leurs mots lui échappent, et deux documents du même domaine partagent du vocabulaire sans rien se répéter — d'où des QUESTIONS et jamais un verdict.",
  };
}

// UN BLOC ÉCRIT PAR UNE MACHINE EST DU DÉCOR, jamais de la substance (2026-09-26, tâche #983).
// Le soir même où ce détecteur est né, l'extension angel-of-index a posé un sommaire généré dans
// une cinquantaine d'index — des blocs quasi identiques d'un dossier à l'autre, par construction.
// Sept paires se sont mises à « dire la même chose », et c'était vrai : elles partageaient le même
// décor. Le retirer avant de comparer est la même règle que le passe-partout des rapports.
//
// LA TROISIÈME COPIE, ET CE QU'ELLE A COÛTÉ (2026-09-27, tâche #1004). Ce retrait existait en
// DEUX exemplaires — ici, et dans `data-archangel` qui pose le bloc. Deux implémentations, une par
// expression régulière et une par index de chaîne, jamais confrontées. Ce n'est pas la duplication
// qui a mordu, c'est sa conséquence : le retrait vivait dans le `chargerLesDocuments()` D'ICI,
// pendant que le filet de sécurité appelait celui de `le-classificateur`, **qui porte le même nom
// et ne retire rien**. Le détecteur recevait donc du texte non nettoyé sans que rien ne le dise,
// et il est passé de 1 paire à instruire à 26 le jour du rattrapage des index — vingt-cinq
// accusations fausses, sur des documents dont pas une ligne de contenu n'avait bougé.
//
// DEUX CORRECTIONS, ET LA SECONDE COMPTE PLUS QUE LA PREMIÈRE : la fonction vit désormais dans
// `lib-shell` (écrite une fois, Article 24), et surtout `trouverDocumentsJumeaux()` l'applique
// LUI-MÊME plutôt que de faire confiance à son appelant. Un détecteur dont la justesse dépend de
// qui l'alimente n'est juste que par chance.
export { sansLeBlocGenere };

export function chargerLesDocuments({ racine = "docs", fichiersEnPlus = ["CLAUDE.md"], listDirImpl = readdirSync, readFileImpl = readFileSync, horsPortee = HORS_PORTEE_DOCUMENTS, tailleMin = TAILLE_MINIMALE_DOCUMENT } = {}) {
  const documents = [];
  const pile = [racine];
  while (pile.length) {
    const d = pile.pop();
    let entrees = [];
    try { entrees = listDirImpl(d, { withFileTypes: true }); } catch { continue; }
    for (const e of entrees) {
      const chemin = `${d}/${e.name}`;
      if (e.isDirectory()) { pile.push(chemin); continue; }
      if (!e.name.endsWith(".md") || horsPortee.some((h) => h.motif.test(chemin))) continue;
      try {
        const texte = sansLeBlocGenere(readFileImpl(chemin, "utf8"));
        // Un document trop court n'a pas assez de vocabulaire pour qu'un recouvrement veuille dire
        // quoi que ce soit : l'inclure produirait des paires au hasard.
        if (texte.length >= tailleMin) documents.push({ chemin, texte });
      } catch { /* illisible : il ne compte pas comme conforme */ }
    }
  }
  for (const f of fichiersEnPlus) {
    try { documents.push({ chemin: f, texte: sansLeBlocGenere(readFileImpl(f, "utf8")) }); } catch { /* absent : on ne l'invente pas */ }
  }
  return documents;
}

export function formatDocumentsJumeauxLines(r) {
  if (!r?.mesurable) return [`=== DOCUMENTS QUI DISENT LA MÊME CHOSE : PAS MESURÉ — ${r?.pourquoi} ===`, "", "Ce n'est PAS « aucun doublon »."];
  const l = [`=== DOCUMENTS QUI DISENT LA MÊME CHOSE — ${r.aInstruire.length} paire(s) à instruire sur ${r.examines} documents ===`, ""];
  const total = Object.values(r.familles).reduce((a, n) => a + n, 0);
  l.push(`  Recouvrement de vocabulaire mesuré au-dessus de ${r.seuil} · ${total} paire(s) écartées comme légitimes PAR CONSTRUCTION :`);
  for (const [f, n] of Object.entries(r.familles).sort((a, b) => b[1] - a[1])) l.push(`    · ${f} × ${n} — ${FAMILLES_LEGITIMES[f]}`);
  l.push("");
  if (!r.paires.length) l.push("  Aucune paire au-dessus du seuil une fois les familles légitimes écartées.");
  for (const p of r.paires) {
    const icone = p.nature === "meme-terrain-non-declare" ? "🟠" : "🟢";
    const dire = p.nature === "meme-terrain-non-declare"
      ? "aucun des deux ne cite l'autre : ils gouvernent le même terrain sans que rien ne dise lequel prime"
      : "l'un cite le chemin de l'autre : le recouvrement est assumé, jamais ignoré";
    l.push(`  ${icone} ${(p.jaccard * 100).toFixed(0)} % de vocabulaire commun (${p.motsPartages} mots) — ${dire}`);
    l.push(`      · ${p.a}`);
    l.push(`      · ${p.b}`);
  }
  l.push("");
  l.push(`  HORS PORTÉE : ${r.horsPortee}`);
  return l;
}

export function deposerRapportDocumentsJumeaux(lignes, { now = new Date(), writeImpl = writeFileSync, mkdirImpl = mkdirSync } = {}) {
  mkdirImpl("docs/abraham-les-references", { recursive: true });
  const chemin = `docs/abraham-les-references/documents-jumeaux-${now.toISOString().slice(0, 10)}.txt`;
  writeImpl(chemin, lignes.join("\n") + "\n", "utf8");
  return chemin;
}


// =============================================================================================
// ————————————————————————————————————————————————————————————————————————
// L'HYGIÈNE DOCUMENTAIRE — les documents SANS règles numérotées (2026-09-28, tâche #1104)
// ————————————————————————————————————————————————————————————————————————
// LE TROU QU'IL A TROUVÉ EN POSANT UNE AUTRE QUESTION, et c'est le plus gros de la journée. Il
// s'interrogeait sur trois dossiers lourds, et il a vu plus loin que sa propre question :
//
//   « Il y a un trou dans la couverture : si Abraham s'arrête aux docs de référence AVEC RÈGLE,
//     qui gère LES AUTRES DOCS ? […] équipe Abraham si besoin. »
//
// MESURÉ LE JOUR MÊME : **396 documents sur 482 — 82 % — n'ont aucune règle numérotée**, donc
// n'appartenaient au périmètre de PERSONNE. Ni Abraham (documents à règles), ni MOÏSE (la charte),
// ni Ezechiel (le filet), ni JESUS (tout ce qui est HORS documents). Ils tombaient exactement
// entre les mailles de la cascade — et c'est la forme de trou la plus difficile à voir, parce que
// chaque maillon avait raison de ne pas s'en occuper.
//
// LA RÉPONSE EST D'ÉLARGIR ABRAHAM, jamais d'ajouter un cinquième maillon : son périmètre devient
// TOUS les documents, avec DEUX capacités distinctes — l'analyse profonde pour ceux qui portent des
// règles, et cette hygiène-ci pour les autres. Un maillon de plus aurait redécoupé une frontière
// déjà juste ; une capacité de plus comble le trou sans toucher à la chaîne.
//
// CE QU'ELLE CHERCHE, ET POURQUOI C'EST CE SIGNAL-LÀ : un document que RIEN ne cite. Ni un index,
// ni un autre document, ni une ligne de code. Il existe, il coûte à maintenir, et **personne ne
// peut le trouver** — ce qui revient à payer un document pour qu'il n'existe pas.
//
// ELLE NE DOUBLE PAS `systeme-des-index`, et la frontière est nette : cet item de Ronde vérifie
// qu'un INDEX tient son contrat (un catalogue nomme ses fichiers, un journal garde ses lignes).
// Celle-ci ignore les index et demande autre chose : ce fichier est-il atteignable depuis N'IMPORTE
// OÙ ? Un document peut être absent d'un index et parfaitement cité ailleurs ; l'inverse aussi.
//
// PREMIER PASSAGE RÉEL : **36 orphelins, et presque tous des blueprints** — écrits parce que la
// règle du 2026-09-26 les rend obligatoires pour tout outil, puis jamais reliés à rien. La règle a
// produit les fichiers ; rien n'a produit leur chemin d'accès.
export const EXTENSIONS_CITANTES = [".md", ".mjs", ".ts", ".tsx", ".json"];
export const DOSSIERS_IGNORES = new Set([".git", "node_modules", ".next", ".sites-runtime", "dist", "build"]);

export function porteDesReglesNumerotees(texte = "") {
  return [/^\*\*Article\s+\d+/m, /^###?\s+\d+[.\d]*\s/m, /^##\s+\d+\.\s/m].some((m) => m.test(String(texte)));
}

// hygieneDocumentaire() — quels documents ne sont atteignables depuis nulle part ?
//
// LE BALAYAGE EST INJECTABLE de bout en bout : sur un dépôt d'accueil, `docs/` peut ne pas exister,
// et l'outil doit alors DÉCLARER l'absence plutôt que mourir (la leçon du projet témoin).
export function hygieneDocumentaire({ racineDocs = "docs", racinesCitantes = ["docs", "scripts"], lireDir = readdirSync, lireFic = readFileSync } = {}) {
  const balayer = (dir, garder) => {
    const trouves = [];
    const pile = [dir];
    while (pile.length) {
      const courant = pile.pop();
      let entrees;
      // PAS DE `ROOT` ICI, ET LE FICHIER LE DIT DÉJÀ QUELQUES CENTAINES DE LIGNES PLUS HAUT :
      // Abraham travaille en chemins RELATIFS au dossier courant. Ma première version écrivait
      // `join(ROOT, …)` avec un ROOT qui n'existe pas — le `catch` avalait l'erreur et la sonde
      // rendait « aucun document lu » sur un dépôt qui en porte 482. Un faux « pas mesuré » est
      // moins dangereux qu'un faux vert, mais il reste un mensonge.
      try { entrees = lireDir(courant, { withFileTypes: true }); } catch { continue; }
      for (const e of entrees) {
        const chemin = `${courant}/${e.name}`;
        if (e.isDirectory()) { if (!DOSSIERS_IGNORES.has(e.name)) pile.push(chemin); continue; }
        if (garder(e.name)) trouves.push(chemin);
      }
    }
    return trouves;
  };
  const documents = balayer(racineDocs, (n) => n.endsWith(".md"));
  if (!documents.length) {
    return { mesurable: false, quoi: "l'hygiène documentaire",
      pourquoi: `aucun document lu sous ${racineDocs}/ — sur un dépôt qui n'a pas ce dossier, c'est un RÉSULTAT, jamais un silence qui voudrait dire « tout va bien » (leçons L5/L11)` };
  }
  const citants = [];
  for (const racine of racinesCitantes) {
    for (const chemin of balayer(racine, (n) => EXTENSIONS_CITANTES.some((x) => n.endsWith(x)))) {
      try { citants.push({ chemin, texte: lireFic(chemin, "utf8") }); } catch { /* illisible : écarté, jamais deviné */ }
    }
  }
  const orphelins = [];
  let avecRegles = 0;
  for (const doc of documents) {
    let texte = "";
    try { texte = lireFic(doc, "utf8"); } catch { continue; }
    if (porteDesReglesNumerotees(texte)) { avecRegles += 1; continue; }   // l'autre capacité s'en occupe
    const base = doc.slice(doc.lastIndexOf("/") + 1);
    // UN FICHIER NE SE CITE PAS LUI-MÊME : sans cette exclusion, tout document qui écrit son propre
    // nom en tête passerait pour atteignable, et la sonde ne trouverait jamais rien.
    const cite = citants.some((c) => c.chemin !== doc && (c.texte.includes(doc) || c.texte.includes(base)));
    if (!cite) orphelins.push(doc);
  }
  const sansRegles = documents.length - avecRegles;
  return { mesurable: true, documents: documents.length, avecRegles, sansRegles, orphelins,
    pourquoi: orphelins.length
      ? `${orphelins.length} document(s) sur les ${sansRegles} sans règles numérotées ne sont cités NULLE PART — ni index, ni autre document, ni code. Ils existent, ils coûtent à maintenir, et personne ne peut les trouver`
      : `les ${sansRegles} documents sans règles numérotées sont tous atteignables depuis au moins un autre fichier` };
}

export function formatHygieneLines(h, { combien = 12 } = {}) {
  if (!h?.mesurable) return [`PAS MESURÉ — ${h?.pourquoi ?? "raison non fournie"}`];
  const L = [h.pourquoi, `  ${h.avecRegles} document(s) à règles numérotées relèvent de l'autre capacité d'Abraham, jamais comptés ici.`];
  for (const o of h.orphelins.slice(0, combien)) L.push(`  · ${o}`);
  if (h.orphelins.length > combien) L.push(`  … et ${h.orphelins.length - combien} autre(s)`);
  return L;
}

// LE REGISTRE D'ALERTES PARTAGÉ — ce qui rend concret « Abraham n'est jamais loin, il veille »
// =============================================================================================
// TRANCHÉ PAR L'UTILISATEUR EN FENÊTRE DÉDIÉE le 2026-09-27, en deux réponses qui se complètent :
// Abraham est le POINT D'ENTRÉE de l'assainissement à grande échelle (il convoque MOÏSE et
// Ezechiel et FUSIONNE leurs alertes, sans jamais refaire leur analyse), et sa veille passe par un
// REGISTRE PARTAGÉ plutôt que par une règle écrite.
//
// POURQUOI UN REGISTRE ET PAS UNE RÈGLE, et c'est l'Article 27 pris au mot : « Abraham veille »
// écrit dans une fiche est une intention. Un fichier où chaque outil dépose son verdict est un
// fait — et il survit à un changement d'IA, ce qu'aucune bonne volonté ne fait.
//
// LE CHOIX DE CONCEPTION QUI COMPTE : un dépôt REMPLACE les alertes de SON outil et ne touche
// jamais à celles des autres. Un journal qui empilerait tout finirait par décrire un passé que
// personne ne relit ; ce qu'on veut savoir est ce qui est vrai MAINTENANT. Mais une alerte qui
// revient à l'identique garde sa date de PREMIÈRE apparition — sans elle, une alerte qui traîne
// depuis trois semaines ressemblerait chaque jour à une alerte toute neuve, et c'est exactement ce
// que la veille doit rendre visible.
// Abraham travaille depuis la racine du dépôt, comme le reste de ce fichier (`racine = "."`) :
// il n'a pas de constante ROOT, et lui en inventer une ici la ferait diverger de la sienne.
const RACINE_ALERTES = ".";
export const FICHIER_ALERTES = "docs/abraham-les-references/alertes.json";
export const JOURS_AVANT_DE_TRAINER = 7;

// LE REGISTRE GARDE DEUX CHOSES, ET LA SECONDE EST AUSSI IMPORTANTE QUE LA PREMIÈRE : les alertes,
// et la trace de QUI EST PASSÉ. Un outil qui a regardé et n'a rien trouvé disparaîtrait sinon
// exactement comme un outil qui n'a jamais tourné — et ce projet paie cette confusion depuis
// toujours (leçons L5/L11). Un passage sans alerte est une bonne nouvelle ; une absence de passage
// est un trou. Les deux doivent se distinguer d'un coup d'œil.
export function lireRegistre({ root = RACINE_ALERTES, lire = null } = {}) {
  const lireF = lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } });
  const brut = lireF(FICHIER_ALERTES);
  if (brut == null) return { passages: {}, alertes: [] };
  try {
    const j = JSON.parse(brut);
    if (Array.isArray(j)) return { passages: {}, alertes: j };
    return { passages: j.passages ?? {}, alertes: Array.isArray(j.alertes) ? j.alertes : [] };
  } catch { return { passages: {}, alertes: [] }; }
}

export function lireAlertes(opts = {}) { return lireRegistre(opts).alertes; }

export function fusionnerDepot(existantes = [], outil, nouvelles = [], { maintenant = new Date().toISOString() } = {}) {
  if (!outil) throw new Error("une alerte sans outil déposant est intraçable : on ne saurait ni à qui la reprocher, ni quand elle a cessé d'être vraie");
  const anciennes = new Map(existantes.filter((a) => a.outil === outil).map((a) => [a.cle, a]));
  const autres = existantes.filter((a) => a.outil !== outil);
  const miennes = nouvelles.map((a) => ({
    outil, cle: String(a.cle), objet: a.objet ?? null, gravite: a.gravite ?? "à surveiller", constat: a.constat ?? "",
    // LA DATE DE PREMIÈRE APPARITION EST CE QUI PERMET DE VOIR UNE ALERTE TRAÎNER. Elle se reprend
    // à l'identique tant que l'alerte revient ; elle repart à zéro dès qu'elle a disparu une fois.
    depuis: anciennes.get(String(a.cle))?.depuis ?? maintenant,
    vueLe: maintenant,
  }));
  return [...autres, ...miennes];
}

// L'ÉCRITURE, volontairement séparée de la fusion : la fusion est pure et donc testable au
// caractère près, l'écriture est le seul endroit qui touche au disque. Un outil qui dépose ne peut
// jamais effacer les alertes d'un autre — le paramètre `outil` est obligatoire pour cette raison.
// L'HORODATAGE EST ARRONDI À LA JOURNÉE, et ce n'est pas une approximation par paresse : le crochet
// post-commit relance l'enquête, donc le registre était réécrit JUSTE APRÈS le commit qui venait de
// l'enregistrer, et le dépôt n'était jamais propre. Ça a rendu la passe de robustesse inlançable
// une fois. La granularité « jour » suffit exactement à la seule mesure qui lit ces dates — « cette
// alerte traîne depuis plus de sept jours » — et rend deux passages du même jour IDENTIQUES.
export function jourDe(horodatage) { return String(horodatage).slice(0, 10); }

export function deposerAlertes(outil, alertes = [], { root = RACINE_ALERTES, lire = null, ecrire = null, maintenant = new Date().toISOString() } = {}) {
  const jour = jourDe(maintenant);
  const registre = lireRegistre({ root, lire });
  const fusionnees = fusionnerDepot(registre.alertes, outil, alertes, { maintenant: jour });
  const passages = { ...registre.passages, [outil]: { quand: jour, combien: alertes.length } };
  const contenu = JSON.stringify({ passages, alertes: fusionnees }, null, 2);
  // ON N'ÉCRIT QUE SI LE CONTENU A CHANGÉ. Réécrire à l'identique salit le dépôt sans rien
  // apprendre à personne, et un dépôt en permanence sale finit par ne plus être regardé.
  const actuel = (lire ?? ((f) => { try { return readFileSync(join(root, f), "utf8"); } catch { return null; } }))(FICHIER_ALERTES);
  if (actuel === contenu) return { passages, alertes: fusionnees, ecrit: false };
  const ecrireF = ecrire ?? ((f, c) => { mkdirSync(join(root, "docs/abraham-les-references"), { recursive: true }); writeFileSync(join(root, f), c); });
  ecrireF(FICHIER_ALERTES, contenu);
  return { passages, alertes: fusionnees, ecrit: true };
}

export function alertesQuiTrainent(alertes = [], { maintenant = Date.now(), jours = JOURS_AVANT_DE_TRAINER } = {}) {
  const seuil = jours * 24 * 3600 * 1000;
  return alertes
    .map((a) => ({ ...a, ageJours: (maintenant - Date.parse(a.depuis)) / (24 * 3600 * 1000) }))
    .filter((a) => Number.isFinite(a.ageJours) && a.ageJours * 24 * 3600 * 1000 >= seuil)
    .sort((a, b) => b.ageJours - a.ageJours);
}

// LA FUSION À GRANDE ÉCHELLE : ce qu'Abraham RASSEMBLE et que personne ne voit autrement. Chaque
// outil connaît son propre périmètre ; aucun ne sait combien d'alertes pèsent sur le dépôt ENTIER,
// ni laquelle attend depuis le plus longtemps. C'est tout ce que ce chapeau apporte — et il
// n'apporte rien d'autre, délibérément : refaire l'analyse des deux autres serait exactement le
// chevauchement que la frontière des trois périmètres interdit.
export function synthetiserLesAlertes(alertes = [], { maintenant = Date.now(), passages = {} } = {}) {
  if (!alertes.length && !Object.keys(passages).length) {
    return { mesurable: false, pourquoi: `le registre partagé (${FICHIER_ALERTES}) est vide : aucun outil n'a encore déposé son verdict. « Aucune alerte » et « personne n'a regardé » se ressemblent trait pour trait, et ce n'est pas la même chose (leçons L5/L11)` };
  }
  const parOutil = {}, parGravite = {};
  for (const a of alertes) {
    (parOutil[a.outil] ??= []).push(a);
    (parGravite[a.gravite] ??= []).push(a);
  }
  const trainent = alertesQuiTrainent(alertes, { maintenant });
  // CEUX QUI SONT PASSÉS SANS RIEN TROUVER — la moitié de l'information, et celle qu'on oublie.
  const propres = Object.entries(passages).filter(([, p]) => !p.combien).map(([o, p]) => ({ outil: o, quand: p.quand }));
  return {
    mesurable: true, total: alertes.length, parOutil, parGravite, trainent, passages, propres,
    bloquantes: alertes.filter((a) => a.gravite === "bloquante"),
    horsPortee: "Abraham RASSEMBLE, il n'analyse jamais à la place des deux autres : MOÏSE reste seul juge de la charte, Ezechiel seul juge du filet. Ce chapeau apporte la vue d'ensemble et l'âge des alertes, rien de plus — et c'est déjà ce que personne d'autre ne voit.",
  };
}

export function formatAlertesLines(s) {
  if (!s?.mesurable) return [`PAS MESURÉ — ${s?.pourquoi ?? "aucune donnée"}`];
  const L = [`${s.total} alerte(s) déposée(s) · ${Object.keys(s.passages ?? {}).length} outil(s) passé(s).`];
  for (const [outil, list] of Object.entries(s.parOutil)) L.push(`  · ${outil} : ${list.length} alerte(s)`);
  for (const p of s.propres ?? []) L.push(`  ✅ ${p.outil} : passé le ${String(p.quand).slice(0, 16).replace("T", " ")}, RIEN trouvé — ce qui n'est pas la même chose que ne pas être passé`);
  if (s.bloquantes.length) {
    L.push("", `🚨 ${s.bloquantes.length} BLOQUANTE(S) :`);
    for (const a of s.bloquantes) L.push(`   ${a.outil} — ${a.constat}`);
  }
  L.push("", s.trainent.length
    ? `⏳ ${s.trainent.length} alerte(s) traînent depuis plus de ${JOURS_AVANT_DE_TRAINER} jours — c'est la seule chose que la veille apporte et que personne d'autre ne voit :`
    : `Aucune alerte ne traîne depuis plus de ${JOURS_AVANT_DE_TRAINER} jours.`);
  for (const a of s.trainent.slice(0, 10)) L.push(`   ${a.ageJours.toFixed(0)} j · ${a.outil} — ${a.constat}`);
  L.push("", s.horsPortee);
  return L;
}

async function main() {
  const [, , arg1, arg2] = process.argv;
  // `couverture <demande.md> <couvrant.md> [...]` — la commande née de sa phrase du 2026-09-28
  // (tâche #1145) : « assure-toi de gérer tout ça avec RIGUEUR ». Elle prend SA commande et les
  // documents censés y répondre, et rend les demandes que personne n'a écrites. Elle est à lancer
  // à la main, sur demande : confronter deux corpus n'a de sens qu'au moment où l'on prétend que
  // le second répond au premier, jamais à chaque commit.
  if (arg1 === "couverture") {
    const [demandeChemin, ...couvrantsChemins] = process.argv.slice(3);
    printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM — ce que sa commande demande, et que personne n'a écrit", scriptPath: "scripts/abraham-les-references.mjs" });
    printReliabilityNotice("abraham-les-references");
    recordCliUsage("abraham-les-references");
    if (!demandeChemin || !couvrantsChemins.length) {
      console.log("Usage : node scripts/abraham-les-references.mjs couverture <demande.md> <couvrant.md> [couvrant2.md …]");
      console.log("  Le premier fichier est CE QUI EST DEMANDÉ ; les suivants sont ce qui est censé y répondre.");
      process.exitCode = 2;
      return;
    }
    const { readFileSync } = await import("node:fs");
    const lire = (c) => readFileSync(c, "utf8");
    const couvrants = Object.fromEntries(couvrantsChemins.map((c) => [c, lire(c)]));
    const r = couvertureDeLaDemande({ demande: lire(demandeChemin), couvrants });
    for (const l of formatCouvertureLines(r)) console.log(l);
    return;
  }
  // « assainissement » : le point d'entrée à grande échelle, tranché par l'utilisateur le
  // 2026-09-27. Il LIT le registre partagé et fusionne ; il ne relance jamais les deux autres, et
  // ce n'est pas une paresse — refaire leur analyse serait le chevauchement que la frontière des
  // trois périmètres interdit, et sur le filet ça coûterait une exécution complète à chaque fois.
  if (arg1 === "assainissement") {
    printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM — assainissement : toutes les alertes du dépôt, rassemblées", scriptPath: "scripts/abraham-les-references.mjs" });
    printReliabilityNotice("abraham-les-references");
    recordCliUsage("abraham-les-references");
    // ABRAHAM DÉPOSE SES PROPRES ALERTES AVANT DE LIRE CELLES DES AUTRES (2026-09-27, trouvé sur sa
    // question « ou alors tout est centralisé chez Abraham pour la maintenance ? »). Le défaut était
    // structurel et parfaitement invisible : Abraham TIENT le registre partagé — c'est lui qui en
    // porte le code — et il n'y déposait JAMAIS RIEN. Seuls MOÏSE et Ezechiel alimentaient. Le
    // coordinateur de l'assainissement ne classait pas ses propres dossiers, si bien que ses
    // trouvailles à lui — deux documents qui disent la même chose — mouraient à l'écran et
    // n'entraient jamais dans la veille qu'il anime. Un rassembleur qui ne se rassemble pas lui-même
    // rend une synthèse incomplète en ayant l'air complète, ce qui est pire qu'une synthèse absente.
    const siennes = [];
    try {
      const jumeaux = trouverDocumentsJumeaux(chargerLesDocuments());
      for (const paire of (jumeaux.aInstruire ?? []).slice(0, 20)) {
        siennes.push({ cle: `documents jumeaux : ${paire.a} × ${paire.b}`, objet: paire.a, gravite: "a-instruire",
          // UN NOM DE CHAMP FAUX A ANNULÉ CINQ TROUVAILLES RÉELLES (2026-09-30, tâche #1277).
          // Ce message lisait `paire.recouvrement` — un champ qui N'EXISTE PAS : la paire porte
          // `jaccard` et `motsPartages`. Le `?? 0` faisait le reste, et les CINQ alertes du
          // registre annonçaient « partagent 0 % de leur vocabulaire » là où la vraie valeur est
          // 28 % pour 134 mots communs.
          //
          // CE QUE ÇA A COÛTÉ, ET C'EST MESURABLE : une alerte « ces deux documents sont jumeaux,
          // ils partagent 0 % de leur vocabulaire » se réfute toute seule. Elle se lit comme du
          // bruit, donc on passe — et c'est exactement ce que j'ai fait cette nuit en classant
          // les cinq paires « préexistantes, aucune de moi » sans en ouvrir une. DEUX
          // concernaient mon propre document, et l'une a changé de onze obligations un chiffre
          // déjà livré à l'utilisateur.
          //
          // LA CORRECTION N'EST PAS LE NOM DU CHAMP, C'EST LE `?? 0`. Un champ absent n'est pas
          // un recouvrement nul : c'est une mesure qui n'a pas eu lieu, et les deux ne doivent
          // jamais s'écrire pareil (leçons L5 et L11). On le DIT quand il manque.
          constat: Number.isFinite(paire.jaccard)
            ? `${paire.a} et ${paire.b} partagent ${Math.round(paire.jaccard * 100)} % de leur vocabulaire (${paire.motsPartages ?? "?"} mots communs) — l'un des deux dit peut-être ce que l'autre dit déjà`
            : `${paire.a} et ${paire.b} sont appariés, mais leur recouvrement n'a PAS ÉTÉ MESURÉ — ce n'est pas un recouvrement nul, c'est une mesure absente` });
      }
    } catch { /* un scan impossible ne fabrique aucune alerte : mieux vaut ne rien déposer que déposer du vide */ }
    // LES COUPLES BLUEPRINT ↔ INSTANCIATION (#1033) déposent ici et pas ailleurs : c'est la seule
    // commande qui tourne dans la chaîne automatique, et un garde-fou qu'on doit penser à lancer
    // n'est pas un garde-fou (leçon L2). Silencieux tant que rien ne dérive, ce qui est le cas
    // le jour où il est écrit — et c'est le résultat attendu, jamais une preuve qu'il fonctionne.
    try {
      const div = divergenceDesCouples();
      for (const e of (div.ecarts ?? []).slice(0, 20)) {
        siennes.push({ cle: `couple désynchronisé : ${e.nom}`, objet: e.enRetard, gravite: "a-instruire",
          constat: `${e.nom} — ${Math.round(e.jours)} jours entre la dernière retouche du blueprint et celle de son instanciation ; le retardataire est ${e.enRetard}` });
      }
    } catch { /* idem : pas de dépôt plutôt qu'un dépôt vide */ }
    deposerAlertes("abraham-les-references", siennes);
    const reg = lireRegistre();
    const s = synthetiserLesAlertes(reg.alertes, { passages: reg.passages });
    for (const l of formatAlertesLines(s)) console.log(l);
    if (!s.mesurable) {
      console.log("\nPour alimenter le registre : `node scripts/moise-tables-de-loi.mjs` (la charte) et `node scripts/ezechiel-les-tests.mjs` (le filet) déposent leur verdict à chaque passage.");
    }
    const ecarts = [];
    if (s.mesurable && s.bloquantes.length) ecarts.push({ pourquoi: `${s.bloquantes.length} alerte(s) bloquante(s) déposée(s) par les outils du rang` });
    if (s.mesurable && s.trainent.length) ecarts.push({ pourquoi: `${s.trainent.length} alerte(s) traînent depuis plus de ${JOURS_AVANT_DE_TRAINER} jours sans être traitées` });
    if (!s.mesurable) ecarts.push({ pourquoi: "le registre partagé est vide : aucun outil n'a encore déposé, donc la veille ne veille sur rien" });
    imprimerPlanDaction(planDactionDepuisEcarts(ecarts, { toolSlug: "abraham-les-references", tache: "traiter chaque alerte sur le périmètre de l'outil qui l'a levée — Abraham rassemble, il ne corrige jamais à la place de MOÏSE ni d'Ezechiel" }));
    return;
  }
  // « couples » : la lecture à la demande du garde-fou blueprint ↔ instanciation (#1033). Le dépôt
  // d'alertes se fait dans « assainissement », qui tourne tout seul ; cette commande-ci sert à LIRE
  // le détail, avec le seuil et sa dérivation imprimés — un seuil qu'on ne peut pas vérifier est un
  // seuil qu'on subit.
  if (arg1 === "couples") {
    printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM — les couples blueprint ↔ instanciation", scriptPath: "scripts/abraham-les-references.mjs" });
    printReliabilityNotice("abraham-les-references");
    recordCliUsage("abraham-les-references");
    const d = divergenceDesCouples();
    for (const l of formatDivergenceLines(d)) console.log(l);
    const ecarts = d.mesurable
      ? d.ecarts.map((e) => ({ pourquoi: `${e.nom} : ${Math.round(e.jours)} jours d'écart, le retardataire est ${e.enRetard}` }))
      : [{ pourquoi: `les couples n'ont PAS pu être mesurés — ${d.pourquoi}` }];
    imprimerPlanDaction(planDactionDepuisEcarts(ecarts, { toolSlug: "abraham-les-references", tache: "relire le document le plus récent du couple et reporter ce qui doit l'être dans l'autre, ou déclarer que le changement ne concernait que ce côté-là — Abraham signale un écart de RYTHME, il ne juge jamais le fond" }));
    return;
  }

  // « documents-jumeaux » : le pendant, à l'échelle du DÉPÔT, de findPairesRedondantes() qui ne
  // regardait que l'intérieur d'un document. Commande à part pour la même raison que « classer » :
  // elle ÉCRIT un fichier.
  // « croisement » (2026-09-28, tâche #1057) — sa question du gros prompt, chapitre C. Les deux
  // registres se LISENT au moment de l'exécution : les process chez god-of-all-process (import à
  // la demande, pour ne pas alourdir tous les autres appels d'Abraham), les règles par le
  // découpage réel du document. Un process ou une section de plus entre sans qu'on y touche.
  if (arg1 === "croisement") {
    printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM — croisement process ↔ règles de travail", scriptPath: "scripts/abraham-les-references.mjs" });
    printReliabilityNotice("abraham-les-references");
    recordCliUsage("abraham-les-references");
    const { PROCESSES } = await import("./god-of-all-process.mjs");
    const cheminRegles = arg2 ?? "docs/regles-de-travail.md";
    let texteRegles = null;
    try { texteRegles = readFileSync(cheminRegles, "utf8"); } catch { texteRegles = null; }
    if (texteRegles === null) {
      console.log(`\n🚨 PAS MESURÉ — ${cheminRegles} est illisible : rien à confronter, ce qui n'est PAS « aucun écart ».`);
      return;
    }
    // Les documents des process se LISENT ici et se passent à la fonction, qui reste pure : c'est
    // ce qui permet de l'éprouver sur un cas fabriqué, sans toucher au dépôt.
    const docsDesProcess = new Map();
    for (const p of PROCESSES) {
      if (!p.doc || docsDesProcess.has(p.doc)) continue;
      try { docsDesProcess.set(p.doc, readFileSync(p.doc, "utf8")); } catch { docsDesProcess.set(p.doc, null); }
    }
    // LE TROISIÈME REGISTRE SE LIT, IL NE SE RECOPIE PAS (Article 24, #1069) : une règle surveillée
    // ajoutée demain chez angel est prise en compte le jour même. Et son absence ne se comble pas
    // par une supposition — si l'import échoue, la fonction le DIT au lieu de sur-accuser en
    // silence, parce qu'un compte rendu faux dans le sens rassurant est le pire des deux.
    let reglesSurveillees = [];
    try { ({ REGLES_SURVEILLEES: reglesSurveillees } = await import("./angel-of-ia-process.mjs")); }
    catch { reglesSurveillees = []; }
    const r = croiserProcessEtRegles({ processes: PROCESSES, sections: mesurerSections(texteRegles), docsDesProcess, cheminDesRegles: cheminRegles, reglesSurveillees });
    const lignes = formatCroisementLines(r);
    for (const ligne of lignes) console.log(ligne);
    // LES TROIS SORTIES DONNENT TROIS ÉCARTS SÉPARÉS, jamais un seul agrégé : elles appellent trois
    // gestes différents, et les fondre en une ligne ferait produire une tâche fourre-tout que
    // personne n'appliquerait.
    const ecarts = [];
    if (r.mesurable && r.processSansRegle.length) ecarts.push({ pourquoi: `${r.processSansRegle.length} process que rien ne nomme dans les règles de travail` });
    if (r.mesurable && r.reglesSansProcess.length) ecarts.push({ pourquoi: `${r.reglesSansProcess.length} règle(s) porteuse(s) d'obligation qu'aucun process n'exécute` });
    if (r.mesurable && r.conflits.length) ecarts.push({ pourquoi: `${r.conflits.length} paire(s) process ↔ règle en conflit possible` });
    if (r.mesurable && r.processMuetsSurLesRegles?.length) ecarts.push({ pourquoi: `${r.processMuetsSurLesRegles.length} process dont le document ne cite jamais les règles de travail` });
    if (r.mesurable && r.citationsMortesDAngel?.length) ecarts.push({ pourquoi: `${r.citationsMortesDAngel.length} règle(s) surveillée(s) citent une section des règles de travail qui n'existe pas — un renvoi mort ressemble à un lien, ce qui est pire qu'une absence` });
    imprimerPlanDaction(planDactionDepuisEcarts(ecarts, { toolSlug: "abraham-les-references", tache: "instruire chaque ligne une par une : écrire la règle manquante, donner un process à la règle orpheline, ou ARBITRER le conflit — l'arbitrage est une décision humaine (Article 16), jamais un correctif d'agent" }));
    mkdirSync("docs/abraham-les-references", { recursive: true });
    const chemin = `docs/abraham-les-references/croisement-process-regles-${new Date().toISOString().slice(0, 10)}.txt`;
    writeFileSync(chemin, lignes.join("\n") + "\n", "utf8");
    console.log(`\nRapport déposé : ${chemin}`);
    return;
  }
  if (arg1 === "documents-jumeaux") {
    printReportHeader({ tool: "abraham-les-references", title: "ABRAHAM-LES-REFERENCES — deux documents qui disent la même chose", scriptPath: "scripts/abraham-les-references.mjs" });
    printReliabilityNotice("abraham-les-references");
    recordCliUsage("abraham-les-references");
    const r = trouverDocumentsJumeaux(chargerLesDocuments());
    const lignes = formatDocumentsJumeauxLines(r);
    for (const ligne of lignes) console.log(ligne);
    const ecarts = r.mesurable && r.aInstruire.length
      ? [{ pourquoi: `${r.aInstruire.length} paire(s) de documents couvrent le même terrain sans qu'aucun ne cite l'autre` }]
      : [];
    const plan = planDactionDepuisEcarts(ecarts, { toolSlug: "abraham-les-references", tache: "instruire chaque paire une par une — fusionner, déclarer la frontière dans l'un des deux, ou écarter avec la raison écrite ; jamais un retrait en masse" });
    imprimerPlanDaction(plan);
    console.log(`\nRapport déposé : ${deposerRapportDocumentsJumeaux(lignes)}`);
    return;
  }
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
  const r = analyserDocument({ texte, chemin, fichiers });
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
  imprimerPlanDaction(plan);
}


// ————————————————————————————————————————————————————————————————————————
// LE COUPLE BLUEPRINT ↔ INSTANCIATION (2026-09-28, tâche #1033)
// ————————————————————————————————————————————————————————————————————————
//
// LE TROU, écrit dans la tâche qui l'ouvre : 82 blueprints ont chacun leur instanciation, et RIEN
// ne vérifie qu'ils disent encore la même chose. « Une règle affinée d'un côté et pas de l'autre,
// c'est une question de semaines » — exactement ce que l'Article 24 interdit : un commentaire qui
// promet une synchronisation future n'est jamais une protection.
//
// POURQUOI ABRAHAM ET PAS MOÏSE : MOÏSE ne connaît qu'un document, la charte. Abraham traite
// n'importe quel document à règles, donc lui seul peut prendre un couple quelconque.
//
// CE QUI A ÉTÉ ESSAYÉ D'ABORD ET ÉCARTÉ PAR LA MESURE, et c'est le cœur de cette fiche parce que
// le prochain agent aura la même idée en premier : **comparer les SECTIONS des deux documents par
// recouvrement de vocabulaire**. Mesuré sur les 82 couples réels — 527 sections de blueprint, 710
// d'instanciation — la distribution du meilleur recouvrement est une courbe LISSE, sans le moindre
// creux : 8 sections à 0, 121 à 0,05, 168 à 0,10, 95 à 0,15, et ainsi de suite jusqu'à 0,75. Poser
// un seuil dedans revient à le choisir, et à 0,10 il déclarerait « sans vis-à-vis » 226 sections de
// blueprint sur 527 et 405 d'instanciation sur 710. **C'est normal et ce n'est pas un défaut** : un
// blueprint est générique et son instanciation est particulière, ils ont le DROIT de ne pas se
// ressembler. Un garde-fou qui accuse la moitié d'un parc cesse d'être lu (leçon L4), et un seuil
// qui ne se pose pas dans un creux n'est pas dérivé, il est décrété (BP5).
//
// LE SIGNAL QUI DISCRIMINE VRAIMENT est celui que la tâche nomme elle-même : **le TEMPS**. Une
// divergence, concrètement, c'est un côté retouché et l'autre laissé en arrière. C'est mécanique,
// sans interprétation, et ça se lit dans l'historique — donc aucun faux positif possible sur le
// FAIT ; seule son importance reste à juger, et elle reste humaine.
//
// LE SEUIL SE DÉRIVE DU PARC, il ne se recopie pas (Article 24) : deux fois le 90ᵉ centile des
// écarts observés, avec un plancher pour qu'un dépôt parfaitement synchrone ne produise pas un
// seuil minuscule qui accuserait tout le monde. Mesure du 2026-09-28 : 82 couples mesurables,
// écart médian 0,2 jour, maximum 7,9 — et RIEN entre 14 jours et l'infini. Le seuil tombe donc
// aujourd'hui dans une zone réellement vide, ce qui veut dire que **ce garde-fou est silencieux au
// moment où il est écrit**. C'est le résultat attendu, jamais une preuve qu'il fonctionne : sa
// morsure est vérifiée sur un couple fabriqué exprès (leçon L2, bonne pratique BP2).
export const PLANCHER_DIVERGENCE_JOURS = 14;

export function couplesBlueprintInstanciation({ root = ".", lister = readdirSync, existe = null } = {}) {
  const ilExiste = existe ?? ((c) => { try { statSync(join(root, c)); return true; } catch { return false; } });
  let fichiers = [];
  try { fichiers = lister(join(root, "docs")); }
  catch { return { mesurable: false, pourquoi: "docs/ illisible — sans lecture, « aucun couple » voudrait dire « je n'ai pas pu regarder » (leçon L5)", couples: [] }; }
  const couples = [];
  for (const f of fichiers.map(String)) {
    if (!f.endsWith("-blueprint.md")) continue;
    const nom = f.slice(0, -"-blueprint.md".length);
    const instanciation = `docs/referentiel/${nom}.md`;
    if (ilExiste(instanciation)) couples.push({ nom, blueprint: `docs/${f}`, instanciation });
  }
  if (!couples.length) return { mesurable: false, pourquoi: "aucun blueprint n'a d'instanciation en face — rien à comparer, ce qui n'est jamais la même chose que « tout concorde »", couples: [] };
  return { mesurable: true, couples };
}

// LA STATISTIQUE COMPTE AUTANT QUE LE FAIT DE DÉRIVER, et le contre-test l'a prouvé avant la
// première mise en service. Première version : « deux fois le 90ᵉ centile ». Sur les 82 couples
// réels elle donnait 10,8 j, plancher 14, tout allait bien. Sur le couple FABRIQUÉ pour vérifier
// que le garde-fou mord — un retard de 200 jours — le 90ᵉ centile d'un corpus de deux valeurs VAUT
// 200, le seuil devenait 400, et **l'anomalie s'était poussée elle-même hors de portée**.
//
// LA RÈGLE GÉNÉRALE QUI EN SORT : un seuil dérivé d'un corpus qui CONTIENT l'anomalie doit reposer
// sur une statistique que l'anomalie ne déplace pas. La MÉDIANE ne bouge pas quand une valeur
// extrême apparaît ; un centile haut, si. Le facteur 10 est large exprès : la médiane du parc est
// de 0,2 jour, donc c'est le plancher qui gouverne aujourd'hui, et la part dérivée ne sert qu'à
// éviter d'accuser un dépôt entier qui travaillerait légitimement plus lentement.
// EN DESSOUS D'UNE CERTAINE TAILLE, IL N'Y A PAS DE CORPUS — et c'est la seconde fois de la même
// nuit que ce piège se referme (l'autre était le « mot rare » du catalogue, leçon L43). Sur DEUX
// écarts, n'importe quelle statistique est l'anomalie elle-même : médiane comme centile. Le parc
// réel en porte 82, largement de quoi dériver ; un dépôt qui démarre, non. Le plancher gouverne
// alors seul, et il est DÉCLARÉ plutôt que calculé — un chiffre annoncé comme mesuré alors qu'il
// ne l'est pas ne se rediscute jamais (BP5).
export const MIN_COUPLES_POUR_DERIVER = 20;

export function seuilDivergence(ecarts = [], { plancher = PLANCHER_DIVERGENCE_JOURS, minCorpus = MIN_COUPLES_POUR_DERIVER } = {}) {
  const valeurs = ecarts.filter(Number.isFinite).sort((a, b) => a - b);
  if (valeurs.length < minCorpus) {
    return { seuil: plancher, derive: false, corpus: valeurs.length,
      pourquoi: `plancher déclaré de ${plancher} j : ${valeurs.length} couple(s) mesurés, il en faut ${minCorpus} pour qu'une statistique veuille dire quelque chose — en dessous, l'anomalie qu'on cherche EST le corpus et déplacerait le seuil au-dessus d'elle-même` };
  }
  const m = valeurs.length % 2 ? valeurs[(valeurs.length - 1) / 2] : (valeurs[valeurs.length / 2 - 1] + valeurs[valeurs.length / 2]) / 2;
  const derive = Math.max(plancher, Math.round(m * 10));
  return { seuil: derive, derive: derive > plancher, mediane: m, corpus: valeurs.length,
    pourquoi: `dérivé du parc : dix fois l'écart MÉDIAN (${m.toFixed(1)} j) sur ${valeurs.length} couples, jamais en dessous du plancher de ${plancher} j — la médiane parce qu'une anomalie ne la déplace pas, là où un centile haut se laisse pousser au-dessus d'elle-même` };
}

export function divergenceDesCouples({ root = ".", lister = readdirSync, existe = null, touches = null } = {}) {
  const inv = couplesBlueprintInstanciation({ root, lister, existe });
  if (!inv.mesurable) return { mesurable: false, pourquoi: inv.pourquoi, ecarts: [] };
  const t = touches ?? dernieresTouchePourLeParc();
  if (!t) return { mesurable: false, pourquoi: "l'historique git n'a pas pu être lu — sans dates, « aucune divergence » serait un satisfecit rendu sur zéro donnée (leçon L5)", ecarts: [] };
  const mesures = []; const nonMesurables = [];
  for (const c of inv.couples) {
    const a = t.get(c.blueprint); const b = t.get(c.instanciation);
    if (!Number.isFinite(a) || !Number.isFinite(b)) { nonMesurables.push({ ...c, pourquoi: "l'un des deux fichiers n'a aucune trace dans l'historique (jamais committé ?)" }); continue; }
    mesures.push({ ...c, jours: Math.abs(a - b) / 86400, enRetard: a > b ? c.instanciation : c.blueprint });
  }
  const s = seuilDivergence(mesures.map((m) => m.jours));
  const ecarts = mesures.filter((m) => m.jours > s.seuil).sort((x, y) => y.jours - x.jours);
  return { mesurable: true, couples: inv.couples.length, compares: mesures.length, nonMesurables, seuil: s, ecarts,
    mediane: mesures.length ? mesures.map((m) => m.jours).sort((a, b) => a - b)[Math.floor(mesures.length / 2)] : null,
    maximum: mesures.length ? Math.max(...mesures.map((m) => m.jours)) : null };
}

function dernieresTouchePourLeParc() {
  try { return dernieresTouchesPartagees(); } catch { return null; }
}

export function formatDivergenceLines(d) {
  if (!d?.mesurable) return ["=== COUPLES BLUEPRINT ↔ INSTANCIATION : PAS MESURÉ ===", `  ${d?.pourquoi}`, "", "  Ce n'est PAS « aucune divergence »."];
  const L = [`=== COUPLES BLUEPRINT ↔ INSTANCIATION — ${d.compares} couple(s) comparé(s) sur ${d.couples} ===`, ""];
  L.push(`  Écart médian ${d.mediane.toFixed(1)} j · maximum ${d.maximum.toFixed(1)} j · seuil ${d.seuil.seuil} j (${d.seuil.pourquoi}).`);
  if (d.nonMesurables.length) L.push(`  ⚪ ${d.nonMesurables.length} couple(s) NON mesurable(s) : ${d.nonMesurables.map((c) => c.nom).join(", ")} — déclarés plutôt que comptés conformes.`);
  L.push("");
  if (!d.ecarts.length) {
    L.push("  ✅ Aucun couple au-delà du seuil. Ce que ça dit exactement : aucun blueprint n'a été retouché sans que son instanciation");
    L.push("     le soit dans la foulée, et réciproquement. Ce que ça NE dit PAS : que les deux documents disent la même chose — la");
    L.push("     concordance de FOND n'est pas mécanisable, seule la concordance de RYTHME l'est.");
  }
  for (const e of d.ecarts) {
    L.push(`  🟠 ${e.nom} — ${Math.round(e.jours)} jours d'écart · le retardataire est ${e.enRetard}`);
    L.push(`      l'un des deux a été retouché et l'autre non : relire le plus récent et reporter ce qui doit l'être, ou déclarer que le changement ne concernait que ce côté-là`);
  }
  return L;
}


// --- 9. LA COUVERTURE D'UNE COMMANDE -----------------------------------------------------------
//
// POURQUOI CETTE PARTIE EXISTE, ET C'EST SA PHRASE QUI L'A CRÉÉE (2026-09-28, tâche #1145) :
// « j'ai l'impression que tu ne prends pas assez en compte mes consignes du document COMMANDE
// IMPORTANTE, que tu ne fais pas les choses à 100%, assure-toi de gérer tout ça avec RIGUEUR. »
//
// LA SEULE RÉPONSE HONNÊTE À CETTE PHRASE N'EST PAS UNE PROMESSE, C'EST UN COMPTEUR. Une promesse
// de rigueur est invérifiable — par lui comme par moi — et elle se redonne à l'identique le jour
// où elle est fausse. Le soir même, la mesure a montré qu'il avait raison : sa commande dit
// « philo » 14 fois, la vue globale 0 fois. Ce constat-là avait été produit par un script jetable,
// donc irreproductible : exactement le défaut que la rigueur réclamée doit fermer.
//
// CHEZ ABRAHAM PLUTÔT QU'À CÔTÉ (Article 31) : il est l'outil maître des documents à règles, il
// sait déjà découper un document en unités, extraire le vocabulaire significatif d'une unité et
// dériver un seuil de terrain commun. Tout ce qui suit réutilise ces trois pièces ; rien n'est
// réécrit.
//
// SA LIMITE EST DÉCLARÉE ET ELLE EST RÉELLE : il mesure un RECOUVREMENT DE VOCABULAIRE, jamais une
// compréhension. Un document qui NOMME un sujet sans le traiter passera pour le couvrir — c'est la
// même famille d'erreur que « mentionner n'est pas dépendre », payée plusieurs fois sur ce dépôt.
// Il sert donc à trouver ce qui est ABSENT (un signal sûr : ce qu'aucun mot ne rejoint n'est
// sûrement pas traité), jamais à certifier ce qui est présent.

// CE QUI FAIT D'UNE LIGNE UNE DEMANDE, et pas du contexte. Sa commande alterne les deux en
// permanence : une même puce peut poser une question, donner un ordre, ou seulement raconter.
// Compter le contexte comme une demande gonflerait le dénominateur et rendrait la couverture
// flatteusement basse ; l'ignorer raterait ses ordres les plus secs.
export const MOTIFS_DE_DEMANDE = [
  { cle: "etiquette", motif: /^\s*-?\s*(QUESTION|REMARQUE|OBJECTIF|ATTENDU|CONSIGNE|IMPORTANT|COMMANDE|RAPPEL|PRECISION|PRÉCISION)\b/i },
  { cle: "interrogation", motif: /\?\s*$/ },
  { cle: "obligation", motif: MOTIF_OBLIGATION_FR },
  { cle: "imperatif", motif: /\b(donne|donnez|fais|faites|mets|mettez|trouve|assure|vérifie|verifie|propose|explique|aide|dis)[- ]?(moi|nous|toi)?\b/i },
];

export const MOTS_MINIMUM_POUR_MESURER = 4;

export function unitesDeDemande(texte = "") {
  const lignes = String(texte).split("\n");
  const unites = [];
  for (const [i, brute] of lignes.entries()) {
    const ligne = brute.trim();
    if (ligne.length < 30) continue;                       // trop court pour porter une demande
    if (/^\|/.test(ligne) || /^#{1,6}\s/.test(ligne)) continue;  // tableaux et titres : de la structure
    const signaux = MOTIFS_DE_DEMANDE.filter((m) => m.motif.test(ligne)).map((m) => m.cle);
    if (!signaux.length) continue;
    unites.push({ ligne: i + 1, texte: ligne, signaux, mots: motsSignificatifs(ligne) });
  }
  return unites;
}

// IL N'Y A PAS DE « POURCENTAGE DE COUVERTURE », ET C'EST UNE DÉCISION, PAS UN MANQUE.
// Le premier jet en produisait un : il a rendu « 1 % des demandes couvertes », avec un seuil dérivé
// à 95 %. Le chiffre était absurde dans les deux sens — deux longs textes français partagent
// naturellement la moitié de leur vocabulaire, donc un seuil dérivé de cette médiane devient
// inatteignable, et le même calcul sur une population plus lâche aurait rendu « 90 % couvert ».
// UN CHIFFRE QUI BOUGE AVEC LA LONGUEUR DES DOCUMENTS PLUTÔT QU'AVEC LEUR CONTENU NE MESURE RIEN,
// et publié sur la question « as-tu tout pris en compte ? » il serait exactement le satisfecit que
// ce projet refuse.
//
// CE QUI SE MESURE VRAIMENT, ET QUI NE SE TRUQUE PAS : l'ÉCART d'une demande au LOT. Une demande
// dont le vocabulaire est nettement moins repris que celui de ses voisines est une demande que
// personne n'a écrite — et ce signal-là ne dépend ni de la longueur ni du style, seulement de la
// comparaison des unités entre elles. L'outil rend donc un CLASSEMENT des demandes les moins
// reprises, jamais une note.
export const PART_DE_LA_MEDIANE_POUR_ETRE_ORPHELINE = 0.5;

export function couvertureDeLaDemande({ demande = "", couvrants = {} } = {}) {
  const unites = unitesDeDemande(demande);
  if (!unites.length) {
    return { mesurable: false, pourquoi: "aucune unité de demande reconnue dans ce document : ce zéro dit que le découpage n'a rien trouvé, jamais que tout est couvert" };
  }
  const vocabulaires = Object.fromEntries(Object.entries(couvrants).map(([c, t]) => [c, motsSignificatifs(t)]));
  if (!Object.keys(vocabulaires).length) {
    return { mesurable: false, pourquoi: "aucun document couvrant fourni : sans eux la question « est-ce pris en compte ? » n'a pas d'objet" };
  }

  // TROIS ÉTATS, JAMAIS DEUX — et le troisième est ce qui empêche ce compteur de mentir. Une unité
  // dont le vocabulaire est trop maigre pour être comparée n'est ni reprise ni orpheline. La ranger
  // dans l'un des deux camps fabriquerait un chiffre, et un chiffre fabriqué sur la rigueur est
  // pire que pas de chiffre du tout.
  const lignes = unites.map((u) => {
    if (u.mots.size < MOTS_MINIMUM_POUR_MESURER) {
      return { ...u, etat: "NON MESURABLE", meilleur: null, taux: null,
        pourquoi: `${u.mots.size} mot(s) significatif(s) seulement : trop peu pour qu'un recouvrement veuille dire quoi que ce soit` };
    }
    let meilleur = null, taux = 0;
    for (const [chemin, vocab] of Object.entries(vocabulaires)) {
      const c = couvertureDuVocabulaire(u.mots, vocab);
      if (c > taux) { taux = c; meilleur = chemin; }
    }
    return { ...u, meilleur, taux };
  });

  const mesurees = lignes.filter((l) => l.taux !== null);
  if (mesurees.length < PAIRES_MINIMUM_POUR_UN_SEUIL) {
    return { mesurable: false, unites: lignes.length,
      pourquoi: `${mesurees.length} unité(s) mesurable(s) seulement : sous ${PAIRES_MINIMUM_POUR_UN_SEUIL}, comparer une demande au lot n'a pas de sens — il n'y a pas de lot` };
  }
  const tries = mesurees.map((l) => l.taux).sort((a, b) => a - b);
  const mediane = tries.length % 2 ? tries[(tries.length - 1) / 2] : (tries[tries.length / 2 - 1] + tries[tries.length / 2]) / 2;
  const plancher = mediane * PART_DE_LA_MEDIANE_POUR_ETRE_ORPHELINE;

  for (const l of mesurees) {
    l.etat = l.taux < plancher ? "ORPHELINE" : (l.taux < mediane ? "FAIBLE" : "REPRISE");
    l.pourquoi = `${Math.round(l.taux * 100)} % de son vocabulaire se retrouve dans ${l.meilleur ?? "aucun document"} — le lot est à ${Math.round(mediane * 100)} %`;
  }

  const parEtat = {};
  for (const l of lignes) (parEtat[l.etat] ??= []).push(l);
  for (const g of Object.values(parEtat)) g.sort((a, b) => (a.taux ?? 0) - (b.taux ?? 0));
  return {
    mesurable: true, mediane, plancher, unites: lignes.length, lignes, parEtat,
    mesurees: mesurees.length,
    orphelines: (parEtat.ORPHELINE ?? []).length,
    pourquoi: `${lignes.length} unité(s) de demande, ${mesurees.length} mesurable(s) · le lot se reprend à ${Math.round(mediane * 100)} %, une demande passe ORPHELINE sous ${Math.round(plancher * 100)} %`,
  };
}

export function formatCouvertureLines(r, { limite = 15 } = {}) {
  if (!r?.mesurable) return ["=== COUVERTURE DE LA COMMANDE : PAS MESURÉ ===", `  ${r?.pourquoi}`, "", "  Ce n'est PAS « tout est couvert »."];
  const L = [`=== COUVERTURE DE LA COMMANDE — ${r.orphelines} demande(s) ORPHELINE(S) sur ${r.mesurees} mesurable(s) ===`, "", `  ${r.pourquoi}`, ""];
  for (const etat of ["ORPHELINE", "FAIBLE", "REPRISE", "NON MESURABLE"]) {
    const g = r.parEtat[etat] ?? [];
    if (!g.length) continue;
    const icone = { ORPHELINE: "🚨", FAIBLE: "🟠", REPRISE: "✅", "NON MESURABLE": "⚪" }[etat];
    const combien = etat === "ORPHELINE" ? limite : 3;
    L.push(`  ${icone} ${etat} — ${g.length}`);
    for (const l of g.slice(0, combien)) {
      L.push(`     ligne ${l.ligne} · ${l.texte.slice(0, 140)}${l.texte.length > 140 ? "…" : ""}`);
      L.push(`        ${l.pourquoi}`);
    }
    if (g.length > combien) L.push(`     … et ${g.length - combien} autre(s)`);
    L.push("");
  }
  L.push("  CE QUE CE CLASSEMENT DIT, ET CE QU'IL NE DIT PAS. Il compare les demandes ENTRE ELLES : une demande");
  L.push("  ORPHELINE est nettement moins reprise que ses voisines, donc probablement jamais écrite nulle part.");
  L.push("  C'est un signal SÛR sur l'absence. Une demande REPRISE ne prouve qu'une chose : quelqu'un a écrit sur");
  L.push("  le même sujet — jamais qu'il l'a traitée. Il n'y a volontairement AUCUN pourcentage de couverture :");
  L.push("  un tel chiffre bougerait avec la longueur des documents plutôt qu'avec leur contenu.");
  return L;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exitCode = 1; });
