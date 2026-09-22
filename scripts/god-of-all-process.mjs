// GOD-OF-ALL-PROCESS (2026-09-22, demande explicite de l'utilisateur : « je veux un outil qui
// centralise les process : quel est l'interet d'un tel script : trouve comment l'amleiorer »).
//
// CE QU'IL EST, tranché avec l'utilisateur le jour même : **le tool-brain des process**. Avant de
// commencer un gros travail, une seule question — « qu'est-ce qui gouverne ça ? » — et il répond
// quel process s'applique, à quelle étape on en est, et ce qui a été sauté. Même réflexe unique que
// tool-brain pour les outils : jamais un choix recomposé à la main entre trois documents.
//
// POURQUOI IL EXISTE, et ce n'est pas théorique — les quatre risques sont tous déjà arrivés :
//   1. Un process écrit quelque part que plus personne ne surveille. La règle « la phase 2 d'une
//      simulation doit contenir de vrais tours autonomes » a été perdue entre full_sim16 et
//      full_sim18 parce qu'elle ne vivait que dans une conclusion de tâche.
//   2. Un gardien qui existe mais qu'on ne lance jamais — exactement ce qui est arrivé à Doc-Report,
//      qui se comptait lui-même comme « jamais sollicité ».
//   3. Deux process qui se contredisent (le nocturne dit « pousse au fil de l'eau », le protocole de
//      simulation dit « demande avant toute action coûteuse »).
//   4. Une étape oubliée parce qu'on se croit arrivé — l'archivage après une simulation.
//
// AUTORITÉ, tranchée le même jour : **il signale, l'utilisateur décide.** Jamais de correction
// automatique, jamais de commit bloqué — même règle que tout le reste de ce paysage.
//
// AVANCEMENT : il ne tient AUCUN compteur. Il déduit ce qui a eu lieu des traces réelles laissées
// sur le disque (le transcript est-il archivé ? la note existe-t-elle ?). Un compteur se
// désynchronise et devient à son tour un mensonge à surveiller ; une trace, non. Limite honnête, et
// elle est dite : il ne voit que les étapes qui laissent un fichier derrière elles, et le déclare
// pour chaque étape qui n'en laisse pas, plutôt que de la compter faite ou non faite au hasard.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { readAgentSession, SESSION_FILE } from "./report-template.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LE REGISTRE DES PROCESS. Chaque entrée déclare où le process est ÉCRIT, qui le SURVEILLE, et
// quelles traces réelles prouvent qu'une étape a eu lieu. Les chemins sont vérifiés à l'exécution
// (findProcessesWithoutGuardian/findProcessDocsMissing ci-dessous) : une entrée qui pointe vers un
// fichier disparu se voit, jamais une promesse tenue à la main (Article 24).
export const PROCESSES = [
  {
    slug: "ronde",
    nom: "Ronde périodique (CIRCLE-TASKS)",
    quand: "les tâches gratuites périodiques qu'on oublie facilement",
    motsCles: ["ronde", "circle", "périodique", "tâches gratuites", "hebdo"],
    doc: "docs/circle-process-detail.txt",
    gardien: "scripts/circle-process-guardian.mjs",
    etapes: [
      { cle: "questionnaire", libelle: "poser la fenêtre à cocher (AUTO/PRIME/GOAT)", preuve: null },
      { cle: "execution", libelle: "exécuter les items cochés", preuve: { dossier: "docs/", motif: /circle-signal-/, recursif: true } },
      { cle: "rapport", libelle: "produire le rapport de fin de Ronde", preuve: { fichier: ".circle-tasks-run-summary-latest.txt" } },
      { cle: "enregistrement", libelle: "enregistrer la Ronde comme faite", preuve: { fichier: ".circle-tasks-last-run.json" } },
    ],
  },
  {
    slug: "simulation",
    nom: "Simulation intégrale (Article 18)",
    quand: "lancer une simulation complète de bout en bout et l'analyser",
    motsCles: ["simulation", "simu", "full_sim", "article 18", "transcript", "dossier retourné"],
    doc: "docs/regles-de-travail.md",
    gardien: "scripts/process-simulation-guardian.mjs",
    etapes: [
      { cle: "conso", libelle: "consulter Smart Conso API avant de brûler du quota", preuve: { dossier: "docs/smart-conso-api/", motif: /\.md$|\.txt$/ } },
      { cle: "lancement", libelle: "lancer contre un serveur à jour", preuve: null },
      { cle: "livraison", libelle: "livrer le transcript en fichier joint", preuve: null },
      { cle: "archivage", libelle: "archiver transcript + dossier + résumé d'actions", preuve: { dossier: "docs/simulations/", motif: /_transcript\.txt$/ } },
      { cle: "note", libelle: "noter la fidélité à la charte (EL-PROFESSOR)", preuve: { dossier: "docs/el-professor/", motif: /^full_sim\d+\.md$/ } },
      { cle: "index", libelle: "écrire les deux lignes de jugement (simulations + KPI)", preuve: { fichier: "docs/simulations/index.md" } },
      { cle: "calibrage", libelle: "poser les questions de calibrage avant toute correction", preuve: null },
    ],
  },
  {
    slug: "nuit",
    nom: "mode-auto-process-guardian — travail autonome (mode nocturne)",
    quand: "travailler seul pendant l'absence de l'utilisateur",
    motsCles: ["autonome", "nuit", "nocturne", "pendant que je dors", "seul"],
    doc: "docs/mode-auto-process-guardian.md",
    gardien: "scripts/god-of-all-process.mjs",
    etapes: [
      { cle: "identite", libelle: "déposer l'identité de session (version de Claude)", preuve: { fichier: SESSION_FILE } },
      { cle: "plan", libelle: "reprendre le plan donné, sans en sauter une étape", preuve: null },
      { cle: "sensible", libelle: "mettre de côté tout ce qui touche au périmètre sensible", preuve: null },
      { cle: "suivi", libelle: "documenter chaque tâche substantielle dans le suivi", preuve: { dossier: "docs/suivi/sessions/", motif: /\.md$/ } },
      { cle: "rapport", libelle: "livrer le rapport de nuit en fichier texte", preuve: { dossier: "docs/rapports-de-nuit/", motif: /\.txt$/ } },
    ],
  },
  {
    // LE PROCESS MAÎTRE (2026-09-22, question de l'utilisateur : « the god of process a-t-il son
    // propre process, et verifie-t-il son propre process ? »). La réponse était NON, et c'était le
    // seul point aveugle du dispositif : l'outil qui reproche aux autres de ne pas avoir de gardien
    // n'en avait aucun lui-même. Un surveillant qu'aucune règle ne surveille finit par dériver sans
    // que rien ne le dise — exactement le motif que tout ce paysage combat, appliqué cette fois à
    // son sommet. Il se surveille donc lui-même, et `selfCheck()` plus bas rend cette
    // auto-surveillance réellement vérifiable plutôt que simplement déclarée ici.
    slug: "meta",
    nom: "Tenue du dispositif de process lui-même (process maître)",
    quand: "ajouter, retirer ou modifier un process, un gardien de process, ou god-of-all-process",
    motsCles: ["process", "gardien de process", "god-of-all-process", "dispositif"],
    doc: "docs/mode-auto-process-guardian.md",
    gardien: "scripts/god-of-all-process.mjs",
    etapes: [
      { cle: "registre", libelle: "le process est déclaré dans PROCESSES avec son document et son gardien", preuve: { fichier: "scripts/god-of-all-process.mjs" } },
      { cle: "document", libelle: "le process est écrit quelque part, pas seulement codé", preuve: null },
      { cle: "sondes", libelle: "chaque étape déclare une preuve réelle, ou déclare honnêtement n'en avoir aucune", preuve: null },
      { cle: "tensions", libelle: "toute tension avec un process voisin est déclarée ET résolue", preuve: null },
      { cle: "identite", libelle: "l'identité de session est déposée, sinon chaque rapport porte un trou", preuve: { fichier: SESSION_FILE } },
    ],
  },
];

