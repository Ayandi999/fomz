import {
     pgTable,
     uuid,
     varchar,
     timestamp,
     boolean,
     text,
   } from "drizzle-orm/pg-core";
import { string } from "zod";
import { usersTable } from "./user";

export const formsTable = pgTable("forms",{
     id:uuid("id").primaryKey().defaultRandom(),
     title: varchar('title',{length:55}),
     description: varchar("description",{length:500}),
     createdBy:uuid('created_by').references(()=>usersTable.id),
     createdAt: timestamp("created_at").defaultNow(),
     updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})