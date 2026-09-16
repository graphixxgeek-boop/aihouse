import {sceneObjects,sceneWindows} from "./perception";
export const proofObjects=[
 {id:'book',label:'Livre',icon:'▥',pattern:/livre|autobiographique/i,room:'bureau',x:6.7,z:2.2},
 {id:'note',label:'Mot',icon:'▱',pattern:/mot laissé|maison est un environnement/i,room:'bureau',x:4.2,z:3.2},
 {id:'code',label:'Code',icon:'⌘',pattern:/MEMOIRE GENEREE|13-5-13-15-9-18-5/i,room:'bureau',x:4.8,z:3.2},
 {id:'screen',label:'Écran',icon:'▣',pattern:/relevé|cohabitation/i,room:'bureau',x:5.5,z:4.8},
 {id:'dossier',label:'Dossier',icon:'▧',pattern:/agents d.intelligence artificielle|agents IA autonomes/i,room:'bureau',x:5,z:3.8},
 {id:'mirror',label:'Miroir',icon:'◐',pattern:/ombres figées|miroir/i,room:'chambre',x:sceneObjects.mirror.x,z:sceneObjects.mirror.z},
 {id:'food',label:'Réserves',icon:'◇',pattern:/réappar|régén/i,room:'cuisine',x:5,z:-5.3},
 {id:'tv',label:'TV',icon:'▣',pattern:/télévision|SESSION/i,room:'salon',x:-4,z:-5.25},
 {id:'plant',label:'Plante',icon:'♧',pattern:/fausse plante/i,room:'salon',x:sceneObjects.plant.x,z:sceneObjects.plant.z},
 {id:'speaker',label:'Enceinte',icon:'♪',pattern:/enceinte activée/i,room:'salon',x:sceneObjects.speaker.x,z:sceneObjects.speaker.z},
 {id:'window',label:'Fenêtres',icon:'⌑',pattern:/fenêtres?.*figé/i,room:'salon',x:sceneWindows[0].x,z:sceneWindows[0].z},
] as const;
export type VerifiedObservations={ambientVerified?:boolean;mirrorVerified?:boolean;foodVerified?:boolean};
export function evidenceLedger(evidence:readonly string[],observations:readonly string[],tvSeen=false,verified?:VerifiedObservations){const text=[...evidence.map(e=>e.split(' Identifiant observateur')[0]),...observations].join('\n');return proofObjects.map(p=>{const flag=p.id==='speaker'?verified?.ambientVerified:p.id==='mirror'?verified?.mirrorVerified:p.id==='food'?verified?.foodVerified:undefined;return {...p,discovered:flag??(p.id==='tv'?tvSeen:p.pattern.test(text))};});}

/** Count unique observed objects, then general findings and distinct recorded dreams. */
export function investigationCounts(evidence:readonly string[],observations:readonly string[],tvSeen=false,dreams:readonly {actor:number;round:number;content:string}[]=[],verified?:VerifiedObservations){const objects=evidenceLedger(evidence,observations,tvSeen,verified).slice(5),general=[...new Set(observations.map(s=>s.trim()).filter(Boolean))].filter(s=>!objects.some(o=>o.pattern.test(s)));return {indices:new Set(evidence.map(s=>s.trim()).filter(Boolean)).size,observations:objects.filter(o=>o.discovered).length+general.length+new Set(dreams.map(d=>d.actor+":"+d.round+":"+d.content)).size};}
