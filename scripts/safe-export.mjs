// SAFE-EXPORT (2026-09-22, nom donné par l'utilisateur) — le scan d'exportabilité et de
// lisibilité-par-une-autre-IA. Septième Gardien sacré du code, par sa COUCHE LÉGÈRE seulement.
//
// SA VOCATION, dans ses mots : « pointer les zones qui pourraient creer de la confusion, conduire
// une IA a mal interpreter » — et répondre à deux questions distinctes : est-ce que l'Agence est
// exportable ? est-ce que le code est bien construit pour qu'une autre IA s'y retrouve ?
//
// POURQUOI SEULEMENT SA COUCHE LÉGÈRE EST GARDIEN SACRÉ, et c'est le précédent exact
// d'ALWAYS-NEW-CODE : le critère d'appartenance est DOUBLE — délivrer un vrai scan de qualité ET
// tourner gratuitement, mécaniquement, à chaque commit. Le vrai jugement « est-ce qu'une autre IA
// s'y retrouve » demande du raisonnement payant ; les INDICES de ce jugement, eux, sont mécaniques
// et gratuits. Ce sont eux qui tournent à chaque commit.
//
// IL AVERTIT, IL PROPOSE, IL NE BLOQUE JAMAIS (calibrage explicite). Un gardien qui bloque sur un
// sujet sans rapport avec le travail en cours pousse à désactiver le crochet — et on perd tout.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { printReliabilityNotice } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { buildPoint, recordPoint, loadSerie, detectTendance, SENS } from "./serie-temporelle.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES DEUX CIBLES — « l'outil qui gere le scan d'exportabilité peut le faire pour deux choses :
// l'agence et/ou le projet ». Ce ne sont pas deux périmètres de fichiers, ce sont deux QUESTIONS
// différentes, et les confondre donnerait un verdict inutilisable : l'Agence doit être exportable
// vers un AUTRE projet (donc rien de propre à cette maison ne doit y fuir), le projet doit être
// reprenable par une AUTRE IA (donc tout doit y être compréhensible sans contexte). Un fichier peut
// très bien être parfaitement reprenable et totalement non exportable.
export const CIBLES = {
  agence: { question: "l'outillage de travail est-il exportable vers un autre projet ?", chercheFuites: true },
  projet: { question: "une autre IA reprendrait-elle ce code sans le casser ?", chercheFuites: false },
};

// LES NIVEAUX — « il a differents niveaux de performance d'execution, comme on a vu ». Même échelle
// d'esprit que CHECK-LEVEL-TARGET : ce qui distingue les niveaux n'est pas la profondeur du
// raisonnement (le gratuit n'en fait aucun), c'est l'ÉTENDUE de ce qui est lu.
export const NIVEAUX = {
  leger: { cout: "gratuit", portee: "les fichiers touchés par les derniers commits", raisonnement: false },
  moyen: { cout: "gratuit", portee: "une zone entière", raisonnement: false },
  profond: { cout: "payant", portee: "une zone, avec un vrai jugement de lisibilité", raisonnement: true },
};

// LA DÉCLARATION — son choix, et c'est le plus solide des trois proposés : le fichier annonce
// lui-même s'il est générique. L'outil ne devine rien, il lit une intention écrite.
//
// LA PROPRIÉTÉ QUI REND CE CHOIX AUTO-RENFORÇANT : un blueprint qui OUBLIE de se déclarer est
// lui-même un écart signalé. La règle se répare donc toute seule au lieu de se périmer — et c'est
// exactement ce que l'Article 24 demande d'une construction évolutive.
// La formule réelle du dépôt est « blueprint exportable », lue dans les fichiers plutôt que
// supposée — mon premier marqueur cherchait « blueprint générique » et déclarait 21 blueprints
// sur 26 en défaut. Le chiffre lui-même était l'alerte : quand un détecteur accuse presque tout,
// c'est presque toujours lui qui a tort, et vérifier avant de rapporter a coûté deux minutes
// contre un rapport entièrement faux.
export const MARQUEUR_GENERIQUE = /blueprint exportable|blueprint générique|générique réutilisable|réutilisable tel quel|gabarit générique/i;
export const MARQUEUR_SPECIFIQUE = /instanciation|propre à ce projet|spécifique à ce/i;

export function declarationDuFichier(texte = "") {
  const entete = texte.slice(0, 2000);
  if (MARQUEUR_GENERIQUE.test(entete)) return "générique";
  if (MARQUEUR_SPECIFIQUE.test(entete)) return "spécifique";
  return "non déclarée";
}

