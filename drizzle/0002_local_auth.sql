-- Migration: add local username/password auth support
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NULL;
ALTER TABLE `users` ADD COLUMN `username` varchar(64) NULL UNIQUE;
ALTER TABLE `users` ADD COLUMN `passwordHash` varchar(255) NULL;
