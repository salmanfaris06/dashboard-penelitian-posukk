CREATE TABLE `activity_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer NOT NULL,
	`created_by_user_id` integer,
	`title` text NOT NULL,
	`description` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`location` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `schedules_center_starts_idx` ON `activity_schedules` (`pos_ukk_center_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `schedules_status_starts_idx` ON `activity_schedules` (`status`,`starts_at`);--> statement-breakpoint
CREATE INDEX `schedules_creator_idx` ON `activity_schedules` (`created_by_user_id`);--> statement-breakpoint
CREATE TABLE `application_evaluations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`respondent_user_id` integer NOT NULL,
	`pos_ukk_center_id` integer,
	`submitted_at` text NOT NULL,
	`answers` text NOT NULL,
	`total_score` integer NOT NULL,
	`average_score` real NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`respondent_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `application_evaluations_respondent_user_id_unique` ON `application_evaluations` (`respondent_user_id`);--> statement-breakpoint
CREATE INDEX `evaluation_center_submitted_idx` ON `application_evaluations` (`pos_ukk_center_id`,`submitted_at`);--> statement-breakpoint
CREATE TABLE `artisans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer NOT NULL,
	`cadre_id` integer,
	`respondent_number` text,
	`identity_number` text,
	`name` text NOT NULL,
	`birth_date` text,
	`age` integer,
	`sex` text,
	`education_level` text,
	`monthly_income` real,
	`work_tenure_years` real,
	`work_hours_per_day` real,
	`rest_hours_per_day` real,
	`occupation` text DEFAULT 'Pasien Batik' NOT NULL,
	`address` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cadre_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artisans_center_respondent_uidx` ON `artisans` (`pos_ukk_center_id`,`respondent_number`);--> statement-breakpoint
