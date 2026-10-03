// ICEBERG: membre
// LES FILS DE DISCUSSION — un sujet, un fil ; et la réponse mécanique à « es-tu à jour ? »
// (2026-09-30, né de sa colère et elle était méritée).
//
// CE QUI L'A FAIT NAÎTRE, en une phrase : il est arrivé un soir, m'a demandé si j'étais à jour,
// et la réponse honnête était non — puis chaque correction que j'ai apportée contenait une
// nouvelle erreur. Sa conclusion : « il faut qu'on trouve un système qui te permette FACILEMENT
// de savoir si tu es à jour ».
//
// POURQUOI L'ANCIEN SYSTÈME N'EN ÉTAIT PAS UN. Ses demandes vivaient dans CINQ endroits sans
// autorité : ses fichiers, la conversation, le suivi (1 300 lignes), les idées à trancher, les
// plans d'action des rapports. « À jour » n'était défini nulle part. À chaque fois qu'il posait la
// question, j'improvisais un balayage — et une improvisation laisse des trous.
//
// L'ERREUR DE FOND, ET ELLE DICTE TOUTE LA CONCEPTION : je vérifiais « ce FICHIER a-t-il été
// lu ? » au lieu de « ce SUJET a-t-il été traité ? ». Le 2026-09-30 j'ai annoncé que le modèle de
// gouvernance n'avait jamais été lu : il était en ANNEXE de sa commande principale, lue
// intégralement deux jours plus tôt, et déjà analysée en profondeur. Le fichier est un signal
// ADJACENT ; le sujet est le signal visé (leçon L47).
//
// D'OÙ L'UNITÉ : LE SUJET, jamais le fichier, jamais la question isolée.

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { printReportHeader, buildPlanDaction } from "./report-template.mjs";
import { recordCliUsage } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

export const DOSSIER_FILS = "docs/fils";
export const CERVEAU = "docs/fils/index.md";
export const DOSSIER_SAISINES = "docs/grand-projet/00-sources/01-sa-demande";

// LES QUESTIONS QUI DÉFINISSENT « À JOUR ». Elles étaient quatre à la naissance de l'outil ; la
// cinquième est arrivée le soir même, et ce n'est pas un raffinement — c'est sa consigne, à la
// ligne 111 de ses réponses du 2026-09-30, retrouvée en mesurant la couverture de sa demande :
// « le format des questions doit toujours m'aider à répondre et/ou à prendre une décision de
// manière simple et FIABILISÉE [...] Note bien tout ça quelque part, pour la suite, équipe ou
// informe les outils si nécessaire. » Une consigne notée dans un document est une intention ;
// portée par un contrôle, elle mord. C'est exactement ce que l'Article 27 exige.
//
// LA RAISON QU'IL DONNE, ET ELLE EST CHIFFRABLE : « c'est là surtout qu'on perd du temps [...]
// si je ne comprends rien, ça crée un aller-retour ». Une question mal posée ne coûte pas une
// reformulation : elle coûte un cycle entier, et parfois un chantier refait sur un malentendu.
//
// Chacune est VÉRIFIABLE par une commande. C'est tout l'intérêt : « es-tu à jour ? » cesse d'être
// une impression pour devenir quatre oui/non. Une seule réponse « non » suffit à répondre NON à la
// question d'ensemble — un système qui répondrait « à peu près » ne servirait à rien.
export const LES_CONTROLES = Object.freeze([
  { cle: "saisines-deposees", question: "Tout ce qu'il m'a envoyé est-il dans le projet ?",
    sansQuoi: "une demande qui n'est pas dans les fichiers du projet n'est vérifiable par aucun outil — c'est ainsi que trois noms d'outils qu'il avait donnés ont été perdus" },
  { cle: "saisines-rattachees", question: "Chaque chose qu'il m'a envoyée est-elle rattachée à au moins un sujet ?",
    sansQuoi: "une saisine sans sujet est une saisine que personne ne rouvrira" },
  { cle: "fils-dates", question: "Chaque sujet dit-il à qui est la balle, et depuis quand ?",
    sansQuoi: "un sujet sans porteur ni date est un sujet dont personne ne sait s'il attend quelqu'un" },
  { cle: "fils-situes", question: "Chaque sujet dit-il où il se place dans la stratégie ?",
    sansQuoi: "un sujet hors du plan avance sans qu'on sache ce qu'il sert — et il se rediscute indéfiniment" },
  { cle: "questions-repondables", question: "Chaque question qui l'attend lui donne-t-elle de quoi répondre simplement ?",
    sansQuoi: "une question ouverte posée à quelqu'un qui n'est pas développeur se paie en aller-retours, jamais en reformulation : c'est le poste de perte de temps qu'il a lui-même désigné" },
  { cle: "engagements-en-taches", question: "Chaque chose que je me suis engagé à faire est-elle une TÂCHE qui existe vraiment ?",
    sansQuoi: "un engagement écrit dans un fil et nulle part ailleurs est une intention : personne ne le relira, aucun outil ne le comptera, et il aura l'air d'un travail en cours jusqu'à ce qu'on l'oublie" },
  // LE SEPTIÈME CONTRÔLE (2026-10-02, tâche #1483) — ET IL EXISTE PARCE QUE LES SIX AUTRES ONT
  // RENDU UN FAUX VERT SUR LA SEULE QUESTION QUI COMPTE.
  //
  // Son constat : « J'ai l'impression que les fils de discussion vegetent avec tes reponses […] tu
  // dois verifier si les fils ont bien été alimentés et que des fichiers ephemeres ne leur ont pas
  // ôté le pain de la bouche. » Mesuré le jour même : 180 documents créés ou modifiés dans docs/
  // depuis le dernier vrai mouvement d'un fil, dont 41 dans les dossiers qui lui sont destinés,
  // contre UN SEUL enregistrement touchant un fil — la fermeture d'une question morte.
  //
  // ET PENDANT CE TEMPS CET OUTIL RÉPONDAIT « 14/14 fils à jour ». Les six contrôles mesurent la
  // FORME d'un fil — a-t-il une date, dit-il à qui est la balle, ses engagements existent-ils en
  // tâches — et PAS UN SEUL ne demande s'il a reçu quelque chose. Un fil parfaitement formé et
  // mort depuis deux jours passait les six. C'est le faux vert posé exactement sur le mécanisme
  // dont la raison d'être est de répondre à « es-tu à jour ? ».
  //
  // CE QUE CELUI-CI MESURE, SANS AUCUN SEUIL ARBITRAIRE (BP5 : un seuil planté dans un nuage
  // continu se trompe au premier cas nouveau). Il compare deux dates que le dépôt porte déjà :
  // la plus récente des dates de mouvement des fils, et les dates du registre des remises. Un
  // document REMIS après le dernier mouvement d'un fil est un document livré sans qu'aucun fil
  // n'ait bougé — exactement le flux de travail qu'il décrit (« pour me repondre, tu me livres
  // les fils concernés ») pris en défaut. Zéro tolérance sur cette population-là, et c'est
  // justifié : chaque document qui lui est remis répond à quelque chose, donc appartient à un fil.
  { cle: "fils-alimentes", question: "Chaque document qui lui a été remis a-t-il laissé une trace dans un fil ?",
    sansQuoi: "un fil parfaitement formé et mort depuis deux jours passe les six autres contrôles : sans celui-ci, « à jour » ne mesure que la FORME des fils, jamais leur ALIMENTATION — et c'est précisément le faux vert qu'il a ressenti avant qu'aucun outil ne le voie" },
  // LE HUITIÈME (2026-10-03, tâche #1542) — L'AUTRE SENS, et il manquait entièrement.
  // Le contrôle 2 demande « chaque FIL nomme-t-il sa saisine ? ». Celui-ci demande l'inverse :
  // « chaque SAISINE est-elle nommée par un fil ? ». Un sens sur deux rassure sur une moitié
  // (BP4), et la moitié manquante était celle qui porte sa demande : une réponse qu'il me donne
  // doit alimenter le fil concerné. Le contrôle 2 était ✅ VERT pendant que son message de
  // 96 points, `reponses-2026-10-03.md`, n'était cité par AUCUN fil.
  { cle: "saisines-digerees", question: "Chaque chose qu'il a déposée est-elle nommée par au moins un fil ?",
    sansQuoi: "une saisine que personne ne cite est une demande entrée dans le dépôt et sortie de la discussion : elle a l'air traitée puisqu'elle est rangée, et rien ne la rouvrira jamais" },
]);

