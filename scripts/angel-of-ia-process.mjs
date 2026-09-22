// ANGEL-OF-IA-PROCESS (2026-09-22, nom donné par l'utilisateur). Outil SÉPARÉ de
// god-of-all-process, et c'est délibéré : god surveille le déroulé d'ACTIVITÉS (une Ronde, une
// simulation), angel surveille la CONDUITE de ceux qui travaillent — le respect de
// `docs/regles-de-travail.md`. Deux métiers différents ; les mélanger rendrait god illisible.
//
// Dans les mots de l'utilisateur : « sa vocation est comme pour tous les outils process : verifier
// et garantir la discipline d'execution, que ce soit pour moi ou pour toi ». Les deux côtés sont
// donc notés de la même façon — pas de complaisance pour l'agent, pas d'exemption pour l'humain
// (même parti pris que CASSANDRA-RH, qui note déjà tout le monde y compris l'utilisateur).
//
// SON APPORT PRINCIPAL, celui que rien d'autre ne fait : LE CROISEMENT DES HORODATAGES. Plusieurs
// règles de la charte imposent de consulter un outil AVANT d'agir — tool-brain avant de chercher
// dans un fichier, Smart Conso API avant une action coûteuse, check-tasks-details avant de lire
// l'état des tâches à la main. Consulter APRÈS COUP ne vaut rien : la règle dit avant. Le compteur
// d'usage horodate chaque consultation, git horodate chaque commit — les croiser est la seule façon
// de savoir si l'ordre a été respecté, et personne ne le faisait.
//
// CE QU'IL NE PEUT PAS VOIR, et le dit : environ la moitié des règles de travail se joue uniquement
// dans la conversation (ai-je posé mes questions avant d'agir, traité les points un par un, respecté
// le format de fenêtre). Il ne les devine JAMAIS : il les DEMANDE, et refuse de conclure tant
// qu'elles ne sont pas fournies (même discipline que circle-process-guardian).

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReportHeader } from "./report-template.mjs";
import { recordCliUsage, USAGE_ORIGINS } from "./tool-usage.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// ————————————————————————————————————————————————————————————————————————
// LES RÈGLES SURVEILLÉES — et de quel côté elles engagent
// ————————————————————————————————————————————————————————————————————————

// `cote` dit qui la règle engage : l'agent, l'utilisateur, ou les deux. `observable` dit si une
// trace existe sur le disque. Une règle non observable n'est pas hors de portée : elle passe par
// `faits` que l'appelant fournit — et son absence est signalée, jamais comblée par une supposition.
export const REGLES_SURVEILLEES = [
  { id: "consultation-avant", cote: "agent", observable: true, regle: "Consulter l'outil obligatoire AVANT d'agir, jamais après coup (tool-brain, Smart Conso API, check-tasks-details).", source: "docs/regles-de-travail.md §7ter et §1001" },
  { id: "suivi-meme-commit", cote: "agent", observable: true, regle: "Documenter chaque tâche substantielle dans docs/suivi/ DANS LE MÊME commit que le travail décrit.", source: "docs/regles-de-travail.md §4" },
  { id: "push-au-fil-de-l-eau", cote: "agent", observable: true, regle: "Pousser au fil de l'eau : ce qui n'est pas poussé n'existe pas si la session s'interrompt.", source: "docs/regles-de-travail.md §4" },
  { id: "questions-avant", cote: "agent", observable: false, regle: "Poser au moins trois questions de vérification AVANT ou PENDANT l'exécution, jamais après coup — et plus si le sujet contient plus de décisions réelles.", source: "CLAUDE.md Article 16" },
  { id: "point-par-point", cote: "agent", observable: false, regle: "Traiter point par point une demande qui en contient plusieurs, sans jamais noyer les points dans une synthèse.", source: "CLAUDE.md Article 16, complément du 2026-09-17" },
  { id: "fenetre-dediee", cote: "agent", observable: false, regle: "Poser les questions dans une vraie fenêtre à choix, avec leur contexte rappelé, jamais en texte libre.", source: "CLAUDE.md Article 16" },
  { id: "double-lecture", cote: "les deux", observable: false, regle: "Après la livraison d'un transcript : l'utilisateur le lit pendant que l'agent travaille, en parallèle et non l'un après l'autre.", source: "CLAUDE.md Article 18" },
  { id: "commentaires-attendus", cote: "utilisateur", observable: false, regle: "Le signal « voici mes commentaires » ouvre un second passage sur le même transcript, que l'agent doit attendre et reconnaître.", source: "CLAUDE.md Article 18" },
  { id: "decisions-en-attente", cote: "utilisateur", observable: true, regle: "Trancher les questions laissées en attente : une décision jamais prise bloque le travail qui en dépend.", source: "docs/regles-de-travail.md §2" },
];

