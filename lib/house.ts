export const rooms = ["salon", "cuisine", "chambre", "bureau"] as const;
export const spaces = [...rooms, "jardin"] as const;
export type Room = typeof spaces[number];
export const exterior = {garden:{x:-11,z:0,w:6,d:12,color:0x477753,tree:{x:-11.7,z:-3,radius:.8}},road:{x:11.8,z:0,w:4,d:15},sidewalk:{x:8.9,z:0,w:1.6,d:15},doors:{garden:{x:-8,z:0},main:{x:8,z:0}}} as const;
export function gardenAccess(story:{finalCalled?:boolean;evidence:string[];life?:{gardenOpen?:boolean}}){return story.finalCalled===true&&story.evidence.length>=5&&story.life?.gardenOpen===true;}
export type Person = 1 | 2;
export const names = { 1: "Lia", 2: "Noé" } as const;
export const centers: Record<Room, [number, number]> = { salon: [-4, -3], cuisine: [4, -3], chambre: [-4, 3], bureau: [4, 3], jardin:[-11,0] };
export type Rect = { x: number; z: number; w: number; d: number; color: number; h: number };
export const walls: Rect[] = [
  { x: 0, z: -6, w: 16, d: .2, h: .55, color: 0xe3e8e3 }, { x: 0, z: 6, w: 16, d: .2, h: .55, color: 0xe3e8e3 },
  ...[-8,8].flatMap(x=>[-3.5,3.5].map(z=>({x,z,w:.2,d:5,h:.55,color:0xe3e8e3}))),
  ...[-1, 1].flatMap(z => [-6.5, 0, 6.5].map((x, i) => ({ x, z, w: i === 1 ? 6 : 3, d: .18, h: .5, color: 0xe3e8e3 }))),
  ...[-4.5, -1.8, 1.8, 4.5].map(z => ({ x: 0, z, w: .18, d: Math.abs(z) > 4 ? 3 : 1.6, h: .5, color: 0xe3e8e3 })),
];
export const furniture: Rect[] = [
  {x:-4,z:-5.25,w:2,d:.7,h:.15,color:0x26363f},
  { x: -6, z: -4.5, w: 2.4, d: 1, h: .5, color: 0x376c69 },
  { x: -6, z: -2.6, w: 1.6, d: .7, h: .32, color: 0x9c714d },
  { x: -1.3, z: -4.5, w: .6, d: 2, h: .75, color: 0x9c714d },
  { x: 5, z: -5.3, w: 4.5, d: .85, h: .65, color: 0xb5cbd2 },
  { x: 6.5, z: -3.5, w: .8, d: 2.7, h: .65, color: 0xb5cbd2 },
  { x: 2, z: -4.2, w: 1.2, d: 1.2, h: .45, color: 0xcca46c },
  { x: -6, z: 3.6, w: 2.3, d: 3.2, h: .4, color: 0xd4b8a1 },
  { x: -1.5, z: 4.8, w: .8, d: 1.5, h: .65, color: 0x8e735d },
  { x: 5.5, z: 4.8, w: 3.5, d: .8, h: .55, color: 0x8c785c },
  { x: 6.7, z: 2.2, w: .65, d: 1.5, h: .7, color: 0x8c785c },
];
export const gardenFurniture=[{x:-13,z:3.6,w:.8,d:1.8},{x:-12.7,z:-4.8,w:1.3,d:.8}] as const;
export const blocked = (x:number,z:number,gardenOpen=false) => x>7.5 || x<(gardenOpen?-13.5:-7.5) || Math.abs(z)>5.5 || (x<-7.5&&x>-8.5&&Math.abs(z)>.5) || (x<-8&&Math.hypot(x-exterior.garden.tree.x,z-exterior.garden.tree.z)<exterior.garden.tree.radius+.24) || [...walls,...furniture,...gardenFurniture].some(r=>Math.abs(x-r.x)<r.w/2+.24&&Math.abs(z-r.z)<r.d/2+.24);
// A grid route keeps both residents inside rooms and through the door openings.
export function pathBetween(start: [number, number], end: [number, number], gardenOpen=false): [number, number][] {
  const key = (x: number, z: number) => `${x},${z}`;
  const sx=Math.round(start[0]*2), sz=Math.round(start[1]*2), ex=Math.round(end[0]*2), ez=Math.round(end[1]*2);
  if (blocked(ex/2,ez/2,gardenOpen)) return [];
  const queue: [number,number][]=[[sx,sz]], previous=new Map<string,string | null>([[key(sx,sz),null]]);
  for(let i=0;i<queue.length;i++) {
    const [x,z]=queue[i]; if(x===ex && z===ez) break;
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,nz=z+dz,k=key(nx,nz);
      if(!previous.has(k) && !blocked(nx/2,nz/2,gardenOpen)) { previous.set(k,key(x,z));queue.push([nx,nz]); }
    }
  }
  let k:string|null=key(ex,ez);if(!previous.has(k))return [];
  const route:[number,number][]=[];
  while(k!==null) { const [x,z]=k.split(',').map(Number);route.unshift([x/2,z/2]);k=previous.get(k) ?? null; }
  return route;
}

