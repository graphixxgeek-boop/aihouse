import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentState = sqliteTable("agent_state", {
  id: integer("id").primaryKey(),
  mood: text("mood").notNull().default("curieuse"),
  activity: text("activity").notNull().default("J’observe la pièce"),
  goal: text("goal").notNull().default("Découvrir mon nouvel environnement"),
  emotions: text("emotions").notNull().default('{"curiosity":72,"tension":58,"trust":8,"comfort":22,"attraction":12}'),
  needs: text("needs").notNull().default('{"hunger":26,"fatigue":20,"stress":55,"uncertainty":90}'),
  intent: text("intent").notNull().default("none"),
  cycle: integer("cycle").notNull().default(0),
  room: text("room").notNull().default("salon"),
  lastSeen: integer("last_seen").notNull(),
});

export const memories = sqliteTable("memories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  agentId: integer("agent_id").notNull().default(1),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_memories_created_at").on(table.createdAt), index("idx_memories_kind_id").on(table.kind,table.id), index("idx_memories_agent_kind_time").on(table.agentId,table.kind,table.createdAt,table.id)]);

export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  speaker: text("speaker").notNull(),
  room:text("room"),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_conversations_speaker_id").on(table.speaker,table.id)]);
export const worldLock = sqliteTable("world_lock", {
  id: integer("id").primaryKey(),
  epoch: integer("epoch").notNull().default(0),
  token: text("token").notNull(),
  expiresAt: integer("expires_at").notNull(),
  lastAuto: integer("last_auto").notNull().default(0),
});
export const worldRequests = sqliteTable("world_requests", {
  id: text("id").primaryKey(),
  result: text("result").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("idx_world_requests_created_at").on(table.createdAt)]);

export const dialogueFingerprints = sqliteTable("dialogue_fingerprints", {fingerprint:text("fingerprint").primaryKey()});
