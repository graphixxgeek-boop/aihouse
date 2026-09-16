CREATE TABLE `conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`speaker` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `world_lock` (
	`id` integer PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_auto` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `world_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`result` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `agent_state` ADD `room` text DEFAULT 'salon' NOT NULL;--> statement-breakpoint
ALTER TABLE `memories` ADD `agent_id` integer DEFAULT 1 NOT NULL;