ALTER TABLE `agent_state` ADD `needs` text DEFAULT '{"hunger":26,"fatigue":20,"stress":55,"uncertainty":90}' NOT NULL;--> statement-breakpoint
ALTER TABLE `agent_state` ADD `intent` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `world_lock` ADD `epoch` integer DEFAULT 0 NOT NULL;