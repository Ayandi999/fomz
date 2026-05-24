import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { formsTable } from "./form";

// 1. Parent Submission Event Table
export const submissionsTable = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  formId: uuid('form_id').references(() => formsTable.formId, { onDelete: 'cascade' }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

