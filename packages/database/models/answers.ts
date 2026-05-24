import { pgTable, uuid, text, timestamp, unique } from "drizzle-orm/pg-core";
import { formField } from "./formFields"; // Name of your fields file
import {submissionsTable} from './submissions'

// 2. Child Individual Answers Table
export const answersTable = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  submissionId: uuid('submission_id').references(() => submissionsTable.id, { onDelete: 'cascade' }).notNull(),
  
  // Links directly to the specific input field (even if it's inside a question group)
  fieldId: uuid('field_id').references(() => formField.id, { onDelete: 'cascade' }).notNull(),
  
  // Clean, strongly-typed textual data storage
  value: text("value"), 

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Audit/Security constraint: Prevents a single submission from answering the exact same field twice
    uniqueSubmissionField: unique().on(table.submissionId, table.fieldId)
  }
});