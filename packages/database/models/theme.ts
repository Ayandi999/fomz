import { pgTable, uuid, varchar, jsonb } from "drizzle-orm/pg-core";

export const themesTable = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: jsonb("code").$type<{ css: string }>().notNull(),
});