// ————————————————————————————————————————————————————————————————————————
// LE CROISEMENT DES HORODATAGES — l'apport propre d'angel
// ————————————————————————————————————————————————————————————————————————

// Les outils dont la consultation DOIT précéder le travail, avec ce que « le travail » veut dire
// pour chacun. Dérivé des obligations écrites, jamais une liste de confort.
export const CONSULTATIONS_OBLIGATOIRES = [
  { slug: "tool-brain", avant: "toute recherche dans un fichier existant", fichiersConcernes: /^(scripts|lib|app)\// },
  { slug: "smart-conso-api", avant: "toute action coûteuse en appels Gemini", fichiersConcernes: null },
  { slug: "smart-conso-token", avant: "tout agent séparé ou lecture exhaustive du dépôt", fichiersConcernes: null },
];

export function loadUsageEvents({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const j = JSON.parse(readFileImpl(join(root, ".tool-usage-history.json"), "utf8"));
    return Array.isArray(j?.events) ? j.events : [];
  } catch { return undefined; }
}

export function lastCommits({ root = ROOT, shImpl, n = 10 } = {}) {
  const run = shImpl ?? ((args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }));
  try {
    return run(["log", `-${n}`, "--format=%H|%at|%s"]).trim().split("\n").filter(Boolean).map((l) => {
      const [hash, at, ...rest] = l.split("|");
      return { hash, at: Number(at) * 1000, sujet: rest.join("|") };
    });
  } catch { return undefined; }
}

// Pour chaque commit récent, la consultation obligatoire a-t-elle eu lieu AVANT lui ?
//
// LIMITE HONNÊTE, déclarée plutôt que cachée : une consultation faite dans une session qui ne
// produit aucun commit reste invisible ici, et un commit groupant plusieurs heures de travail élargit
// la fenêtre au point de rendre le verdict peu discriminant. Le résultat est donc un SIGNAL daté, pas
// une preuve — d'où l'avertissement de fiabilité en tête du rapport.
export const ORIGINES_DE_JUGEMENT = ["spontane", "demande"];
export const ORIGINE_NON_CONCLUANTE = "cli_direct";

// GARDE-FOU (Article 24) : ces deux constantes NOMMENT des origines définies ailleurs. Le jour où
// tool-usage.mjs en renomme une, angel doit s'arrêter net plutôt que de compter zéro consultation
// de jugement en silence — un faux vert serait pire que l'erreur qu'il surveille.
export function findOriginesInconnues(origines = USAGE_ORIGINS) {
  return [...ORIGINES_DE_JUGEMENT, ORIGINE_NON_CONCLUANTE].filter((o) => !origines.includes(o));
}

