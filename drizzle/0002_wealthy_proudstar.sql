CREATE INDEX `leadId_idx` ON `lead_feedback` (`leadId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `lead_feedback` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `lead_feedback` (`status`);--> statement-breakpoint
CREATE INDEX `followUpDate_idx` ON `lead_feedback` (`followUpDate`);--> statement-breakpoint
CREATE INDEX `feedback_createdAt_idx` ON `lead_feedback` (`createdAt`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `leads` (`phone`);--> statement-breakpoint
CREATE INDEX `assignedTo_idx` ON `leads` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `autoCategory_idx` ON `leads` (`autoCategory`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `leads` (`createdAt`);--> statement-breakpoint
CREATE INDEX `username_idx` ON `users` (`username`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `users` (`role`);