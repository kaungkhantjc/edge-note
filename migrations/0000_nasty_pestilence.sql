CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_public` integer DEFAULT false,
	`slug` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notes_slug_unique` ON `notes` (`slug`);--> statement-breakpoint
CREATE INDEX `title_idx` ON `notes` (`title`);