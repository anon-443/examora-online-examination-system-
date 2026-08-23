CREATE TABLE `assignmentAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`attemptId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignmentAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `assignment_attempt_uq` UNIQUE(`assignmentId`,`userId`),
	CONSTRAINT `assignment_attempt_attempt_uq` UNIQUE(`attemptId`)
);
--> statement-breakpoint
CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cohortId` int NOT NULL,
	`examId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`instructions` text,
	`scheduledAt` timestamp NOT NULL,
	`dueAt` timestamp,
	`status` enum('scheduled','published','archived') NOT NULL DEFAULT 'scheduled',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cohortMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cohortId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('instructor','learner') NOT NULL DEFAULT 'learner',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cohortMemberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `cohort_membership_uq` UNIQUE(`cohortId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(140) NOT NULL,
	`description` text,
	`inviteCode` varchar(32) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cohorts_id` PRIMARY KEY(`id`),
	CONSTRAINT `cohorts_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('assignment','deadline','cohort','system') NOT NULL DEFAULT 'system',
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`actionHref` varchar(255),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `examAttempts` ADD `assignmentId` int;--> statement-breakpoint
ALTER TABLE `assignmentAttempts` ADD CONSTRAINT `assignment_attempts_assignment_fk` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignmentAttempts` ADD CONSTRAINT `assignment_attempts_attempt_fk` FOREIGN KEY (`attemptId`) REFERENCES `examAttempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignmentAttempts` ADD CONSTRAINT `assignment_attempts_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_cohort_fk` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_exam_fk` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_creator_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cohortMemberships` ADD CONSTRAINT `cohort_memberships_cohort_fk` FOREIGN KEY (`cohortId`) REFERENCES `cohorts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cohortMemberships` ADD CONSTRAINT `cohort_memberships_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cohorts` ADD CONSTRAINT `cohorts_creator_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assignment_attempts_user_idx` ON `assignmentAttempts` (`userId`);--> statement-breakpoint
CREATE INDEX `assignments_cohort_schedule_idx` ON `assignments` (`cohortId`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `assignments_exam_idx` ON `assignments` (`examId`);--> statement-breakpoint
CREATE INDEX `cohort_memberships_user_idx` ON `cohortMemberships` (`userId`);--> statement-breakpoint
CREATE INDEX `cohorts_creator_idx` ON `cohorts` (`createdBy`);--> statement-breakpoint
CREATE INDEX `notifications_user_created_idx` ON `notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`readAt`);--> statement-breakpoint
ALTER TABLE `examAttempts` ADD CONSTRAINT `attempts_assignment_fk` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE set null ON UPDATE no action;