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

// Thoughts are private feelings, never a substitute for physical actions.
export function groundPrivateThought(thought:string|undefined, actor:1|2, attraction:number, stress:number, cycle:number, recent:string[]) {
    const peer=actor===1?"Noé":"Lia";
    const normalized=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
    const text=thought?.trim()??"";
    const describesAction=/\b(?:je|nous)\s+(?:m[’']approche|rejoins|regardons|examinons|lis|vois)|(?:avec\s+(?:Noé|Lia)|ensemble)\s+(?:devant|dans|au|à)|\b(?:écran|chiffres|code|ces chiffres)\b/i.test(text);
    const relational=/\b(?:Noé|Lia|elle|lui|son|sa|ses)\b/i.test(text);
    if(text && !describesAction && (relational || cycle%5===4) && !recent.slice(0,2).some(s=>normalized(s)===normalized(text))) return text;
    const options=attraction>=75 ? [
        `${peer} m’intrigue de plus en plus. J’aimerais un vrai moment avec ${peer}, sans rien imposer.`,
        `J’ai envie de me rapprocher de ${peer}, mais je préfère attendre un signe clair.`,
        `Je pense à ${peer}. Ce que je ressens ne me dit pas encore ce que l’autre souhaite.`,
    ] : attraction>=45 ? [
        `${peer} me plaît. J’aimerais mieux comprendre ce que cette proximité signifie pour l’autre.`,
        `Je me demande si ${peer} apprécie nos moments ensemble autant que moi.`,
        `J’aimerais un moment rien qu’à nous avec ${peer}, sans précipiter les choses.`,
    ] : [
        `Je ne sais pas encore quoi penser de ${peer}. J’ai besoin de mieux le connaître.`,
        `La présence de ${peer} me rassure, mais ma confiance ne viendra pas d’un seul échange.`,
        `Je me demande ce qui compte vraiment pour ${peer}, au-delà de notre première impression.`,
    ];
    if(actor===2) options[0]=options[0].replace("le connaître","la connaître");
    if(stress>=75) options.unshift(`J’aimerais faire confiance à ${peer}, mais je suis encore trop tendu${actor===1?"e":""} pour savoir quoi dire.`);
    return Array.from({length:options.length},(_,i)=>options[(cycle+i)%options.length]).find(s=>!recent.slice(0,2).includes(s))??options[cycle%options.length];
}

export function groundRoomSpeech(reply:string,room:string,history:DialogueLine[]) {
    reply=reply.replace(new RegExp("(?:allons|retournons)\\s+(?:nous\\s+)?(?:poser|asseoir|installer)\\b[^.!?]*?au\\s+"+room,"ig"),"On se pose ici");
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
function recentEchoWords(recent:DialogueLine[]):string[]{
  const counts=new Map<string,number>();
  for(const line of recent){
    const words=new Set((line.content.toLowerCase().match(/[a-zàâäéèêëïîôöùûüÿœæç]{6,}/g))??[]);
    for(const w of words)counts.set(w,(counts.get(w)??0)+1);
  }
  return [...counts.entries()].filter(([,n])=>n>=2).map(([w])=>w).slice(0,8);
}
export function dialogueProgress(history:DialogueLine[],contributions:readonly string[]){
 const recent=history.slice(-16);
 // Chaque motif détecte un THÈME qui tourne à vide, pas seulement une phrase répétée mot pour
 // mot (déjà géré ailleurs par le registre anti-écho) : ici, la même idée ressassée avec des
 // mots différents à chaque fois compte aussi comme un thème épuisé (Article 9/11 de la charte).
 const motifs=[['repos et confort du salon',/canapé|calme|souffl|repos|tranquill/i],['silence et absence de monde extérieur',/silence|\bvide\b|dehors|\bair\b|\broute\b|sortir/i],['réconfort mutuel',/présence|ensemble|rassur|à tes côtés|avec toi/i],['ressasser un indice sans preuve neuve',/tourne(?:nt)? en (?:rond|boucle)|qui tient les ficelles|manipul[ée]?s?|ça ne (?:nous )?(?:avance|dit|explique) (?:pas|rien)|boucle sans fin|prouve (?:au moins |juste )?(?:que|rien)|ça (?:ne )?prouve (?:pas|rien)/i]] as const;
 const echoWords=recentEchoWords(history.slice(-30));
 return {recentContributions:contributions.slice(-12),overusedThemes:motifs.filter(([,pattern])=>recent.filter(l=>pattern.test(l.content)).length>=4).map(([name])=>name),echoWords,rule:'Répondre à la dernière intervention avec un apport concret : une objection, un détail personnel ou une déduction prudente. Ne pas reformuler simplement l’accord du partenaire. Garder Lia incisive et Noé concret ; éviter la même tournure pour les deux. Si overusedThemes n’est pas vide, ne l’alimentez plus avec une nouvelle variante, même reformulée : proposez une action concrète (se déplacer, vérifier un autre objet), une hypothèse vraiment neuve, une question personnelle, ou reconnaissez l’impasse en une phrase puis changez réellement de sujet. Aucun faux indice pour renouveler le sujet. Si echoWords n’est pas vide, ces mots précis reviennent déjà plusieurs fois récemment (détection automatique, pas une interdiction définitive) : évite de les réutiliser dans cette réplique, cherche une formulation qui n’en a besoin d’aucun.'};
}
