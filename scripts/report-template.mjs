// GABARIT UNIFIÉ DES RAPPORTS (2026-09-22, tâche #199, demande explicite de l'utilisateur :
// « doc-report nouvelle fonction : s'assurer que tous les reports ont le meme format, gabarit : ce
// format est graphique (txt ou html, mise en page, couleurs, etc.) mais aussi au niveau du contenu :
// message d'en tete, titres, facon de presnter, organisation, structure... Il y a une place dans
// chaque report pour pouvoir importer une phrase generique, comme le probleme qu'on a eu a devoir
// inserer la phrase "resultats non garantis" »).
//
// L'ASYMÉTRIE RÉELLE QUI L'A MOTIVÉ, mesurée avant d'écrire une ligne (Article 19) : les rapports
// HTML partageaient DÉJÀ un contrat unique depuis html-report.mjs (`title` / `subtitle` /
// `dateLabel` / `blocks` / `footer`), et c'est pour ça qu'ils se ressemblent tous. Les rapports
// TEXTE, eux, n'avaient aucun contrat : chaque outil improvisait son en-tête, son titre, sa façon
// de dater, son ordre. D'où l'épisode de la phrase de fiabilité, qu'il a fallu insérer à la main
// dans 28 fichiers faute d'un endroit prévu pour ça.
//
// CE FICHIER EST LA DÉFINITION UNIQUE. Une seule description de ce qu'EST un rapport ; deux rendus
// (texte et HTML) qui la consomment, jamais deux définitions parallèles qui divergeraient au premier
// changement. html-report.mjs garde le rendu HTML (mise en page, couleurs, zoom) et passe désormais
// par le même cadre — jamais un second gabarit concurrent (règle anti-doublon, §7ter).
//
// L'EMPLACEMENT GÉNÉRIQUE (`slots`) est le cœur de la demande : une place réservée, en tête, que
// n'importe quelle phrase transverse future peut occuper sans repasser sur trente scripts. Son
// premier locataire est l'avertissement de fiabilité (TOOL_RELIABILITY, tâche #198) ; une mention
// légale, un rappel de contexte ou un statut de chantier s'y ajouteraient de la même façon.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reliabilityNotice } from "./lib-shell.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
// Où l'agent dépose l'identité de sa session. Un fichier local, jamais committé (cf. .gitignore) :
// il décrit QUI a produit un rapport à un instant donné, pas un état du projet.
export const SESSION_FILE = ".agent-session.json";

// Ce que TOUT rapport porte, dans cet ordre — la partie « contenu » du gabarit, celle qui vaut
// autant pour un .txt que pour un .html. Exportée pour être vérifiable mécaniquement plutôt que
// simplement promise en commentaire (Article 24).
export const REPORT_CONTRACT = [
  { cle: "title", obligatoire: true, role: "de quoi parle ce rapport — jamais un rapport sans titre" },
  { cle: "subtitle", obligatoire: false, role: "la portée exacte et le renvoi au référentiel de l'outil" },
  { cle: "dateLabel", obligatoire: true, role: "quand il a été produit — un rapport sans date ne se compare à rien" },
  { cle: "slots", obligatoire: false, role: "l'emplacement générique d'en-tête : phrases transverses venues d'un registre partagé, jamais écrites à la main dans l'outil" },
  { cle: "blocks", obligatoire: true, role: "le corps : les constats réels de l'outil, et eux seuls" },
  { cle: "footer", obligatoire: false, role: "la limite de l'outil — ce qu'il ne prétend pas faire" },
];

// CARTE D'IDENTITÉ DU RAPPORT (2026-09-22, demande explicite de l'utilisateur : « la version de
// claude utilisée au moment de la conception du rapport, avec aussi en plus les infos generiques du
// rapport : date, heure, etc. + infos pertinentes à conserver »). Elle occupe l'emplacement
// générique déjà prévu, jamais réécrite à la main dans chaque outil — c'était tout l'objet du
// gabarit.
//
// POURQUOI CES CHAMPS-LÀ, et pas seulement la date. Un rapport se relit des semaines plus tard, et
// la seule question qui compte alors est : « est-ce que ce constat est encore vrai ? ». Y répondre
// exige de savoir de quel état du projet il parlait (version du code, branche), si cet état était
// seulement retrouvable (du travail non enregistré traînait-il ?), dans quel cadre il a été produit
// (Ronde, nuit autonome, demande directe), et si l'outil qui l'a écrit avait lui-même bougé depuis.
// Les quatre ont été choisis par l'utilisateur ce jour-là ; la version du modèle s'y ajoute.

