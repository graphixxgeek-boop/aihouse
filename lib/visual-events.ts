/** Ephemeral, idempotent scene cues. Publish observations only after playback. */
export type VisualEvent={id:string;kind:"food"|"speaker"|"tv";room:string;duration:number;on?:boolean};
export const visualTiming={food:3800,regeneration:2000,speaker:2200,tv:1500} as const;
