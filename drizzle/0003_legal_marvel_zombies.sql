ALTER TABLE `attemptAnswers` MODIFY COLUMN `selectedOption` int;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `questionPromptSnapshot` text;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `optionASnapshot` text;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `optionBSnapshot` text;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `optionCSnapshot` text;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `optionDSnapshot` text;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `correctOptionSnapshot` int;--> statement-breakpoint
ALTER TABLE `attemptAnswers` ADD `explanationSnapshot` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `explanation` text NOT NULL;