// LE MODÈLE NE SE DEVINE PAS. Un script ne peut pas savoir quel modèle fait tourner l'agent : il
// faut que l'agent le dépose. D'où la règle, tranchée avec l'utilisateur le 2026-09-22 : en son
// absence le rapport écrit « non renseignée », JAMAIS un nom deviné ni le dernier connu — une
// version périmée affirmée avec aplomb serait exactement l'erreur que tout ce paysage combat (une
// absence de mesure présentée comme une mesure). L'utilisateur a ajouté le corollaire : veiller à ce
// que ce cas n'arrive jamais est le travail du gardien de process, pas celui du rapport.
export function recordAgentSession({ model, sessionId, root = ROOT } = {}) {
  const payload = { model: model ?? null, sessionId: sessionId ?? null, recordedAt: new Date().toISOString() };
  writeFileSync(join(root, SESSION_FILE), JSON.stringify(payload, null, 1));
  return payload;
}

export function readAgentSession({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const raw = JSON.parse(readFileImpl(join(root, SESSION_FILE), "utf8"));
    return { model: raw?.model ?? undefined, sessionId: raw?.sessionId ?? undefined, recordedAt: raw?.recordedAt ?? undefined };
  } catch {
    return {};
  }
}

// L'état réel du dépôt, LU au moment du rapport (Article 24 : jamais une valeur recopiée). Un dépôt
// illisible répond par des absences, jamais par des valeurs inventées.
export function repoState({ shImpl } = {}) {
  const run = shImpl ?? ((args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim());
  const safe = (args) => { try { return run(args) || undefined; } catch { return undefined; } };
  const dirtyRaw = safe(["status", "--porcelain"]);
  return {
    commit: safe(["rev-parse", "--short", "HEAD"]),
    branche: safe(["rev-parse", "--abbrev-ref", "HEAD"]),
    // `undefined` (dépôt illisible) et `false` (arbre propre) ne veulent pas dire la même chose et
    // ne sont jamais confondus : seul le second autorise à écrire que l'état était retrouvable.
    travauxNonEnregistres: dirtyRaw === undefined ? undefined : dirtyRaw.length > 0,
  };
}

// Depuis quand l'outil qui écrit ce rapport n'a pas changé — un constat rassurant produit par un
// outil figé depuis des semaines ne vaut pas celui d'un outil à jour.
export function toolLastChanged(scriptPath, { shImpl } = {}) {
  if (!scriptPath) return undefined;
  const run = shImpl ?? ((args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim());
  try { return run(["log", "-1", "--format=%ad", "--date=short", "--", scriptPath]) || undefined; } catch { return undefined; }
}

// D'où vient le rapport. Déposé par l'appelant (la Ronde, le mode nocturne) ou, à défaut, lu dans
// l'environnement — jamais supposé : sans indication, on écrit que ce n'est pas précisé.
export const REPORT_ORIGINS = { ronde: "Ronde périodique", nuit: "nuit autonome", demande: "demande directe" };
export function reportOrigin({ origin, env = process.env } = {}) {
  const clef = origin ?? env.REPORT_ORIGIN;
  return REPORT_ORIGINS[clef] ?? (clef ? String(clef) : undefined);
}

// Assemble la carte d'identité en lignes prêtes à afficher. Chaque absence est NOMMÉE, jamais
// silencieusement omise : une ligne manquante se lirait comme une information jugée sans intérêt,
// alors qu'elle signale un trou à combler.
export function identityLines({ tool, scriptPath, origin, session, repo, changedAt, gravite, health } = {}) {
  const s = session ?? readAgentSession();
  const r = repo ?? repoState();
  const lignes = [];
  lignes.push(`Version de Claude : ${s.model ?? "non renseignée (à déposer par l'agent — cf. god-of-all-process)"}`);
  const d = new Date();
  lignes.push(`Produit le : ${d.toISOString().slice(0, 10)} à ${d.toISOString().slice(11, 16)} UTC`);
  lignes.push(`État du code : ${r.commit ?? "inconnu"}${r.branche ? ` sur ${r.branche}` : ""}${r.travauxNonEnregistres === true ? " — ⚠️ des travaux n'étaient pas enregistrés, cet état n'est pas retrouvable tel quel" : r.travauxNonEnregistres === false ? " — arbre propre" : ""}`);
  const o = reportOrigin({ origin });
  lignes.push(`Contexte de production : ${o ?? "non précisé"}`);
  const c = changedAt ?? toolLastChanged(scriptPath);
  if (tool || scriptPath) lignes.push(`Outil : ${tool ?? scriptPath}${c ? ` — inchangé depuis le ${c}` : " — date de dernière modification inconnue"}`);
  // LES DEUX NOTES, toujours séparées (décision de l'utilisateur, 2026-09-22) : l'une dit comment va
  // l'outil, l'autre ce que vaut ce rapport-ci. Les fondre en un seul chiffre les rendrait illisibles.
  if (tool) lignes.push(healthLine(tool, { health }));
  lignes.push(gravityLine(gravite));
  return lignes;
}

// Les phrases transverses disponibles pour l'emplacement générique. Une seule aujourd'hui ; le point
// de la demande est qu'une seconde s'ajoute ICI et atteigne tous les rapports d'un coup.
export function genericSlots(tool, options = {}) {
  if (!tool) return [];
  // La carte d'identité vient APRÈS l'avertissement de fiabilité : ce qu'on doit lire avant de faire
  // confiance au rapport passe avant ce qui sert à le situer plus tard.
  return [reliabilityNotice(tool), identityLines({ tool, ...options }).join("\n")].filter(Boolean);
}

// Normalise ce qu'un outil fournit en un cadre complet, avec l'emplacement générique déjà rempli.
// C'est le seul point de passage : les deux rendus consomment SON résultat, jamais les arguments
// bruts de l'appelant — sans quoi l'un pourrait oublier une partie du gabarit que l'autre applique.
export function buildReportFrame({ tool, title, subtitle, dateLabel, blocks = [], footer, scriptPath, origin, session, repo, changedAt, gravite, health } = {}) {
  if (!title) throw new Error("buildReportFrame() exige un titre — jamais un rapport sans titre (REPORT_CONTRACT)");
  return {
    tool,
    title,
    subtitle,
    dateLabel: dateLabel ?? new Date().toISOString(),
    slots: genericSlots(tool, { scriptPath, origin, session, repo, changedAt, gravite, health }),
    blocks,
    footer,
  };
}

// ————————————————————————————————————————————————————————————————————————
// LES DEUX NOTES (2026-09-22, demande de l'utilisateur : « Les outils ont tous une "note" à chaque
// rapport », calibrée le même jour en DEUX notes séparées, jamais mélangées)
// ————————————————————————————————————————————————————————————————————————
//
// Pourquoi deux et pas une : elles répondent à deux questions sans rapport, et les additionner en un
// seul chiffre rendrait les deux illisibles.
//   · SANTÉ DE L'OUTIL — est-ce que cet outil va bien ? Est-il sollicité pour de vrai, a-t-il un
//     objectif, l'atteint-il ? C'est le domaine de CASSANDRA, gardienne des objectifs et des KPI.
//   · GRAVITÉ DU CONTENU — ce que ce rapport-ci annonce est-il grave ? Seul l'outil qui l'écrit le
//     sait, donc il la FOURNIT ; elle n'est jamais devinée depuis l'extérieur.
//
// ÉVOLUTIVITÉ (Article 24, précision du même jour) : la santé se calcule pour N'IMPORTE QUEL slug à
// partir des registres partagés, sans aucune liste d'outils ici. Un outil qui rejoint l'équipe a
// donc sa note le jour même, sans qu'on ait à penser à l'inscrire quelque part.

export const GRAVITES = {
  rien: { libelle: "rien à signaler", ordre: 0 },
  attention: { libelle: "à regarder", ordre: 1 },
  serieux: { libelle: "sérieux — demande une décision", ordre: 2 },
};

// La santé d'un outil, LUE dans ce que les autres savent déjà — jamais un second calcul. Chaque
// signal absent est déclaré absent, jamais remplacé par une valeur neutre qui gonflerait la note :
// un outil qu'on ne sait pas mesurer n'est pas un outil en bonne santé, c'est un outil non mesuré.
export function toolHealth(slug, { root = ROOT } = {}) {
  if (!slug) return { mesurable: false, raison: "aucun outil nommé" };
  const signaux = [];
  let sollicitations;
  try {
    const journal = JSON.parse(readFileSync(join(root, ".tool-usage-history.json"), "utf8"));
    const evenements = Array.isArray(journal?.events) ? journal.events : [];
    // Le champ réel du journal est `toolSlug` — vérifié en LISANT un vrai événement, pas supposé
    // depuis le nom de la fonction qui l'écrit. La première version cherchait `tool`/`slug` et
    // trouvait donc zéro pour tout le monde : chaque outil se serait affiché « jamais sollicité »
    // dans son propre en-tête, une fausse mesure diffusée sur 29 rapports d'un coup. Les deux
    // anciennes clés restent acceptées au cas où un journal plus ancien traînerait.
    sollicitations = evenements.filter((e) => e?.toolSlug === slug || e?.tool === slug || e?.slug === slug).length;
    signaux.push(sollicitations > 0
      ? { clef: "usage", ok: true, texte: `${sollicitations} sollicitation(s) réelle(s) enregistrée(s)` }
      : { clef: "usage", ok: false, texte: "jamais sollicité d'après le compteur — ou jamais instrumenté pour l'être" });
  } catch {
    signaux.push({ clef: "usage", ok: undefined, texte: "compteur d'usage illisible — non mesuré" });
  }
  try {
    const registre = readFileSync(join(root, "docs/objectifs-vs-resultats/registre.md"), "utf8");
    // TROIS ÉTATS, jamais deux (2026-09-22) : un objectif chiffré, une absence ASSUMÉE (la ligne
    // existe, sa colonne Objectif vaut « — » et sa Note dit pourquoi), ou rien du tout. Sans le
    // deuxième, la note pousserait à inventer un objectif creux pour un Gardien qui tourne à chaque
    // commit — un chiffre qui ne mesurerait que le nombre de commits. Inventer un objectif pour
    // verdir une note est exactement le travers que le badge évite déjà par ailleurs.
    const ligne = registre.split("\n").find((l) => l.startsWith("|") && l.split("|")[1]?.trim() === slug);
    const objectif = ligne ? ligne.split("|")[4]?.trim() : undefined;
    const absenceAssumee = Boolean(ligne) && (objectif === "—" || objectif === "-" || objectif === "");
    signaux.push(absenceAssumee
      ? { clef: "objectif", ok: true, texte: "aucun objectif chiffré, et c'est une décision écrite — pas un oubli" }
      : ligne
        ? { clef: "objectif", ok: true, texte: "un objectif chiffré lui est fixé" }
        : { clef: "objectif", ok: false, texte: "aucun objectif chiffré — rien à quoi comparer son résultat" });
  } catch {
    signaux.push({ clef: "objectif", ok: undefined, texte: "registre d'objectifs illisible — non mesuré" });
  }
  const mesures = signaux.filter((s) => s.ok !== undefined);
  const bons = mesures.filter((s) => s.ok).length;
  return {
    mesurable: mesures.length > 0,
    signaux,
    // Le score porte sur ce qui a pu être mesuré, et le dénominateur est affiché : « 1/2 » dit
    // quelque chose, « 50 % » sur un seul signal mesuré ne dirait rien.
    bons,
    mesures: mesures.length,
    nonMesures: signaux.filter((s) => s.ok === undefined).length,
  };
}

export function healthLine(slug, { root = ROOT, health } = {}) {
  const h = health ?? toolHealth(slug, { root });
  if (!h.mesurable) return `Santé de l'outil : non mesurable (${h.raison ?? "aucun signal lisible"})`;
  const detail = h.signaux.filter((s) => s.ok === false).map((s) => s.texte);
  return `Santé de l'outil : ${h.bons}/${h.mesures} signal(aux) au vert${h.nonMesures ? `, ${h.nonMesures} non mesuré(s)` : ""}${detail.length ? ` — ${detail.join(" ; ")}` : ""}`;
}

// La gravité vient de l'outil, jamais d'ailleurs. Non fournie, elle est dite non fournie : deviner
// « rien à signaler » sur un rapport qui annonce peut-être un incendie serait le pire des défauts.
export function gravityLine(gravite) {
  if (!gravite) return "Gravité de ce rapport : non renseignée par l'outil — à lire pour le savoir";
  const g = GRAVITES[gravite];
  return `Gravité de ce rapport : ${g ? g.libelle : String(gravite)}`;
}

// L'EN-TÊTE PARTAGÉ, IMPRIMABLE (2026-09-22, ajouté pour rendre la migration des 18 outils non
// unifiés réalisable sans réécrire leur corps). Beaucoup d'outils impriment leur rapport au fil de
// l'eau dans le terminal plutôt que de construire un objet complet : leur demander de tout
// restructurer d'un coup, c'est réécrire dix-huit sorties que quelqu'un lit vraiment, avec le risque
// d'en abîmer une. Or ce que le gabarit apporte vraiment tient dans l'EN-TÊTE — l'avertissement de
// fiabilité et la carte d'identité, tous deux venus des registres partagés. Cette fonction imprime
// exactement cet en-tête en passant par buildReportFrame(), donc sans aucun second gabarit
// concurrent ; le corps reste la voix de chaque outil.
//
// Elle remplace, chez l'appelant, le couple « printReliabilityNotice(slug) + console.log('=== TITRE
// ===') » qui était jusqu'ici recopié à la main dans chaque script — exactement le genre de
// duplication que le gabarit existe pour supprimer.
export function printReportHeader({ tool, title, subtitle, scriptPath, origin, gravite, log = console.log } = {}) {
  const frame = buildReportFrame({ tool, title, subtitle, scriptPath, origin, gravite, blocks: [] });
  for (const phrase of frame.slots) log(phrase + "\n");
  log(`=== ${frame.title} ===`);
  if (frame.subtitle) log(frame.subtitle);
  log("");
  return frame;
}

// Rendu TEXTE — le pendant exact de renderHtmlReport(), même cadre, même ordre, même emplacement
// générique. Volontairement sobre : un rapport texte se lit dans un terminal et se relit par un
// autre outil, jamais une décoration qui gênerait l'un ou l'autre.
export function renderTextReport(frame) {
  // Reconnu à `slots`, jamais au titre : un objet brut d'appelant a lui aussi un titre, si bien
  // qu'un test sur le titre prenait l'entrée brute pour un cadre déjà construit et sautait
  // silencieusement tout le gabarit (trouvé au premier essai réel de cette fonction). `slots` est la
  // seule chose que buildReportFrame() est seul à poser — c'est donc la seule preuve qu'il est passé.
  const f = Array.isArray(frame?.slots) ? frame : buildReportFrame(frame);
  const out = [];
  for (const phrase of f.slots) out.push(phrase, "");
  out.push(`=== ${f.title} ===`);
  if (f.subtitle) out.push(f.subtitle);
  out.push(`Date : ${f.dateLabel}`, "");
  for (const block of f.blocks) out.push(renderTextBlock(block), "");
  if (f.footer) out.push("---", f.footer);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

// Mêmes types de blocs que le rendu HTML (`renderBlock`, html-report.mjs) — jamais un second
// vocabulaire de blocs pour le texte, sinon un outil devrait écrire son corps deux fois.
export function renderTextBlock(block) {
  if (!block) return "";
  if (typeof block === "string") return block;
  switch (block.type) {
    case "note": return block.text ?? "";
    case "code": return block.text ?? "";
    case "list": return (block.items ?? []).map((i) => `  · ${i}`).join("\n");
    case "table": {
      const entetes = block.headers ?? [];
      const lignes = block.rows ?? [];
      const largeurs = entetes.map((h, i) => Math.max(String(h).length, ...lignes.map((r) => String(r[i] ?? "").length)));
      const ligne = (cells) => "  " + cells.map((c, i) => String(c ?? "").padEnd(largeurs[i])).join("  ");
      return [ligne(entetes), "  " + largeurs.map((w) => "-".repeat(w)).join("  "), ...lignes.map(ligne)].join("\n");
    }
    default: return block.text ?? "";
  }
}
