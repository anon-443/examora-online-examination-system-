CREATE TABLE `notificationDispatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('deadline_soon') NOT NULL DEFAULT 'deadline_soon',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationDispatches_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_dispatch_uq` UNIQUE(`assignmentId`,`userId`,`kind`)
);
--> statement-breakpoint
CREATE TABLE `notificationSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleKey` varchar(64) NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSchedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSchedules_scheduleKey_unique` UNIQUE(`scheduleKey`),
	CONSTRAINT `notificationSchedules_taskUid_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
ALTER TABLE `notificationDispatches` ADD CONSTRAINT `notification_dispatches_assignment_fk` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificationDispatches` ADD CONSTRAINT `notification_dispatches_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notificationSchedules` ADD CONSTRAINT `notification_schedules_creator_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;