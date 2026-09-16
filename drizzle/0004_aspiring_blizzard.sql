CREATE INDEX `idx_memories_kind_id` ON `memories` (`kind`,`id`);--> statement-breakpoint
CREATE INDEX `idx_memories_agent_kind_time` ON `memories` (`agent_id`,`kind`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_conversations_speaker_id` ON `conversations` (`speaker`,`id`);--> statement-breakpoint
CREATE INDEX `idx_world_requests_created_at` ON `world_requests` (`created_at`);