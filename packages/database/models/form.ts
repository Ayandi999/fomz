import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from './user'

export const visibilityEnum = pgEnum('visibility_enum',['PUBLIC','PRIVATE','UNLISTED'])

export const formsTable = pgTable("forms", {
  formId: uuid("form_id").primaryKey().defaultRandom(),
  title: varchar('title', { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  isPublished: boolean('is_published').default(false).notNull(),

  visibility: visibilityEnum('visibility').default('UNLISTED'), 

  createdBy: uuid('created_by').references(() => usersTable.id, { onDelete: 'cascade' }),
  validTill: timestamp('valid_till'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
