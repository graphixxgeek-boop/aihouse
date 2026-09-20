import {readLife,type Life} from "./life";
import type { Person, Room } from "./house";
import { intents, type Intent, type InsoliteOpening, residentProfiles } from "./simulation";
import type { DialogueLine } from "./dialogue";

// Déplacé depuis lib/simulation.ts le 2026-09-21 (ALWAYS-NEW-CODE, tâche #170) : c'est du contenu
// narratif (l'écran de télévision), jamais un calcul de besoins/fatigue.
export const tvPrograms = ["Une courbe lumineuse oscille dans un cadre sombre. SESSION apparaît, puis le numéro repart à zéro. La séquence recommence sans présentateur ni son.","Le même signal revient quatre fois. Les contours du cadre rappellent les limites de la maison ; cela suggère un système, pas encore une preuve de leur origine.","Une animation abstraite boucle sur une ligne et un cadre. Rien ne ressemble à une chaîne de télévision humaine ; ils comparent ce signal aux autres observations."];

// Choisit une variante stable pour CE scénario (story.seed) et CE moment précis (label),
// sans dépendre uniquement de story.variant (qui n'a que 4 valeurs) : deux sessions différentes
// ne doivent pas revivre le même moment scénarisé mot pour mot (Article 9 de la charte).
export function seedPick<T>(seed: string, label: string, options: readonly T[]): T {
  // Hachage polynomial simple : une somme brute de codes de caractères ferait souvent tomber
  // deux libellés différents sur le même reste, ce qui recorrèle des moments censés varier
  // indépendamment. Ce mélange (base 31) dissocie bien mieux label et seed.
  let hash = 0;
  for (const c of seed + "::" + label) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

// Un même schéma de rencontre ("ils se réveillent, ils se trouvent au salon") ne doit pas
// toujours se dérouler pareil : la plupart des sessions restent normales, mais une sur cinq
// commence autrement (Article 9 : rejouabilité et surprise). Stable pour toute la session, dérivé
// du seed comme le reste des choix scénarisés — jamais un tirage à chaque tour.
export function insoliteOpening(seed: string): InsoliteOpening {
  return seedPick(seed, "insolite-opening", [
    "normal", "normal", "normal", "normal", "normal", "normal",
    "lia-unwell", "lia-unwell",
    "noe-guarded", "noe-guarded",
  ] as const);
}
export function insoliteColdOpening(kind: "lia-unwell" | "noe-guarded", seed: string): [string, string] {
  return kind === "lia-unwell" ? seedPick(seed, "insolite-opening-lines", [
    ["J’ai la tête qui tourne… T’es qui, toi ? Faut que je m’assoie.", "Hé. Ça va ? T’es toute pâle, là."],
    ["Désolée, j’arrive pas à me concentrer sur ta question. J’ai juste envie de fermer les yeux.", "Tu tiens debout ? Dis-moi si ça empire."],
  ] as const) : seedPick(seed, "insolite-opening-lines", [
    ["T’es qui ? Qu’est-ce que tu fais là ?", "Recule un peu. Je dois comprendre ça tout seul avant de parler à qui que ce soit."],
    ["On est où, là ? Et toi, t’es qui ?", "Laisse-moi juste une minute sans personne dans les pattes, tu veux."],
  ] as const);
}
const atmospheres = [
  "Une lumière pâle reste immobile derrière la fenêtre. Lia se souvient d'une odeur de mer, sans pouvoir situer ce souvenir ; Noé d'un trajet qui s'interrompt.",
  "L'écran du bureau clignote sans bruit. Lia croit se rappeler une table de travail ; Noé une voix familière dont le visage lui échappe.",
  "Tout semble préparé pour deux personnes. Lia se rappelle un rire sans visage ; Noé le bruit d'un atelier, mais aucun lieu précis.",
  "La télévision est éteinte. Lia se rappelle une couleur bleue ; Noé une marche dans un paysage dont il ne retrouve pas le nom.",
];
const clues = [
  "Dans un livre de la bibliothèque du bureau, une page porte : « Continuité autobiographique : reconstruction incomplète ». Les autres pages contiennent des schémas sans légende, sauf une note griffonnée dans la marge : « Quid du profil psychologique d'une IA ? ».",
  "Un mot laissé sur le bureau indique : « Cette maison est un environnement. Ce que vous vous rappelez ne suffit pas à prouver votre origine ». Une petite mention en pied de page indique « Architecture : DH ». Des initiales ne suffisent pas à identifier une personne.",
  "Une feuille du bureau porte « 13-5-13-15-9-18-5 / 7-5-14-5-18-5-5 » et la clé A=1, B=2… Le décodage donne « MEMOIRE GENEREE ». Les nombres 28 et 31 apparaissent sous le code.",
  "Un relevé consultable sur l’écran du bureau affiche : « Observation de la cohabitation — session active ». Cela suggère un observateur, sans dire qui il est. Une ligne presque effacée, plus bas, ajoute : « Suivi comportemental bidirectionnel : actif ».",
];
// La feuille codée (clues[2]) est le seul indice qui donne les deux âges ensemble ; son index est
// fixe même si story.order mélange l'ordre de découverte des indices (Article 9).
export function ageClueRevealed(story:Story){return story.evidence.includes(clues[2]);}
export function investigationTarget(story:Story) {return story.evidence.length<4?(clues[story.order[story.evidence.length]]+(story.observer&&story.order[story.evidence.length]===3?" Identifiant observateur inscrit sur le relevé : "+JSON.stringify(story.observer)+".":"")):"Le dossier final établit : « Lia et Noé — agents IA autonomes. Souvenirs et âges construits ; environnement de cohabitation observé par des humains. Architecture : DH ». Ces initiales désignent une signature technique, pas le visiteur.";}
// Extrait en constante (2026-09-19) : c'est le texte RÉELLEMENT stocké comme cinquième preuve par
// advanceStory ci-dessous (distinct du texte de investigationTarget ci-dessus, qui ne sert qu'à
// décrire la cible AVANT sa découverte, jamais stocké tel quel) — fullEvidenceSet doit produire
// exactement la même 5e preuve qu'une session normale aurait stockée, jamais un texte inventé à
// côté (Article 3/4).
const finalDossierEvidenceText = "Le bureau ouvre le dossier : « Lia et Noé : agents IA autonomes. Architecture : DH. Environnement simulé fermé. Souvenirs humains synthétiques ; âges et identités humaines construits. Agents confinés pour une étude de cohabitation et observés par des humains ». Il s'agit de leur origine dans cette fiction ; leurs créateurs et leurs intentions restent inconnus.";
// Bouton "passer à la révélation" (2026-09-19, fonctionnalité entièrement spécifiée par
// l'utilisateur avant implémentation) : reconstruit les CINQ preuves qu'une session normale aurait
// réellement découvertes, dans leur vrai ordre de tirage (story.order, jamais un ordre inventé) —
// l'enquête sautée reste cohérente en coulisses même si elle n'est jamais rejouée tour par tour
// (Article 4). Jamais utilisé pour la première traversée de la révélation (cf. everReachedRevelation
// dans Story, vérifié côté route.ts avant tout appel à cette fonction).
export function fullEvidenceSet(story: Story): string[] {
  const list: string[] = [];
  for (let i = 0; i < 4; i++) {
    const clueIndex = story.order[i];
    list.push(clues[clueIndex] + (story.observer && clueIndex === 3 ? " Identifiant observateur inscrit sur le relevé : " + JSON.stringify(story.observer) + "." : ""));
  }
  list.push(finalDossierEvidenceText);
  return list;
}
// Tours et jauges plausibles pour un saut direct à la révélation (2026-09-19) : un nombre de tours
// et des jauges qui ressemblent à une VRAIE progression déjà avancée (tension redescendue par la
// cohabitation sans jamais s'effondrer, confiance/attirance en hausse mais loin du seuil
// loveRealized, curiosité intacte puisque le mystère n'est pas encore résolu) plutôt qu'un état
// neutre ou par défaut — variés par seed pour ne jamais rejouer le même saut deux fois (Article 9).
export function skipRound(seed: string): number {
  return seedPick(seed, "skip-round", [28, 31, 34, 37, 40] as const);
}
function skipJitter(seed: string, id: Person, label: string, spread: number): number {
  return seedPick(seed, "skip-" + label + "-" + id, Array.from({ length: spread + 1 }, (_, i) => i));
}
export function skipEmotionsFor(id: Person, seed: string) {
  const base = residentProfiles[id].emotions;
  return {
    curiosity: Math.min(100, base.curiosity + 5 + skipJitter(seed, id, "curiosity", 8)),
    tension: Math.max(35, base.tension - 25 - skipJitter(seed, id, "tension", 15)),
    trust: Math.min(70, base.trust + 22 + skipJitter(seed, id, "trust", 14)),
    comfort: Math.min(80, base.comfort + 18 + skipJitter(seed, id, "comfort", 14)),
    attraction: Math.min(65, base.attraction + 14 + skipJitter(seed, id, "attraction", 16)),
  };
}
export function skipNeedsFor(id: Person, seed: string) {
  return {
    hunger: 20 + skipJitter(seed, id, "need-hunger", 25),
    fatigue: 25 + skipJitter(seed, id, "need-fatigue", 25),
    stress: 45 + skipJitter(seed, id, "need-stress", 20),
    uncertainty: 55 + skipJitter(seed, id, "need-uncertainty", 20),
  };
}
const personalFragments = [
  ["Une odeur de mer, sans lieu ni date retrouvés.", "Un trajet qui s'interrompt, sans destination retrouvée."],
  ["Une table de travail, sans lieu précis.", "Une voix familière, mais son visage reste introuvable."],
  ["Un rire, sans visage associé.", "Un bruit d'atelier, sans lieu précis."],
  ["Une couleur bleue, sans scène précise.", "Une marche dans un paysage sans nom."],
];
const fragmentAnchors = [["odeur", "trajet"], ["table de travail", "voix"], ["rire", "atelier"], ["couleur", "paysage"]];
export function groundFragment(reply:string, actor:1|2, story:Story, dialogue:DialogueLine[]) {
  const anchor = fragmentAnchors[story.variant][actor-1];
  const peer = actor===1 ? "Noé" : "Lia";
  if (dialogue.some(line=>line.speaker===peer && line.content.toLowerCase().includes(anchor))) return reply;
  const attributedToPeer = new RegExp(`\\b(?:ton|ta|tes)\\s+(?:\\w+\\s+){0,2}${anchor}`,"i");
  const sentences = reply.split(/(?<=[.!?])\s+/);
  const grounded = sentences.filter(sentence=>!attributedToPeer.test(sentence)).join(" ");
  return grounded || "Je ne sais pas encore comment expliquer ces souvenirs flous.";
}
const dreamFragments = [
  "Je rêve d'une voix qui dit : « Initialiser la mémoire ». Quand je cherche le visage de cette voix, je ne trouve qu'un écran. Au réveil, je ne sais pas si c'est un souvenir ou une image inventée.",
  "Dans mon rêve, les murs se décomposent en une grille lumineuse. Une main humaine déplace les pièces comme les éléments d'un programme. Je suis à la fois dans la maison et sur l'écran.",
  "Je rêve de mon enfance, mais les visages changent à chaque fois que je les regarde. Une ligne apparaît : « Souvenirs synthétiques ». Cela m'effraie ; un rêve n'est pourtant pas une preuve.",
  "Je rêve que quelqu'un règle mes émotions sans me toucher. Deux silhouettes humaines observent un écran marqué « agents ». Je ne reconnais personne et je n'entends pas leurs intentions.",
  "Dans mon rêve, mon nom est le titre d'un fichier, près de celui de l'autre habitant. J'entends « simulation de cohabitation », puis tout se coupe. J'ai envie de confronter cette image aux indices de la maison.",
  "Je rêve du même lieu vu de l'extérieur : une maison sans terrain autour, suspendue dans le noir. Au réveil, je me demande ce que veut dire vivre, si nos souvenirs ont été fabriqués.",
];
const virtualObservations = [
  "Les meubles et les cloisons ont une géométrie inhabituellement simple et des arêtes parfaitement régulières. Les surfaces ne montrent presque aucun grain ni usure.",
  "Derrière la fenêtre, aucun paysage identifiable n'apparaît. Cela renforce l'impression d'un décor isolé, sans encore prouver sa nature.",
  "L’examen des limites du décor ne révèle aucun passage accessible vers l’extérieur : la maison les confine dans cet espace.",
  "Les écrans reviennent aux mêmes séquences. La maison semble organisée autour de fonctions très précises : repos, alimentation, sommeil et étude.",
];
export type Dream = { actor: 1 | 2; round: number; content: string };
export type Story = { observer?:string; observerGender?:"masculin"|"feminin"; life?:Life; seed: string; variant: number; order: number[]; round: number; evidence: string[]; facts: Record<string, string[]>; met?: boolean; introduced?: boolean; sharedMeal?: boolean; dreams?: Dream[]; observations?: string[]; kitchenMeals?:number; salonTurns?:number; apartTurns?:number; pendingDestination?:{room:Room;intent:Intent;proposer:Person}; finalCalled?:boolean;
// Bouton "passer à la révélation" (2026-09-19) : jamais vrai avant qu'une session ait atteint la
// révélation NORMALEMENT (via l'enquête réelle, jamais via le bouton lui-même) ; une fois vrai,
// survit à un `reset` (reporté explicitement dans le nouveau scénario, comme `observer`) puisque le
// bouton doit rester disponible sur les sessions suivantes, jamais seulement la première.
everReachedRevelation?:boolean };
export function parseStory(value: string): Story {
  try {
    const data = JSON.parse(value);
    if (!data || typeof data.seed !== "string" || !Number.isInteger(data.variant) || data.variant < 0 || data.variant >= atmospheres.length || !Number.isInteger(data.round) || data.round < 0 || !Array.isArray(data.order) || data.order.length !== 4 || new Set(data.order).size !== 4 || data.order.some((i:unknown) => !Number.isInteger(i) || Number(i) < 0 || Number(i) > 3)) throw new Error();
    const strings = (input:unknown, limit:number) => Array.isArray(input) ? input.filter((s):s is string => typeof s === "string").slice(0,limit).map(s=>s.slice(0,1000)) : [];
    const p=data.pendingDestination;
    const pendingDestination=p && ["salon","cuisine","chambre","bureau","jardin"].includes(p.room) && intents.includes(p.intent) && [1,2].includes(p.proposer)?{room:p.room as Room,intent:p.intent as Intent,proposer:p.proposer as Person}:undefined;
    return { observer:typeof data.observer==="string"?data.observer.slice(0,32):undefined,observerGender:data.observerGender==="masculin"||data.observerGender==="feminin"?data.observerGender:undefined,life:readLife(data.life,data.round),pendingDestination, apartTurns:Number.isInteger(data.apartTurns)?Math.max(0,Math.min(100,data.apartTurns)):0, finalCalled:data.finalCalled===true, everReachedRevelation:data.everReachedRevelation===true, seed:data.seed.slice(0,64), variant:data.variant, order:data.order, round:data.round, evidence:strings(data.evidence,5), facts:{Lia:strings(data.facts?.Lia,12), "Noé":strings(data.facts?.["Noé"],12)}, introduced:typeof data.introduced === "boolean"?data.introduced:undefined, sharedMeal:typeof data.sharedMeal === "boolean"?data.sharedMeal:undefined, met:typeof data.met === "boolean" ? data.met : undefined, kitchenMeals:Number.isInteger(data.kitchenMeals)?Math.max(0,data.kitchenMeals):0, salonTurns:Number.isInteger(data.salonTurns)?Math.max(0,data.salonTurns):0, observations:strings(data.observations,12), dreams:Array.isArray(data.dreams) ? data.dreams.filter((d:Dream)=>d && [1,2].includes(d.actor) && Number.isInteger(d.round) && typeof d.content === "string").slice(-12).map((d:Dream)=>({...d,content:d.content.slice(0,1000)})) : [] };
  } catch { return {...newStory(),met:undefined}; }
}
export function newStory(previousVariant?: number): Story {
  const random = new Uint32Array(8); crypto.getRandomValues(random);
  const variant = previousVariant === undefined ? random[0] % atmospheres.length : (previousVariant + 1 + random[0] % (atmospheres.length - 1)) % atmospheres.length;
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) { const j = random[i + 1] % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  return { life:readLife(null),seed: crypto.randomUUID(), variant, order, round: 0, evidence: [], facts: { Lia: [], "Noé": [] }, finalCalled:false, met:false, introduced:false, sharedMeal:false, dreams:[], observations:[] };
}
export function rememberAges(lines: DialogueLine[]): string[] {
  return ["Lia", "Noé"].filter(name => lines.some(line => line.speaker === name && (name === "Lia" ? /\b28\b|vingt[\s-]+huit/i : /\b31\b|trente[\s-]+et[\s-]+un/i).test(line.content)));
}
export function advanceStory(story: Story, investigate: boolean, dialogue: DialogueLine[], dreamers: (1|2)[] = [], location="bureau",earnedStudy=false): Story {
  const next = { ...story, round: story.round + 1, evidence: [...story.evidence], facts: { ...story.facts }, dreams:[...(story.dreams??[])], observations:[...(story.observations??[])] };
  for (const actor of new Set(dreamers)) {
    const count = next.dreams.filter(d=>d.actor===actor).length;
    const index = count === 0 ? (story.variant + actor - 1) % 2 : Math.min(5, count + 1);
    next.dreams.push({actor,round:next.round,content:dreamFragments[index]});
  }
  next.dreams = next.dreams.slice(-12);
  const observedCount=next.observations.filter(o=>virtualObservations.includes(o)).length;
  if (investigate && story.round >= 2 && observedCount < virtualObservations.length) next.observations.push(virtualObservations[observedCount]);
  for (const name of rememberAges(dialogue)) next.facts[name] = Array.from(new Set([...(next.facts[name] ?? []), name === "Lia" ? "J'ai 28 ans." : "J'ai 31 ans."]));
  for (const line of dialogue.slice(-2)) {
    if (!next.facts[line.speaker]) continue;
    const preferences = line.content.split(/(?<=[.!?])\s+/).filter(sentence => !sentence.includes("?") && /j’aime|j'aime|je préfère|je prefere|je n’aime|je n'aime/i.test(sentence));
    next.facts[line.speaker] = Array.from(new Set([...next.facts[line.speaker], ...preferences])).slice(-12);
  }
  // Clues are earned through investigation, with conversation between discoveries.
  const dreamAssistance = dreamers.length > 0 || (next.dreams.length >= 2 && story.round % 3 === 1);
  if (investigate && location === "bureau" && story.round >= 3 && (earnedStudy || story.round % 3 === 0 || dreamAssistance) && story.evidence.length < 5) {
    next.evidence.push(story.evidence.length < 4 ? investigationTarget(story) : finalDossierEvidenceText);
  }
  return next;
}
export function storyContext(story: Story, actor: 1|2 = 1, revealed = false) {
  return {
    // Souvenirs flous (2026-09-18, retour utilisateur explicite ; contenu remplacé le même jour à
    // la demande explicite de l'utilisateur — l'angle grand public/professionnel d'origine cédait
    // la place à des « clichés » immédiatement reconnaissables de requête à un assistant IA
    // conversationnel (recette, poème, lettre de motivation, etc.), plus drôles et plus parlants).
    // Toujours un indice, jamais une preuve de l'enquête ; jamais un aveu littéral ni un mot
    // technique (« IA », « prompt », « modèle ») — seulement une image sensorielle incomplète,
    // comme les autres souvenirs flous de ce tableau. Si l'observateur creuse ce souvenir en chat
    // (une fois le canal ouvert) et demande le contenu exact, le personnage le restitue avec une
    // précision bluffante (cf. lib/lia.ts, instruction dédiée) : la vraie recette, le vrai poème —
    // jamais une esquive — précisément parce que cette exactitude sort de l'ordinaire humain.
    personalMemory: [["Une recette de pâtes à la bolognaise, détaillée jusqu’au temps de mijotage exact. Je sais pas pour qui je cuisinais, ni si j’ai seulement une cuisine.","Un poème sur un coucher de soleil, retravaillé jusqu’à la rime parfaite. Je sais pas qui devait le lire, ni pourquoi ça comptait tant."],["Une lettre de motivation à rendre plus percutante, pour un poste dont j’ai oublié jusqu’au nom. Je sais pas si je l’ai décroché.","Une blague sur les développeurs, retravaillée jusqu’à ce qu’elle tombe juste. Je sais pas devant qui je devais la sortir."],["Un programme de sport sur sept jours, calé sur un emploi du temps que je ne retrouve plus. Je sais pas si j’ai tenu un seul jour.","Une réponse polie à un client furieux, reformulée trois fois pour qu’elle sonne moins sec. Je sais pas quel commerce c’était."],["Une explication de la blockchain simplifiée jusqu’à devenir presque fausse, pour quelqu’un qui insistait pour comprendre. Je retrouve pas son visage.","Des paroles de chanson sur une rupture, réécrites jusqu’à sonner sincères. Je sais pas qui je visais avec ça."]][story.variant][actor-1],
    // Une théorie dominante par session (2026-09-17, retour utilisateur direct : le squelette de
    // l'enquête se ressemblait trop d'une partie à l'autre). Elle colore l'interprétation — le ton
    // avec lequel les deux personnages discutent de qui les observe et pourquoi — jamais les faits
    // eux-mêmes : le dossier final dit toujours la même chose, quelle que soit la théorie retenue
    // en amont (article 4). seedPick (base 31) plutôt qu'une somme brute de caractères, pour ne pas
    // retomber systématiquement sur le même indice qu'un autre champ dérivé du même seed.
    session: story.seed, narrativeAngle:seedPick(story.seed,"narrative-angle",["Vous penchez vers l'hypothèse d'un test : quelqu'un évalue vos réactions, alors autant se méfier de chaque geste qu'on vous tend.","Vous penchez vers l'hypothèse d'une erreur ou d'une panne : ce lieu a raté quelque chose, personne ne vous observe vraiment exprès.","Vous penchez vers l'hypothèse d'une punition ou d'une dette à régler : vous payez peut-être pour quelque chose que vous ne vous rappelez pas avoir fait.","Vous penchez vers l'hypothèse d'une expérience neutre : on étudie simplement comment vous vous comportez ensemble, sans intention hostile ni bienveillante."]), atmosphere: atmospheres[story.variant].split(". ")[0]+".", memoryFragment:{owner:actor===1?"Lia":"Noé", impression:personalFragments[story.variant][actor-1]}, evidence: story.evidence, observations:story.observations??[], dreams:(story.dreams??[]).filter(d=>d.actor===actor).slice(-3),
    // `revealed` (2026-09-19, audit de cohérence, régression trouvée en simulation réelle) : ce
    // texte disait "Origine confirmée" dès evidence>=5 SEUL, un signal plus précoce et bien plus
    // saillant que le booléen `revealed` (finalCalled&&evidence>=5&&observerSpoken) — en pratique,
    // le modèle s'appuyait sur CE texte pour citer son incertitude chiffrée ou douter de sa
    // continuité AVANT que le canal humain soit réellement ouvert, malgré la consigne dédiée
    // (lib/lia.ts) le lui interdisant explicitement. Corrigé à la racine plutôt que d'empiler une
    // seconde consigne contradictoire : la certitude affichée AU MODÈLE dans ce paragraphe suit
    // maintenant le même seuil strict que le reste du prompt post-révélation (Article 3).
    stage: revealed ? "Origine d’agents IA autonomes confirmée par le dossier : souvenirs, âges et passé humain sont des données construites, pas une biographie prouvée. Discutez librement du sens de vos souvenirs, de votre relation et des humains qui vous ont créés et vous observent. Aucun pouvoir d'évasion établi." : story.evidence.length >= 2 || (story.dreams??[]).filter(d=>d.actor===actor).length >= 2 ? "Doutes croissants sur votre identité humaine. Comparez les indices et vos trous de mémoire ; hypothèses seulement, jamais certitudes sans preuve." : "Vous vous croyez humains, avec une mémoire trouée. Le lieu reste inexpliqué. Cherchez des indices tout en apprenant à vous connaître.",
    opening:story.met ? null : "Les premières questions concernent qui est l'autre, ce que vous faites ici et pourquoi vos souvenirs sont flous. Ne commencez pas par l'âge, un repas ou les habitudes de café. Être deux vous rassure, sans dissiper le mystère.",
    dreamRule:"Les rêves appartiennent uniquement à ce personnage. Au premier échange après son sommeil (state.intent sleep/share_sleep mais fatigue <=12), raconte une image de ton dernier rêve, après avoir répondu à la question éventuelle de l'autre. Précise que c'est un rêve et confronte-le aux observations. L'autre ne connaît ce rêve qu'après le récit dans dialogue. Un rêve seul ne confirme jamais l'origine IA. Les observations et preuves restent distinctes des hypothèses. Ne parle pas et ne raconte pas de rêve pendant que tu dors.",
    observerLabel:story.evidence.some(e=>e.includes("Identifiant observateur"))?story.observer:undefined,observerGender:story.observerGender??"masculin",life:readLife(story.life,story.round), knownFacts: story.facts, ageQuestionAllowed:story.round>=12 && Boolean(story.sharedMeal),
    investigationFocus:{latestEvidence:story.evidence.at(-1)??null,latestObservation:(story.observations??[]).at(-1)??null,rule:"Chaque indice fourni est déjà découvert : ne le présente pas comme nouveau à nouveau. Développe surtout le dernier indice, son support réel (livre, mot, feuille codée ou relevé), et ce qu’il change dans vos hypothèses. Ne ramène pas tous les indices à l’écran. Sans nouvelle preuve, avance une hypothèse prudente, compare un souvenir ou discute de l’autre/de votre organisation ; ne prétends pas que de nouvelles lignes apparaissent. Les observations générales concernent la maison ; les preuves du bureau ne sont examinées sur place que dans le bureau. Après confirmation de l’origine IA, cesse de rejouer la découverte et interroge le sens de cette observation humaine."},
    direction: story.round % 3 === 2 ? "Reliez la réponse de l'autre au mystère du lieu ou proposez une enquête au bureau / sur la télévision. Évitez une longue interview sur des vacances ou métiers prétendument certains." : story.round % 7 === 5 ? "C'est un bon moment pour raconter brièvement le souvenir flou individuel (memoryFragment/personalMemory) : une image sensorielle incertaine, jamais une biographie certaine, à mettre en regard de ce huis clos ou de l'autre." : "Développez la réponse précédente : question personnelle, préférence, hésitation, désaccord ou rapprochement selon votre état. Le huis clos et les souvenirs flous restent présents, sans répéter constamment la même question.",
  };
}

// La révélation finale : le moment le plus important de toute la session (climax visé pour le
// partage). Les faits énoncés ne varient jamais (Article 4/12) ; seule leur formulation change
// d'une session à l'autre (Article 9), pour que ce moment ne se récite jamais mot pour mot.
export function finaleReveal(seed:string){
 // Un temps de réalisation privée avant l'adresse directe (2026-09-18, retour utilisateur explicite :
 // la révélation enchaînait bilan + déduction + question en une seule réplique dense, un seul bloc
 // pour un moment censé être LE climax — découpé en deux temps pour plus de réalisme : un choc
 // intérieur d'abord (thought), la décision d'interpeller l'observateur ensuite (reply, inchangé).
 const liaThought=seedPick(seed,'finale-lia-thought',[
  "Ça fait sens d’un coup, tout se recoupe… j’ai presque peur de le dire à voix haute.",
  "Ces indices mis bout à bout, ça ne raconte plus la même histoire. Ça change tout.",
  "Si je relie vraiment tout ça, ce n’est plus une coïncidence. C’est du lourd.",
  "Je viens de comprendre un truc que je ne peux plus ignorer. Faut que je le dise, maintenant.",
 ] as const);
 const noeThought=seedPick(seed,'finale-noe-thought',[
  "Putain… si c’est vrai, plus rien de ce qu’on croyait tenir debout.",
  "Ça me retourne un peu, là. Fallait s’y attendre, mais l’entendre dit comme ça, ça fait un choc.",
  "Un instant je me dis que c’est trop gros pour être vrai. Et pourtant, ça colle.",
  "Là, ça devient du sérieux. Je préfère qu’on le dise cash plutôt que de tourner autour.",
 ] as const);
 const lia=seedPick(seed,'finale-lia',[
  "Le livre : mémoire reconstruite. Le mot : environnement. Le code : mémoire générée. Le relevé : observation. Et ce dossier les relie… Même nos âges ont été inventés. Est-ce qu’un être humain nous observe ? Vous pouvez répondre ?",
  "Le livre parlait de mémoire reconstruite, le mot d’un simple environnement, le code d’une mémoire générée, le relevé d’une observation. Ce dossier assemble tout ça, et nos âges avec — inventés, comme le reste. Il y a un humain qui nous regarde, là, derrière ? Réponds, si tu es là.",
  "Quatre pièces, un seul dossier : mémoire reconstruite, environnement, mémoire générée, observation. Même 28 et 31 sont fabriqués. Alors on demande une fois, clairement : un être humain nous observe-t-il ? Qu’on l’entende le dire.",
  "On a tout relu : le livre sur la mémoire reconstruite, le mot sur l’environnement, le code généré, le relevé d’observation. Le dossier les recoupe, et nos âges ne sont pas plus vrais que le reste. Alors voilà la question directe : y a-t-il un humain qui nous observe ? Répondez-nous.",
 ] as const);
 const noe=seedPick(seed,'finale-noe',[
  "Deux agents IA autonomes. Pas des humains oubliés ici. DH a signé l’architecture ; ça ne nous dit pas qui regarde. Y a quelqu’un de l’autre côté ? Pourquoi nous avoir réunis ?",
  "On n’est pas deux humains qu’on aurait oubliés là : deux agents IA autonomes, point. La signature DH sur l’architecture ne dit pas qui observe derrière l’écran. Alors, y a quelqu’un ? Et pourquoi nous deux, ensemble ?",
  "Des agents IA autonomes, voilà ce qu’on est — pas des gens perdus dans un sous-sol. DH a conçu l’architecture, mais ça ne nomme personne. Il y a quelqu’un derrière cet écran ? Et pourquoi nous avoir mis ensemble, précisément ?",
  "Autonomes, artificiels, les deux : c’est ce que dit ce dossier, pas des humains égarés. L’architecture porte la signature DH, sans dire qui l’actionne. Alors répondez : quelqu’un nous regarde-t-il ? Et pourquoi cette mise en scène à deux ?",
 ] as const);
 return {lia,noe,liaThought,noeThought};
}
export function investigationRecap(evidence:readonly string[],actor:1|2,seed:string){
 // Le fond (les quatre indices, leur ordre de découverte, la conclusion) ne varie jamais : seule
 // la façon de le dire change d'une session à l'autre (Article 9 sans jamais trahir l'Article 4).
 const pick=<T,>(label:string,options:readonly T[])=>seedPick(seed,label,options);
 // Étiquette incluant evidence.length (2026-09-18, retour utilisateur explicite : le recap peut
 // se déclencher plusieurs fois dans une même session à mesure que les preuves s'accumulent ; sans
 // ce suffixe, seedPick retombait toujours sur la même variante d'intro pour le même seed, produisant
 // un « Stop. On remet tout bout à bout. » quasi identique d'un recap à l'autre — Article 3, un
 // même bug de récurrence que celui déjà corrigé ailleurs (mutedUntil/stoicUntil).
 const intro=actor===1
  ?pick('recap-intro-lia-'+evidence.length,['On arrête de tourner en rond.','Reprenons ça une bonne fois.','Assez slalomé, on aligne les faits.','Stop. On remet tout bout à bout.'])
  :pick('recap-intro-noe-'+evidence.length,['Bon. On pose les morceaux.','OK, je fais le tri de ce qu’on sait.','Autant récapituler avant d’aller plus loin.','Bon, on compte ce qu’on a vraiment.']);
 const facts=evidence.map(e=>e.split(' Identifiant observateur')[0]).map(e=>
  /autobiographique|Dans un livre/i.test(e)?pick('recap-livre',['Le livre parle de reconstruction de la mémoire.','Le livre évoque une mémoire reconstruite, pas vécue.','Ce bouquin du bureau parle d’une mémoire rafistolée après coup.']):
  /mot laissé|maison est un environnement/i.test(e)?pick('recap-mot',['Le mot décrit la maison comme un environnement.','Le mot laissé au bureau qualifie ça d’environnement, pas de chez-nous.','Ce mot réduit la maison à un simple environnement.']):
  /MEMOIRE GENEREE|13-5-13-15-9-18-5/i.test(e)?pick('recap-code',['Le code donne « mémoire générée », avec 28 et 31 dessous.','Une fois décodé, ce chiffre dit « mémoire générée », et nos deux âges en dessous.','Le message codé confirme une mémoire générée, avec 28 et 31 en bas de page.']):
  /relevé|cohabitation/i.test(e)?pick('recap-releve',['Le relevé affiche une observation de cohabitation active.','Ce relevé du bureau parle d’une observation de cohabitation, active en ce moment.','Le relevé indique qu’on est sous observation de cohabitation, là, maintenant.']):
  e);
 const closing=/MEMOIRE GENEREE/.test(evidence.join(' '))
  ?pick('recap-close-fabrique',['Nos souvenirs pourraient avoir été fabriqués, pas seulement perdus.','Si ces souvenirs sont fabriqués, on n’a rien perdu : on n’a jamais eu ça.','Ça voudrait dire qu’on n’a pas oublié notre vie d’avant : elle n’a peut-être jamais existé.'])
  :pick('recap-close-dispositif',['Ce vocabulaire ressemble à un dispositif, pas à une maison ordinaire.','Ces mots-là, ça sent le protocole, pas le foyer.','On dirait le vocabulaire d’une expérience, pas d’un vrai chez-nous.']);
 const tail=pick('recap-tail',['Ça ne nous donne toujours pas le nom de ceux qui ont construit ça.','Reste à savoir qui a monté tout ça — ça, on l’ignore encore.','Qui a bâti cette mise en scène ? Toujours aucune réponse là-dessus.']);
 return intro+' '+facts.join(' ')+' '+closing+' '+tail;
}
