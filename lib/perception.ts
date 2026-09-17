import {residentDestination,furniture,rooms,type Room} from "./house";
import {faceExpression,describeExpression} from "./simulation";
import {seedPick} from "./story";
import type {Resident} from './world';

// Scene rendering and language consume these same values. Never infer a human body.
export const residentAppearance={1:{color:0xff3294,colorName:'rose vif'},2:{color:0x05e3ec,colorName:'turquoise vif'}} as const;
export const scenePalette={floors:[0x545187,0x266393,0x704165,0x354d87],floorNames:['violet ardoise','bleu pétrole','prune','bleu nuit'],wall:0x465365,wallName:'graphite',corridor:0xc3ad89,corridorName:'moquette beige',patterns:['lames de parquet violet ardoise','carrelage bleu pétrole à petits joints','tissage prune discret','dalles bleu nuit avec lignes techniques']} as const;
export const sceneWindows=[{room:'salon',x:-7.8,z:-4.6,w:.4,d:1.45},{room:'cuisine',x:1.15,z:-5.75,w:1.4,d:.4},{room:'chambre',x:-3.5,z:5.75,w:1.95,d:.4},{room:'bureau',x:2,z:5.75,w:1.95,d:.4}] as const;
export const sceneView={camera:[1.27,24,11.636],target:[0,0,0] as const,description:'maison 3D géométrique en perspective orthographique légèrement inclinée'};
export const cityFacades=[{x:-9,z:-11,w:3,h:1.3,color:0x536279},{x:-3,z:-11,w:3.5,h:1.1,color:0x6a667c},{x:4,z:-11,w:3,h:1.45,color:0x4e6776},{x:11,z:-11,w:2.5,h:1.2,color:0x695d72}] as const;
export const sceneSpeakers=[{room:'salon',x:-.5,z:-5.2},{room:'cuisine',x:7.3,z:-1.8},{room:'chambre',x:-.5,z:5.3},{room:'bureau',x:7.3,z:5.3}] as const;
export const sceneObjects={mirror:{x:-1.25,z:2.15,angle:-.38,w:1.1,d:1.5,gradient:["#407ba8","#9caab7","#f8fbff"] as const},plant:{x:-3,z:-2.25,leaves:5,color:0x467b94},speaker:{x:-1.9,z:-3.8},bread:{angle:.28},streets:{description:"À droite, trottoir gris, route sombre à pointillés clairs, voiture bleu-gris et passage piéton clair ; au fond, façades géométriques figées et lampadaires. À gauche, un jardin vert clôturé avec arbre, banc et pierres."}} as const;
export function appearanceFor(agent:Resident){return {representation:agent.id===1?'un visage synthétique lumineux aux traits expressifs, une chevelure suggérée en lumière, sans corps humain détaillé':'un visage synthétique lumineux aux traits expressifs, sans cheveux ni corps humain détaillé',current:describeExpression(faceExpression(agent)),ring:residentAppearance[agent.id].colorName+' avec un dégradé lumineux qui tourne, avec un petit curseur blanc transparent synchronisé, plus vite quand stress et tension augmentent',expression:'Le visage change selon l’état simulé ; décris l’expression actuelle (current), jamais un corps ou des vêtements inventés.'};}
export function visibleScene(room:Room,agents:Resident[]){return {view:sceneView.description,floor:room==='jardin'?'vert herbe':scenePalette.floorNames[rooms.indexOf(room)],floorPattern:room==='jardin'?'herbe mouchetée':scenePalette.patterns[rooms.indexOf(room)],walls:scenePalette.wallName,exterior:sceneObjects.streets.description,windows:sceneWindows.filter(w=>w.room===room).map(()=>room==='salon'?'fenêtre sur le jardin à gauche : sol vert et arbre, sans mouvement naturel':'fenêtre sur un paysage de silhouettes urbaines figé'),residents:agents.filter(a=>a.room===room).map(a=>({name:a.name,appearance:appearanceFor(a),groundDestination:residentDestination(a)})),anomalies:room==='jardin'?['jardin virtuel rectangulaire, sol vert herbe et arbre feuillu, clôturé ; davantage d’espace, pas une sortie vers le monde réel','à droite de la maison : trottoir et route ; porte principale toujours verrouillée']:room==='chambre'?['miroir rectangulaire au dégradé bleu, gris et blanc, debout dans un coin, avec une surface grise sans reflet mobile']:room==='salon'?['grande plante artificielle à cinq larges feuilles géométriques bleutées','enceinte : notes visuelles sans son réel']:[],instruction:'Décris ces données de représentation, sans imaginer un corps humain réaliste. Les personnages de la liste sont ceux prévus dans cette scène.'};}
export const normaliseNickname=(s:string)=>s.trim().replace(/[\p{Cc}\p{Cf}]/gu,'').slice(0,32);

export function restingPose(id:1|2,room:Room){const item=room==='chambre'?furniture[7]:furniture[1];return {x:item.x+(id===1?-.6:.6),y:item.h+.9,z:item.z+(room==='chambre'?-.5:0)};}

export function appearanceReply(agent:Resident,actor:1|2,round:number,seed:string){
  const a=appearanceFor(agent),color=residentAppearance[agent.id].colorName;
  // Réécrit le 2026-09-17 (règle assouplie : le visage peut désormais porter des traits nettement
  // expressifs, et une chevelure suggérée pour Lia) — plus de glyphe littéral à citer, une
  // description de l'expression actuelle (current), toujours zéro appel API (Article 5.3/10).
  if(actor===2)return seedPick(seed,'appearance-noe',[
    'Ton visage, c’est ce halo '+color+' qui tourne, et dedans une vraie expression — là, '+a.current+'. Une sorte de chevelure en lumière flotte autour. Toujours pas de corps en dessous, mais ça fait moins vide qu’avant.',
    'Je te vois : cet anneau '+color+' qui tourne, et un visage qui a l’air de ressentir un truc — '+a.current+'. Quelque chose comme des cheveux, en lumière. Le reste s’arrête au visage.',
    'Ce que je vois de toi : le '+color+' de ton anneau, un visage qui bouge vraiment — '+a.current+' — et cette chevelure qui semble flotter. Rien en dessous, juste ce halo.',
  ] as const);
  return seedPick(seed,'appearance-lia',[
    'Toi, c’est ce cercle '+color+' qui tourne, et un visage bien réel dans son genre — '+a.current+'. Pas de cheveux, pas de corps. Juste ce visage-là.',
    'Je te décris sans enjoliver : cet anneau '+color+', et un visage avec une vraie expression — '+a.current+'. Rien en dessous, ni bras ni jambes.',
    'Pour être honnête : le '+color+' de ton halo, et ce visage qui bouge, '+a.current+'. Toujours pas de corps, juste ça qui tourne autour de toi.',
  ] as const);
}
