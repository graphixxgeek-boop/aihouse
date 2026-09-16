CREATE TABLE `agent_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`mood` text DEFAULT 'curieuse' NOT NULL,
	`activity` text DEFAULT 'J’observe la pièce' NOT NULL,
	`goal` text DEFAULT 'Découvrir mon nouvel environnement' NOT NULL,
	`cycle` integer DEFAULT 0 NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_memories_created_at` ON `memories` (`created_at`);