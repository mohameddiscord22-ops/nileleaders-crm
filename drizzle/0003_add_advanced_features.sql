-- Activity Log Table
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `action` varchar(64) NOT NULL,
  `entityType` varchar(64) NOT NULL,
  `entityId` int NOT NULL,
  `changes` json,
  `description` text,
  `ipAddress` varchar(45),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `activity_userId_idx` (`userId`),
  INDEX `activity_entityType_idx` (`entityType`),
  INDEX `activity_entityId_idx` (`entityId`),
  INDEX `activity_action_idx` (`action`),
  INDEX `activity_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `type` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `relatedEntityType` varchar(64),
  `relatedEntityId` int,
  `isRead` boolean NOT NULL DEFAULT false,
  `actionUrl` varchar(512),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `readAt` timestamp,
  INDEX `notif_userId_idx` (`userId`),
  INDEX `notif_isRead_idx` (`isRead`),
  INDEX `notif_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Scheduled Tasks Table
CREATE TABLE IF NOT EXISTS `scheduled_tasks` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `leadId` int NOT NULL,
  `userId` int,
  `taskType` varchar(64) NOT NULL,
  `dueDate` bigint NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `priority` enum('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt` timestamp,
  INDEX `task_leadId_idx` (`leadId`),
  INDEX `task_userId_idx` (`userId`),
  INDEX `task_dueDate_idx` (`dueDate`),
  INDEX `task_status_idx` (`status`),
  INDEX `task_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `leadId` int NOT NULL,
  `userId` int,
  `phoneNumber` varchar(32) NOT NULL,
  `message` text NOT NULL,
  `direction` enum('inbound', 'outbound') NOT NULL,
  `status` enum('sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'sent',
  `externalId` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `wa_leadId_idx` (`leadId`),
  INDEX `wa_userId_idx` (`userId`),
  INDEX `wa_phone_idx` (`phoneNumber`),
  INDEX `wa_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
