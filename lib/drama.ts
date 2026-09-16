import type {Person,Room} from './house';
export const dramaRules={openingTurns:1,proposalStress:{noe:18,lia:14},rejection:{attraction:3,hunger:6,fatigue:5},pressureStress:16,personalBoost:3,debriefTurns:2} as const;
// Une seule formule de motif ("je préfère qu'on ne reste pas chacun de notre côté") habillée de
// six verbes différents reste reconnaissable au bout de quelques répétitions : ce n'est pas la
// forme qui manquait de variété, c'est le fond. Chaque condition a maintenant plusieurs motifs
// réellement distincts ; l'ordre d'essai tourne avec story.seed pour ne pas toujours épuiser le
// même dans le même ordre d'une session à l'autre.
export function departureLine(motives:readonly string[],target:string,destination:string,seed:string,avoid:(candidate:string)=>boolean):string{
 const offset=Array.from(seed).reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0)%motives.length;
 const ordered=[...motives.slice(offset),...motives.slice(0,offset)];
 const prefixes=["Je bouge ","Je file ","Je pars ","Je passe maintenant ","Je vais faire un tour ","Je m’en vais "];
 const candidates=ordered.flatMap(motive=>[
  ...prefixes.flatMap(start=>[start+target+" : "+motive+".",start+target+". "+motive.charAt(0).toUpperCase()+motive.slice(1)+"."]),
  "Je vais "+target+" : "+motive+".","Je passe "+target+". "+motive.charAt(0).toUpperCase()+motive.slice(1)+".","Direction "+destination+" ; "+motive+".",
 ]);
 return candidates.find(c=>!avoid(c))??"Je pars "+target+" ; "+ordered[0]+".";
}
export function coldOpening(variant:number){return [
 ["T’es qui ? Reste là une seconde.","Pourquoi je suis ici ? Je te connais pas."],
 ["T’es qui ? C’est toi qui m’as fait venir ici ?","Non. Approche pas. Je sais même pas où on est."],
 ["Y a quelqu’un… T’es qui ?","Pourquoi je suis ici ? J’ai la tête en vrac."],
 ["T’es qui ? Qu’est-ce que tu fais là ?","La même chose que toi, apparemment. J’en sais rien."],
 ][variant%4];}