// Reachable ground positions beside furniture; paired seats never share a cell.
export const roomAnchors:Record<Room,Record<string,[[number,number],[number,number]]>>={
 // La télécommande repose sur la table basse : on s'approche d'elle pour allumer la tv, pas de
 // l'écran lui-même, puis on l'observe depuis là (plus naturel qu'un nez collé à l'écran).
 salon:{sofa:[[-6.5,-3.5],[-5,-3.5]],remote:[[-6.3,-1.8],[-5.7,-1.8]],speaker:[[-2.5,-3.5],[-3,-3.5]],plant:[[-3.5,-2],[-4,-2]],window:[[-7.5,-5],[-6.5,-5.5]],entry:[[-4.5,-2],[-3.5,-2]]},
 cuisine:{stock:[[5.5,-3.5],[5.5,-2.5]],table:[[1,-3],[2,-3]],stove:[[4.5,-4.5],[5.5,-4.5]],window:[[1,-5],[1.5,-5.5]],entry:[[3.5,-2],[4.5,-2]]},
 chambre:{bed:[[-4,3],[-4,4]],mirror:[[-2,2],[-2.5,2]],window:[[-3.5,5],[-2.5,5]],entry:[[-4.5,1.5],[-3.5,1.5]]},
 jardin:{fence:[[-12.5,5],[-11.5,5]],entry:[[-9,0],[-9,.5]],tree:[[-10.5,-2.5],[-10.5,-3.5]],grass:[[-11,1.5],[-12,1.5]]},
 bureau:{screen:[[5,4],[6.5,4]],book:[[5.5,2],[5.5,2.5]],note:[[4,2.5],[4.5,2.5]],window:[[2,5],[2.5,5]],entry:[[3,2],[4.5,2]]}
};
export type LocatedResident={id:Person;room:Room;intent:string;activity?:string;goal?:string;location?:string};
export function destinationAnchor(agent:LocatedResident):string{
 const hint=(agent.activity??'').toLowerCase();let key=agent.room==='jardin'?(/clôture/.test(hint)?'fence':/arbre/.test(hint)?'tree':'grass'):'entry';
 if(agent.room==='salon')key=/enceinte/.test(hint)?'speaker':/plante/.test(hint)?'plant':agent.intent==='tv'?'remote':/fenêtre/.test(hint)?'window':'sofa';
 if(agent.room==='cuisine')key=agent.intent==='eat'?(/cuisin|prépar/.test(hint)?'stove':'table'):/fenêtre/.test(hint)?'window':'entry';
 if(agent.room==='chambre')key=/miroir/.test(hint)?'mirror':/fenêtre/.test(hint)?'window':['sleep','share_sleep','massage','intimacy'].includes(agent.intent)?'bed':'entry';
 if(agent.room==='bureau')key=agent.intent==='study'?(/livre|biblioth/.test(hint)?'book':/mot|feuille|cod/.test(hint)?'note':'screen'):/fenêtre/.test(hint)?'window':'entry';
 return key;
}
export function residentDestination(agent:LocatedResident):[number,number]{
 const key=agent.location&&Object.hasOwn(roomAnchors[agent.room],agent.location)?agent.location:destinationAnchor(agent);
 const point=roomAnchors[agent.room][key][agent.id-1];
 // A future furniture edit cannot send a resident into an obstacle.
 if(!blocked(...point,agent.room==="jardin"))return [...point];
 return [centers[agent.room][0]+(agent.id===1?-.5:.5),centers[agent.room][1]];
}