// ————————————————————————————————————————————————————————————————————————
// LES QUATRE DÉTECTEURS — les quatre priorités qu'il a retenues, toutes les quatre
// ————————————————————————————————————————————————————————————————————————

// 1. CE QUI NE S'EXPORTE PAS. Le défaut qu'il a lui-même attrapé sur EVAL-DH : des initiales dans
// un livrable d'une agence conçue pour être exportée. On ne cherche QUE dans les fichiers déclarés
// génériques — « Lia » dans une fiche spécifique est parfaitement normal, et le signaler noierait
// les vrais cas.
export const MARQUES_DE_CE_PROJET = /\bLia\b|\bNoé\b|la maison|l'enquête|Gemini|aihouse/;
export function findFuitesDeSpecificite(fichiers = [], { readFileImpl = readFileSync, root = ROOT } = {}) {
  const fuites = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    if (declarationDuFichier(texte) !== "générique") continue;
    const lignes = texte.split("\n");
    const touchees = lignes
      .map((l, i) => ({ ligne: i + 1, texte: l, m: l.match(MARQUES_DE_CE_PROJET) }))
      .filter((x) => x.m);
    if (touchees.length) fuites.push({ fichier: f, occurrences: touchees.length, exemple: touchees[0].texte.trim().slice(0, 100), ligne: touchees[0].ligne });
  }
  return fuites;
}

// 2. CE QUI PEUT ÊTRE MAL COMPRIS — un nom propre employé sans être défini nulle part. C'est la
// dette de reprise que l'Article 27 nomme explicitement : « un nom propre sans définition
// atteignable est une dette de reprise, au même titre qu'un chemin cassé ».
export function findTermesNonDefinis(termesEmployes = [], { root = ROOT, exists = existsSync } = {}) {
  return termesEmployes
    .filter((t) => {
      const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      // Un terme est « défini » s'il a une fiche, un blueprint ou un registre — les trois endroits
      // où ce projet définit ses noms propres. Chercher ailleurs serait deviner.
      return !exists(join(root, `docs/referentiel/${slug}.md`))
        && !exists(join(root, `docs/${slug}-blueprint.md`))
        && !exists(join(root, `docs/${slug}/index.md`));
    })
    .map((t) => ({ terme: t, pourquoi: "employé sans définition atteignable — une autre IA devra deviner, et devinera mal" }));
}

// 3. CE QUI N'A PAS DE RAISON ÉCRITE. Le plus subtil des quatre, et le plus coûteux quand il
// manque : un mécanisme qui paraît redondant ou trop prudent se fait supprimer par le prochain
// agent qui croit nettoyer — réintroduisant un bug déjà corrigé une fois (Article 19 pris par
// l'autre bout, Article 27).
//
// L'HEURISTIQUE EST DÉCLARÉE FAIBLE : on repère une fonction exportée sans AUCUN commentaire dans
// les lignes qui la précèdent. Ça ne prouve pas l'absence de raison, ça signale une absence
// d'explication — deux choses différentes, et le rapport le dit.
export function findMecanismesSansRaison(code = "", { fichier = "" } = {}) {
  const lignes = code.split("\n");
  const sans = [];
  for (let i = 0; i < lignes.length; i++) {
    const m = lignes[i].match(/^export (?:async )?function (\w+)/);
    if (!m) continue;
    const avant = lignes.slice(Math.max(0, i - 3), i).join("\n");
    if (!/\/\/|\/\*|\*/.test(avant)) sans.push({ fichier, fonction: m[1], ligne: i + 1 });
  }
  return sans;
}

