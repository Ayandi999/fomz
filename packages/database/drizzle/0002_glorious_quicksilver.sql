ALTER TABLE "forms" ADD COLUMN "is_password_protected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "password" varchar(255) DEFAULT '';