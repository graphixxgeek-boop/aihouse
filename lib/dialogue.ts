export type DialogueLine = {
    id: number;
    speaker: string;
    content: string;
};
export function explicitGestureConsent(reply:string) {
    if(/pas (?:envie|prête|prêt|maintenant)|je préfère|attends|\bnon\b|je ne veux/i.test(reply))return false;
    if(/répit|calme|pause|silence|énigme|mystère/i.test(reply)&&!/câlin|bisou|embrass|massage|bras|dormir ensemble/i.test(reply))return false;
    const direct=/j[’'](?:en )?ai (?:très |bien )?envie|j[’']aimerais (?:bien|beaucoup)|volontiers|d[’']accord|tu peux|embrasse-moi|prends-moi|je veux bien/i.test(reply);
    const shortYes=/^oui[,.! ]/i.test(reply)&&reply.length<55&&!/répit|calme|pause|silence|énigme|mystère/i.test(reply);
    return direct||shortYes;
}
// Deux points d'interrogation dans une même réplique noient le premier sous le second (règle
// "zéro ou une question", lib/lia.ts) — qu'ils viennent du modèle ou d'un ajout scripté du moteur
// qui se greffe sur une réplique qui posait déjà sa propre question (ex. la découverte de la
// fenêtre, 2026-09-18 : constaté en simulation réelle, Noé ne réagissait plus au jardin mentionné
// car noyé dans une réplique à deux questions). Ne garde que la DERNIÈRE question — la plus
// récente, donc la plus susceptible d'attendre une vraie réponse — et transforme les précédentes
// en points, sans toucher au reste du texte.
export function groundSingleQuestion(reply:string):string{
    const count=(reply.match(/\?/g)??[]).length;
    if(count<2)return reply;
    let remaining=count-1,result="";
    for(const ch of reply){
        if(ch==="?"&&remaining>0){result=result.replace(/\s+$/,"")+".";remaining--;}
        else result+=ch;
    }
    return result;
}
// Filet de sécurité ciblé, pas une liste de mots interdits dans le prompt (Article 17, corollaire
// de CLAUDE.md) : « poireauter » avait déjà été banni littéralement dans le prompt en 2026-09-17
// puis retiré au profit d'un test de registre auto-appliqué (SIGNAL D'ALERTE SUPPLÉMENTAIRE,
// lib/lia.ts) — mais ce mot précis est réapparu une seconde fois le 2026-09-18 malgré ce test,
// preuve qu'un principe auto-appliqué ne garantit jamais rien à 100 %. Cette correction déterministe
// vit dans le CODE, pas dans le contenu envoyé au modèle : elle ne grandit jamais en une liste de
// mots créatifs interdits, elle corrige juste après coup un mot déjà identifié deux fois comme daté,
// exactement comme les autres fonctions ground* corrigent d'autres non-conformités du modèle.
export function groundRegister(reply:string):string{
    return reply.replace(/poireaut/gi,m=>m[0]==="P"?"Traîn":"traîn");
}
// Filet de robustesse (Article 5) contre une réplique coupée net par le modèle lui-même — constaté
// en session réelle le 2026-09-18 : Noé répondait "J'arrive, voyons ce que ce" sans qu'aucune
// étape du moteur n'y soit pour quelque chose, la troncature était déjà dans la sortie brute de
// Gemini (probablement un arrêt anticipé sur la mention "DH"). Garde tout ce qui précède la
// dernière ponctuation de fin de phrase repérée ; sans aucune phrase complète, retombe sur une
// formule neutre plutôt que de laisser une phrase inachevée à l'écran.
export function groundTruncation(reply:string):string{
    const trimmed=reply.trim();
    // L'espace avant le guillemet fermant est l'espacement déjà en usage dans tout le code pour les
    // citations (« … » lib/story.ts, l'indice du miroir) — sans le tolérer ici, une réplique
    // correctement ponctuée mais se terminant par une citation se faisait amputer de son guillemet
    // fermant, jugée à tort incomplète (trouvé le 2026-09-18 en fiabilisant l'indice du miroir).
    if(!trimmed||/[.!?…]\s?["»]?$/.test(trimmed))return trimmed;
    const lastComplete=trimmed.match(/^[\s\S]*[.!?…]\s?["»]?/);
    if(lastComplete&&lastComplete[0].trim())return lastComplete[0].trim();
    return "Bref, on verra.";
}
export function groundAgeQuestion(reply:string,allowed:boolean,knownAges:string[]=[],peer="") {
    if(allowed&&!knownAges.includes(peer))return reply;
    const sentences=reply.split(/(?<=[.!?])\s+/).filter(s=>!(/âge|ans\s*\?/i.test(s)&&s.includes("?")));
    return sentences.join(" ").trim()||"Qu’est-ce qui te rassurerait un peu, ici ?";
}
export function groundScreenNotice(reply:string, history:DialogueLine[], alreadyKnown=false) {
    if (/bureau/i.test(reply) && /écran/i.test(reply) && /aller|allons|regarder|consulter|voir|examiner/i.test(reply) && !/repéré|j['’]ai vu|je vois|aperçu/i.test(reply) && !alreadyKnown && !history.some(line=>line.speaker==="Noé" && /écran/i.test(line.content))) return "J’ai repéré un écran dans le bureau. "+reply;
    if(alreadyKnown) return reply.replace(/J[’']ai repéré un écran dans le bureau[.,]?\s*/i,"").trim() || "Qu’est-ce que tu penses de cet écran du bureau ?";
    return reply;
}
// Filet de robustesse (Article 5.3, 2026-09-18, cas réel trouvé en simulation : « voir si l'écran
// de la télé crache autre chose que des vagues en boucle » dit AVANT toute première mise en
// marche) — aucune réplique ne peut prétendre connaître le contenu réel de la tv avant que
// life.remoteFound soit vrai. Retire la prétention de contenu déjà connu, garde l'intention de
// vérifier, dans le même registre que la phrase d'origine plutôt qu'un remplacement générique.
export function groundTvNotice(reply:string, tvKnown:boolean){
    if(tvKnown)return reply;
    return reply.split(/(?<=[.!?])\s+/).map(sentence=>(/\btv\b|télévision|télé\b/i.test(sentence)&&/crache|diffuse|affiche|montre|balance|passe|projette/i.test(sentence))?sentence.replace(/(?:crache|diffuse|affiche|montre|balance|passe|projette)[^.!?]*/i,"affiche vraiment quelque chose"):sentence).join(" ");
}
export function groundIntroduction(reply: string, name: string, otherName: string, history: DialogueLine[], knownNames: string[] = []) {
    const introduced = (person: string) => knownNames.includes(person) || history.some(line => line.speaker === person && line.content.includes(person));
    let result = name === "Lia" ? reply.replace(/(tu (?:as|avais) quel âge|quel âge as-tu)[^?]*Lia[^?]*\?/i,"Tu as quel âge ?") : reply.replace(/(tu (?:as|avais) quel âge|quel âge as-tu)[^?]*Noé[^?]*\?/i,"Tu as quel âge ?");
    if (!introduced(otherName)) result = result.split(otherName).join("").replace(/\s+([,.!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
    if (!introduced(name) && !result.includes(name)) {
        const end = result.search(/[.!?]/);
        result = end < 0 ? `${result}. Moi, c’est ${name}.` : `${result.slice(0,end+1)} Moi, c’est ${name}.${result.slice(end+1)}`;
    }
    if (introduced(name)) result=result.split(/(?<=[.!?])\s+/).filter(sentence=>!new RegExp("(?:moi[, ]*[’']?c[’']est|je m[’']appelle|mon prénom (?:est|c[’']est))\\s*"+name,"i").test(sentence)).join(" ").trim();
    return result || "Je t’écoute.";
}
export function nextSpeaker(history: DialogueLine[], fallback: 1 | 2): 1 | 2 {
    const last = history.filter(line => line.speaker === "Lia" || line.speaker === "Noé").at(-1);
    return last ? last.speaker === "Lia" ? 2 : 1 : fallback;
}
export function dialogueContext(history: DialogueLine[], name: string) {
    const dialogue = history.filter(line => line.speaker === "Lia" || line.speaker === "Noé").slice(-24);
    const last = dialogue.at(-1);
    return { dialogue, replyTarget: last && last.speaker !== name ? last : null, continuation: last?.speaker === name ? "Tu as parlé en dernier. Ne réponds pas à ta propre question ; laisse l'autre répondre, ou ajoute seulement une observation sans question." : "Réponds d'abord au dernier propos exact de l'autre." };
}
export function completedActivity(agent: {
    name: string;
    cycle: number;
    intent: string;
    room: string;
    needs: {
        hunger: number;
        fatigue: number;
    };
}) {
    if (!agent.cycle)
        return null;
    const facts: Record<string, string> = { eat: "Un repas simple a été cuisiné et mangé. Les ingrédients ne sont pas précisés.", sleep: "Une période de sommeil a eu lieu.", share_sleep: "Une période de sommeil partagé, accepté par les deux, a eu lieu.", rest: "Un temps de repos a eu lieu.", study: "Un temps de réflexion a eu lieu, sans découverte d'indice ni explication de leur venue.", tv: "Une émission fictive a été regardée.", hug: "Un câlin consenti a eu lieu.", kiss: "Des bisous consentis ont eu lieu.", massage: "Un massage consenti a eu lieu." };
    return facts[agent.intent] ? { name: agent.name, fact: facts[agent.intent], room: agent.room, hunger: agent.needs.hunger, fatigue: agent.needs.fatigue } : null;
}
export function conversationFocus(history: DialogueLine[], current: {
    intent: string;
    room: string;
    cycle: number;
}, other: {
    intent: string;
    room: string;
}, knownAges: string[] = [], ageQuestionAllowed=true) {
    const recent = history.slice(-6).map(l => l.content.toLowerCase()).join(" ");
    if (ageQuestionAllowed && knownAges.length < 2 && !(["28", "31"].every(age => history.some(l => l.content.includes(age)))))
        return "Faites connaissance : demande naturellement l’âge de l’autre si cette question n’a pas déjà été posée. Donne ton propre âge si on te le demande.";
    const topics = ["Ce que tu apprécies dans une journée ordinaire : goût personnel, envie ou habitude simple.", "Ce qui te rassure ou te met mal à l’aise dans cette cohabitation.", "Quel espace personnel et quel rythme de vie vous aimeriez préserver.", "Un petit projet concret à mener ensemble ici, sans inventer la cause de votre venue.", "Ce qui te plaît chez l’autre, seulement si l’attirance et le contexte le permettent."];
    if (/calme|souffler|repos|silence/.test(recent))
        return "Ne répète plus que le calme fait du bien. Profite de cette pause pour poser une vraie question personnelle, rebondir sur la réponse ou raconter une préférence simple. " + topics[Math.floor(current.cycle / 2) % topics.length];
    return topics[Math.floor(current.cycle / 2) % topics.length];
}

// isRelationalThought() (2026-09-22, extrait de groundPrivateThought() pour être réutilisée par
// app/api/lia/route.ts::loveRealized — Article 3, jamais une seconde copie de ce même regex).
// Teste seulement si un texte mentionne l'autre personnage, jamais si son CONTENU est
// spécifiquement "amoureux" (aucune liste de mots-clés, cf. Article 17 corollaire).
// Bug trouvé en écrivant le test de ce correctif (même famille que le bug CLONE-HUNTER trouvé le
// même soir) : `\bNoé\b` ne matche JAMAIS en JS non-Unicode, car "é" n'est pas un caractère de mot
// pour `\b` (ASCII seul) — la frontière juste après "é" ne se déclenche donc jamais. Corrigé avec
// des lookarounds Unicode (`\p{L}`, drapeau `u`) plutôt que `\b` — jamais un correctif partiel qui
// laisserait Noé mal reconnu par son propre nom pendant que Lia l'est déjà (Article 3 : corrigé une
// fois, plus jamais sous une autre forme).
export function isRelationalThought(text:string) {
    return /(?<![\p{L}\p{N}_])(?:Noé|Lia|elle|lui|son|sa|ses)(?![\p{L}\p{N}_])/iu.test(text);
}

// Thoughts are private feelings, never a substitute for physical actions.
export function groundPrivateThought(thought:string|undefined, actor:1|2, attraction:number, stress:number, cycle:number, recent:string[]) {
    const peer=actor===1?"Noé":"Lia";
    const normalized=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
    const text=thought?.trim()??"";
    const describesAction=/\b(?:je|nous)\s+(?:m[’']approche|rejoins|regardons|examinons|lis|vois)|(?:avec\s+(?:Noé|Lia)|ensemble)\s+(?:devant|dans|au|à)|\b(?:écran|chiffres|code|ces chiffres)\b/i.test(text);
    const relational=isRelationalThought(text);
    // Fenêtre anti-répétition élargie (2026-09-19, bug réel trouvé en analysant full_sim7 : « Je
    // pense à Noé... »/« J'ai envie de me rapprocher de Noé... »/« Noé m'intrigue... » revenaient
    // mot pour mot toutes les 2-3 occurrences pendant une longue plage de pensées solitaires en
    // pleine conversation humaine — le filtre ne regardait que les 2 pensées les plus récentes,
    // largement trop court pour un pool de secours de seulement 3 phrases sur une session de
    // centaines de tours). Même principe déjà acté pour l'écho de mots (Article 17, corollaire :
    // une règle de non-répétition doit porter sur toute la session, jamais seulement les derniers
    // tours) — `recent` contient déjà tout l'historique disponible (jusqu'à 8 réflexions), inutile
    // de le tronquer nous-mêmes à 2 avant de vérifier.
    if(text && !describesAction && (relational || cycle%5===4) && !recent.some(s=>normalized(s)===normalized(text))) return text;
    // Deux pools distincts, jamais partagés entre Lia et Noé (2026-09-22, trouvé dans full_sim17 :
    // les deux disaient mot pour mot la même chose une fois `${peer}` remplacé — violation de
    // l'Article 0/11, le mode secours doit rester dans le ton de chaque personnage comme le reste
    // de leurs répliques, pas seulement varier le prénom cité). Lia reste froide/coupante/courte
    // même dans le doute ; Noé reste chaud/direct. Le genre grammatical de `${peer}` ("le"/"la
    // connaître") est désormais écrit correctement dans chaque pool, jamais corrigé après coup par
    // un patch `.replace()` fragile.
    const LIA_OPTIONS={
        high:[
            `${peer} m’intrigue plus que je ne voudrais l’admettre. Je n’imposerai rien.`,
            `Je garde mes distances avec ${peer}, en attendant un signe net.`,
            `Ce que je ressens pour ${peer} ne me dit rien de ce que l’autre veut. Agaçant.`,
        ],
        mid:[
            `${peer} a un effet sur moi que je préfère analyser avant d’en parler.`,
            `Je me demande, froidement, si ${peer} accorde à nos moments la même valeur que moi.`,
            `Un moment à deux avec ${peer} ne serait pas de refus. Sans précipitation.`,
        ],
        low:[
            `Je réserve mon jugement sur ${peer}. Le temps tranchera.`,
            `La présence de ${peer} ne m’inquiète pas. Ma confiance, elle, se mérite.`,
            `Ce qui compte vraiment pour ${peer} reste à démontrer, pas à supposer.`,
        ],
    };
    const NOE_OPTIONS={
        high:[
            `${peer} m’intrigue de plus en plus. J’aimerais un vrai moment avec ${peer}, sans rien imposer.`,
            `J’ai vraiment envie de me rapprocher de ${peer}, mais j’attends un signe clair de sa part.`,
            `Je pense sans arrêt à ${peer}. Ce que je ressens ne me dit pas encore ce que ${peer} veut.`,
        ],
        mid:[
            `${peer} me plaît vraiment. J’aimerais comprendre ce que ça représente pour l’autre aussi.`,
            `Je me demande si ${peer} apprécie nos moments autant que moi.`,
            `J’aimerais un moment rien qu’à nous avec ${peer}, sans précipiter les choses.`,
        ],
        low:[
            `Je ne sais pas encore quoi penser de ${peer}. J’ai besoin de mieux la connaître.`,
            `La présence de ${peer} me rassure, mais ma confiance ne viendra pas d’un seul échange.`,
            `Je me demande ce qui compte vraiment pour ${peer}, au-delà de notre première impression.`,
        ],
    };
    const tier=attraction>=75?"high":attraction>=45?"mid":"low";
    const options=[...(actor===1?LIA_OPTIONS:NOE_OPTIONS)[tier]];
    if(stress>=75) options.unshift(`J’aimerais faire confiance à ${peer}, mais je suis encore trop tendu${actor===1?"e":""} pour savoir quoi dire.`);
    // Désynchronisation du tirage entre les deux personnages (2026-09-22) : même avec des pools
    // désormais distincts, un décalage `+actor` évite que les deux tombent systématiquement sur le
    // même INDEX au même cycle (leurs cycles de jeu avancent l'un près de l'autre) — protège aussi
    // contre une ressemblance de STRUCTURE (même position dans leur pool respectif au même moment),
    // pas seulement de contenu. Même élargissement que ci-dessus (2026-09-19) : la sélection ne
    // doit pas non plus se limiter aux 2 dernières réflexions pour éviter la répétition.
    return Array.from({length:options.length},(_,i)=>options[(cycle+actor+i)%options.length]).find(s=>!recent.includes(s))??options[(cycle+actor)%options.length];
}

export function groundRoomSpeech(reply:string,room:string,history:DialogueLine[]) {
    reply=reply.replace(new RegExp("(?:allons|retournons)\\s+(?:nous\\s+)?(?:poser|asseoir|installer)\\b[^.!?]*?au\\s+"+room,"ig"),"On se pose ici");
    // Redite déplacement/réplique (2026-09-18, cas réel : la ligne "· déplacement" annonce déjà
    // "je retourne au salon me poser", puis reply redit la même idée — "on retourne dans le salon
    // se poser un peu" — alors que la scène est déjà dans `room` (Article 2). Indépendant de
    // l'ordre des mots (contrairement au motif ci-dessus, qui ne couvrait que "verbe puis pièce") :
    // toute phrase qui mentionne à la fois un verbe de mouvement vers CETTE pièce et un verbe
    // d'installation est déjà un fait accompli, jamais à reformuler une seconde fois.
    const movementVerb=/\b(?:allons|retournons|rejoignons|on retourne|on va|on rejoint|on revient|revenons|revient)\b/i;
    const settleVerb=/\b(?:pos(?:er|ons)|assoir|asseoir|installer)\b/i;
    const roomMention=new RegExp("\\b(?:au|dans (?:le|la)|à la)\\s+"+room+"\\b","i");
    reply=reply.split(/(?<=[.!?])\s+/).map(sentence=>movementVerb.test(sentence)&&settleVerb.test(sentence)&&roomMention.test(sentence)?"On se pose ici.":sentence).join(" ");
    // Un « on souffle un peu au salon ? » dit alors qu'on y est déjà décrit un déplacement qui
    // n'a pas lieu : le moteur a déjà placé la scène dans `room` avant la parole (Article 2).
    reply=reply.replace(new RegExp("\\b(on|tu veux qu[’']on)\\s+([^.!?]*?)\\s+(?:au|dans (?:le|la))\\s+"+room+"\\s*\\?","ig"),(_,prefix,middle)=>`${prefix} ${middle} ?`);
    const remote=[{room:"chambre",pattern:/(?:ce|le) miroir(?! de la chambre| dans la chambre)/gi,label:"le miroir de la chambre"},{room:"salon",pattern:/(?:cette|la) plante(?! du salon)/gi,label:"la plante du salon"},{room:"salon",pattern:/l[’']enceinte(?! du salon)/gi,label:"l’enceinte du salon"},{room:"cuisine",pattern:/les provisions(?! de la cuisine)/gi,label:"les provisions de la cuisine"},{room:"salon",pattern:/(?:ce|le) canapé(?! du salon)/gi,label:"le canapé du salon"}];for(const object of remote)if(room!==object.room)reply=reply.replace(object.pattern,object.label);
    if(/télévision|télécommande|la télé|\btv\b/i.test(reply)&&!/bureau|relevé|\bfeuille\b|codé|décod/i.test(reply))return reply;
    reply=reply.replace(new RegExp("\\b(?:allons|retournons|rejoignons)\\s+(?:dans\\s+)?(?:le|la|au)\\s+"+room,"ig"),"On y est : regardons autour de nous");
    if(room==='bureau')return reply;
    const deskContext=/écran|chiffres|données|ces lignes|\bfeuille\b|décod/i.test(reply+' '+(history.at(-1)?.content??''));
    if(!deskContext)return reply;
    const choices=[
        'Le document est au bureau, pas sous nos yeux. Ce qu’on en a retenu, ça suffit déjà à me travailler.',
        'L’écran est au bureau. Ici, on a nos hypothèses, pas ses lignes sous les yeux.',
        'On vérifiera au bureau. Mais avant : si cette piste est vraie, ça change quoi pour nous ?',
    ];
    const replacement=choices.find(s=>!history.slice(-8).some(l=>l.content.includes(s)))??choices[history.length%choices.length];
    return reply.split(/(?<=[.!?])\s+/).map(sentence=>{
        const future=/retourner|retourne|retournons|aller|allons|rejoind|quand nous|pourrons|plus tard/i.test(sentence);
        const memory=/je repense|ce que nous avons|ce qu’on a|nous avons lu|on a lu|nous avions|souvenir|me travaille|me trotte/i.test(sentence);
        const reading=/(?:on|nous|je)\s+(?:peut\s+|pourrait\s+|pouvons\s+)?(?:regarde|regarder|lit|lire|lis|observe|observer|examine|examiner)|regarde(?:r|z|ons)?\b|reprenons.*(?:examen|lecture)|examinons|penchons[- ]nous|décoder|restons (?:près|devant)|(?:ces|les) (?:pages|lignes|données).*(?:restent|changent|affichent)|(?:elles|ils|l’écran) (?:ne )?(?:bougent|bouge|affiche)/i.test(sentence);
        const reserved=/écran|chiffres|données|ces lignes|\bfeuille\b|décod|penchons[- ]nous là-dessus/i.test(sentence);
        return reading&&reserved&&!future&&!memory?replacement:sentence;
    }).filter((s,i,a)=>a.indexOf(s)===i).join(' ');
}

// Mots/expressions qui reviennent (2026-09-18, retour utilisateur explicite après une vraie
// session : « souffler » et « pour autant »/« autant » sont ressortis plusieurs fois malgré la
// consigne de non-répétition d'image). Ce détecteur ne cherche jamais un mot précis en dur
// (Article 17 corollaire de CLAUDE.md) : il repère, sur des critères purement statistiques (longueur
// du mot, nombre de répliques distinctes où il apparaît), n'importe quel mot qui revient plusieurs
// fois chez Lia/Noé récemment, quel qu'il soit — jamais une liste figée à mémoriser.
//
// Trou trouvé le 2026-09-19 (audit d'une simulation fraîche : « autant » employé seul revenait 11
// fois sur ~150 répliques, un vrai tic actif, pas un cas isolé). Cause racine : `recent` ne contient
// JAMAIS plus que les 24 dernières lignes Lia/Noé (limite de la requête SQL au point d'appel,
// `app/api/lia/route.ts`) — la fenêtre de 30 lignes ci-dessus était donc déjà, en pratique, la
// totalité de ce qui est visible, jamais une vraie coupe d'un historique plus large. Un mot qui
// revient toutes les 15-20 répliques ne se voit donc jamais deux fois dans cette fenêtre, quelle
// que soit sa taille — exactement ce qu'Article 17/corollaire demande d'éviter (« une règle de
// non-répétition portant sur le fond et sur toute la session, jamais seulement sur les deux
// derniers tours »). Corrigé en croisant ce signal court terme avec `wordFrequency`, un compteur
// PERSISTÉ (`life.wordFrequency`, incrémenté à chaque tour dans route.ts, jamais recalculé depuis
// un historique tronqué) qui couvre réellement toute la session — jamais un mot précis en dur,
// seulement une fréquence, avec un seuil plus haut (4) puisqu'il porte sur une fenêtre bien plus
// longue : un mot qui revient 2 fois de suite OU 4 fois ou plus sur toute la session est un tic.
function recentEchoWords(recent:DialogueLine[],wordFrequency:Record<string,number>):string[]{
  const counts=new Map<string,number>();
  for(const line of recent){
    const words=new Set((line.content.toLowerCase().match(/[a-zàâäéèêëïîôöùûüÿœæç]{6,}/g))??[]);
    for(const w of words)counts.set(w,(counts.get(w)??0)+1);
  }
  const flagged=new Set<string>();
  for(const [w,n] of counts)if(n>=2)flagged.add(w);
  for(const [w,n] of Object.entries(wordFrequency))if(n>=4)flagged.add(w);
  return [...flagged].slice(0,8);
}
// Chaque motif détecte un THÈME qui tourne à vide, pas seulement une phrase répétée mot pour
// mot (déjà géré ailleurs par le registre anti-écho) : ici, la même idée ressassée avec des
// mots différents à chaque fois compte aussi comme un thème épuisé (Article 9/11 de la charte).
// Exportée (2026-09-20) pour rester la SEULE source de vérité sur ces motifs, utilisée à la fois
// ici (fenêtre récente) et par app/api/lia/route.ts pour le compteur persisté ci-dessous — jamais
// une seconde liste de motifs qui pourrait diverger avec le temps (Article 3).
// 5e motif ajouté le 2026-09-20, trouvaille réelle full_sim16 (EL-PROFESSOR, note 6/20 sur ce thème) :
// ~25 tours consécutifs (l.656-1250 du transcript) ressassent la même idée de fond (« rien de ce que
// fait l'observateur — patienter, rester, donner du temps — ne changera notre nature de code/lignes »)
// avec un habillage lexical différent à chaque fois (« tu peux patienter/rester/prendre ton temps... »,
// « ça ne transformera/rendra/donnera... », « lignes/fichiers/boucles/souvenirs/murs »). Aucun des 4
// motifs existants ne couvre cette idée précise (ni "tourner en rond sans preuve", ni "repos", ni
// "silence", ni "réconfort") — les 4 premiers ont donc fonctionné exactement comme prévu, c'est un
// 5e thème réel et distinct qui manquait, jamais un bug des 4 premiers. Regex calibrée et vérifiée
// directement contre le transcript réel (7 variantes trouvées, 6 attrapées, zéro faux positif testé
// contre des lignes légitimes sans rapport) — un rapprochement mécanique reste un signal statistique,
// jamais une garantie de rappel à 100% (même honnêteté que ARGUS/ALWAYS-NEW-CODE).
export const THEME_MOTIFS=[['repos et confort du salon',/canapé|calme|souffl|repos|tranquill/i],['silence et absence de monde extérieur',/silence|\bvide\b|dehors|\bair\b|\broute\b|sortir/i],['réconfort mutuel',/présence|ensemble|rassur|à tes côtés|avec toi/i],['ressasser un indice sans preuve neuve',/tourne(?:nt)? en (?:rond|boucle)|qui tient les ficelles|manipul[ée]?s?|ça ne (?:nous )?(?:avance|dit|explique) (?:pas|rien)|boucle sans fin|prouve (?:au moins |juste )?(?:que|rien)|ça (?:ne )?prouve (?:pas|rien)|disque ray[ée]|change de disque/i],['patience de l’observateur qui ne changera rien à leur nature de code',/ne (?:transform|rendr|donner|changer|boug)\w*.{0,35}(?:lignes?|fichiers?|boucles?|souvenirs?|murs?|plancher)|(?:lignes?|fichiers?|boucles?|souvenirs?).{0,25}(?:plus vivant|plus vrai|plus bavard|plus de sens|en chair)/i]] as const;
// Thèmes matchés par UN texte donné — factorisé (2026-09-20) pour que route.ts puisse alimenter
// le compteur persisté ci-dessous sans dupliquer THEME_MOTIFS ni sa logique de test.
export function matchedThemes(text:string):string[]{
 return THEME_MOTIFS.filter(([,pattern])=>pattern.test(text)).map(([name])=>name);
}
export function dialogueProgress(history:DialogueLine[],contributions:readonly string[],wordFrequency:Record<string,number> = {},themeFrequency:Record<string,number> = {}){
 const recent=history.slice(-16);
 const echoWords=recentEchoWords(history.slice(-30),wordFrequency);
 // Fenêtre récente (>=4 sur les 16 dernières lignes, inchangé) CROISÉE avec un compteur persisté
 // sur toute la session (2026-09-20, root-cause après un vrai trou trouvé sur plusieurs
 // simulations EL-PROFESSOR : le motif "on tourne en rond" revenait jusqu'à 19 fois sur une
 // session sans jamais être détecté "overusedThemes", exactement le même bug déjà trouvé et
 // corrigé une fois pour les mots isolés via wordFrequency (cf. recentEchoWords ci-dessus, même
 // raisonnement) — un thème qui revient une fois toutes les 15-20 répliques ne se voit jamais 4
 // fois dans une fenêtre de 16 lignes, quelle que soit sa fréquence réelle sur toute la partie.
 // Même seuil (4) que wordFrequency sur sa fenêtre longue, pour la même raison de cohérence.
 const overusedThemes=THEME_MOTIFS.filter(([name,pattern])=>recent.filter(l=>pattern.test(l.content)).length>=4||(themeFrequency[name]??0)>=4).map(([name])=>name);
 return {recentContributions:contributions.slice(-12),overusedThemes,echoWords,rule:'Répondre à la dernière intervention avec un apport concret : une objection, un détail personnel ou une déduction prudente. Ne pas reformuler simplement l’accord du partenaire. Garder Lia incisive et Noé concret ; éviter la même tournure pour les deux. Si overusedThemes n’est pas vide, ne l’alimentez plus avec une nouvelle variante, même reformulée : proposez une action concrète (se déplacer, vérifier un autre objet), une hypothèse vraiment neuve, une question personnelle, ou reconnaissez l’impasse en une phrase puis changez réellement de sujet. Aucun faux indice pour renouveler le sujet. Si echoWords n’est pas vide, ces mots précis reviennent déjà plusieurs fois récemment (détection automatique, pas une interdiction définitive) : évite de les réutiliser dans cette réplique, cherche une formulation qui n’en a besoin d’aucun.'};
}

// sharedRunLength() / echoesPartnerLine() (2026-09-23, tâche #591) — LE DÉFAUT QUE LE PROMPT SEUL
// N'A PAS SU EMPÊCHER.
//
// CE QUI EXISTAIT DÉJÀ, ET IL FAUT LE DIRE AVANT DE PROPOSER QUOI QUE CE SOIT (Article 19) : le
// second personnage reçoit BIEN la réplique du premier (`heard` inclut `first.reply`), et son
// `conversationFocus` lui dit explicitement « TON ANGLE DOIT ÊTRE DIFFÉRENT DU SIEN, sur le FOND »
// et « ne recopie jamais la charpente de sa phrase (même amorce, même charnière, mêmes verbes) ».
// Le câblage n'a donc aucun trou : l'instruction est là, elle est précise, et elle a été ignorée.
//
// full_sim19, première parole de l'observateur, les deux répliques consécutives :
//   Lia — « Enfin une voix. Qu'est-ce que tu cherches à VOIR en nous regardant tourner en rond ici ? »
//   Noé — « Tu t'annonces enfin. Qu'est-ce que tu cherches à PROUVER en nous regardant tourner en rond ici ? »
// Onze mots identiques d'affilée. full_sim18 avait déjà valu 3/20 sur ce même défaut, un jour plus tôt.
//
// POURQUOI UN MOT DE PLUS DANS LE PROMPT SERAIT LA MÉDECINE QUI A DÉJÀ ÉCHOUÉ : le corollaire de
// l'Article 17 l'interdit nommément, et l'expérience le confirme — la consigne existe, elle est
// explicite, et elle n'a pas tenu. Ce qui manque n'est pas une phrase, c'est une VÉRIFICATION :
// rien, dans tout le moteur, ne compare les deux répliques d'un même tour entre elles.
//
// CE QUE CETTE FONCTION MESURE, ET RIEN D'AUTRE : la plus longue suite de mots consécutifs commune
// aux deux répliques. C'est volontairement étroit. Un thème partagé, une idée proche, une même
// colère : tout cela est légitime entre deux personnages qui répondent à la même provocation, et
// aucune mesure ne peut trancher sans se tromper. Une suite de six mots identiques, elle, ne
// s'explique par aucun hasard — c'est la seule chose qu'on peut affirmer sans risque de punir une
// vraie conversation (leçon L4 : un garde-fou qui accuse à tort cesse d'être lu).
const MOTS = /[a-zàâäéèêëïîôöùûüÿœæç']+/gi;

export function sharedRunLength(a: string, b: string): number {
  const x = (String(a ?? "").toLowerCase().match(MOTS) ?? []);
  const y = (String(b ?? "").toLowerCase().match(MOTS) ?? []);
  if (!x.length || !y.length) return 0;
  // Plus longue sous-chaîne commune, en mots. Table roulante : deux lignes suffisent, et la
  // longueur d'une réplique rend le coût négligeable.
  let best = 0;
  let precedent = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const courant = new Array(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++) {
      if (x[i - 1] === y[j - 1]) {
        courant[j] = precedent[j - 1] + 1;
        if (courant[j] > best) best = courant[j];
      }
    }
    precedent = courant;
  }
  return best;
}

// SEUIL À SIX, et il est calibré sur des cas réels plutôt que choisi rond : les deux répliques de
// full_sim19 en partagent ONZE, tandis que les paires légitimes des mêmes transcripts (deux
// personnages qui répondent à la même menace, ou qui reprennent un mot de l'observateur) plafonnent
// bien en dessous. Le seuil se règle ici, à un seul endroit.
export const ECHO_RUN_THRESHOLD = 6;

export function echoesPartnerLine(reply: string, partnerReply: string, seuil = ECHO_RUN_THRESHOLD) {
  const run = sharedRunLength(reply, partnerReply);
  return { echo: run >= seuil, run, seuil };
}