// 4. CE QUI DÉPEND D'UN OUTIL PARTICULIER. L'Article 27 l'interdit explicitement dans ce qui fait
// loi : « une IA qui arrive sans le gestionnaire de tâches de Claude Code, sans ses crochets git ou
// sans ses fenêtres de questions doit pouvoir travailler avec les documents seuls ».
export const DEPENDANCES_OUTILLAGE = /TaskCreate|TaskUpdate|AskUserQuestion|SendUserFile|crochet post-commit|crochet pre-commit|Claude Code/;
export function findDependancesOutillage(fichiers = [], { readFileImpl = readFileSync, root = ROOT } = {}) {
  const trouvees = [];
  for (const f of fichiers) {
    let texte;
    try { texte = readFileImpl(join(root, f), "utf8"); } catch { continue; }
    if (declarationDuFichier(texte) !== "générique") continue;
    const lignes = texte.split("\n").filter((l) => DEPENDANCES_OUTILLAGE.test(l));
    // Une dépendance CITÉE POUR ÊTRE ÉCARTÉE n'en est pas une — le texte qui dit « une IA sans
    // crochet git doit pouvoir travailler » nomme forcément le crochet git. Sans cette distinction,
    // le détecteur signalerait le plus fort des garde-fous d'exportabilité comme un défaut.
    const reelles = lignes.filter((l) => !/sans |jamais |ne dépend|indépendam|plutôt que/i.test(l));
    if (reelles.length) trouvees.push({ fichier: f, occurrences: reelles.length, exemple: reelles[0].trim().slice(0, 100) });
  }
  return trouvees;
}

// ————————————————————————————————————————————————————————————————————————
// LES BLUEPRINTS — « il detecte aussi une absence de blueprint ou un blueprint mal construit »
// ————————————————————————————————————————————————————————————————————————