CREATE INDEX `artisans_center_name_idx` ON `artisans` (`pos_ukk_center_id`,`name`);--> statement-breakpoint
CREATE INDEX `artisans_cadre_created_idx` ON `artisans` (`cadre_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `exercise_contents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_user_id` integer,
	`title` text NOT NULL,
	`body_area` text,
	`category` text,
	`summary` text,
	`instructions` text NOT NULL,
	`media_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `exercise_status_published_idx` ON `exercise_contents` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `exercise_body_category_idx` ON `exercise_contents` (`body_area`,`category`);--> statement-breakpoint
CREATE INDEX `exercise_author_idx` ON `exercise_contents` (`author_user_id`);--> statement-breakpoint
CREATE TABLE `health_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer NOT NULL,
	`artisan_id` integer NOT NULL,
	`cadre_id` integer,
	`assessed_at` text NOT NULL,
	`height_cm` real,
	`weight_kg` real,
	`bmi` real,
	`blood_pressure` text,
	`cholesterol_mg_dl` real,
	`blood_glucose_mg_dl` real,
	`uric_acid_mg_dl` real,
	`has_hypertension` integer DEFAULT false NOT NULL,
	`has_diabetes` integer DEFAULT false NOT NULL,
	`has_gout` integer DEFAULT false NOT NULL,
	`has_hypercholesterolemia` integer DEFAULT false NOT NULL,
	`other_diseases` text,
	`uses_medication` integer DEFAULT false NOT NULL,
	`medication_notes` text,
	`complaint_duration` text,
	`current_complaint` text,
	`aggravated_by_walking` integer DEFAULT false NOT NULL,
	`aggravated_by_sitting` integer DEFAULT false NOT NULL,
	`aggravated_by_activity` integer DEFAULT false NOT NULL,
	`pain_location` text,
	`pain_type` text,
	`has_joint_stiffness` integer DEFAULT false NOT NULL,
	`range_of_motion` text,
	`has_swelling` integer DEFAULT false NOT NULL,
	`palpation_status` text,
	`sit_to_stand_result` text,
	`therapy_plan` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artisan_id`) REFERENCES `artisans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cadre_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `health_center_assessed_idx` ON `health_assessments` (`pos_ukk_center_id`,`assessed_at`);--> statement-breakpoint
CREATE INDEX `health_artisan_assessed_idx` ON `health_assessments` (`artisan_id`,`assessed_at`);--> statement-breakpoint
CREATE INDEX `health_cadre_assessed_idx` ON `health_assessments` (`cadre_id`,`assessed_at`);--> statement-breakpoint
CREATE TABLE `health_data_audits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer,
	`actor_user_id` integer,
	`actor_type` text DEFAULT 'user' NOT NULL,
	`event` text NOT NULL,
	`auditable_type` text NOT NULL,
	`auditable_id` integer NOT NULL,
	`changed_fields` text,
	`occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audits_center_occurred_idx` ON `health_data_audits` (`pos_ukk_center_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audits_target_idx` ON `health_data_audits` (`auditable_type`,`auditable_id`);--> statement-breakpoint
CREATE INDEX `audits_actor_occurred_idx` ON `health_data_audits` (`actor_user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audits_event_occurred_idx` ON `health_data_audits` (`event`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `lbp_pain_duration_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lbp_pain_duration_options_label_unique` ON `lbp_pain_duration_options` (`label`);--> statement-breakpoint
CREATE INDEX `lbp_duration_active_sort_idx` ON `lbp_pain_duration_options` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `lbp_screenings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer NOT NULL,
	`artisan_id` integer NOT NULL,
	`cadre_id` integer,
	`lbp_pain_duration_option_id` integer,
	`screened_at` text NOT NULL,
	`item_01_score` integer,
	`item_02_score` integer,
	`item_03_score` integer,
	`item_04_score` integer,
	`item_05_score` integer,
	`item_06_score` integer,
	`item_07_score` integer,
	`item_08_score` integer,
	`item_09_score` integer,
	`item_10_score` integer,
	`item_11_score` integer,
	`item_12_score` integer,
	`item_13_score` integer,
	`item_14_score` integer,
	`item_15_score` integer,
	`item_16_score` integer,
	`item_17_score` integer,
	`item_18_score` integer,
	`item_19_score` integer,
	`item_20_score` integer,
	`total_score` integer,
	`mean_score` real,
	`category` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artisan_id`) REFERENCES `artisans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cadre_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lbp_pain_duration_option_id`) REFERENCES `lbp_pain_duration_options`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `lbp_center_screened_idx` ON `lbp_screenings` (`pos_ukk_center_id`,`screened_at`);--> statement-breakpoint
CREATE INDEX `lbp_artisan_screened_idx` ON `lbp_screenings` (`artisan_id`,`screened_at`);--> statement-breakpoint
CREATE INDEX `lbp_cadre_screened_idx` ON `lbp_screenings` (`cadre_id`,`screened_at`);--> statement-breakpoint
CREATE INDEX `lbp_category_screened_idx` ON `lbp_screenings` (`category`,`screened_at`);--> statement-breakpoint
CREATE TABLE `msd_risk_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer NOT NULL,
	`artisan_id` integer NOT NULL,
	`cadre_id` integer,
	`screened_at` text NOT NULL,
	`pain_scale` integer,
	`pain_level` text,
	`pain_location` text,
	`stiffness_frequency` text,
	`stiffness_level` text,
	`abnormal_sensation_status` text,
	`abnormal_sensation_level` text,
	`muscle_fatigue_status` text,
	`muscle_fatigue_level` text,
	`posture_method` text,
	`posture_score` real,
	`posture_level` text,
	`repetitive_motion_per_hour` integer,
	`repetitive_motion_level` text,
	`exposure_duration_hours` real,
	`exposure_duration_level` text,
	`strength_flexibility_status` text,
	`strength_flexibility_level` text,
	`inflammation_sign_status` text,
	`inflammation_sign_level` text,
	`environment_workload_status` text,
	`environment_workload_level` text,
	`final_risk_category` text,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artisan_id`) REFERENCES `artisans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cadre_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `msd_center_screened_idx` ON `msd_risk_assessments` (`pos_ukk_center_id`,`screened_at`);--> statement-breakpoint
CREATE INDEX `msd_artisan_screened_idx` ON `msd_risk_assessments` (`artisan_id`,`screened_at`);--> statement-breakpoint
CREATE INDEX `msd_cadre_screened_idx` ON `msd_risk_assessments` (`cadre_id`,`screened_at`);--> statement-breakpoint
CREATE INDEX `msd_risk_screened_idx` ON `msd_risk_assessments` (`final_risk_category`,`screened_at`);--> statement-breakpoint
CREATE TABLE `physical_independence_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer NOT NULL,
	`artisan_id` integer NOT NULL,
	`cadre_id` integer,
	`assessed_at` text NOT NULL,
	`walking_status` text NOT NULL,
	`sitting_status` text NOT NULL,
	`standing_status` text NOT NULL,
	`work_activity_status` text NOT NULL,
	`sit_to_stand_status` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`category` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artisan_id`) REFERENCES `artisans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cadre_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pia_center_assessed_idx` ON `physical_independence_assessments` (`pos_ukk_center_id`,`assessed_at`);--> statement-breakpoint
CREATE INDEX `pia_artisan_assessed_idx` ON `physical_independence_assessments` (`artisan_id`,`assessed_at`);--> statement-breakpoint
CREATE INDEX `pia_cadre_assessed_idx` ON `physical_independence_assessments` (`cadre_id`,`assessed_at`);--> statement-breakpoint
CREATE INDEX `pia_category_assessed_idx` ON `physical_independence_assessments` (`category`,`assessed_at`);--> statement-breakpoint
CREATE TABLE `pos_ukk_centers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`leader_name` text,
	`contact_phone` text,
	`address` text,
	`district` text,
	`city` text DEFAULT 'Jambi' NOT NULL,
	`cadre_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`established_at` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pos_ukk_centers_name_unique` ON `pos_ukk_centers` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `pos_ukk_centers_code_unique` ON `pos_ukk_centers` (`code`);--> statement-breakpoint
CREATE INDEX `centers_active_district_idx` ON `pos_ukk_centers` (`is_active`,`district`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_expires_idx` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pos_ukk_center_id` integer,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified_at` integer,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'cadre' NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`phone` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pos_ukk_center_id`) REFERENCES `pos_ukk_centers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_role_active_center_idx` ON `users` (`role`,`is_active`,`pos_ukk_center_id`);