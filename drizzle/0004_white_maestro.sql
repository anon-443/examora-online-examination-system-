CREATE TABLE `examFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`userId` int NOT NULL,
	`difficultyRating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `examFeedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `exam_feedback_attempt_uq` UNIQUE(`attemptId`)
);
--> statement-breakpoint
ALTER TABLE `examFeedback` ADD CONSTRAINT `exam_feedback_attempt_fk` FOREIGN KEY (`attemptId`) REFERENCES `examAttempts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `examFeedback` ADD CONSTRAINT `exam_feedback_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `exam_feedback_user_idx` ON `examFeedback` (`userId`);