// ————————————————————————————————————————————————————————————————————————
// LE RÉFLEXE : quel process gouverne ce que je m'apprête à faire ?
// ————————————————————————————————————————————————————————————————————————

// Même mécanique honnête que tool-brain : une correspondance par mots-clés, jamais une
// compréhension. Elle peut passer à côté — d'où l'avertissement de fiabilité en tête du rapport.
export function whichProcess(tache, { processes = PROCESSES } = {}) {
  const t = String(tache ?? "").toLowerCase();
  if (!t.trim()) return [];
  return processes
    .map((p) => ({ process: p, score: p.motsCles.filter((m) => t.includes(m)).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.process);
}

// ————————————————————————————————————————————————————————————————————————
// L'AVANCEMENT : déduit des traces, jamais compté
// ————————————————————————————————————————————————————————————————————————

// Une étape a-t-elle laissé sa trace ? Trois réponses possibles, jamais deux : oui, non, et
// « cette étape ne laisse aucune trace vérifiable » — cette troisième n'est pas un échec, c'est une
// limite déclarée. La confondre avec « non faite » produirait exactement le faux constat que ce
// paysage d'outils passe son temps à corriger.
function contient(chemin, motif, recursif, profondeur = 0) {
  for (const e of readdirSync(chemin, { withFileTypes: true })) {
    if (e.isFile() && motif.test(e.name)) return true;
    if (recursif && e.isDirectory() && profondeur < 3 && contient(join(chemin, e.name), motif, recursif, profondeur + 1)) return true;
  }
  return false;
}

export function etapeTrace(etape, { root = ROOT } = {}) {
  if (!etape.preuve) return { verifiable: false };
  const { fichier, dossier, motif, recursif } = etape.preuve;
  try {
    if (fichier) return { verifiable: true, presente: existsSync(join(root, fichier)) };
    if (dossier) {
      const chemin = join(root, dossier);
      // UNE SONDE QUI POINTE VERS RIEN N'EST PAS UNE ÉTAPE MANQUANTE (2026-09-22, trouvé au premier
      // lancement réel de cet outil : trois de mes propres sondes visaient des chemins inexistants
      // et annonçaient tranquillement des étapes « manquantes » qui avaient parfaitement eu lieu).
      // Confondre les deux, c'est encore lire une absence de mesure comme une mesure — l'erreur que
      // cet outil est précisément censé empêcher. Une sonde cassée le dit, et findBrokenProbes()
      // ci-dessous la fait remonter en tant que défaut de l'outil, jamais du travail surveillé.
      if (!existsSync(chemin)) return { verifiable: false, sondeCassee: `le dossier ${dossier} n'existe pas` };
      return { verifiable: true, presente: contient(chemin, motif ?? /./, recursif === true) };
    }
  } catch {
    return { verifiable: false };
  }
  return { verifiable: false };
}

// Toutes les sondes qui ne pointent nulle part, tous process confondus. C'est un défaut de l'outil,
// à corriger dans l'outil — jamais un reproche adressé au travail qu'il surveille.
export function findBrokenProbes({ processes = PROCESSES, root = ROOT } = {}) {
  return processes.flatMap((p) => p.etapes.map((e) => ({ p, e, t: etapeTrace(e, { root }) }))
    .filter((x) => x.t.sondeCassee)
    .map((x) => `${x.p.nom} / « ${x.e.libelle} » : ${x.t.sondeCassee}`));
}

export function processProgress(slug, { processes = PROCESSES, root = ROOT } = {}) {
  const p = processes.find((x) => x.slug === slug);
  if (!p) return undefined;
  const etapes = p.etapes.map((e) => ({ ...e, ...etapeTrace(e, { root }) }));
  const verifiables = etapes.filter((e) => e.verifiable);
  return {
    slug: p.slug,
    nom: p.nom,
    etapes,
    verifiables: verifiables.length,
    presentes: verifiables.filter((e) => e.presente).length,
    // Les étapes sans trace ne sont JAMAIS comptées comme faites ni comme manquantes — elles sont
    // nommées à part, pour que le lecteur sache exactement ce que ce chiffre ne couvre pas.
    sansTrace: etapes.filter((e) => !e.verifiable && !e.sondeCassee).map((e) => e.libelle),
    sondesCassees: etapes.filter((e) => e.sondeCassee).map((e) => `${e.libelle} (${e.sondeCassee})`),
    manquantes: verifiables.filter((e) => !e.presente).map((e) => e.libelle),
  };
}

// ————————————————————————————————————————————————————————————————————————
// LA SURVEILLANCE DU DISPOSITIF (Article 24)
// ————————————————————————————————————————————————————————————————————————

export function findProcessesWithoutGuardian({ processes = PROCESSES, root = ROOT } = {}) {
  return processes.filter((p) => !p.gardien || !existsSync(join(root, p.gardien))).map((p) => p.nom);
}

export function findProcessDocsMissing({ processes = PROCESSES, root = ROOT } = {}) {
  return processes.filter((p) => !p.doc || !existsSync(join(root, p.doc))).map((p) => `${p.nom} → ${p.doc ?? "aucun document déclaré"}`);
}

// LE POINT EXPLICITEMENT DEMANDÉ PAR L'UTILISATEUR (2026-09-22) : « c'est typiquement le travail du
// gardien de process que de veiller à ce que ce ne soit jamais le cas : grace aux process, tu
// n'oublies jamais rien ». Sans identité de session déposée, chaque rapport produit porte
// « Version de Claude : non renseignée » — honnête, mais c'est un trou qu'on ne devrait jamais voir.
export function checkAgentSessionDeclared({ session } = {}) {
  const s = session ?? readAgentSession();
  if (!s.model) {
    return { ok: false, message: `Identité de session absente : chaque rapport produit maintenant portera « Version de Claude : non renseignée ». À déposer une fois en début de session (recordAgentSession, ${SESSION_FILE}).` };
  }
  return { ok: true, message: `Identité de session déposée : ${s.model}${s.recordedAt ? ` (le ${s.recordedAt.slice(0, 10)})` : ""}.` };
}

// Deux process peuvent se contredire sans qu'aucun test ne le voie. Les tensions connues sont
// déclarées ici À LA MAIN — nature volontairement manuelle, écrite noir sur blanc comme l'Article 24
// l'exige pour ce cas : une contradiction entre deux textes ne se détecte pas mécaniquement, elle
// se constate en les lisant. Ce que le code garantit, lui, c'est que chaque tension déclarée porte
// bien sur deux process qui existent encore.
export const TENSIONS_CONNUES = [
  {
    entre: ["nuit", "simulation"],
    tension: "Le mode nocturne autorise à consommer de l'API sans validation ; le protocole de simulation exige une consultation préalable de Smart Conso API.",
    resolution: "Les deux tiennent ensemble : l'autorisation nocturne porte sur le fait de consommer, jamais sur le fait de sauter la consultation. Tranché par l'utilisateur le 2026-09-22 (« tu es quand meme autorisé à consommer des api, tout en respectant les conseils de smart conso api »).",
  },
  {
    entre: ["nuit", "ronde"],
    tension: "La Ronde exige une vraie fenêtre à cocher posée à l'utilisateur ; le mode nocturne se déroule en son absence.",
    resolution: "Une Ronde lancée en nuit autonome est explicitement dispensée de cette fenêtre — exemption déjà codée dans le gardien de la Ronde, jamais une entorse improvisée.",
  },
];

export function findTensionsOnUnknownProcess({ tensions = TENSIONS_CONNUES, processes = PROCESSES } = {}) {
  const connus = new Set(processes.map((p) => p.slug));
  return tensions.flatMap((t) => t.entre.filter((s) => !connus.has(s)).map((s) => `${s} (cité dans une tension déclarée, mais n'est plus un process connu)`));
}

// L'AUTO-SURVEILLANCE, exécutable plutôt que promise. Un surveillant qui se contente de déclarer
// qu'il se surveille ne se surveille pas : ces cinq contrôles portent sur SON propre état, et
// tombent au rouge si le dispositif dérive — y compris s'il dérive par sa faute à lui.
export function selfCheck({ processes = PROCESSES, root = ROOT, tensions = TENSIONS_CONNUES } = {}) {
  const constats = [];
  const meta = processes.find((p) => p.slug === "meta");
  if (!meta) constats.push("god-of-all-process ne se surveille plus lui-même : le process maître a disparu de PROCESSES.");
  if (meta && meta.gardien !== "scripts/god-of-all-process.mjs") constats.push("le process maître a été confié à un autre gardien que god-of-all-process lui-même.");
  for (const m of findProcessesWithoutGuardian({ processes, root })) constats.push(`process sans gardien réel : ${m}`);
  for (const m of findProcessDocsMissing({ processes, root })) constats.push(`process sans document réel : ${m}`);
  for (const m of findBrokenProbes({ processes, root })) constats.push(`sonde cassée : ${m}`);
  for (const m of findTensionsOnUnknownProcess({ tensions, processes })) constats.push(`tension orpheline : ${m}`);
  // Une étape sans preuve est légitime ; une étape qui n'en déclare aucune ET dont personne ne dit
  // qu'elle est invérifiable serait un trou muet. Ici les deux sont le même champ (`preuve: null`),
  // donc rien à vérifier de plus — dit explicitement pour qu'un futur lecteur ne cherche pas en vain.
  const sansGardienDeSoi = !processes.some((p) => p.gardien === "scripts/god-of-all-process.mjs" && p.slug === "meta");
  return { ok: constats.length === 0 && !sansGardienDeSoi, constats };
}

// ————————————————————————————————————————————————————————————————————————
// QUELS SCRIPTS MÉRITERAIENT UN PROCESS ET N'EN ONT PAS
// ————————————————————————————————————————————————————————————————————————

// (2026-09-22, demande de l'utilisateur : « god of process devrait etre l'outil qui scanne si un
// script qui le merite n'a pas de process ».) Le critère, calibré le même jour : un outil MÉRITE un
// process quand son usage suit vraiment une suite d'étapes qu'on peut sauter — lancer une
// simulation, tenir une Ronde. Un outil qu'on lance d'une commande et qui répond (chercher dans un
// fichier, compter des tokens) n'a rien à déclarer, et ne doit jamais être puni pour ça.
//
// Ce que le code peut voir honnêtement : un script qui possède plusieurs SOUS-COMMANDES enchaînables
// ou qui ÉCRIT un artefact durable a, presque toujours, une suite d'étapes autour de lui. C'est un
// indice, jamais une preuve — d'où le mot « mériterait », et d'où le fait que rien ne se déclenche
// tout seul : c'est une liste à regarder, pas un reproche.
const INDICES_MERITE_PROCESS = [
  { marqueur: /process\.argv\[2\]/, indice: "plusieurs sous-commandes — donc un ordre dans lequel on les lance" },
  { marqueur: /writeFileSync\(/, indice: "écrit un artefact durable — donc un avant et un après" },
  { marqueur: /--confirm|--force|override/, indice: "prévoit un passage en force — donc une règle à respecter" },
];

export function findScriptsDeservingProcess({ processes = PROCESSES, root = ROOT, scripts, readFileImpl = readFileSync } = {}) {
  const gardiens = new Set(processes.map((p) => p.gardien));
  const liste = scripts ?? (() => { try { return readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => `scripts/${f}`); } catch { return []; } })();
  const trouves = [];
  for (const chemin of liste) {
    if (gardiens.has(chemin)) continue; // un gardien de process n'a pas à en déclarer un de plus
    let src;
    try { src = readFileImpl(join(root, chemin), "utf8"); } catch { continue; }
    const indices = INDICES_MERITE_PROCESS.filter((i) => i.marqueur.test(src)).map((i) => i.indice);
    // Deux indices au moins : un seul est trop courant pour vouloir dire quelque chose.
    if (indices.length >= 2) trouves.push({ chemin, indices });
  }
  return trouves;
}

// ————————————————————————————————————————————————————————————————————————
// LE RAPPORT DE RONDE — centralisé ici, et ici seulement
// ————————————————————————————————————————————————————————————————————————

// ARCHITECTURE FIXÉE PAR L'UTILISATEUR (2026-09-22) : « pour les process, c'est god of process qui
// produit le rapport uniquement [...] Les rapports de process secondaires ne produisent pas de
// rapport directement livrés à la ronde : ce serait trop : god of process centralise. » Les gardiens
// secondaires (la Ronde, la simulation) gardent donc leur propre verdict, mais c'est god qui les lit
// et qui livre LE rapport de process. Une seule voix à la Ronde, pas une par gardien.
//
// LE COUPABLE EST NOMMÉ, sans détour — demande explicite du même jour (« il designe le coupable »).
// Dans les faits c'est presque toujours l'agent qui a sauté une étape, et le dire est le seul moyen
// que ça change : c'est précisément ce qui manquait quand la règle des tours autonomes s'est perdue
// entre deux simulations sans que personne ne soit responsable de rien.
export const RESPONSABLES = {
  agent: "l'agent (moi) — étape prévue par le process et simplement pas faite",
  outil: "un outil — il devait produire quelque chose et ne l'a pas fait",
  personne: "personne — aucun mécanisme ne peut vérifier cette étape, elle repose sur la seule discipline",
};

export function buildProcessComplianceReport({ processes = PROCESSES, root = ROOT, verdictsSecondaires = [] } = {}) {
  const lignes = [];
  const manquements = [];
  for (const p of processes) {
    const av = processProgress(p.slug, { processes, root });
    for (const libelle of av.manquantes) manquements.push({ process: p.nom, etape: libelle, responsable: "agent" });
    for (const libelle of av.sansTrace) manquements.push({ process: p.nom, etape: libelle, responsable: "personne" });
  }
  // Les verdicts des gardiens secondaires sont RELAYÉS, jamais recalculés : chacun sait juger son
  // domaine mieux que god ne le ferait, et un second calcul divergerait tôt ou tard.
  for (const v of verdictsSecondaires) {
    if (v?.ok === false) manquements.push({ process: v.process ?? "process secondaire", etape: v.detail ?? "verdict négatif de son gardien", responsable: v.responsable ?? "outil", relaye: v.gardien });
  }
  const fautes = manquements.filter((m) => m.responsable !== "personne");
  lignes.push(fautes.length ? `⚠️ ${fautes.length} manquement(s) réel(s) au process :` : "✅ Aucun manquement réel au process sur ce qui est vérifiable.");
  for (const m of fautes) lignes.push(`  · ${m.process} — « ${m.etape} »\n      responsable : ${RESPONSABLES[m.responsable] ?? m.responsable}${m.relaye ? ` (relayé par ${m.relaye}, jamais recalculé ici)` : ""}`);
  const nonVerifiables = manquements.filter((m) => m.responsable === "personne");
  if (nonVerifiables.length) {
    lignes.push("", `${nonVerifiables.length} étape(s) que rien ne peut vérifier — ni reprochées à personne, ni comptées comme faites :`);
    for (const m of nonVerifiables) lignes.push(`  · ${m.process} — « ${m.etape} »`);
  }
  const merite = findScriptsDeservingProcess({ processes, root });
  if (merite.length) {
    lignes.push("", `${merite.length} script(s) qui mériteraient peut-être un process et n'en ont aucun (indice, jamais un reproche) :`);
    for (const m of merite) lignes.push(`  · ${m.chemin} — ${m.indices.join(" ; ")}`);
  }
  return { lignes, manquements, fautes: fautes.length, scriptsSansProcess: merite.length, texte: lignes.join("\n") };
}

// ————————————————————————————————————————————————————————————————————————
// LE RAPPORT
// ————————————————————————————————————————————————————————————————————————

export function buildGodReportBlocks({ processes = PROCESSES, root = ROOT, session } = {}) {
  const blocks = [];
  const auto = selfCheck({ processes, root });
  blocks.push({ type: "note", text: auto.ok ? "✅ Process maître : god-of-all-process se surveille bien lui-même, et le dispositif est cohérent." : `⚠️ Process maître — ${auto.constats.length} constat(s) sur le dispositif lui-même :\n  ${auto.constats.join("\n  ")}` });
  const identite = checkAgentSessionDeclared({ session });
  blocks.push({ type: "note", text: `${identite.ok ? "✅" : "⚠️"} ${identite.message}` });

  const lignes = processes.map((p) => {
    const av = processProgress(p.slug, { processes, root });
    return `· ${p.nom} — ${av.presentes}/${av.verifiables} étape(s) vérifiable(s) tracée(s)${av.manquantes.length ? ` — manque : ${av.manquantes.join(" ; ")}` : ""}${av.sansTrace.length ? ` — ${av.sansTrace.length} étape(s) sans trace vérifiable, jamais comptée(s) ni dans un sens ni dans l'autre` : ""}`;
  });
  blocks.push({ type: "note", text: `Process suivis (${processes.length}) :\n${lignes.join("\n")}` });

  const sansGardien = findProcessesWithoutGuardian({ processes, root });
  const docsAbsents = findProcessDocsMissing({ processes, root });
  const tensionsOrphelines = findTensionsOnUnknownProcess({ processes });
  for (const [titre, liste] of [
    ["Process sans gardien", sansGardien],
    ["Process dont le document déclaré n'existe pas", docsAbsents],
    ["Tensions déclarées sur un process disparu", tensionsOrphelines],
    ["Sondes cassées (défaut de CET outil, jamais du travail surveillé)", findBrokenProbes({ processes, root })],
  ]) {
    blocks.push({ type: "note", text: liste.length ? `⚠️ ${titre} (${liste.length}) :\n  ${liste.join("\n  ")}` : `✅ ${titre} : aucun.` });
  }

  blocks.push({ type: "note", text: `Tensions connues entre process (${TENSIONS_CONNUES.length}), déclarées à la main et résolues :\n${TENSIONS_CONNUES.map((t) => `· ${t.entre.join(" ↔ ")} — ${t.tension}\n  → ${t.resolution}`).join("\n")}` });
  return blocks;
}

function main() {
  printReliabilityNotice("god-of-all-process");
  recordCliUsage("god-of-all-process");
  const tache = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ");
  if (tache) {
    const trouves = whichProcess(tache);
    console.log(`=== god-of-all-process — pour : "${tache}" ===\n`);
    if (!trouves.length) {
      console.log("Aucun process connu ne gouverne cette tâche — ce qui ne prouve pas qu'il n'en faut pas un, seulement qu'aucun n'est écrit.");
      return;
    }
    for (const p of trouves) {
      const av = processProgress(p.slug);
      console.log(`${p.nom}\n  écrit dans : ${p.doc}\n  surveillé par : ${p.gardien}\n  étapes :`);
      for (const e of av.etapes) {
        const etat = !e.verifiable ? "  (aucune trace vérifiable — à confirmer soi-même)" : e.presente ? "✔" : "✗";
        console.log(`    ${etat} ${e.libelle}`);
      }
      console.log("");
    }
    return;
  }
  console.log("=== god-of-all-process — état du dispositif ===\n");
  for (const b of buildGodReportBlocks()) console.log(b.text, "\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
