CREATE TABLE `attemptAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`attemptId` int NOT NULL,
	`questionId` int NOT NULL,
	`selectedOption` int NOT NULL,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attemptAnswers_id` PRIMARY KEY(`id`),
	CONSTRAINT `attempt_answers_attempt_question_uq` UNIQUE(`attemptId`,`questionId`)
);
--> statement-breakpoint
CREATE TABLE `examAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
	`totalQuestions` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`incorrectAnswers` int NOT NULL DEFAULT 0,
	`percentage` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	CONSTRAINT `examAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`subject` varchar(96) NOT NULL,
	`description` text NOT NULL,
	`durationMinutes` int NOT NULL,
	`difficulty` enum('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Intermediate',
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`examId` int NOT NULL,
	`prompt` text NOT NULL,
	`optionA` text NOT NULL,
	`optionB` text NOT NULL,
	`optionC` text NOT NULL,
	`optionD` text NOT NULL,
	`correctOption` int NOT NULL,
	`position` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`),
	CONSTRAINT `questions_exam_position_uq` UNIQUE(`examId`,`position`)
);
--> statement-breakpoint
CREATE INDEX `attempt_answers_attempt_idx` ON `attemptAnswers` (`attemptId`);--> statement-breakpoint
CREATE INDEX `attempts_user_idx` ON `examAttempts` (`userId`);--> statement-breakpoint
CREATE INDEX `attempts_exam_idx` ON `examAttempts` (`examId`);--> statement-breakpoint
CREATE INDEX `attempts_status_idx` ON `examAttempts` (`status`);--> statement-breakpoint
CREATE INDEX `exams_status_idx` ON `exams` (`status`);--> statement-breakpoint
CREATE INDEX `exams_subject_idx` ON `exams` (`subject`);--> statement-breakpoint
CREATE INDEX `questions_exam_idx` ON `questions` (`examId`);