export function dialogueFingerprint(text:string){return text.replace(/^\[[a-z]+→[a-z]+\] /,"").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");}
/** Conservative lexical echo check; it does not pretend to understand every paraphrase. */
export function looksLikeEcho(reply:string,previous:string){if(/«|“|tu dis|tu répètes|ta phrase|imite/i.test(reply))return false;const stops=new Set("alors avec bien dans depuis encore entre fait faire ici leur même mais nous notre pour plus quelque quand sans sont sous tout très vous cette être avoir aussi celui celle c’est n’est qu’on j’ai suis te toi moi que des les une son ses mon mes ton tes pas ces comme parce donc veut veut suis".split(" "));const tokens=(s:string)=>new Set((s.normalize("NFKC").toLowerCase().match(/[\p{L}]+/gu)??[]).filter(w=>w.length>3&&!stops.has(w)));const a=tokens(reply),b=tokens(previous);if(a.size<7||b.size<7)return false;const shared=[...a].filter(w=>b.has(w)).length;return shared/(a.size+b.size-shared)>=.9;}
export function distinctReply(reply:string,actor:Person,room:Room,history:{content:string}[],round:number,stress=0){const normalize=dialogueFingerprint;if(!history.some(l=>normalize(l.content)===normalize(reply))&&!history.slice(-16).some(l=>looksLikeEcho(reply,l.content)))return reply;
 // Chaque option ci-dessous exprime une réaction réellement différente (pas une reformulation
 // de la même idée) : l'Article 10 de la charte interdit de varier seulement la forme.
 const choices=actor===1&&stress>=30?["Je sais pas quoi te répondre. J’ai besoin de mettre mes idées en ordre.","Laisse-moi souffler une seconde avant de dire une bêtise.","J’ai trop de choses qui se bousculent pour te répondre clairement.","Je préfère me taire plutôt que de parler pour ne rien dire."]:actor===1?["On s’entend parler en boucle, là. Qu’est-ce qu’on a vraiment appris ?","Tu fais ça souvent, répondre avec mes mots ? J’aimerais ton avis, pas mon écho.","Je veux pas une jolie phrase. Je veux savoir ce que tu penses.","Change de disque deux secondes. On dirait un mauvais copier-coller.","Si t’as rien de neuf, dis-le franchement, ça m’évitera d’attendre.","Arrête, on dirait qu’on récite un script. Dis un truc que tu penses vraiment."]:["Je me répète. Ça m’énerve aussi. Reprenons ce qui nous échappe.","J’ai pas de formule magique. Mais je compte pas te raconter du vent.","Je vais pas faire semblant : cette histoire me dépasse.","Bon, on recommence pas ce laïus. Dis-moi un truc que je sais pas déjà.","J’ai déjà dit ça y a deux minutes. On avance, ou on cause pour causer ?","Je sature un peu. Change de sujet ou trouve autre chose à dire."];const leads=actor===1?["Attends.","Deux secondes.","Bon.","Écoute.","Franchement.","Là, je bloque."]:["OK.","Un truc me gêne.","Bon, attends.","Je reprends.","Je te suis, mais…","Merde."];const tails=actor===1&&stress>=30?["J’ai du mal à respirer normalement.","Restons sur une chose à la fois.","Tu peux rester là un moment ?"]:actor===1?["C’est toi que je veux entendre.","Pas besoin de me rassurer à tout prix.","On peut aussi ne pas être d’accord."]:["On peut reconnaître qu’on sait pas.","Je préfère ton doute à une certitude inventée.","Dis-moi ce qui te paraît le moins crédible."];const variants=[...choices,...leads.flatMap(lead=>choices.flatMap(choice=>tails.map(tail=>lead+" "+choice+" "+tail)))];return variants.find(s=>!history.some(l=>normalize(l.content)===normalize(s)))??(actor===1?"Je crois qu’on manque encore quelque chose. Laisse-moi y réfléchir.":"Je vais arrêter de tourner autour. Cette piste me laisse sur ma faim.");}
export function justifiedReply(actor:Person,accepted:boolean,round:number){const refused=actor===1?["Non. Tu me plais peut-être, mais on vient de débarquer dans une cage. Laisse-moi trouver mes repères.","Pas maintenant. J’ai besoin de pouvoir te faire confiance sans devoir me rapprocher.","Je veux ralentir. Si tu tiens à moi, laisse-moi cet espace."]:['Non, je suis pas à l’aise. Il me faut encore un peu de temps.'];return accepted?(actor===1?"Oui, j’en ai envie. Ça me rassure, mais allons doucement.":"Oui, j’en ai envie aussi. Sans se précipiter."):refused[round%refused.length];}
export function truthfulGender(text:string,actor:Person){
 text=text.replace(actor===1?/quel genre d[’']homme je suis/gi:/quel genre de femme je suis/gi,actor===1?"quel genre de femme je suis":"quel genre d’homme je suis").replace(actor===1?/je suis (?:un homme|un garçon)/gi:/je suis (?:une femme|une fille)/gi,actor===1?"je suis une femme":"je suis un homme");
 if(actor===2)text=text.replace(/quel genre d[’']homme (?:es-tu|tu es)/gi,"quel genre de femme es-tu");
 if(actor===2)text=text.replace(/j[’']apprécie qu[’']il/gi,"j’apprécie qu’elle");else text=text.replace(/j[’']apprécie qu[’']elle/gi,"j’apprécie qu’il");
 const pairs:Record<string,string>={attentif:'attentive',curieux:'curieuse',rassuré:'rassurée',fatigué:'fatiguée',humain:'humaine',enfermé:'enfermée',perdu:'perdue',prêt:'prête',content:'contente',seul:'seule',confiant:'confiante',têtu:'têtue',buté:'butée',blessé:'blessée',stressé:'stressée',séduit:'séduite'};
 const forms=actor===1?pairs:Object.fromEntries(Object.entries(pairs).map(([m,f])=>[f,m]));
 return text.replace(new RegExp('\\b(Je suis|je suis|je me sens|Je me sens|j[’\']suis) ('+Object.keys(forms).join('|')+')(?![\\p{L}])','gu'),(_,prefix,word)=>prefix+' '+forms[word]);
}
