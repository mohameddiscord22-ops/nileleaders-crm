CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`changes` json,
	`description` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedEntityType` varchar(64),
	`relatedEntityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int,
	`taskType` varchar(64) NOT NULL,
	`dueDate` bigint NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `scheduled_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int,
	`phoneNumber` varchar(32) NOT NULL,
	`message` text NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`status` enum('sent','delivered','read','failed') NOT NULL DEFAULT 'sent',
	`externalId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_userId_idx` ON `activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `activity_entityType_idx` ON `activity_log` (`entityType`);--> statement-breakpoint
CREATE INDEX `activity_entityId_idx` ON `activity_log` (`entityId`);--> statement-breakpoint
CREATE INDEX `activity_action_idx` ON `activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `activity_createdAt_idx` ON `activity_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notif_userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notif_isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `notif_createdAt_idx` ON `notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `task_leadId_idx` ON `scheduled_tasks` (`leadId`);--> statement-breakpoint
CREATE INDEX `task_userId_idx` ON `scheduled_tasks` (`userId`);--> statement-breakpoint
CREATE INDEX `task_dueDate_idx` ON `scheduled_tasks` (`dueDate`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `scheduled_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `task_createdAt_idx` ON `scheduled_tasks` (`createdAt`);--> statement-breakpoint
CREATE INDEX `wa_leadId_idx` ON `whatsapp_messages` (`leadId`);--> statement-breakpoint
CREATE INDEX `wa_userId_idx` ON `whatsapp_messages` (`userId`);--> statement-breakpoint
CREATE INDEX `wa_phone_idx` ON `whatsapp_messages` (`phoneNumber`);--> statement-breakpoint
CREATE INDEX `wa_createdAt_idx` ON `whatsapp_messages` (`createdAt`);