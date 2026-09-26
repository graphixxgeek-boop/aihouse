// INTEGRATION-OUTIL (2026-09-22) — le process d'intégration d'un nouvel outil dans l'Agence Codex,
// rendu ACTIF plutôt qu'écrit.
//
// POURQUOI IL EXISTE, ET LA DEMANDE EXACTE QUI L'A FAIT NAÎTRE. L'utilisateur, le 2026-09-22 :
// « ecris quelque part le process integration ou renforce le si deja existant, pour le rendre plus
// efficace et te permettre d'integrer plus facilement un outil ». Il n'en existait aucun : ni
// document, ni entrée dans PROCESSES, ni gardien.
//
// CE QUE L'ABSENCE COÛTAIT, MESURÉ ET PAS SUPPOSÉ. Faire entrer SAFE-EXPORT puis TOOL-LEARNING a
// demandé SEPT inscriptions manuelles chacun, dans sept registres différents. Chacune s'est
// signalée en FAISANT ÉCHOUER un test — jamais avant. C'est le diagnostic que l'Article 24 pose
// noir sur blanc depuis le 2026-09-22 : « les garde-fous font bien leur travail (rien ne passe en
// silence), mais ils DÉTECTENT l'oubli au lieu de l'ÉVITER : l'agent reste le mécanisme
// d'intégration, ce qui est exactement ce que cette précision juge insuffisant. »
//
// CE QUE CET OUTIL CHANGE, ET CE QU'IL NE CHANGE PAS. Il ne remplace aucun garde-fou : les sept
// continuent d'échouer si l'inscription manque, et c'est très bien — un filet qu'on retire parce
// qu'on a mis un panneau n'est plus un filet. Il inverse seulement le MOMENT : la liste des
// registres est DÉRIVÉE en lisant chaque fichier réel (Article 24 : un registre se lit, il ne
// s'énumère pas), donc demandable AVANT de commencer plutôt que découverte un test après l'autre.
//
// SA LIMITE, DÉCLARÉE PLUTÔT QUE TUE (même honnêteté que tool-brain et SMART-CONSO-TOKEN) : aucun
// mécanisme ne peut m'obliger à le consulter. Ce que le code garantit, c'est qu'une réponse
// demandée est exacte et complète ; que je la demande reste une obligation écrite, portée par
// l'entrée « Intégration d'un nouvel outil » de PROCESSES et surveillée par god-of-all-process.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { PROCESSES } from "./god-of-all-process.mjs";
import { join } from "node:path";
import { printReliabilityNotice, sansAccents, AGENT_CATEGORIES } from "./lib-shell.mjs";
import { recordCliUsage } from "./tool-usage.mjs";
import { printReportHeader } from "./report-template.mjs";
import { EXIGENCES_PAR_CLASSE, classesDuScript, typeDeScript } from "./cassandra-rh.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

