export const roomTag:Record<string,string>={salon:"◈ SAL",cuisine:"◇ CUI",chambre:"◐ CHB",bureau:"▤ BUR",jardin:"♧ JAR",couloir:"↔ COU","haut-parleurs":"◉ VOIX"};
export function departurePresentation(content:string,room?:string|null){const m=content.match(/^\[([a-z]+)→([a-z]+)\] /);if(m)return {route:(roomTag[m[1]]??m[1])+" → "+(roomTag[m[2]]??m[2]),text:content.slice(m[0].length)};return {route:roomTag[room??""]??"—",text:content};}
export function uniqueObservations(observations:readonly string[]=[]){return [...new Set(observations.map(o=>o.trim()).filter(Boolean))];}
