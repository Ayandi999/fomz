import { pgTable, uuid, varchar, boolean, timestamp, pgEnum, text } from "drizzle-orm/pg-core";
import { usersTable } from './user';
import { themesTable } from './theme';

export const visibilityEnum = pgEnum('visibility_enum',['PUBLIC','PRIVATE','UNLISTED'])

export const formsTable = pgTable("forms", {
  formId: uuid("form_id").primaryKey().defaultRandom(),
  title: varchar('title', { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  isPublished: boolean('is_published').default(false).notNull(),

  visibility: visibilityEnum('visibility').default('UNLISTED'), 

  //for passwor dprotection
  isPasswordProtected : boolean('is_password_protected').default(false),
  password:varchar('password',{length:255}).default(''),

  createdBy: uuid('created_by').references(() => usersTable.id, { onDelete: 'cascade' }),
  themeId: uuid('theme_id').references(() => themesTable.id, { onDelete: 'set null' }),
  validTill: timestamp('valid_till'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),

  digestSent: boolean('digest_sent').default(false).notNull(),
  notificationEmails: text('notification_emails').array(),
  allowedDomains: text('allowed_domains').array(),
});


