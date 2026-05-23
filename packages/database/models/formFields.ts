import {
     pgTable,
     uuid,
     varchar,
     timestamp,
     boolean,
     text,
     numeric,
     pgEnum,
     unique
   } from "drizzle-orm/pg-core";
import {formsTable} from './form'

export const filedTypeEnum = pgEnum('field_type_enum',['TEXT','NUMBER','EMAIL','YES_NO','PASSWORD']) 
export const formFiled = pgTable("forms_fields",{
     id:uuid("id").primaryKey().defaultRandom(),
     description:text('description'),
     formId:uuid('form_id').references(()=>formsTable.id),
     lable:varchar('lable',{length:100}),
     placeholder:text("placeholder"),
     isRequired:boolean().default(false).notNull(),
     index:numeric('index',{scale:2}).notNull(), //can store 1.2,1.3,...
     lableKey:varchar('lable_key',{length:100}).notNull(),
     fieldType:filedTypeEnum('type').notNull(),
     createdAt: timestamp("created_at").defaultNow(),
     updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
},(table)=>{
     return { 
          uniqueFormIdAndIndex: unique().on(table.formId,table.index)
     }
})