// LES REGISTRES, chacun avec sa façon de se LIRE. `extrait` renvoie l'ensemble des slugs déjà
// déclarés dans le fichier réel — jamais une liste recopiée ici, qui se serait périmée au premier
// registre ajouté. `forme` est la ligne à écrire, donnée telle quelle pour que l'inscription ne
// demande aucune fouille : c'est là que se gagne le « plus facilement » de la demande.
export const REGISTRES_D_INTEGRATION = [
  {
    cle: "fiabilite", fichier: "scripts/lib-shell.mjs", quoi: "classification de fiabilité (l'avertissement d'inexactitude affiché en tête de rapport)",
    extrait: (t) => slugsDansBloc(t, "TOOL_RELIABILITY"),
    // La forme donnée ici était FAUSSE jusqu'au 2026-09-23 : elle dictait `niveau`/`raison` quand le
    // registre et son test attendent `nature`/`pourquoi`. Un outil dont le métier est d'éviter qu'on
    // découvre les oublis un test après l'autre dictait donc une inscription que le test refusait —
    // le pire cas pour un guide : un conseil précis et faux. Trouvé en l'appliquant pour de vrai.
    forme: (s) => `  "${s}": { nature: "mecanique|heuristique", pourquoi: "..." },  // dans TOOL_RELIABILITY`,
  },
  {
    cle: "categorie", fichier: "scripts/lib-shell.mjs", quoi: "rôle dans l'organigramme (Agent / Gardien sacré / Membre)",
    extrait: (t) => slugsDansBloc(t, "AGENT_CATEGORIES"),
    forme: (s) => `  "${s}": "Membre",  // dans AGENT_CATEGORIES — « Gardien sacré du code » seulement si scan de qualité ET gratuit à CHAQUE commit`,
  },
  {
    cle: "domaine-gardien", fichier: "scripts/lib-shell.mjs", quoi: "domaine surveillé (uniquement si l'outil devient Gardien sacré)",
    extrait: (t) => slugsDansBloc(t, "GARDIEN_DOMAINS"), facultatif: true,
    forme: (s) => `  "${s}": ["docs", "scripts"],  // dans GARDIEN_DOMAINS — les dossiers qu'il surveille vraiment`,
  },
  {
    cle: "couverture-axa", fichier: "scripts/axa-check.mjs", quoi: "couverture de test réelle (sans quoi l'outil est invisible à AXA-CHECK et à la stagnation)",
    extrait: (t) => chemin_scripts(t, "AGENT_SCRIPT_FILES"),
    forme: (s) => `  "scripts/${s}.mjs",  // dans AGENT_SCRIPT_FILES`,
  },
  {
    cle: "registre-rapports", fichier: "scripts/doc-report.mjs", quoi: "registre de rapports (décision HTML/texte, index global, journaux orphelins)",
    extrait: (t) => slugsDansBloc(t, "REGISTRIES"),
    forme: (s) => `  { slug: "${s}", path: "docs/${s}/index.md", scriptPath: "scripts/${s}.mjs", html: false },  // dans REGISTRIES`,
  },
  {
    cle: "avertissement", fichier: "scripts/doc-report.mjs", quoi: "fichier porteur de l'avertissement d'inexactitude",
    extrait: (t) => chemin_scripts(t, "RELIABILITY_SCRIPT_FILES"),
    forme: (s) => `  "scripts/${s}.mjs",  // dans RELIABILITY_SCRIPT_FILES`,
  },
  {
    // objectif-chiffre (2026-09-23) — ONZIÈME REGISTRE, ajouté après un écart réel : en intégrant
    // THE-EQUALIZER, cet outil a annoncé « 10/10 registres renseignés » pendant que la suite de tests
    // REFUSAIT le commit, faute d'une ligne dans le registre des objectifs. Un outil d'intégration
    // qui déclare une intégration complète alors qu'il manque une inscription obligatoire est
    // exactement le faux vert que tout ce paysage combat — et il est pire ici qu'ailleurs, puisque
    // c'est LUI qu'on consulte pour ne rien oublier.
    //
    // Ce registre n'est pas dans un script mais dans un document, et c'est normal : l'objectif
    // chiffré d'un outil est une décision humaine, pas une donnée dérivable (cf. l'exigence C4 de
    // docs/referentiel/standards.md, et le garde-fou vivant de scripts/objectifs-vs-resultats.mjs
    // qui refuse tout membre branché sur rien).
    cle: "objectif-chiffre", fichier: "docs/objectifs-vs-resultats/registre.md", quoi: "objectif chiffré, OU décision écrite de ne pas en avoir (sans quoi rien ne peut juger son résultat)",
    extrait: (t) => new Set([...t.matchAll(/^\|\s*([a-z0-9-]+)\s*\|/gm)].map((m) => m[1])),
    forme: (s) => `| ${s} | <début> | <échéance> | <cible> | <unité> | <source> | <la raison du chiffre, ou la raison de ne pas en avoir> |`,
  },
  {
    cle: "catalogue-coordinateur", fichier: "scripts/le-coordinateur.mjs", quoi: "catalogue des prestations (ce que tool-brain peut me recommander)",
    // PRESTATIONS ne porte pas de slug : ses entrées nomment les outils en toutes lettres
    // (« SAFE-EXPORT ») ou par leur script. On lit donc les deux formes, en minuscules — jamais une
    // regex « universelle » qui prétendrait couvrir des registres de formes différentes et
    // trouverait surtout des faux positifs.
    extrait: (t) => nomsOuScripts(t, "PRESTATIONS"),
    forme: (s) => `  { slug: "${s}", quand: "...", cout: "gratuit" },  // dans PRESTATIONS`,
  },
  {
    cle: "ronde", fichier: "scripts/circle-tasks.mjs", quoi: "item de Ronde périodique, OU exclusion documentée si l'outil tourne déjà à chaque commit",
    // CIRCLE_ITEMS indexe par `id:`, jamais par `slug:` — une différence d'un mot qui rendait le
    // lecteur muet, et un lecteur muet déclare tout le monde absent.
    // Deuxième correction, au passage suivant : un Gardien sacré est VOLONTAIREMENT hors de la Ronde
    // (il tourne déjà à chaque commit), et cette exclusion est écrite noir sur blanc dans
    // CIRCLE_AUTO_COVERED_REGISTRIES. Ne lire que CIRCLE_ITEMS réclamait donc une inscription qui
    // aurait DÉFAIT une décision documentée — le pire cas pour un outil censé aider : un conseil
    // faux mais net. L'exclusion déclarée compte comme « renseigné », puisqu'elle EST la décision.
    extrait: (t) => new Set([
      ...[...blocApres(t, "CIRCLE_ITEMS").matchAll(/\bid:\s*["']([a-z0-9-]+)["']/g)].map((m) => m[1]),
      ...[...blocApres(t, "CIRCLE_AUTO_COVERED_REGISTRIES").matchAll(/^\s*["']([a-z0-9-]+)["']\s*:/gm)].map((m) => m[1]),
    ]),
    forme: (s) => `  { slug: "${s}", theme: "...", ... },  // dans CIRCLE_ITEMS — ou une exclusion écrite si déjà câblé au post-commit`,
  },
  {
    cle: "table-maitresse", fichier: "docs/regles-de-travail.md", quoi: "table maîtresse §7ter (la description détaillée outil par outil)",
    extrait: (t) => new Set([...t.matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1])),
    forme: (s) => `| ${s} | ... | \`scripts/${s}.mjs\` |  — ligne de la table maîtresse §7ter`,
  },
  {
    // Renommé le 2026-09-22 (« je veux réserver tant que possible le nom catalogue pour le
    // catalogue du coordinateur ») : en le baptisant « catalogue-charte » la veille, j'avais ajouté
    // une cinquième occurrence d'un mot qui en désignait déjà quatre, au lieu de lever l'ambiguïté.
    cle: "inventaire-charte", fichier: "CLAUDE.md", quoi: "inventaire documentaire de la charte (blueprint + instanciation + script)",
    extrait: (t) => new Set([...t.matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1])),
    forme: (s) => `| ${s} | ... | \`docs/${s}-blueprint.md\` | \`docs/referentiel/${s}.md\` | \`scripts/${s}.mjs\` |`,
  },
];

// Deux lectures, volontairement distinctes plutôt qu'une regex unique « intelligente » : un registre
// indexé par slug (`"safe-export": {...}`) et un registre listant des chemins
// (`"scripts/safe-export.mjs"`) n'ont pas la même forme, et une regex qui prétendrait couvrir les
// deux trouverait aussi des choses qui n'en sont pas. Deux fonctions honnêtes valent mieux qu'une
// qui ratisse large.
// Ancré sur la DÉCLARATION (`export const X = `), jamais sur la première occurrence du mot : celle-ci
// tombait dans un commentaire 80 lignes plus haut, et la fenêtre de lecture ratait la moitié du
// registre. Trouvé au premier vrai passage de cet outil sur le vrai dépôt (Article 25).
// blocApres() — LA FENÊTRE FIXE DE 40 000 CARACTÈRES ÉTAIT UN PLAFOND INVISIBLE (corrigé le
// 2026-09-26). Elle coupait `CIRCLE_ITEMS` au milieu : sur les 37 items réels, **22 seulement**
// étaient lus, et les quinze derniers passaient pour inexistants. Un outil inscrit dans l'un
// d'eux s'entendait donc répondre « inscription manquante », avec la ligne à coller — un conseil
// faux mais net, qui aurait créé un doublon d'item si je l'avais suivi.
//
// POURQUOI LA FENÊTRE A TENU SI LONGTEMPS SANS SE VOIR : elle était juste au début, quand la
// constante tenait dedans. Un plafond en dur ne se périme pas d'un coup, il se périme quand le
// contenu grandit — et personne ne relit un nombre magique le jour où il devient trop petit.
// C'est le motif de l'Article 24 dans sa version la plus discrète.
//
// LA FIN RÉELLE DU BLOC, plutôt qu'une longueur devinée : le `];` ou `};` en colonne 0, la forme
// qu'ont toutes les grandes déclarations de ce dépôt (même repère que
// `stripExportedConstantBodies()` chez data-archangel). Si ce repère est introuvable, on retombe
// sur la fin du fichier — jamais sur une fenêtre arbitraire qui recréerait le défaut en silence.
function blocApres(texte, nom) {
  const i = texte.indexOf(`export const ${nom}`);
  const j = i < 0 ? texte.indexOf(nom) : i;
  if (j < 0) return "";
  const fin = texte.slice(j).search(/^[\]}];?$/m);
  return fin < 0 ? texte.slice(j) : texte.slice(j, j + fin + 2);
}
function slugsDansBloc(texte, nom) {
  return new Set([...blocApres(texte, nom).matchAll(/["'{\s]slug:\s*["']([a-z0-9-]+)["']|^\s*["']([a-z0-9-]+)["']\s*:/gm)].map((m) => m[1] ?? m[2]).filter(Boolean));
}
// Les noms sont NORMALISÉS avant comparaison (2026-09-23) : sans ça, « MOÏSE-TABLES-DE-LOI » ne
// pouvait jamais correspondre à son slug sans accent, et le contournement trouvé sur le moment —
// glisser un chemin de script dans le catalogue pour que ce lecteur-ci le voie — a créé un outil
// FANTÔME nommé « scripts » chez un autre lecteur, qui découpe sur le « / ». Satisfaire un
// garde-fou en lui donnant une chaîne qu'un second lecteur interprète autrement n'est pas une
// correction, c'est un déplacement du défaut (Article 3).
function nomsOuScripts(texte, nom) {
  const bloc = blocApres(texte, nom);
  const parScript = [...bloc.matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1]);
  const parNom = [...sansAccents(bloc).matchAll(/["']([A-Za-z][A-Za-z0-9 -]{2,})["']/g)]
    .map((m) => m[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  return new Set([...parScript, ...parNom]);
}
function chemin_scripts(texte, nom) {
  return new Set([...blocApres(texte, nom).matchAll(/scripts\/([a-z0-9-]+)\.mjs/g)].map((m) => m[1]));
}

// etatIntegration() — où en est CET outil, registre par registre. Un fichier illisible rapporte
// `mesurable: false` plutôt que « absent » : une absence de mesure n'est pas une absence
// d'inscription, et les confondre enverrait réécrire une ligne déjà présente.
// LES TROIS NATURES D'UN FICHIER `scripts/*.mjs`, jamais deux (2026-09-23).
//
// LE DÉFAUT RÉEL, trouvé en demandant l'intégration de `messages-courts` : cet outil répondait
// « 0/11, 10 inscriptions manquantes » pour N'IMPORTE QUEL nom de script — y compris
// `criticite`, `priorites` et `modes-de-travail`, qui ne sont pas des membres de l'Agence mais des
// MODULES DE RÈGLES hébergés par un process. Suivre son plan aurait produit quatre blueprints et
// quatre registres pour quatre modules qui n'ont rien en propre à documenter : exactement ce que la
// charte interdit en réservant six outils « volontairement SANS blueprint ni instanciation ».
//
// Un outil qui répond la même chose à toutes les questions ne répond à aucune. La nature se DÉCLARE
// donc dans le fichier lui-même (`export const PROCESS_HOTE = "<slug>"`), jamais dans une liste
// tenue ici qui se périmerait au module suivant (Article 24), et jamais devinée d'après le nom.
//
// LE TROISIÈME ÉTAT EST LE PLUS IMPORTANT, et c'est le bruyant : un script sans marqueur ET absent
// de tous les registres n'est pas « un outil à intégrer », c'est un script dont PERSONNE n'a encore
// dit ce qu'il est. Le ranger d'office en outil à intégrer serait deviner — et deviner en silence
// est précisément le défaut que la moitié de ce paysage existe pour empêcher.
export const NATURES_DE_SCRIPT = {
  membre: "un outil de l'Agence Codex : il doit renseigner tous les registres obligatoires",
  "module-de-regles": "un module de règles hébergé par un process : rien à inscrire dans les registres d'outils, mais son process hôte doit exister",
  "non-decide": "personne n'a encore dit ce que c'est — à trancher AVANT de l'intégrer ou de l'ignorer",
};

// ANCRÉ EN DÉBUT DE LIGNE (`^` en mode multiligne), et ce n'est pas un détail de style : sans
// l'ancre, ce fichier-ci se déclarait lui-même module de règles rattaché au process « <slug> » —
// il matchait l'EXEMPLE écrit dans son propre commentaire, deux blocs plus haut. Un détecteur qui
// se fait piéger par sa propre documentation est le premier faux positif à corriger (leçon L4 :
// un garde-fou qui accuse à tort cesse d'être lu), et il a été trouvé en le lançant pour de vrai
// sur le dépôt entier, jamais en le relisant.
const MARQUEUR_PROCESS_HOTE = /^export\s+const\s+PROCESS_HOTE\s*=\s*["'`]([^"'`]+)["'`]/m;

// Lit la nature dans le fichier réel, jamais dans une liste. Un script introuvable rend
// « pas mesurable » plutôt qu'une nature par défaut : ne pas savoir n'autorise jamais à conclure.
export function natureDuScript(slug, { root = ROOT, readFileImpl = readFileSync, registres = REGISTRES_D_INTEGRATION } = {}) {
  let source;
  try {
    source = readFileImpl(join(root, `scripts/${slug}.mjs`), "utf8");
  } catch {
    return { nature: null, mesurable: false, pourquoi: `scripts/${slug}.mjs est introuvable — aucune nature déduite, et surtout aucune supposée` };
  }
  const hote = source.match(MARQUEUR_PROCESS_HOTE)?.[1];
  if (hote) return { nature: "module-de-regles", mesurable: true, processHote: hote, pourquoi: `le fichier déclare lui-même son process hôte (« ${hote} ») : ce n'est pas un membre de l'Agence` };
  const inscrit = etatIntegration(slug, { root, readFileImpl, registres }).some((e) => e.mesurable && e.present);
  if (inscrit) return { nature: "membre", mesurable: true, pourquoi: "déjà déclaré dans au moins un registre d'outils : c'est un membre, son intégration est simplement incomplète" };
  return { nature: "non-decide", mesurable: true, pourquoi: "aucun marqueur de process hôte, et aucun registre ne le connaît — sa nature n'a jamais été tranchée" };
}

// findModulesDeReglesOrphelins() — un module qui déclare un process hôte INEXISTANT. Un hôte
// fantôme est pire qu'une absence d'hôte : il rassure à tort, exactement comme le porteur fantôme
// que la leçon L7 interdit. Les process sont lus chez god-of-all-process, jamais recopiés ici.
export function findModulesDeReglesOrphelins({ root = ROOT, readFileImpl = readFileSync, listeScripts, processConnus } = {}) {
  const scripts = listeScripts ?? readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, ""));
  const connus = new Set(processConnus ?? PROCESSES.map((p) => p.slug));
  const orphelins = [];
  for (const slug of scripts) {
    let source;
    try { source = readFileImpl(join(root, `scripts/${slug}.mjs`), "utf8"); } catch { continue; }
    const hote = source.match(MARQUEUR_PROCESS_HOTE)?.[1];
    if (hote && !connus.has(hote)) orphelins.push({ slug, processHote: hote, pourquoi: `« ${slug} » se déclare rattaché au process « ${hote} », qui n'existe dans aucun process déclaré — un hôte fantôme rassure à tort` });
  }
  return orphelins;
}

// estDeclare() — LE RÔLE SUFFIXÉ COMPTE (2026-09-26, onze faux positifs mesurés).
//
// CE QUI A ÉTÉ TROUVÉ EN LANÇANT L'OUTIL POUR DE VRAI, et c'est la troisième fois que le même motif
// mord ici : ce fichier porte déjà deux corrections écrites plus haut, chacune sur « un lecteur muet
// déclare tout le monde absent ». En voici la troisième forme. Les registres n'écrivent pas tous le
// même identifiant : CIRCLE_ITEMS range data-archangel sous `data-archangel-SCAN`, the-king sous
// `the-king-SIGNAL`, ecotoken sous `ecotoken-SCAN`. Une comparaison à l'identique déclarait donc ces
// outils NON INSCRITS et réclamait un item de Ronde qui existe déjà.
//
// COMBIEN, EXACTEMENT : 11 outils sur 58. Un outil sur cinq recevait un conseil faux mais net —
// « ajoute ceci » — et l'appliquer aurait créé un doublon d'item de Ronde. C'est le pire cas pour un
// outil censé aider, et la leçon L4 en personne : un garde-fou qui accuse à tort cesse d'être lu.
//
// LA CLAUSE QUI ÉVITE DE SUR-CORRIGER, dérivée plutôt qu'écrite à la main : un identifiant ne couvre
// un outil que si le reste, après le tiret, n'est pas LUI-MÊME le nom d'un autre outil. Sans elle, un
// outil nommé « tool » se croirait couvert par l'entrée de « tool-brain » — un faux négatif, donc le
// plus dangereux des deux, puisqu'il ne se voit jamais.
export function estDeclare(slug, declares, autresOutils = []) {
  if (declares.has(slug)) return true;
  const connus = new Set(autresOutils.filter((o) => o !== slug));
  for (const d of declares) {
    if (!String(d).startsWith(`${slug}-`)) continue;
    const reste = String(d).slice(slug.length + 1);
    if (connus.has(reste) || connus.has(String(d))) continue;
    return true;
  }
  return false;
}

export function etatIntegration(slug, { root = ROOT, readFileImpl = readFileSync, registres = REGISTRES_D_INTEGRATION, autresOutils = Object.keys(AGENT_CATEGORIES) } = {}) {
  return registres.map((r) => {
    let texte;
    try {
      texte = readFileImpl(join(root, r.fichier), "utf8");
    } catch {
      return { ...r, mesurable: false, pourquoi: `${r.fichier} illisible — aucune conclusion tirée` };
    }
    const declares = r.extrait(texte);
    return { cle: r.cle, fichier: r.fichier, quoi: r.quoi, facultatif: !!r.facultatif, mesurable: true, present: estDeclare(slug, declares, autresOutils), forme: r.forme(slug) };
  });
}

// planDIntegration() — ce qu'il reste à faire, dans l'ordre, prêt à coller. Les registres facultatifs
// sont donnés à part : les mélanger ferait passer un choix (« devient-il Gardien ? ») pour une
// formalité à cocher, et c'est une décision de fond, pas une ligne de plus.
// LES OBLIGATIONS DE CLASSE (2026-09-24, chantier 2.4 du plan de nuit) — demande explicite de
// l'utilisateur : rendre une intégration OBLIGATOIRE plutôt que « sauvage », et sa précision sur
// l'Article 24 : « si un nouveau script arrive, toutes les fonctionnalités et
// paramètres/certifications sont appliquées au nouvel outil qui rejoint l'équipe ».
//
// LE TROU QUE ÇA FERME, ET IL ÉTAIT ENTIER : ce plan d'intégration ne savait vérifier qu'une chose,
// « es-tu inscrit dans les registres ? ». Un outil pouvait donc être parfaitement intégré au sens de
// cette fonction en ne déclarant jamais sa marge d'erreur, en ne sachant pas répondre « pas mesuré »
// et en ne concluant par aucun plan d'action. Mesuré le soir même sur le dépôt réel : selon
// l'exigence, 45 à 76 % seulement des outils concernés l'atteignent. Les registres étaient à jour
// et les obligations de fond, invisibles.
//
// LES EXIGENCES NE SONT PAS RECOPIÉES ICI : elles sont LUES chez CASSANDRA, où elles vivent avec les
// classes qu'elles gouvernent. Une exigence ajoutée là-bas s'applique donc à la prochaine intégration
// sans que ce fichier bouge — c'est précisément ce que l'Article 24 exige, et le contraire de la
// liste recopiée qui se périme au premier ajout.
export function obligationsDeClasse(slug, { root = ROOT, readFileImpl = readFileSync, exigences = EXIGENCES_PAR_CLASSE } = {}) {
  let source;
  try { source = readFileImpl(join(root, `scripts/${slug}.mjs`), "utf8"); } catch {
    return { mesurable: false, pourquoi: `scripts/${slug}.mjs est introuvable — aucune obligation déduite, et surtout aucune supposée` };
  }
  const classes = classesDuScript(source);
  // Un outil en cours d'intégration EST un outil : c'est le type visé, jamais le type constaté
  // avant qu'il soit documenté. Le mesurer autrement l'exempterait de tout au moment précis où il
  // faut l'exiger.
  const ligne = { chemin: `scripts/${slug}.mjs`, type: "commande-documentee", classes };
  const dues = exigences.filter((e) => e.sApplique(ligne));
  return {
    mesurable: true, classes,
    tenues: dues.filter((e) => classes.includes(e.exige)).map((e) => e.cle),
    manquantes: dues.filter((e) => !classes.includes(e.exige)).map((e) => ({ cle: e.cle, exige: e.exige, pourquoi: e.pourquoi })),
  };
}

export function planDIntegration(slug, options = {}) {
  const etat = etatIntegration(slug, options);
  const obligations = obligationsDeClasse(slug, options);
  return {
    slug,
    fait: etat.filter((e) => e.mesurable && e.present).map((e) => e.cle),
    restant: etat.filter((e) => e.mesurable && !e.present && !e.facultatif),
    optionnel: etat.filter((e) => e.mesurable && !e.present && e.facultatif),
    nonMesurable: etat.filter((e) => !e.mesurable),
    obligations,
    // COMPLET veut dire les DEUX : inscrit partout ET à niveau sur ce que sa classe exige. Les
    // séparer laisserait exactement le trou d'avant — un outil « intégré » qui ne tient aucune des
    // obligations de fond de l'équipe qu'il rejoint. Une obligation non mesurable ne bloque pas :
    // ne pas savoir n'autorise jamais à conclure, dans un sens comme dans l'autre.
    complet: etat.every((e) => !e.mesurable || e.present || e.facultatif)
      && (!obligations.mesurable || obligations.manquantes.length === 0),
  };
}

// findLecteursCasses() — le garde-fou de l'outil sur lui-même, et il n'est pas décoratif : un
// `extrait` dont la regex cesse de correspondre (un registre reformaté, renommé, déplacé) renverrait
// un ensemble VIDE, donc déclarerait tous les outils absents partout — un rapport spectaculaire et
// entièrement faux. SAFE-EXPORT a vécu exactement ça le 2026-09-22 (25 blueprints « fautifs » parce
// que son marqueur cherchait le mauvais mot) ; le chiffre lui-même était l'alarme. Un registre réel
// contient forcément plusieurs outils : zéro ou un, c'est le lecteur qui est cassé, pas le dépôt.
// ══════════════════════════════════════════════════════════════════════════
// L'ANGLE MORT DE L'AUDIT D'INTÉGRATION (2026-09-26, tâche #915 — point 22 de son gros prompt :
// « l'angle mort de l'audit d'intégration — fermer le trou côté outil »).
//
// CE QUE L'AUDIT VÉRIFIE, ET CE QU'IL NE VOIT PAS. Les onze registres ci-dessus vérifient le
// BRANCHEMENT : l'outil est-il connu de la couverture de test, du catalogue, de la Ronde, de la
// charte. C'est nécessaire, et ce n'est pas suffisant — **un outil peut être branché 11/11 et
// décrire quelque chose qui n'existe plus.** L'audit regarde les fils, jamais ce qui passe dedans.
//
// CE N'EST PAS UNE CRAINTE, C'EST ARRIVÉ CETTE NUIT. `check-profile.mjs` a été gelé hors de
// l'équipe le 2026-09-26 parce que son en-tête, écrit le 2026-09-17, affirmait « le mécanisme réel
// n'existe pas encore dans le code, cette conception n'étant pas encore validée ». Le mécanisme
// existait depuis des jours — et pire, il avait été construit À PARTIR de cet outil. Neuf jours de
// fausseté, aucun registre en défaut, aucune alerte.
//
// LA PHRASE QUI SE PÉRIME EN SILENCE A UNE FORME CONSTANTE : c'est le FUTUR. « pas encore »,
// « à venir », « en cours de conception », « sera », « prochainement ». Une description au présent
// vieillit mal mais reste discutable ; une promesse, elle, devient fausse le jour où elle est tenue
// — **et c'est le succès qui la rend fausse, ce qui explique que personne ne revienne la corriger.**
//
// IL QUESTIONNE, IL NE CONCLUT JAMAIS. Un « pas encore » parfaitement légitime existe (un outil
// écrit hier, une limite réelle et toujours vraie). Ce détecteur rend une QUESTION avec l'âge de la
// phrase ; c'est la lecture qui tranche. Un garde-fou qui accuserait à tort cesserait d'être lu (L4).
export const MOTIF_PROMESSE = /\b(?:n'existe pas encore|pas encore (?:validé|construit|câblé|branché|écrit|intégré|implémenté)|à venir|en cours de conception|sera (?:construit|câblé|ajouté|écrit)|prochainement|reste à (?:construire|câbler|écrire))\b/i;

// L'EN-TÊTE SEULEMENT, jamais tout le fichier : une promesse dans un commentaire local décrit un
// bout de code précis et se corrige avec lui. Une promesse EN TÊTE décrit l'outil entier, c'est
// elle qu'on lit pour savoir à quoi il sert, et c'est elle qui trompe quand elle se périme.
export const LIGNES_D_ENTETE = 40;

export function findPromessesPerimees({ root = ROOT, readFileImpl = readFileSync, listeScripts = null, lignesEntete = LIGNES_D_ENTETE, ageDepuis = null } = {}) {
  let noms = listeScripts;
  if (!noms) {
    try { noms = readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")); }
    catch { return { mesurable: false, pourquoi: "le dossier scripts/ n'a pas pu être lu : aucune promesse n'a été cherchée, ce qui n'est jamais la même chose qu'aucune promesse trouvée" }; }
  }
  const trouvees = [];
  for (const n of noms) {
    let texte;
    try { texte = readFileImpl(join(root, "scripts", n), "utf8"); } catch { continue; }
    const lignes = texte.split("\n").slice(0, lignesEntete);
    // L'ÉTAT DE CITATION SE SUIT D'UNE LIGNE À L'AUTRE, et il l'a fallu : au premier passage réel,
    // la seule trouvaille du dépôt était une citation dont le « ouvrait ligne 3 et le » fermait
    // ligne 4. Un balayage ligne par ligne voyait la fin d'une citation sans son début, donc une
    // promesse nue là où il y avait du discours rapporté. Une exclusion qui ne tient pas sur deux
    // lignes ne tient pas du tout — ce dépôt écrit ses citations sur plusieurs lignes partout.
    let dansCitation = false;
    lignes.forEach((l, i) => {
      const nu = l.trim();
      const ouvre = (nu.match(/«/g) ?? []).length;
      const ferme = (nu.match(/»/g) ?? []).length;
      const etaitDansCitation = dansCitation;
      dansCitation = dansCitation ? !(ferme > ouvre) : ouvre > ferme;
      if (!nu.startsWith("//")) return;
      if (etaitDansCitation) return;
      // LE DÉTECTEUR NE SE TROUVE PAS LUI-MÊME — cinquième fois cette semaine que ce motif revient.
      if (nu.includes("MOTIF_PROMESSE") || nu.includes("findPromessesPerimees")) return;
      if (!MOTIF_PROMESSE.test(nu)) return;
      // UNE PROMESSE CITÉE N'EN EST PAS UNE — même patron déjà prouvé ailleurs dans ce dépôt
      // (findDependancesOutillage exclut la dépendance « citée pour être écartée »). Le premier
      // passage réel a signalé l'unique ligne de `check-profile.mjs` qui CITE son ancien en-tête
      // pour expliquer en quoi il était faux : accuser le texte qui répare le défaut est le plus
      // sûr moyen de ne plus être lu (L4). Une vraie promesse s'écrit en clair, pas entre guillemets.
      if (/«[^»]*»/.test(nu) && MOTIF_PROMESSE.test((nu.match(/«([^»]*)»/) ?? ["", ""])[1])) return;
      // LA DATE ÉCRITE À CÔTÉ, quand il y en a une, est ce qui rend la question CHIFFRÉE plutôt que
      // vague : « ce "pas encore" a neuf jours » se traite, « ce "pas encore" est peut-être vieux »
      // se repousse. Sans date, la question reste posée, mais sans âge — et c'est dit.
      const date = (nu.match(/\b(20\d{2}-\d{2}-\d{2})\b/) ?? [])[1] ?? null;
      const jours = date && ageDepuis ? Math.round((new Date(ageDepuis) - new Date(date)) / 86400000) : null;
      trouvees.push({ fichier: `scripts/${n}`, ligne: i + 1, date, jours, extrait: nu.slice(0, 130) });
    });
  }
  return {
    mesurable: true, scripts: noms.length, trouvees,
    horsPortee: "cherche des PROMESSES au futur dans l'en-tête, jamais la vérité d'une description au présent — un outil qui décrit faussement quelque chose au présent lui échappe entièrement. Et un « pas encore » peut être parfaitement exact : il QUESTIONNE avec l'âge de la phrase, il ne conclut jamais (leçon L4).",
  };
}

export function formatPromessesLines(p) {
  if (!p?.mesurable) return [`PROMESSES D'EN-TÊTE : PAS MESURÉ — ${p?.pourquoi ?? "raison non fournie"}`];
  const l = [`=== L'ANGLE MORT DE L'AUDIT : les promesses d'en-tête (${p.scripts} script(s) lus) ===`];
  l.push(`  Les 11 registres vérifient le BRANCHEMENT. Un outil peut être branché 11/11 et décrire quelque chose`);
  l.push(`  qui n'existe plus — c'est arrivé cette nuit, neuf jours durant, sans qu'aucun registre soit en défaut.`);
  if (!p.trouvees.length) { l.push(`  Aucune promesse au futur dans les en-têtes lus.`); return l; }
  for (const t of p.trouvees) {
    l.push(`  ❓ ${t.fichier}:${t.ligne}${t.jours !== null ? ` — la phrase porte la date ${t.date}, soit ${t.jours} jour(s)` : t.date ? ` — datée ${t.date}` : " — aucune date écrite, donc aucun âge"}`);
    l.push(`     ${t.extrait}`);
  }
  l.push(`  HORS PORTÉE : ${p.horsPortee}`);
  return l;
}

export function findLecteursCasses({ root = ROOT, readFileImpl = readFileSync, registres = REGISTRES_D_INTEGRATION, minimum = 2 } = {}) {
  const casses = [];
  for (const r of registres) {
    let texte;
    try {
      texte = readFileImpl(join(root, r.fichier), "utf8");
    } catch {
      casses.push({ cle: r.cle, pourquoi: `${r.fichier} introuvable` });
      continue;
    }
    const n = r.extrait(texte).size;
    if (n < minimum) casses.push({ cle: r.cle, pourquoi: `n'extrait que ${n} outil(s) de ${r.fichier} — un vrai registre en contient plusieurs, donc c'est le lecteur qui est cassé, jamais le registre qui serait vide` });
  }
  return casses;
}

// findModulesNonCitesParLeurProcess() — l'ÉQUIVALENT, pour un module de règles, des onze registres
// qu'un membre doit renseigner. Sans lui, la branche « module de règles » ci-dessus se contenterait
// d'IMPRIMER une consigne (« vérifie que le process hôte le cite »), et une consigne imprimée est
// exactement l'intention que la leçon L7 refuse : personne ne la lit deux fois.
//
// Ce que ça attrape concrètement, et le cas est réel : `messages-courts` s'est déclaré rattaché au
// process semi-autonome le jour de sa construction, alors que le document de ce process ne le
// citait nulle part. Le module existait, il était testé, et aucun déroulé n'y menait — un rattachement
// sur le papier, qui est précisément la forme que prend ici « un mécanisme qui ne sort pas du
// script » (L2).
export function findModulesNonCitesParLeurProcess({ root = ROOT, readFileImpl = readFileSync, listeScripts, processus = PROCESSES } = {}) {
  const scripts = listeScripts ?? readdirSync(join(root, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => f.replace(/\.mjs$/, ""));
  const parSlug = new Map(processus.map((p) => [p.slug, p]));
  const hits = [];
  for (const slug of scripts) {
    let source;
    try { source = readFileImpl(join(root, `scripts/${slug}.mjs`), "utf8"); } catch { continue; }
    const hote = source.match(MARQUEUR_PROCESS_HOTE)?.[1];
    if (!hote) continue;
    const proc = parSlug.get(hote);
    if (!proc) continue; // déjà signalé comme orphelin — jamais deux reproches pour un seul défaut
    if (!proc.doc) { hits.push({ slug, processHote: hote, pourquoi: `le process « ${hote} » n'a aucun document de détail : impossible d'y rattacher quoi que ce soit` }); continue; }
    let doc;
    try { doc = readFileImpl(join(root, proc.doc), "utf8"); } catch { hits.push({ slug, processHote: hote, pourquoi: `${proc.doc} est illisible — le rattachement n'est pas vérifiable, donc pas acquis` }); continue; }
    if (!doc.includes(`scripts/${slug}.mjs`)) hits.push({ slug, processHote: hote, pourquoi: `« ${slug} » se dit hébergé par le process « ${hote} », mais ${proc.doc} ne le cite nulle part : un rattachement sur le papier, aucun déroulé n'y mène` });
  }
  return hits;
}

function main() {
  // Cadre commun (pure-gold-unity, Ronde du 2026-09-22) : l'avertissement de fiabilité, le titre et
  // l'horodatage passent par printReportHeader() plutôt que d'être réécrits ici. Un rapport qui
  // fabrique son propre en-tête finit par diverger de tous les autres sans que personne ne le
  // décide — trouvé sur ce fichier le soir même de sa construction, par la Ronde.
  printReportHeader({ tool: "integration-outil", title: "INTEGRATION-OUTIL — faire entrer un outil dans l'Agence Codex", scriptPath: "scripts/integration-outil.mjs", origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
  const slug = process.argv[2];
  // L'ANGLE MORT, IMPRIMÉ À CHAQUE PASSAGE (2026-09-26, #915) : il ne coûte rien, il lit 80 fichiers
  // en quelques millisecondes, et un détecteur qu'il faut penser à lancer n'est lu par personne (L2).
  const promesses = findPromessesPerimees({ ageDepuis: new Date().toISOString().slice(0, 10) });
  if (promesses.mesurable && promesses.trouvees.length) {
    console.log("");
    for (const l of formatPromessesLines(promesses)) console.log(l);
    console.log("");
  }
  const casses = findLecteursCasses();
  if (casses.length) {
    console.log("⚠️  Lecteurs cassés — le rapport ci-dessous serait faux, à corriger AVANT de s'y fier :");
    for (const c of casses) console.log(`   ${c.cle} : ${c.pourquoi}`);
    console.log("");
  }
  if (!slug) {
    console.log(`${REGISTRES_D_INTEGRATION.length} registres à renseigner pour un outil qui arrive :\n`);
    for (const r of REGISTRES_D_INTEGRATION) console.log(`· ${r.cle}${r.facultatif ? " (selon décision)" : ""} — ${r.quoi}\n    ${r.fichier}`);
    console.log("\nUsage : node scripts/integration-outil.mjs <slug-de-l-outil>");
    recordCliUsage("integration-outil", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return;
  }
  // LA NATURE D'ABORD, le plan ensuite — sans quoi l'outil répond la même chose à toutes les
  // questions, ce qu'il a fait jusqu'au 2026-09-23 pour les quatre modules de règles du dépôt.
  const orphelins = findModulesDeReglesOrphelins();
  if (orphelins.length) {
    console.log("⚠️  Module(s) de règles rattaché(s) à un process qui n'existe pas — un hôte fantôme rassure à tort :");
    for (const o of orphelins) console.log(`   ${o.pourquoi}`);
    console.log("");
  }
  const nonCites = findModulesNonCitesParLeurProcess();
  if (nonCites.length) {
    console.log("⚠️  Module(s) de règles que leur process hôte ne cite pas — rattachés sur le papier, sans déroulé qui y mène :");
    for (const h of nonCites) console.log(`   ${h.pourquoi}`);
    console.log("");
  }
  const nature = natureDuScript(slug);
  if (!nature.mesurable) {
    console.log(`${slug} : ${nature.pourquoi}`);
    recordCliUsage("integration-outil", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return;
  }
  if (nature.nature === "module-de-regles") {
    console.log(`${slug} — ${NATURES_DE_SCRIPT["module-de-regles"]}\n`);
    console.log(`Process hôte déclaré : « ${nature.processHote} ».`);
    console.log("Aucun registre d'outil à renseigner : ce module n'a rien en propre à documenter, sa place est dans le process qui l'héberge.");
    console.log("Ce qui reste à vérifier, et c'est tout : (1) le process hôte le cite dans son document de détail ; (2) ses fonctions sont couvertes par check-house.mjs.");
    recordCliUsage("integration-outil", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
    return;
  }
  if (nature.nature === "non-decide") {
    console.log(`⚠️  ${slug} — ${NATURES_DE_SCRIPT["non-decide"]}\n`);
    console.log("Aucun marqueur `export const PROCESS_HOTE` dans le fichier, et aucun registre ne le connaît.");
    console.log("Deux issues, jamais un silence : en faire un MEMBRE (le plan ci-dessous s'applique), ou déclarer son process hôte dans le fichier lui-même.");
    console.log("Le plan est donné quand même, mais il ne vaut que si la première issue est la bonne :\n");
  }
  const plan = planDIntegration(slug);
  console.log(`Outil : ${slug}\n${plan.fait.length}/${REGISTRES_D_INTEGRATION.length} registre(s) déjà renseigné(s) : ${plan.fait.join(", ") || "aucun"}\n`);
  if (plan.restant.length) {
    console.log(`${plan.restant.length} inscription(s) manquante(s) — à faire AVANT le commit, pas après l'échec du test :`);
    for (const e of plan.restant) console.log(`\n· ${e.quoi}\n  ${e.fichier}\n  ${e.forme}`);
  } else {
    console.log("Tous les registres obligatoires sont renseignés.");
  }
  for (const e of plan.optionnel) console.log(`\n· (selon décision) ${e.quoi}\n  ${e.fichier}\n  ${e.forme}`);
  for (const e of plan.nonMesurable) console.log(`\n· ${e.cle} : ${e.pourquoi}`);
  recordCliUsage("integration-outil", { origin: process.env.TOOL_USAGE_ORIGIN || "cli_direct" });
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