export function checkConsultationOrder({ root = ROOT, evenements, commits, fenetreMinutes = 120, obligations = CONSULTATIONS_OBLIGATOIRES, origines = USAGE_ORIGINS } = {}) {
  const inconnues = findOriginesInconnues(origines);
  if (inconnues.length) return { mesurable: false, raison: `origine(s) disparue(s) du compteur d'usage : ${inconnues.join(", ")} — angel refuse de conclure sur une classification qu'il ne comprend plus` };
  const ev = evenements ?? loadUsageEvents({ root });
  const cm = commits ?? lastCommits({ root });
  if (!ev || !cm) return { mesurable: false, raison: !ev ? "compteur d'usage illisible" : "historique git illisible" };
  const fenetre = fenetreMinutes * 60 * 1000;
  const constats = [];
  const signaux = [];
  for (const c of cm) {
    for (const o of obligations) {
      // TROIS ÉTATS, JAMAIS DEUX (corrigé le 2026-09-22, après DEUX passages ratés du même outil).
      //
      // Premier passage : angel accusait six fois, et les six « consultations tardives » étaient en
      // réalité moi relançant ces outils pour vérifier qu'ils marchaient encore après leur migration.
      // Réponse d'alors : une origine `verification` à écarter. Correcte, mais insuffisante — elle
      // ne réparait que les événements enregistrés APRÈS sa création.
      //
      // Deuxième passage : les six accusations tenaient toujours, portées par des événements
      // `cli_direct`. Et la vraie cause était là, écrite noir sur blanc dans la définition même de
      // cette origine : « le script SAIT qu'il a été lancé via sa propre ligne de commande, mais ne
      // peut jamais savoir POURQUOI ». Un `cli_direct` ne prouve donc AUCUNE consultation — il
      // prouve un lancement. En le lisant comme une consultation, angel commettait exactement la
      // faute que tout ce paysage traque : une mesure ADJACENTE présentée comme la mesure visée.
      //
      // D'où la séparation définitive : seules les origines de JUGEMENT (spontane/demande, les deux
      // que l'agent déclare sciemment) peuvent fonder un manquement nommé. Un `cli_direct` hors
      // d'ordre devient un SIGNAL non concluant — montré, jamais imputé à quelqu'un.
      const meme = (e) => e?.toolSlug === o.slug;
      const jugement = (e) => meme(e) && ORIGINES_DE_JUGEMENT.includes(e?.origin);
      const nonConcluant = (e) => meme(e) && e?.origin === ORIGINE_NON_CONCLUANTE;
      const dansFenetre = (e, sens) => (sens === "avant" ? e.at <= c.at && c.at - e.at <= fenetre : e.at > c.at && e.at - c.at <= fenetre);

      // Seul le cas « consulté APRÈS mais jamais avant » dit quelque chose : il montre que l'outil a
      // servi, mais dans le mauvais ordre. Ne l'avoir jamais lancé du tout peut simplement vouloir
      // dire que ce commit ne le concernait pas — on n'en conclut donc rien.
      const base = { commit: c.hash.slice(0, 7), sujet: c.sujet.slice(0, 60), slug: o.slug, avant: o.avant };
      if (!ev.some((e) => jugement(e) && dansFenetre(e, "avant")) && ev.some((e) => jugement(e) && dansFenetre(e, "apres"))) {
        constats.push(base);
      } else if (!ev.some((e) => (jugement(e) || nonConcluant(e)) && dansFenetre(e, "avant")) && ev.some((e) => nonConcluant(e) && dansFenetre(e, "apres"))) {
        signaux.push({ ...base, pourquoi: `lancement ${ORIGINE_NON_CONCLUANTE} postérieur, qui ne dit pas s'il s'agissait d'une consultation` });
      }
    }
  }
  return { mesurable: true, commitsExamines: cm.length, constats, signaux };
}

// ————————————————————————————————————————————————————————————————————————
// LE VERDICT
// ————————————————————————————————————————————————————————————————————————