// LE REGISTRE DES REMISES, LU D'ICI. Son chemin est le même que celui déclaré par data-archangel
// (REGISTRE_DES_LIVRAISONS) — recopié plutôt qu'importé, parce qu'importer data-archangel entier
// pour une constante alourdirait un outil qu'on lance souvent. Le filet vérifie que les deux
// chaînes restent identiques, ce que l'Article 24 exige d'une valeur recopiée.
export const REGISTRE_DES_REMISES = "docs/livraisons.json";

export function filsAlimentes({ root = ROOT, fils = [], readFileImpl = readFileSync } = {}) {
  let registre;
  try { registre = JSON.parse(readFileImpl(join(root, REGISTRE_DES_REMISES), "utf8")); }
  catch { return { mesurable: false, pourquoi: `${REGISTRE_DES_REMISES} n'a pas pu être lu : on ne sait pas ce qui lui a été remis, donc on ne peut pas dire si les fils ont suivi` }; }
  const remises = Array.isArray(registre?.remises) ? registre.remises : Array.isArray(registre) ? registre : [];
  if (!remises.length) return { mesurable: false, pourquoi: "aucune remise enregistrée : rien à confronter aux fils, ce qui n'est jamais « les fils ont suivi »" };
  const datesFils = fils.map((f) => f.date).filter(Boolean).sort();
  if (!datesFils.length) return { mesurable: false, pourquoi: "aucun fil ne porte de date de mouvement : la comparaison est impossible" };
  const dernierFil = datesFils[datesFils.length - 1];
  // On compare sur la DATE seule (10 caractères) : une remise et un mouvement de fil le même jour
  // ne sont pas un écart — le fil a pu être nourri dans la même session.
  const orphelines = remises.filter((r) => String(r?.remisLe ?? "").slice(0, 10) > dernierFil);
  return { mesurable: true, orphelines, remises: remises.length, dernierFil };
}

