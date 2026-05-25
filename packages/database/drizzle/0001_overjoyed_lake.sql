ALTER TYPE "public"."field_type_enum" ADD VALUE 'WELCOME';--> statement-breakpoint
ALTER TYPE "public"."field_type_enum" ADD VALUE 'THANK_YOU';--> statement-breakpoint
ALTER TYPE "public"."field_type_enum" ADD VALUE 'INFO';--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "digest_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "notification_emails" text[];