// `faits` porte les réponses aux règles non observables. Une règle non fournie n'est jamais réputée
// respectée : elle est comptée à part, et le verdict global refuse d'être vert tant qu'il en reste.
export function auditWorkingRules({ root = ROOT, faits = {}, regles = REGLES_SURVEILLEES, ordre } = {}) {
  const o = ordre ?? checkConsultationOrder({ root });
  const resultats = regles.map((r) => {
    if (r.id === "consultation-avant") {
      if (!o.mesurable) return { ...r, etat: "non mesurable", detail: o.raison };
      return o.constats.length
        ? { ...r, etat: "manquement", detail: o.constats.map((c) => `${c.slug} consulté APRÈS le commit ${c.commit} (« ${c.sujet} ») alors qu'il doit l'être avant ${c.avant}`).join(" ; ") }
        : { ...r, etat: "respecté", detail: `${o.commitsExamines} commit(s) examiné(s), aucun cas de consultation après coup` };
    }
    const fourni = faits[r.id];
    if (fourni === undefined) return { ...r, etat: r.observable ? "non fourni" : "non fourni", detail: "à confirmer — angel ne devine jamais ce qu'il ne peut pas observer" };
    return { ...r, etat: fourni ? "respecté" : "manquement", detail: typeof fourni === "string" ? fourni : undefined };
  });
  const manquements = resultats.filter((r) => r.etat === "manquement");
  const nonFournis = resultats.filter((r) => r.etat === "non fourni");
  return {
    resultats,
    manquements,
    nonFournis,
    // Vert seulement si tout est réellement vérifié : un verdict vert obtenu en laissant la moitié
    // des règles « non fournies » serait un faux vert, exactement ce que ce paysage combat.
    ok: manquements.length === 0 && nonFournis.length === 0,
  };
}

// Livré PAR god-of-all-process, dans une section clairement à part (décision de l'utilisateur,
// 2026-09-22) : une seule voix à la Ronde, mais la conduite de l'agent ne se mélange jamais aux
// étapes de process sautées — deux natures différentes dans un même rapport.
export function angelSectionLines(audit, ordre) {
  const l = ["— Discipline d'exécution (angel-of-ia-process) —"];
  l.push(audit.ok ? "✅ Toutes les règles surveillées sont respectées et vérifiées." : `${audit.manquements.length} manquement(s), ${audit.nonFournis.length} règle(s) non vérifiable(s) sans réponse.`);
  for (const m of audit.manquements) l.push(`  ✗ [${m.cote}] ${m.regle}\n      ${m.detail ?? ""}\n      source : ${m.source}`);
  for (const n of audit.nonFournis) l.push(`  ? [${n.cote}] ${n.regle} — ${n.detail}`);
  // Les signaux non concluants ne sont JAMAIS mêlés aux manquements : ils sont montrés pour qu'on
  // puisse les regarder, sans désigner personne. Un outil qui désigne un coupable sur une mesure
  // qui ne prouve rien perd le droit d'être cru le jour où il en tient une vraie.
  if (ordre?.signaux?.length) {
    l.push(`  ~ ${ordre.signaux.length} signal(aux) non concluant(s) — montrés, jamais imputés :`);
    for (const g of ordre.signaux) l.push(`      ${g.slug} / commit ${g.commit} (« ${g.sujet} ») : ${g.pourquoi}`);
  }
  return l;
}

function main() {
  printReportHeader({
    tool: "angel-of-ia-process",
    title: "angel-of-ia-process — discipline d'exécution des règles de travail",
    subtitle: "Surveille la CONDUITE (agent et utilisateur), jamais le déroulé d'une activité — ça, c'est god-of-all-process.",
    scriptPath: "scripts/angel-of-ia-process.mjs",
  });
  // Un seul croisement, réutilisé par les deux sorties : le recalculer donnerait deux mesures
  // faites à deux instants différents dans le même rapport, exactement le genre d'incohérence
  // silencieuse que cet outil est censé débusquer ailleurs.
  const o = checkConsultationOrder();
  const audit = auditWorkingRules({ ordre: o });
  console.log(angelSectionLines(audit, o).join("\n"));
  if (o.mesurable) {
    console.log(`\nCroisement des horodatages : ${o.commitsExamines} commit(s) examiné(s), ${o.constats.length} consultation(s) de jugement faite(s) après coup, ${o.signaux.length} signal(aux) non concluant(s).`);
    console.log("Limite honnête : une consultation dans une session sans commit reste invisible, et un commit groupant plusieurs heures élargit la fenêtre — c'est un signal daté, jamais une preuve.");
    console.log(`Deux origines sont écartées du verdict : « verification » (relancer un outil pour voir s'il marche encore n'est pas le consulter) et « ${ORIGINE_NON_CONCLUANTE} » (le compteur sait qu'un outil a été lancé, jamais pourquoi — insuffisant pour nommer un manquement).`);
  } else {
    console.log(`\nCroisement des horodatages impossible : ${o.raison}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