// CE QU'UNE QUESTION DOIT PORTER POUR ÊTRE RÉPONDABLE, et le seuil est volontairement bas.
//
// Une question qui lui est adressée (« — À TOI ») doit offrir des OPTIONS CONCRÈTES, repérées par
// une lettre entre parenthèses : (a) … · (b) … Deux au minimum, quatre au maximum — c'est la règle
// de forme déjà écrite dans docs/regles-de-travail.md §2, jamais inventée ici ; ce fichier ne fait
// que la rendre mesurable.
//
// CE QUI N'EST PAS MESURÉ, ET IL FAUT LE DIRE : qu'une option soit CLAIRE. Une mécanique compte
// des lettres, elle ne lit pas. Un contrôle vert ne prouve donc pas qu'il a compris la question —
// il prouve seulement qu'on ne lui a pas tendu une page blanche. Le reste reste son jugement à
// lui, et lui seul peut dire « je n'ai rien compris ».
export const MOTIF_QUESTION_A_LUI = /^\*\*Q[\d.]+(?:bis|ter)?\s*—\s*À TOI\b[^\n]*\n(?:[^\n]*\n?)*?(?=\n\*\*Q|\n##|$)/gim;
export const MOTIF_OPTION = /\((?:a|b|c|d)\)\s*\S/g;

// LE SIXIÈME CONTRÔLE — SA QUESTION DU 2026-09-30, ET ELLE VISE JUSTE.
//
// SES MOTS : « tu veilles bien aux mécanismes entre suivi des tâches et suivi fil de discussion ?
// tu veilles bien en général à ce que chaque constat suivi d'une proposition ne reste pas qu'une
// intention, jamais réalisée ? »
//
// LA RÉPONSE HONNÊTE, LE JOUR OÙ IL L'A POSÉE, ÉTAIT NON. Les fils portaient VINGT engagements
// « À MOI » et aucun n'existait comme tâche dans le suivi. Chacun avait l'air d'un travail en
// cours parce qu'il était écrit ; aucun n'était comptable.
//
// C'EST EXACTEMENT LE TROU QUE L'ARTICLE 28 FERME AILLEURS — rapport → analyse → plan d'action →
// tâches — et que les fils rouvraient sur un autre terrain, parce qu'un fil n'est pas un rapport
// et qu'aucun contrôle ne les regardait.
//
// ET LA MÊME DOCTRINE QUE checkActionChain() S'APPLIQUE, LE CAS VICIEUX COMPRIS : on ne vérifie
// pas qu'un numéro est CITÉ, on vérifie que la tâche EXISTE. Une référence morte ressemble à un
// lien, ce qui est pire qu'une absence.
export const MOTIF_ENGAGEMENT = /^\*\*Q[\d.]+(?:bis|ter)?\s*—\s*À MOI\b[^\n]*\n(?:[^\n]*\n?)*?(?=\n\*\*Q|\n##|$)/gim;
export const MOTIF_TACHE_CITEE = /#(\d{3,5})\b/g;

export function engagementsSansTache(texte = "", tachesExistantes = null) {
  const blocs = String(texte).match(MOTIF_ENGAGEMENT) ?? [];
  const nus = [];
  for (const b of blocs) {
    const id = (b.match(/^\*\*(Q[\d.]+(?:bis|ter)?)/) ?? [])[1] ?? "?";
    const numeros = [...b.matchAll(MOTIF_TACHE_CITEE)].map((m) => m[1]);
    if (!numeros.length) { nus.push({ id, pourquoi: "aucune tâche citée" }); continue; }
    // Une tâche CITÉE mais INEXISTANTE est pire qu'aucune : elle rassure.
    if (tachesExistantes && !numeros.some((n) => tachesExistantes.has(n))) {
      nus.push({ id, pourquoi: `tâche(s) ${numeros.map((n) => "#" + n).join(", ")} citée(s) mais introuvable(s) dans le suivi` });
    }
  }
  return { pris: blocs.length, nus };
}

// Les numéros de tâche réellement présents dans docs/suivi/ — lus, jamais supposés.
export function tachesDuSuivi({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  const ids = new Set();
  const balayer = (dossier) => {
    let entrees = [];
    try { entrees = listDirImpl(join(root, dossier), { withFileTypes: true }); } catch { return; }
    for (const e of entrees) {
      const rel = `${dossier}/${e.name}`;
      if (e.isDirectory()) { balayer(rel); continue; }
      if (!e.name.endsWith(".md")) continue;
      let t = "";
      try { t = readFileImpl(join(root, rel), "utf8"); } catch { continue; }
      for (const m of t.matchAll(/^\|\s*(\d{3,5})\s*\|/gm)) ids.add(m[1]);
    }
  };
  balayer("docs/suivi");
  return ids;
}

export function questionsRepondables(texte = "") {
  const blocs = String(texte).match(MOTIF_QUESTION_A_LUI) ?? [];
  const nues = [];
  for (const b of blocs) {
    const lettres = new Set((b.match(MOTIF_OPTION) ?? []).map((o) => o[1]));
    if (lettres.size < 2) nues.push((b.match(/^\*\*(Q[\d.]+(?:bis|ter)?)/) ?? [])[1] ?? "?");
  }
  return { posees: blocs.length, nues };
}

// Les marqueurs que chaque fil doit porter. Ils sont LUS dans le fichier, jamais supposés.
export const MOTIF_BALLE = /^\*\*Balle\s*:\*\*\s*(À TOI|À MOI|CLOS|DORMANT)\b/mi;
export const MOTIF_DATE = /^\*\*Dernier mouvement\s*:\*\*\s*(\d{4}-\d{2}-\d{2})/mi;
export const MOTIF_PLACE = /^\*\*Place dans le plan\s*:\*\*\s*(.+)$/mi;
export const MOTIF_SAISINES = /^\*\*Saisines\s*:\*\*\s*(.+)$/mi;

export function lireLesFils({ root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync, ...opts } = {}) {
  let noms = [];
  try { noms = listDirImpl(join(root, DOSSIER_FILS)); } catch { return { mesurable: false, pourquoi: `${DOSSIER_FILS} n'existe pas encore — aucun fil n'a été ouvert`, fils: [] }; }
  const fils = [];
  for (const n of noms.filter((x) => /^fil-\d+.*\.md$/.test(x)).sort()) {
    let t = "";
    try { t = readFileImpl(join(root, DOSSIER_FILS, n), "utf8"); } catch { continue; }
    const titre = (t.match(/^#\s+(.+)$/m) ?? [])[1] ?? n;
    fils.push({
      fichier: `${DOSSIER_FILS}/${n}`,
      numero: Number((n.match(/^fil-(\d+)/) ?? [])[1] ?? 0),
      titre,
      balle: (t.match(MOTIF_BALLE) ?? [])[1] ?? null,
      date: (t.match(MOTIF_DATE) ?? [])[1] ?? null,
      place: (t.match(MOTIF_PLACE) ?? [])[1] ?? null,
      saisines: ((t.match(MOTIF_SAISINES) ?? [])[1] ?? "").split("·").map((s) => s.trim()).filter(Boolean),
      questions: questionsRepondables(t),
      engagements: engagementsSansTache(t, opts.taches ?? null),
    });
  }
  return { mesurable: true, fils };
}

// LE CONTRÔLE 1 compare ce qu'il a envoyé à ce qui est déposé. Il ne peut PAS voir le dossier
// temporaire des envois depuis un autre poste : quand il est absent, on le DIT plutôt que de rendre
// un vert (leçons L5 et L11) — « je n'ai pas pu regarder » et « rien ne manque » ne s'écrivent
// jamais pareil.
export function saisinesDeposees({ root = ROOT, dossierEnvois = null, listDirImpl = readdirSync } = {}) {
  let deposees = [];
  try { deposees = listDirImpl(join(root, DOSSIER_SAISINES)).filter((f) => /\.(md|docx|txt)$/i.test(f)); } catch { /* déclaré ci-dessous */ }
  if (!dossierEnvois) return { mesurable: false, pourquoi: "le dossier des envois n'est pas accessible depuis ici : je peux dire ce qui EST déposé, jamais ce qui manque", deposees: deposees.length, manquantes: [] };
  let envoyees = [];
  try { envoyees = listDirImpl(dossierEnvois); } catch { return { mesurable: false, pourquoi: `${dossierEnvois} illisible`, deposees: deposees.length, manquantes: [] }; }
  const norm = (s) => String(s).toLowerCase().replace(/^[0-9a-f]{8}-/, "").replace(/[^a-z0-9]/g, "");
  const dep = deposees.map(norm);
  const manquantes = envoyees.filter((e) => /\.(docx|txt|md|pdf)$/i.test(e)).filter((e) => !dep.some((d) => d.includes(norm(e).slice(0, 18)) || norm(e).includes(d.slice(0, 18))));
  return { mesurable: true, deposees: deposees.length, envoyees: envoyees.length, manquantes };
}

// ————————————————————————————————————————————————————————————————————————
// LES CANAUX, ET LA DIGESTION FIL PAR FIL (tâche #1542)
// ————————————————————————————————————————————————————————————————————————
//
// HUIT DE SES POINTS PORTENT SUR LA MÊME MÉCANIQUE (P10, P55, P57, P58, P60, P61, P62, P81), et
// sa demande centrale tient en une phrase : une réponse qu'il me donne, ou que je lui envoie, doit
// alimenter le fil concerné — en reprenant SA QUESTION et MA RÉPONSE — **quel que soit le canal**.
//
// CE QU'AUCUN MÉCANISME NE PEUT FAIRE, ET LE DIRE EST LA PROTECTION (Article 27) : rien, dans ce
// dépôt, ne peut lire la conversation. Une réponse donnée de vive voix et jamais déposée
// n'existera pour aucun outil. Les canaux sont donc DÉCLARÉS un par un avec, pour chacun, s'il est
// mesurable et pourquoi non — parce qu'un canal silencieusement non couvert se lit comme un canal
// propre, et c'est exactement le faux vert que le septième contrôle a déjà payé une fois.
export const CANAUX_DUNE_REPONSE = [
  { cle: "document-depose", quoi: "un document qu'il dépose dans le dossier de ses demandes", mesurable: true,
    comment: "le fichier est sur le disque, daté, et le contrôle « saisines rattachées » vérifie qu'un fil le cite" },
  { cle: "document-remis", quoi: "un document que je lui remets", mesurable: true,
    comment: "le registre des remises le date, et le septième contrôle vérifie qu'un fil a bougé depuis" },
  { cle: "ligne-de-suivi", quoi: "une décision écrite dans une ligne de suivi", mesurable: true,
    comment: "le suivi est sur le disque et porte un horodatage lu" },
  { cle: "conversation", quoi: "une réponse donnée dans la conversation, jamais déposée", mesurable: false,
    pourquoi: "aucun outil de ce dépôt ne peut lire la conversation. C'est une limite dure, pas un manque d'effort : la seule protection possible est de DÉPOSER la réponse, et de le déclarer ici plutôt que de laisser croire que le canal est couvert" },
  { cle: "fenetre-de-calibrage", quoi: "une réponse donnée dans une fenêtre de question dédiée", mesurable: false,
    pourquoi: "même limite que la conversation : la fenêtre n'écrit rien sur le disque. Ce qu'elle produit doit être recopié dans une ligne de suivi ou dans le fil, sans quoi la décision n'aura jamais existé pour le dépôt" },
  { cle: "document-ephemere", quoi: "une réponse qui ne vit que dans un document de travail jeté ensuite", mesurable: false,
    pourquoi: "c'est le cas qu'il a nommé lui-même — « des fichiers ephemeres […] leur ont ôté le pain de la bouche ». Le document disparaît, donc rien ne reste à mesurer : la parade est en amont, ne jamais répondre dans un éphémère" },
];

// LE GARDE-FOU DE LA DÉCLARATION (Article 24/27) : un canal non mesurable DOIT porter sa raison
// écrite, sinon la liste redevient une liste de vœux — et un canal nouveau ajouté sans dire s'il
// est mesurable passerait pour couvert.
export function findCanauxMalDeclares({ canaux = CANAUX_DUNE_REPONSE } = {}) {
  const ecarts = [];
  for (const c of canaux) {
    if (typeof c.mesurable !== "boolean") { ecarts.push(`le canal « ${c.cle} » ne dit pas s'il est mesurable : un canal muet se lit comme un canal couvert`); continue; }
    if (c.mesurable && !c.comment) ecarts.push(`le canal « ${c.cle} » se dit mesurable sans dire PAR QUOI : une mesure sans instrument nommé est invérifiable (Article 31, faille 8)`);
    if (!c.mesurable && (!c.pourquoi || c.pourquoi.length < 40)) ecarts.push(`le canal « ${c.cle} » se dit non mesurable sans raison écrite : déclarer l'impossibilité EST la protection, la taire ne l'est pas (Article 27)`);
  }
  return ecarts;
}

// LA DIGESTION FIL PAR FIL — ce que le septième contrôle ne pouvait pas voir. Il compare les
// remises à la date du fil LE PLUS RÉCENT de tous, donc un seul fil vivant suffisait à couvrir
// treize fils morts. Celui-ci regarde CHAQUE fil contre SES PROPRES saisines : une saisine
// déposée après le dernier mouvement d'un fil qui la cite est une matière que ce fil n'a pas
// digérée, et c'est exactement « le fil végète » qu'il a ressenti avant qu'aucun outil ne le voie.
export const MOTIF_DATE_DANS_UN_NOM = /(\d{4}-\d{2}-\d{2})/;

export function dateDUneSaisine(nom = "") {
  const m = String(nom).match(MOTIF_DATE_DANS_UN_NOM);
  return m ? m[1] : null;
}

export function filsNonDigeres({ fils = [], root = ROOT, listDirImpl = readdirSync } = {}) {
  if (!fils.length) return { mesurable: false, pourquoi: "aucun fil lu : rendre « tout est digéré » sur zéro fil serait l'inverse d'une mesure (leçon L5)" };
  let deposees = [];
  try { deposees = listDirImpl(join(root, DOSSIER_SAISINES)).filter((f) => /\.md$/i.test(f)); } catch {
    return { mesurable: false, pourquoi: `${DOSSIER_SAISINES} est illisible : on ne sait pas ce qui a été déposé, donc pas si les fils l'ont digéré` };
  }
  // On ne garde que les saisines DATÉES dans leur nom : sans date, impossible de dire si elle est
  // antérieure ou postérieure au mouvement du fil, et la compter au hasard accuserait à tort.
  const datees = deposees.map((n) => ({ nom: n, date: dateDUneSaisine(n) })).filter((x) => x.date);
  const sansDate = deposees.length - datees.length;
  const retards = [];
  for (const f of fils) {
    if (!f.date) continue;  // un fil sans date est déjà relevé par le contrôle « fils datés »
    const cite = (nom) => f.saisines.some((s) => {
      const d = dateDUneSaisine(s);
      return d && nom.includes(d);
    });
    const enRetard = datees.filter((x) => cite(x.nom) && x.date > f.date);
    if (enRetard.length) retards.push({ fil: f.fichier, titre: f.titre, date: f.date, saisines: enRetard.map((x) => x.nom) });
  }
  return { mesurable: true, fils: fils.length, saisinesDatees: datees.length, sansDate, retards };
}

// LE CONTRÔLE QUI MANQUAIT, ET IL RENDAIT UN VERT SUR LE PLUS GROS MESSAGE DU PROJET.
//
// Le contrôle « saisines rattachées » vérifie que chaque FIL nomme la saisine dont il sort. C'est
// un sens sur deux. L'autre sens — chaque saisine DÉPOSÉE est-elle nommée par au moins un fil ? —
// n'était vérifié par personne, et c'est pourtant celui qui répond à sa demande : une réponse
// qu'il me donne doit alimenter le fil concerné. Mesuré le 2026-10-03 : le contrôle était ✅ VERT
// pendant que `reponses-2026-10-03.md`, son message de 96 points, n'était cité par AUCUN fil.
//
// C'est BP4 pris en défaut sur le mécanisme même dont la raison d'être est de répondre à « es-tu à
// jour ? » : un contrôle vérifié dans un seul sens est un contrôle qui rassure sur une moitié.
export function saisinesOrphelines({ fils = [], root = ROOT, listDirImpl = readdirSync } = {}) {
  if (!fils.length) return { mesurable: false, pourquoi: "aucun fil lu : rendre « aucune saisine orpheline » sur zéro fil dirait l'inverse de la vérité (leçon L5)" };
  let deposees = [];
  try { deposees = listDirImpl(join(root, DOSSIER_SAISINES)).filter((f) => /\.md$/i.test(f) && !/^README/i.test(f)); } catch {
    return { mesurable: false, pourquoi: `${DOSSIER_SAISINES} est illisible : on ne sait pas ce qui a été déposé` };
  }
  if (!deposees.length) return { mesurable: false, pourquoi: "aucune saisine déposée : rien à rattacher, ce qui n'est pas « tout est rattaché »" };
  // LE RAPPROCHEMENT SE FAIT SUR LA DATE PORTÉE PAR LE NOM, jamais sur le nom entier : un fil
  // écrit « réponses 2026-09-30 » ou « gros prompt du 2026-10-02 » là où le fichier s'appelle
  // `reponses-2026-09-30.md`. La date est le seul élément que les deux écritures partagent à coup
  // sûr. Une saisine sans date dans son nom est COMPTÉE À PART plutôt qu'accusée : on ne peut pas
  // la rapprocher, ce qui n'est pas la même chose que ne pas la trouver (leçon L5).
  const texteDesSaisines = fils.flatMap((f) => f.saisines).join(" | ");
  const avecDate = [];
  const sansDate = [];
  for (const nom of deposees) {
    const d = dateDUneSaisine(nom);
    if (d) avecDate.push({ nom, date: d }); else sansDate.push(nom);
  }
  const orphelines = avecDate.filter((x) => !texteDesSaisines.includes(x.date)).map((x) => x.nom);
  return { mesurable: true, deposees: deposees.length, rapprochables: avecDate.length, sansDate, orphelines };
}

// LE TABLEAU DU CERVEAU DES FILS, GÉNÉRÉ (tâche #1542).
//
// LE CONSTAT QUI L'IMPOSE, ET IL EST MESURÉ : le catalogue annonçait « fil 01 : 5 questions » là
// où le fil en porte SEIZE, « fil 06 : 6 (2 pour toi) » là où il en porte 9 dont 3 pour lui.
// Presque chaque ligne avait dérivé — ce qui est inévitable d'une table recopiée à la main
// (Article 24), et grave ici : c'est la PREMIÈRE chose qu'il lit pour savoir où il en est. Un
// catalogue faux est pire qu'un catalogue absent, parce qu'il a l'air à jour.
//
// LA PROSE AUTOUR N'EST JAMAIS TOUCHÉE : seul le bloc entre marqueurs est réécrit, exactement
// comme l'arborescence de la cascade. Le reste du Cerveau — l'explication, la distinction cascade
// / transverses, les renvois — est écrit à la main et le reste.
export const REGISTRE_DU_JOURNAL = "docs/fils-de-discussion/index.md";
export const MARQUEUR_FILS_DEBUT = "<!-- TABLEAU DES FILS — bloc généré par `node scripts/fils-de-discussion.mjs cerveau --inserer`, ne pas éditer à la main -->";
export const MARQUEUR_FILS_FIN = "<!-- /TABLEAU DES FILS -->";

export function compterLesQuestions(texte = "") {
  const toutes = (String(texte).match(/^\*\*Q[\d.]+(?:bis|ter)?\s*—/gim) ?? []).length;
  const pourLui = (String(texte).match(/^\*\*Q[\d.]+(?:bis|ter)?\s*—\s*À TOI\b/gim) ?? []).length;
  return { toutes, pourLui };
}

// LA FAMILLE D'UN FIL — cascade (il y a un ordre, et le sauter fait tout rediscuter) ou transverse
// (il n'attend personne). Liste MANUELLE et assumée (Article 24, second cas) : aucun signal du
// dépôt ne dit qu'un sujet en conditionne un autre, c'est une décision. Le garde-fou ci-dessous
// refuse qu'elle diverge des fils réels dans les DEUX sens (BP4).
export const FAMILLE_DES_FILS = { 1: "cascade 0", 2: "cascade 1", 3: "cascade 1", 6: "cascade 2", 7: "cascade 3" };
export const FAMILLE_PAR_DEFAUT = "transverse";

export function findFamillesDeFilsDivergentes({ fils = [], familles = FAMILLE_DES_FILS } = {}) {
  const numeros = new Set(fils.map((f) => f.numero));
  const ecarts = [];
  for (const n of Object.keys(familles)) {
    if (!numeros.has(Number(n))) ecarts.push(`la famille déclare un fil ${n} qui n'existe plus : un rangement qui nomme un sujet disparu ressemble à une carte à jour`);
  }
  return ecarts;
}

export function tableauDesFils({ root = ROOT, fils = [], readFileImpl = readFileSync, familles = FAMILLE_DES_FILS } = {}) {
  const lignes = [];
  lignes.push("| Fil | Sujet | Famille | Balle | Dernier mouvement | Questions |");
  lignes.push("|---|---|---|---|---|---|");
  let toutes = 0;
  let pourLui = 0;
  for (const f of [...fils].sort((a, b) => a.numero - b.numero)) {
    let t = "";
    try { t = readFileImpl(join(root, f.fichier), "utf8"); } catch { t = ""; }
    const q = compterLesQuestions(t);
    toutes += q.toutes;
    pourLui += q.pourLui;
    const nom = f.fichier.split("/").pop();
    // Le titre du fil commence par « FIL NN — » : on retire ce préfixe, qui est déjà la colonne
    // d'à côté, plutôt que de le répéter.
    const sujet = String(f.titre).replace(/^FIL\s*\d+\s*[—–-]\s*/i, "");
    lignes.push(`| [${String(f.numero).padStart(2, "0")}](${nom}) | ${sujet} | ${familles[f.numero] ?? FAMILLE_PAR_DEFAUT} | **${f.balle ?? "?"}** | ${f.date ?? "—"} | ${q.toutes} (${q.pourLui} pour toi) |`);
  }
  lignes.push("");
  lignes.push(`**Total : ${fils.length} fils · ${toutes} questions · ${pourLui} attendent ta réponse · ${toutes - pourLui} sont de mon côté.**`);
  return lignes;
}

export function insererLeTableauDesFils(texte = "", lignes = [], { debut = MARQUEUR_FILS_DEBUT, fin = MARQUEUR_FILS_FIN } = {}) {
  const bloc = [debut, "", "**Les fils, leur balle et leurs questions** — compté sur les fils réels à chaque passage, jamais recopié :", "", ...lignes, "", fin].join("\n");
  const t = String(texte ?? "");
  const i = t.indexOf(debut);
  if (i !== -1) {
    const j = t.indexOf(fin, i);
    // Un marqueur d'ouverture sans fermeture : on REFUSE plutôt que de deviner où le bloc
    // s'arrête — écraser jusqu'à la fin emporterait de la prose écrite à la main.
    if (j === -1) return { change: false, pourquoi: "marqueur d'ouverture sans marqueur de fin : refusé plutôt que de deviner où le bloc s'arrête", texte: t };
    const nouveau = t.slice(0, i) + bloc + t.slice(j + fin.length);
    return { change: nouveau !== t, texte: nouveau, remplace: true };
  }
  const l = t.split("\n");
  let pos = l.findIndex((x) => /^#\s/.test(x));
  pos = pos === -1 ? 0 : pos + 1;
  l.splice(pos, 0, "", bloc);
  return { change: true, texte: l.join("\n"), remplace: false };
}

// SA DÉCISION, ACTÉE : un fil CLOS mais réouvrable reste au catalogue ; un fil CLOS DÉFINITIVEMENT
// est archivé et compressé, JAMAIS supprimé. Un mécanisme ne peut pas savoir si une clôture était
// définitive — mais il peut refuser la DISPARITION, qui est le seul geste que sa règle interdit
// absolument.
export const DOSSIER_FILS_ARCHIVES = "docs/fils/archives";
export const MOTIF_LIEN_VERS_UN_FIL = /\((fil-\d+[a-z0-9-]*\.md)\)/gi;

export function findFilsDisparus({ root = ROOT, cerveau = CERVEAU, readFileImpl = readFileSync, existsImpl = existsSync } = {}) {
  let texte = "";
  try { texte = readFileImpl(join(root, cerveau), "utf8"); } catch {
    return { mesurable: false, pourquoi: `${cerveau} est illisible : sans le catalogue, on ne sait pas quels fils devraient exister` };
  }
  const cites = [...new Set([...texte.matchAll(MOTIF_LIEN_VERS_UN_FIL)].map((m) => m[1]))];
  if (!cites.length) return { mesurable: false, pourquoi: "le catalogue ne renvoie vers aucun fil : rien à vérifier, ce qui n'est pas « aucun fil n'a disparu »" };
  const disparus = cites.filter((n) => !existsImpl(join(root, DOSSIER_FILS, n)) && !existsImpl(join(root, DOSSIER_FILS_ARCHIVES, n)));
  return { mesurable: true, cites: cites.length, disparus };
}

export function suisJeAJour({ root = ROOT, dossierEnvois = null, taches = null } = {}) {
  const lus = lireLesFils({ root, taches: taches ?? tachesDuSuivi({ root }) });
  const dep = saisinesDeposees({ root, dossierEnvois });
  const fils = lus.fils ?? [];
  const resultats = [
    { ...LES_CONTROLES[0], mesurable: dep.mesurable, ok: dep.mesurable ? dep.manquantes.length === 0 : null,
      detail: dep.mesurable ? `${dep.deposees} saisine(s) déposée(s), ${dep.manquantes.length} manquante(s)` : dep.pourquoi },
    { ...LES_CONTROLES[1], mesurable: lus.mesurable, ok: lus.mesurable ? fils.length > 0 && fils.every((f) => f.saisines.length > 0) : null,
      detail: lus.mesurable ? `${fils.filter((f) => f.saisines.length).length}/${fils.length} fil(s) nomment la saisine dont ils sortent` : lus.pourquoi },
    { ...LES_CONTROLES[2], mesurable: lus.mesurable, ok: lus.mesurable ? fils.length > 0 && fils.every((f) => f.balle && f.date) : null,
      detail: lus.mesurable ? `${fils.filter((f) => f.balle && f.date).length}/${fils.length} fil(s) disent à qui est la balle ET depuis quand` : lus.pourquoi },
    { ...LES_CONTROLES[3], mesurable: lus.mesurable, ok: lus.mesurable ? fils.length > 0 && fils.every((f) => f.place) : null,
      detail: lus.mesurable ? `${fils.filter((f) => f.place).length}/${fils.length} fil(s) disent où ils se placent` : lus.pourquoi },
    (() => {
      const e = fils.reduce((acc, f) => ({ pris: acc.pris + (f.engagements?.pris ?? 0), nus: acc.nus.concat((f.engagements?.nus ?? []).map((n) => `${f.fichier.split("/").pop()} ${n.id} (${n.pourquoi})`)) }), { pris: 0, nus: [] });
      return { ...LES_CONTROLES[5], mesurable: lus.mesurable && e.pris > 0, ok: lus.mesurable && e.pris > 0 ? e.nus.length === 0 : null,
        detail: !lus.mesurable ? lus.pourquoi
          : e.pris === 0 ? "je ne me suis engagé à rien — rien à mesurer, et ce n'est pas un vert"
          : `${e.pris - e.nus.length}/${e.pris} engagement(s) portent une tâche qui existe vraiment${e.nus.length ? ` — sans tâche : ${e.nus.join(", ")}` : ""}` };
    })(),
    (() => {
      const q = fils.reduce((acc, f) => ({ posees: acc.posees + f.questions.posees, nues: acc.nues.concat(f.questions.nues.map((n) => `${f.fichier.split("/").pop()} ${n}`)) }), { posees: 0, nues: [] });
      return { ...LES_CONTROLES[4], mesurable: lus.mesurable && q.posees > 0, ok: lus.mesurable && q.posees > 0 ? q.nues.length === 0 : null,
        detail: !lus.mesurable ? lus.pourquoi
          : q.posees === 0 ? "aucune question ne l'attend — rien à mesurer, et ce n'est pas un vert"
          : `${q.posees - q.nues.length}/${q.posees} question(s) lui offrent des options concrètes${q.nues.length ? ` — nues : ${q.nues.join(", ")}` : ""}` };
    })(),
    (() => {
      const so = saisinesOrphelines({ fils, root });
      return { ...LES_CONTROLES[7], mesurable: so.mesurable, ok: so.mesurable ? so.orphelines.length === 0 : null,
        detail: !so.mesurable ? so.pourquoi
          : so.orphelines.length === 0 ? `les ${so.rapprochables} saisine(s) datée(s) sont toutes nommées par au moins un fil${so.sansDate.length ? ` (${so.sansDate.length} sans date dans leur nom, non rapprochables)` : ""}`
          : `${so.orphelines.length} saisine(s) déposée(s) qu'aucun fil ne cite : ${so.orphelines.join(", ")}` };
    })(),
    (() => {
      const al = filsAlimentes({ root, fils });
      return { ...LES_CONTROLES[6], mesurable: al.mesurable, ok: al.mesurable ? al.orphelines.length === 0 : null,
        detail: !al.mesurable ? al.pourquoi
          : al.orphelines.length === 0 ? `les ${al.remises} remise(s) enregistrée(s) sont toutes antérieures ou contemporaines du dernier mouvement de fil (${al.dernierFil})`
          : `${al.orphelines.length} document(s) remis APRÈS le dernier mouvement d'un fil (${al.dernierFil}) sans qu'aucun fil ne bouge : ${al.orphelines.slice(0, 5).map((o) => o.fichier.split("/").pop()).join(", ")}${al.orphelines.length > 5 ? ` (+${al.orphelines.length - 5})` : ""}` };
    })(),
  ];
  const nonMesures = resultats.filter((r) => r.ok === null).length;
  const rates = resultats.filter((r) => r.ok === false).length;
  return {
    fils: fils.length,
    resultats,
    // TROIS VERDICTS, JAMAIS DEUX. « Je ne sais pas » n'est pas « oui » : un contrôle qu'on n'a pas
    // pu faire ne se compte jamais comme réussi, sinon le système ment exactement quand il est
    // aveugle — et c'est là qu'il est le plus dangereux.
    verdict: rates > 0 ? "NON" : nonMesures > 0 ? "PAS ENTIÈREMENT MESURÉ" : "OUI",
  };
}

export function formatVerdictLines(v) {
  const l = [];
  l.push(`=== SUIS-JE À JOUR ? — ${v.verdict} ===`);
  l.push("");
  for (const r of v.resultats) {
    const p = r.ok === true ? "✅" : r.ok === false ? "🚨" : "⚪";
    l.push(`${p} ${r.question}`);
    l.push(`     ${r.detail}`);
    if (r.ok === false) l.push(`     sans quoi : ${r.sansQuoi}`);
  }
  l.push("");
  l.push(`${v.fils} fil(s) de discussion ouverts.`);
  if (v.verdict === "PAS ENTIÈREMENT MESURÉ") l.push("⚪ = ce contrôle n'a PAS pu être fait. Ce n'est jamais un oui : un système aveugle qui répond « à jour » ment au moment où il est le plus dangereux.");
  return l;
}

// planDactionDesFils() (2026-10-01, tâche #1355) — LE TROU QUE pure-gold-unity A TROUVÉ.
// Cet outil était le DERNIER des 49 tenus par le gabarit à ne jamais conclure : il rendait six
// verdicts et s'arrêtait là. C'est précisément ce que l'Article 28 interdit — « un rapport n'est
// pas fini quand il est écrit, il l'est quand ses constats sont devenus des tâches ».
//
// LES DEUX ÉTATS, ET POURQUOI PAS UN SEUL. Un contrôle qui ÉCHOUE est un écart que je dois
// réparer : RETENU. Un contrôle qui n'a PAS PU ÊTRE FAIT n'est pas mon écart — c'est une décision
// qui ne m'appartient pas (lui donner accès au dossier de ses envois, ou accepter de rester
// aveugle sur ce point) : À TRANCHER. Les fondre en un seul état transformerait sa décision en
// mon manquement, et l'inverse serait pire encore.
//
// CE QU'IL N'INVENTE PAS : aucun constat n'est fabriqué pour remplir la section. Quand les six
// contrôles passent, le plan dit « rien à faire » — ce que buildPlanDaction() écrit déjà seul.
// LA TABLE EST CHOISIE À LA MAIN, EXPRÈS, et cette phrase est ce qui l'autorise (Article 24,
// deuxième exemption). Elle ne reflète l'état d'aucun autre système : elle dit quelle tâche DÉJÀ
// OUVERTE porte la réparation de quel contrôle. Un contrôle absent d'ici n'a simplement pas encore
// de tâche dédiée, et son constat sortira sans numéro — jamais avec un numéro inventé.
// Vérifié ligne par ligne contre docs/suivi/ le 2026-10-01, jamais déduit d'un nom.
export const TACHE_PAR_CONTROLE = Object.freeze({
  "engagements-en-taches": "1332",   // Suivi / « 20 engagements de ma part, 0 tâche » — la tâche qui a créé ce contrôle
  "questions-repondables": "1332",   // même tâche : les deux contrôles sont nés du même constat
});

export function planDactionDesFils(v, { numeros = TACHE_PAR_CONTROLE } = {}) {
  const constats = [];
  for (const r of v.resultats ?? []) {
    if (r.ok === false) {
      constats.push({
        constat: `${r.question} — ${r.detail}`,
        etat: "retenu",
        tache: r.sansQuoi ?? "réparer l'écart avant de répondre « à jour » à quoi que ce soit",
        // Le numéro n'est renseigné que si une tâche existe POUR DE VRAI (passée par l'appelant) :
        // un numéro inventé ici serait une référence morte, qui ressemble à un lien.
        numeroTache: numeros[r.cle] ?? null,
      });
    } else if (r.ok === null) {
      constats.push({
        constat: `${r.question} — ${r.detail}`,
        etat: "a-trancher",
        pourquoi: "ce contrôle est aveugle par construction, et le rendre voyant est TA décision, jamais la mienne — un système aveugle qui répond « à jour » ment au moment où il est le plus dangereux",
      });
    }
  }
  return buildPlanDaction(constats, { toolSlug: "fils-de-discussion" });
}

// LIVRER LES FILS, ET C'EST LA SECONDE MOITIÉ DE SON FLUX (2026-10-02, tâche #1483)
//
// SA DEMANDE, MOT POUR MOT : « lorsque je t'envoie des prompts avec des questions à l'interieur :
// 1/ tu extrais les questions, tu les rattaches au fil concerné ou tu créé un nouveau 2/ pour me
// repondre, tu me livres les fils concernés ou créés : normalement, ca me permet d'acceder à ta
// reponse en bas ou haut de page suivant l'ordre, mais aussi de reprendre les derniers echanges
// sur le sujet. »
//
// CE QUI SE MÉCANISE ET CE QUI NE SE MÉCANISE PAS, et la frontière est nette. Le point ① —
// extraire les questions d'un prompt et décider à quel fil chacune appartient — est un JUGEMENT :
// une même question peut toucher trois sujets, et choisir est tout le travail. Aucune mécanique
// ne le fera à ma place, et prétendre le contraire produirait un rattachement au petit bonheur.
// Le point ② — mettre en page les fils concernés et les préparer à l'envoi — est purement
// mécanique, et c'était pourtant la partie que je faisais À LA MAIN, donc la partie que
// j'oublierais (leçon L2).
//
// CE QU'ELLE REND : les chemins HTML, prêts à envoyer, index compris. L'ENVOI reste un geste de
// l'agent — rien ici ne peut remettre un fichier à quelqu'un — et la REMISE s'enregistre après,
// jamais avant (même discipline que les sauvegardes et les documents).
export function filsALivrer(numeros = [], { root = ROOT, listDirImpl = readdirSync, readFileImpl = readFileSync } = {}) {
  const lus = lireLesFils({ root, listDirImpl, readFileImpl });
  if (!lus.mesurable) return { mesurable: false, pourquoi: lus.pourquoi ?? "les fils n'ont pas pu être lus : aucune livraison ne peut être préparée sur zéro donnée" };
  const voulus = numeros.map((n) => String(n).replace(/^#/, "").padStart(2, "0"));
  const choisis = voulus.length
    ? lus.fils.filter((f) => voulus.includes(String(f.numero).padStart(2, "0")))
    : lus.fils;
  const introuvables = voulus.filter((n) => !lus.fils.some((f) => String(f.numero).padStart(2, "0") === n));
  const sources = choisis.map((f) => ({
    numero: f.numero, titre: f.titre, balle: f.balle, date: f.date,
    markdown: f.fichier,
    html: f.fichier.replace(/^docs\/fils\//, "docs/fils/html/").replace(/\.md$/, ".html"),
  }));
  return { mesurable: true, sources, introuvables, index: { markdown: CERVEAU, html: "docs/fils/html/index.html" } };
}

export function formatLivraisonDesFilsLines(r) {
  if (!r?.mesurable) return [`=== LIVRER LES FILS : PAS MESURÉ — ${r?.pourquoi ?? "raison non fournie"} ===`];
  const L = [`=== ${r.sources.length} FIL(S) À LUI LIVRER ===`, ""];
  L.push("  Commencer par l'index — il dit où est la balle sur chaque sujet :");
  L.push(`     ${r.index.html}`);
  L.push("");
  for (const f of r.sources) L.push(`  #${String(f.numero).padStart(2, "0")} [${f.balle ?? "sans balle"}] ${String(f.titre).slice(0, 62)}\n     ${f.html}`);
  for (const n of r.introuvables) L.push(`  🔴 fil #${n} demandé mais introuvable — un numéro qui ne désigne rien ressemble à un fil qu'on aurait livré`);
  L.push("");
  L.push("  ⚠️  LES PAGES HTML NE SONT PAS RÉGÉNÉRÉES ICI : cette commande PRÉPARE une livraison, elle ne");
  L.push("     met pas à jour les pages. Un fil modifié depuis sa dernière mise en page partirait périmé.");
  L.push("     Régénérer d'abord, puis livrer, puis enregistrer la remise — jamais dans un autre ordre.");
  return L;
}

function main() {
  printReportHeader({ tool: "fils-de-discussion", title: "LES FILS DE DISCUSSION — un sujet, un fil", scriptPath: "scripts/fils-de-discussion.mjs" });
  printReliabilityNotice("fils-de-discussion");
  recordCliUsage("fils-de-discussion");
  // `cerveau [--inserer]` (tâche #1542) — le tableau du Cerveau des fils, compté sur les fils
  // réels. Sans `--inserer` il l'imprime ; avec, il réécrit le bloc entre marqueurs et ne touche
  // jamais à la prose autour.
  if (process.argv[2] === "cerveau") {
    const lus = lireLesFils({ root: ROOT });
    if (!lus.mesurable) { console.log(`🚨 PAS MESURÉ — ${lus.pourquoi}`); process.exitCode = 1; return; }
    const lignes = tableauDesFils({ root: ROOT, fils: lus.fils });
    for (const l of lignes) console.log(l);
    if (process.argv.includes("--inserer")) {
      const chemin = join(ROOT, CERVEAU);
      let avant = "";
      try { avant = readFileSync(chemin, "utf8"); } catch { console.log(`🚨 ${CERVEAU} illisible`); process.exitCode = 1; return; }
      const r = insererLeTableauDesFils(avant, lignes);
      if (!r.change) { console.log(`\nInchangé${r.pourquoi ? ` — ${r.pourquoi}` : " : le bloc était déjà à jour"}.`); return; }
      writeFileSync(chemin, r.texte, "utf8");
      console.log(`\n${r.remplace ? "Bloc remplacé" : "Bloc inséré"} dans ${CERVEAU}.`);
      // LE REGISTRE N'EST ALIMENTÉ QUE QUAND QUELQUE CHOSE A CHANGÉ : un passage qui trouve le
      // bloc déjà à jour n'écrit rien. Sans cette condition, le journal gagnerait une ligne par
      // commit pour ne rien apprendre, et un signal qui ne change jamais cesse d'être lu (L6).
      // Et un registre que l'outil n'alimente pas est une intention, pas un registre (L2).
      try {
        const reg = join(ROOT, REGISTRE_DU_JOURNAL);
        const avantReg = readFileSync(reg, "utf8");
        const jour = new Date().toISOString().slice(0, 10);
        const tot = lignes.find((l) => l.startsWith("**Total")) ?? "";
        writeFileSync(reg, `${avantReg.replace(/\n+$/, "")}\n| ${jour} | Tableau réécrit : ${tot.replace(/\*\*/g, "").replace(/^Total : /, "")} |\n`, "utf8");
      } catch { /* le registre est réclamé par le garde-fou des kits : son absence s'y verra, jamais ici en silence */ }
    }
    const dis = findFilsDisparus({ root: ROOT });
    if (dis.mesurable && dis.disparus.length) console.log(`\n🚨 ${dis.disparus.length} fil(s) cité(s) au catalogue dont le fichier n'existe plus, ni dans les fils ni dans les archives : ${dis.disparus.join(", ")} — un fil clos s'archive, il ne se supprime jamais.`);
    for (const e of findCanauxMalDeclares()) console.log(`🚨 ${e}`);
    for (const e of findFamillesDeFilsDivergentes({ fils: lus.fils })) console.log(`🚨 ${e}`);
    return;
  }
  if (process.argv[2] === "livrer") {
    const r = filsALivrer(process.argv.slice(3));
    for (const l of formatLivraisonDesFilsLines(r)) console.log(l);
    if (!r.mesurable || r.introuvables.length) process.exitCode = 1;
    return;
  }
  const envois = process.argv[3] && process.argv[2] === "--envois" ? process.argv[3] : null;
  const v = suisJeAJour({ dossierEnvois: envois });
  for (const ligne of formatVerdictLines(v)) console.log(ligne);
  const lus = lireLesFils();
  if (lus.mesurable && lus.fils.length) {
    console.log("\n--- LES FILS, PAR NUMÉRO ---");
    for (const f of lus.fils) console.log(`  #${String(f.numero).padStart(2, "0")} [${f.balle ?? "sans balle"}] ${f.titre} — ${f.place ?? "sans place déclarée"}`);
  }
  console.log("\n=== Plan d'action ===");
  for (const ligne of planDactionDesFils(v).lignes) console.log(ligne);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
