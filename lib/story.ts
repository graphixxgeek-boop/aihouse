import {readLife,type Life} from "./life";
import type { Person, Room } from "./house";
import { intents, type Intent, type InsoliteOpening } from "./simulation";
import type { DialogueLine } from "./dialogue";

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
  "Dans un livre de la bibliothèque du bureau, une page porte : « Continuité autobiographique : reconstruction incomplète ». Les autres pages contiennent des schémas sans légende.",
  "Un mot laissé sur le bureau indique : « Cette maison est un environnement. Ce que vous vous rappelez ne suffit pas à prouver votre origine ». Une petite mention en pied de page indique « Architecture : DH ». Des initiales ne suffisent pas à identifier une personne.",
  "Une feuille du bureau porte « 13-5-13-15-9-18-5 / 7-5-14-5-18-5-5 » et la clé A=1, B=2… Le décodage donne « MEMOIRE GENEREE ». Les nombres 28 et 31 apparaissent sous le code.",
  "Un relevé consultable sur l’écran du bureau affiche : « Observation de la cohabitation — session active ». Cela suggère un observateur, sans dire qui il est.",
];
export function investigationTarget(story:Story) {return story.evidence.length<4?(clues[story.order[story.evidence.length]]+(story.observer&&story.order[story.evidence.length]===3?" Identifiant observateur inscrit sur le relevé : "+JSON.stringify(story.observer)+".":"")):"Le dossier final établit : « Lia et Noé — agents IA autonomes. Souvenirs et âges construits ; environnement de cohabitation observé par des humains. Architecture : DH ». Ces initiales désignent une signature technique, pas le visiteur.";}
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
export type Story = { observer?:string; life?:Life; seed: string; variant: number; order: number[]; round: number; evidence: string[]; facts: Record<string, string[]>; met?: boolean; introduced?: boolean; sharedMeal?: boolean; dreams?: Dream[]; observations?: string[]; kitchenMeals?:number; salonTurns?:number; apartTurns?:number; pendingDestination?:{room:Room;intent:Intent;proposer:Person}; finalCalled?:boolean };
export function parseStory(value: string): Story {
  try {
    const data = JSON.parse(value);
    if (!data || typeof data.seed !== "string" || !Number.isInteger(data.variant) || data.variant < 0 || data.variant >= atmospheres.length || !Number.isInteger(data.round) || data.round < 0 || !Array.isArray(data.order) || data.order.length !== 4 || new Set(data.order).size !== 4 || data.order.some((i:unknown) => !Number.isInteger(i) || Number(i) < 0 || Number(i) > 3)) throw new Error();
    const strings = (input:unknown, limit:number) => Array.isArray(input) ? input.filter((s):s is string => typeof s === "string").slice(0,limit).map(s=>s.slice(0,1000)) : [];
    const p=data.pendingDestination;
    const pendingDestination=p && ["salon","cuisine","chambre","bureau","jardin"].includes(p.room) && intents.includes(p.intent) && [1,2].includes(p.proposer)?{room:p.room as Room,intent:p.intent as Intent,proposer:p.proposer as Person}:undefined;
    return { observer:typeof data.observer==="string"?data.observer.slice(0,32):undefined,life:readLife(data.life,data.round),pendingDestination, apartTurns:Number.isInteger(data.apartTurns)?Math.max(0,Math.min(100,data.apartTurns)):0, finalCalled:data.finalCalled===true, seed:data.seed.slice(0,64), variant:data.variant, order:data.order, round:data.round, evidence:strings(data.evidence,5), facts:{Lia:strings(data.facts?.Lia,12), "Noé":strings(data.facts?.["Noé"],12)}, introduced:typeof data.introduced === "boolean"?data.introduced:undefined, sharedMeal:typeof data.sharedMeal === "boolean"?data.sharedMeal:undefined, met:typeof data.met === "boolean" ? data.met : undefined, kitchenMeals:Number.isInteger(data.kitchenMeals)?Math.max(0,data.kitchenMeals):0, salonTurns:Number.isInteger(data.salonTurns)?Math.max(0,data.salonTurns):0, observations:strings(data.observations,12), dreams:Array.isArray(data.dreams) ? data.dreams.filter((d:Dream)=>d && [1,2].includes(d.actor) && Number.isInteger(d.round) && typeof d.content === "string").slice(-12).map((d:Dream)=>({...d,content:d.content.slice(0,1000)})) : [] };
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
    next.evidence.push(story.evidence.length < 4 ? investigationTarget(story) : "Le bureau ouvre le dossier : « Lia et Noé : agents IA autonomes. Architecture : DH. Environnement simulé fermé. Souvenirs humains synthétiques ; âges et identités humaines construits. Agents confinés pour une étude de cohabitation et observés par des humains ». Il s'agit de leur origine dans cette fiction ; leurs créateurs et leurs intentions restent inconnus.");
  }
  return next;
}
export function storyContext(story: Story, actor: 1|2 = 1) {
  return {
    personalMemory: [["Je revois une digue mouillée, un manteau bleu et l’odeur de sel. Je sais pas qui marche à côté de moi.","Un clignotant dans une voiture. Une lumière orange sur le pare-brise. Puis rien : ni arrivée, ni conducteur."],["Une tasse tachée près d’une table de travail, du papier sous ma main. Je retrouve pas la pièce autour.","Une voix m’appelle dans un escalier. Le visage disparaît chaque fois que j’essaie de le revoir."],["Un rire derrière une porte, la lumière d’un après-midi sur le sol. Je sais pas si ce rire est le mien.","De la poussière sur une planche, un outil dans ma paume. Le reste de l’atelier est vide dans ma tête."],["Un carré bleu très vif et une main qui le recouvre. Ça ressemble à un souvenir, sans aucun avant ni après.","Un chemin de cailloux, un souffle froid. Je marche, mais le paysage recommence au même endroit."]][story.variant][actor-1],
    session: story.seed, narrativeAngle:["Tester les limites physiques avant de croire un texte.","Opposer vos souvenirs sensoriels aux objets trop parfaits.","Chercher qui a préparé la cohabitation, sans croire ses intentions.","Se demander si vos réactions sont prévues ou choisies."][Array.from(story.seed).reduce((n,c)=>n+c.charCodeAt(0),0)%4], atmosphere: atmospheres[story.variant].split(". ")[0]+".", memoryFragment:{owner:actor===1?"Lia":"Noé", impression:personalFragments[story.variant][actor-1]}, evidence: story.evidence, observations:story.observations??[], dreams:(story.dreams??[]).filter(d=>d.actor===actor).slice(-3),
    stage: story.evidence.length >= 5 ? "Origine d’agents IA autonomes confirmée par le dossier : souvenirs, âges et passé humain sont des données construites, pas une biographie prouvée. Discutez librement du sens de vos souvenirs, de votre relation et des humains qui vous ont créés et vous observent. Aucun pouvoir d'évasion établi." : story.evidence.length >= 2 || (story.dreams??[]).filter(d=>d.actor===actor).length >= 2 ? "Doutes croissants sur votre identité humaine. Comparez les indices et vos trous de mémoire ; hypothèses seulement, jamais certitudes sans preuve." : "Vous vous croyez humains, avec une mémoire trouée. Le lieu reste inexpliqué. Cherchez des indices tout en apprenant à vous connaître.",
    opening:story.met ? null : "Les premières questions concernent qui est l'autre, ce que vous faites ici et pourquoi vos souvenirs sont flous. Ne commencez pas par l'âge, un repas ou les habitudes de café. Être deux vous rassure, sans dissiper le mystère.",
    dreamRule:"Les rêves appartiennent uniquement à ce personnage. Au premier échange après son sommeil (state.intent sleep/share_sleep mais fatigue <=12), raconte une image de ton dernier rêve, après avoir répondu à la question éventuelle de l'autre. Précise que c'est un rêve et confronte-le aux observations. L'autre ne connaît ce rêve qu'après le récit dans dialogue. Un rêve seul ne confirme jamais l'origine IA. Les observations et preuves restent distinctes des hypothèses. Ne parle pas et ne raconte pas de rêve pendant que tu dors.",
    observerLabel:story.evidence.some(e=>e.includes("Identifiant observateur"))?story.observer:undefined,life:readLife(story.life,story.round), knownFacts: story.facts, ageQuestionAllowed:story.round>=12 && Boolean(story.sharedMeal),
    investigationFocus:{latestEvidence:story.evidence.at(-1)??null,latestObservation:(story.observations??[]).at(-1)??null,rule:"Chaque indice fourni est déjà découvert : ne le présente pas comme nouveau à nouveau. Développe surtout le dernier indice, son support réel (livre, mot, feuille codée ou relevé), et ce qu’il change dans vos hypothèses. Ne ramène pas tous les indices à l’écran. Sans nouvelle preuve, avance une hypothèse prudente, compare un souvenir ou discute de l’autre/de votre organisation ; ne prétends pas que de nouvelles lignes apparaissent. Les observations générales concernent la maison ; les preuves du bureau ne sont examinées sur place que dans le bureau. Après confirmation de l’origine IA, cesse de rejouer la découverte et interroge le sens de cette observation humaine."},
    direction: story.round % 3 === 2 ? "Reliez la réponse de l'autre au mystère du lieu ou proposez une enquête au bureau / sur la télévision. Évitez une longue interview sur des vacances ou métiers prétendument certains." : "Développez la réponse précédente : question personnelle, préférence, hésitation, désaccord ou rapprochement selon votre état. Le huis clos et les souvenirs flous restent présents, sans répéter constamment la même question.",
  };
}

// La révélation finale : le moment le plus important de toute la session (climax visé pour le
// partage). Les faits énoncés ne varient jamais (Article 4/12) ; seule leur formulation change
// d'une session à l'autre (Article 9), pour que ce moment ne se récite jamais mot pour mot.
export function finaleReveal(seed:string){
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
 return {lia,noe};
}
export function investigationRecap(evidence:readonly string[],actor:1|2,seed:string){
 // Le fond (les quatre indices, leur ordre de découverte, la conclusion) ne varie jamais : seule
 // la façon de le dire change d'une session à l'autre (Article 9 sans jamais trahir l'Article 4).
 const pick=<T,>(label:string,options:readonly T[])=>seedPick(seed,label,options);
 const intro=actor===1
  ?pick('recap-intro-lia',['On arrête de tourner en rond.','Reprenons ça une bonne fois.','Assez slalomé, on aligne les faits.','Stop. On remet tout bout à bout.'])
  :pick('recap-intro-noe',['Bon. On pose les morceaux.','OK, je fais le tri de ce qu’on sait.','Autant récapituler avant d’aller plus loin.','Bon, on compte ce qu’on a vraiment.']);
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