// Les sections qu'un blueprint doit porter pour être réellement réutilisable. Un blueprint qui
// décrit CE QUE fait l'outil sans dire QUEL PROBLÈME il résout n'est pas exportable : on ne saurait
// pas s'il vaut la peine d'être repris.
export const SECTIONS_ATTENDUES = [
  { cle: "probleme", motif: /problème qu'il résout|le problème|pourquoi il existe|vocation/i, pourquoi: "sans le problème résolu, personne ne saura si cet outil vaut la peine d'être repris" },
  { cle: "garde-fous", motif: /garde-fou|limite honnête|ce qu'il ne|jamais/i, pourquoi: "sans ses limites, l'outil sera cru au-delà de ce qu'il sait faire" },
];

export function findBlueprintsMalConstruits(blueprints = [], { readFileImpl = readFileSync, root = ROOT } = {}) {
  const defauts = [];
  for (const b of blueprints) {
    let texte;
    try { texte = readFileImpl(join(root, b), "utf8"); } catch { continue; }
    const manquantes = SECTIONS_ATTENDUES.filter((s) => !s.motif.test(texte));
    const declaration = declarationDuFichier(texte);
    // Un blueprint qui oublie de se DÉCLARER générique est un écart à part entière : c'est ce qui
    // rend la règle de déclaration auto-renforçante plutôt que périssable.
    if (declaration !== "générique") defauts.push({ fichier: b, defaut: "ne se déclare pas générique", consequence: "aucun détecteur de fuite ne le regardera — il pourra contenir n'importe quoi sans que rien ne le dise" });
    for (const s of manquantes) defauts.push({ fichier: b, defaut: `section « ${s.cle} » absente`, consequence: s.pourquoi });
  }
  return defauts;
}

export function findOutilsSansBlueprint(outils = [], { root = ROOT, exists = existsSync } = {}) {
  return outils.filter((o) => !exists(join(root, `docs/${o}-blueprint.md`))).map((o) => ({ outil: o, pourquoi: "aucun blueprint : cet outil ne partira pas avec l'Agence le jour de l'export" }));
}

// ————————————————————————————————————————————————————————————————————————
// L'ESCALADE INTELLIGENTE — « elle avertit et propose une sonde plus poussée de façon intelligente »
// ————————————————————————————————————————————————————————————————————————

// Ce qui rend la proposition INTELLIGENTE plutôt que systématique : elle ne se déclenche que quand
// les indices se CONCENTRENT. Trois écarts éparpillés dans trois fichiers sont du bruit ordinaire ;
// trois écarts dans le même fichier disent qu'il s'y passe quelque chose. Proposer un scan payant à
// chaque avertissement reviendrait à le proposer toujours, donc à n'être jamais écouté.
export const CONCENTRATION_MINIMUM = 3;
export function proposerSondePoussee(ecarts = [], { seuil = CONCENTRATION_MINIMUM } = {}) {
  const parFichier = new Map();
  for (const e of ecarts) {
    const f = e.fichier ?? e.outil ?? "?";
    parFichier.set(f, (parFichier.get(f) ?? 0) + 1);
  }
  const concentres = [...parFichier.entries()].filter(([, n]) => n >= seuil).sort((a, b) => b[1] - a[1]);
  if (!concentres.length) return { propose: false, raison: `aucun fichier ne concentre ${seuil} écarts ou plus — des écarts éparpillés sont du bruit ordinaire, jamais un signal` };
  return {
    propose: true,
    zone: concentres[0][0],
    ecarts: concentres[0][1],
    raison: `${concentres[0][0]} concentre ${concentres[0][1]} écarts : c'est là qu'un scan profond a une chance de rapporter plus qu'il ne coûte`,
  };
}

// LE CHOIX DE ZONE POUR LE SCAN PAYANT — le mélange qu'il a demandé (« un mélange des solutions 1
// et 2 : une solution performante, pertinente, efficace ») : priorité aux indices, AVEC une
// garantie anti-famine par rotation.
//
// POURQUOI LES DEUX ET PAS L'UN : la seule priorité aux indices laisserait indéfiniment de côté une
// zone silencieuse mais pourrie — les indices mécaniques ne voient qu'une partie du problème, donc
// zéro indice ne veut pas dire zéro problème. La seule rotation ferait payer un scan complet sur
// une zone où rien ne cloche. Le compromis : les indices décident, sauf si une zone attend depuis
// trop longtemps, auquel cas elle passe devant.
export const FAMINE_JOURS = 30;
export function choisirZoneAScanner(zones = [], { indices = {}, dernierScan = {}, maintenant = Date.now(), famineJours = FAMINE_JOURS } = {}) {
  const affamees = zones
    .map((z) => {
      const at = Date.parse(dernierScan[z] ?? "");
      const jours = Number.isFinite(at) ? Math.floor((maintenant - at) / 86400000) : Infinity;
      return { zone: z, jours };
    })
    .filter((z) => z.jours >= famineJours)
    .sort((a, b) => b.jours - a.jours);
  if (affamees.length) {
    const z = affamees[0];
    return { zone: z.zone, motif: "anti-famine", raison: z.jours === Infinity ? "jamais scannée — zéro indice ne veut pas dire zéro problème, seulement que les indices mécaniques n'y voient rien" : `${z.jours} jours sans scan` };
  }
  const parIndices = zones.map((z) => ({ zone: z, n: indices[z] ?? 0 })).sort((a, b) => b.n - a.n);
  if (!parIndices.length || parIndices[0].n === 0) return { zone: null, motif: "aucune", raison: "aucun indice nulle part et aucune zone en famine — rien ne justifie de payer un scan" };
  return { zone: parIndices[0].zone, motif: "indices", raison: `${parIndices[0].n} indice(s) mécanique(s) concentrés là` };
}

// ————————————————————————————————————————————————————————————————————————
// LA MÉMOIRE — trois états, et le troisième est celui qui rend le rapport lisible dans la durée
// ————————————————————————————————————————————————————————————————————————
//
// « Ce qui a été vu, corrigé, et écarté sciemment » (son choix). ÉCARTÉ SCIEMMENT est le plus utile
// des trois : une zone qu'on a regardée et décidé de laisser telle quelle ne doit pas revenir à
// chaque passage — sinon le rapport se remplit de bruit déjà tranché et on cesse de le lire, ce qui
// tue l'outil plus sûrement qu'un bug.
export const ETATS_MEMOIRE = ["vu", "corrigé", "écarté sciemment"];
export const MEMOIRE_FILE = "docs/safe-export/memoire.json";

// UN ÉCART NE SE MET DE CÔTÉ QU'AVEC SON ACCORD EXPLICITE (correction du 2026-09-22, le jour même
// où cette mémoire a été écrite, sur sa relecture : « ne jamais ecarter une zone sciemment laissée
// de coté par moi, sauf avec mon accord explicite »).
//
// CE QUE JE M'ÉTAIS DONNÉ SANS LE VOIR : la première version filtrait tout écart marqué « écarté
// sciemment » sans jamais demander qui l'avait écarté. L'agent pouvait donc faire taire un
// avertissement tout seul, et le silence qui suit ressemble exactement à un problème réglé. C'est
// la même famille d'erreur que celle traquée toute la journée — une absence prise pour un
// résultat — mais appliquée au dispositif de surveillance lui-même, ce qui est pire : un gardien
// qui peut se taire à sa propre initiative ne garde plus rien.
//
// LA RÈGLE : seul un écart portant un accord explicite daté de l'utilisateur est filtré. Tous les
// autres REVIENNENT, et leur rappel GROSSIT — « les gardiens sacrés doivent repeter une alerte si
// je ne la prends pas en compte, pour etre sur que je la traite ou l'ignore VOLONTAIREMENT ». La
// distinction qui compte est entre IGNORÉ et ÉCARTÉ : ignorer est un non-événement, écarter est une
// décision. Seule la seconde a le droit de faire taire l'alerte.
export const ACCORD_REQUIS = "accord explicite de l'utilisateur, daté";

export function loadMemoire({ root = ROOT, readFileImpl = readFileSync } = {}) {
  try {
    const b = JSON.parse(readFileImpl(join(root, MEMOIRE_FILE), "utf8"));
    return Array.isArray(b) ? b : [];
  } catch {
    return [];
  }
}

// Les paliers de relance. Un rappel identique devient un meuble — ce projet en a la preuve chiffrée
// (son rappel de Ronde ignoré plus de 200 fois, mot pour mot le même). À partir du troisième
// passage, l'alerte ne se contente plus de revenir : elle exige une réponse par une vraie question,
// pour qu'il soit certain de l'avoir traitée ou ignorée VOLONTAIREMENT.
export const PALIERS_RELANCE = [
  { passages: 5, action: "question obligatoire", ton: "🔴 signalé 5 fois sans décision — cette alerte bloque une question à te poser, elle ne repartira pas seule" },
  { passages: 3, action: "question proposée", ton: "🟠 signalé 3 fois : à trancher explicitement, garder ou écarter" },
  { passages: 1, action: "rappel", ton: "🟡 déjà signalé" },
  { passages: 0, action: "nouveau", ton: "· nouvel écart" },
];

export function filtrerDejaTranches(ecarts = [], memoire = []) {
  const cle = (e) => `${e.fichier ?? e.outil}::${e.defaut ?? e.pourquoi ?? ""}`;
  // SEULS les écarts portant un accord explicite sont filtrés. Un « écarté sciemment » sans accord
  // est traité comme non tranché — donc il revient, ce qui est exactement le but.
  const ecartesAvecAccord = new Set(
    memoire.filter((m) => m.etat === "écarté sciemment" && m.accordUtilisateur).map((m) => `${m.fichier}::${m.defaut ?? m.pourquoi ?? ""}`),
  );
  const sansAccord = memoire.filter((m) => m.etat === "écarté sciemment" && !m.accordUtilisateur);
  const gardes = ecarts.filter((e) => !ecartesAvecAccord.has(cle(e)));
  // Le compteur de passages porte la relance : il vit dans la mémoire, pas dans la tête de l'agent.
  const avecRelance = gardes.map((e) => {
    const vu = memoire.find((m) => `${m.fichier}::${m.defaut ?? m.pourquoi ?? ""}` === cle(e));
    const passages = vu?.passages ?? 0;
    const palier = PALIERS_RELANCE.find((p) => passages >= p.passages);
    return { ...e, passages, relance: palier.action, ton: palier.ton };
  });
  const revenus = ecarts.filter((e) => memoire.some((m) => m.etat === "corrigé" && m.fichier === (e.fichier ?? e.outil)));
  return {
    gardes: avecRelance,
    ecartesAvecAccord: ecarts.length - gardes.length,
    // Nommé plutôt que tu : un « écarté » posé sans accord est une tentative de faire taire
    // l'alerte, et elle doit se voir dans le rapport.
    ecartesSansAccord: sansAccord.map((m) => ({ fichier: m.fichier, pourquoi: "marqué écarté sans accord explicite de l'utilisateur — l'alerte continue donc de remonter" })),
    regressions: revenus,
    // Ce que l'agent DOIT poser en question, jamais à son appréciation.
    aTrancherObligatoirement: avecRelance.filter((e) => e.relance === "question obligatoire"),
  };
}

// Série temporelle partagée — SAFE-EXPORT n'en avait aucune à sa naissance (2026-09-22), et il
// n'était même pas inscrit au registre des consommateurs de tendance : celui-ci avait été écrit
// avant lui et rien ne l'a rouvert à son arrivée. Sept registres ont réclamé leur inscription en
// échouant ; celui-là n'a rien réclamé, faute de test disant ce qui DEVRAIT consommer une tendance.
export function enregistrerTendanceExport(mesures = {}, options = {}) {
  const point = buildPoint({
    mesures: {
      fuites: { valeur: mesures.fuites, sens: SENS.BAS_MIEUX },
      "blueprints-mal-construits": { valeur: mesures.blueprintsMalConstruits, sens: SENS.BAS_MIEUX },
      "dependances-outillage": { valeur: mesures.dependances, sens: SENS.BAS_MIEUX },
      "blueprints-total": { valeur: mesures.blueprints, sens: SENS.NEUTRE },
    },
    ...options,
  });
  return recordPoint("safe-export", point, options);
}

export function tendancesExport(options = {}) {
  const serie = loadSerie("safe-export", options);
  return ["fuites", "blueprints-mal-construits", "dependances-outillage", "blueprints-total"].map((c) => detectTendance(serie, c, options));
}

function main() {
  printReliabilityNotice("safe-export");
  console.log("=== SAFE-EXPORT — exportabilité de l'Agence, lisibilité du projet ===\n");
  for (const [nom, c] of Object.entries(CIBLES)) console.log(`· cible « ${nom} » : ${c.question}`);
  console.log("");
  const blueprints = readdirSync(join(ROOT, "docs")).filter((f) => f.endsWith("-blueprint.md")).map((f) => `docs/${f}`);
  console.log(`${blueprints.length} blueprint(s) trouvé(s).`);
  const fuites = findFuitesDeSpecificite(blueprints);
  const defauts = findBlueprintsMalConstruits(blueprints);
  const deps = findDependancesOutillage(blueprints);
  console.log(`  fuites de spécificité : ${fuites.length}`);
  console.log(`  blueprints mal construits : ${defauts.length}`);
  console.log(`  dépendances à un outillage particulier : ${deps.length}`);
  const memoire = loadMemoire();
  // 2026-09-22, corrigé au premier vrai passage post-intégration : ce bloc destructurait
  // `ecartesSilencieusement`, un nom qui n'existe plus depuis la correction du garde-fou
  // anti-auto-silence — d'où un « undefined déjà écarté(s) » affiché en clair. Le vrai problème
  // n'était pas ce mot : c'est que TOUTE l'escalade réclamée par l'utilisateur (« les gardiens
  // sacrés doivent répéter une alerte si je ne la prends pas en compte ») était calculée par
  // filtrerDejaTranches() et n'atteignait AUCUN lecteur. Un mécanisme qui ne sort pas du script ne
  // protège rien — c'est une intention, pas un garde-fou (Article 25).
  const tri = filtrerDejaTranches([...fuites, ...defauts, ...deps], memoire);
  console.log(`\n${tri.gardes.length} écart(s) à regarder (${tri.ecartesAvecAccord} écarté(s) avec votre accord explicite, jamais reposé(s)).`);
  for (const e of tri.ecartesSansAccord) console.log(`   ⚠️  ${e.fichier} : ${e.pourquoi}`);
  for (const r of tri.regressions) console.log(`   🔁 ${r.fichier ?? r.outil} : déjà corrigé une fois, revenu depuis — une règle corrigée ne doit jamais se reproduire (Article 3).`);
  const relances = tri.gardes.filter((e) => e.passages > 0);
  for (const e of relances) console.log(`   ${e.ton ?? "·"} ${e.fichier ?? e.outil} : vu ${e.passages} fois → ${e.relance}`);
  if (tri.aTrancherObligatoirement.length) {
    console.log(`\n🔴 ${tri.aTrancherObligatoirement.length} écart(s) à vous poser en question OBLIGATOIRE — ce n'est plus à mon appréciation :`);
    for (const e of tri.aTrancherObligatoirement) console.log(`   ${e.fichier ?? e.outil} : ${e.defaut ?? e.pourquoi}`);
  }
  const sonde = proposerSondePoussee(tri.gardes);
  console.log(sonde.propose ? `\n🔍 Sonde profonde proposée : ${sonde.raison}` : `\n· Aucune sonde proposée : ${sonde.raison}`);

  // Série temporelle partagée (2026-09-22) — « l'exportabilité en instantané ne veut rien dire ».
  // Chaque mesure déclare son sens : sans quoi la flèche se tromperait une fois sur deux. Le nombre
  // de blueprints est NEUTRE et c'est important : 28 au lieu de 26 n'est ni bon ni mauvais, c'est
  // l'assiette sur laquelle les trois autres chiffres se lisent — une baisse des fuites qui
  // accompagne une baisse des blueprints ne prouve rien.
  enregistrerTendanceExport({ fuites: fuites.length, blueprintsMalConstruits: defauts.length, dependances: deps.length, blueprints: blueprints.length });
  for (const t of tendancesExport()) console.log(`  ${t.cle} : ${t.tendance ?? t.etat ?? "pas encore de tendance"}${t.pourquoi ? ` — ${t.pourquoi}` : ""}`);
  recordCliUsage("safe-export", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
