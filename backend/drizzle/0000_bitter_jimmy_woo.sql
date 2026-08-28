CREATE TABLE `triage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`from_level` text,
	`to_level` text NOT NULL,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_name` text NOT NULL,
	`level` text NOT NULL,
	`status` text DEFAULT 'WAITING' NOT NULL,
	`arrived_at` integer NOT NULL
);
