CREATE TABLE `lead_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`status` enum('available','not_available','will_be_free_later','do_not_contact') NOT NULL,
	`followUpDate` bigint,
	`notes` text,
	`userId` int,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `lead_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerName` text,
	`phone` varchar(32) NOT NULL,
	`customFields` json,
	`assignedTo` int,
	`autoCategory` enum('unassigned','available','unavailable','upcoming','contacted') NOT NULL DEFAULT 'unassigned',
	`createdAt` bigint NOT NULL,
	`updatedAt` bigint NOT NULL,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);