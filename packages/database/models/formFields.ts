import {
     pgTable,
     uuid,
     varchar,
     timestamp,
     boolean,
     text,
     real,
     pgEnum,
     unique,
     foreignKey
   } from "drizzle-orm/pg-core";
import {formsTable} from './form'

export const filedTypeEnum = pgEnum('field_type_enum',['LONG_TEXT','SHORT_TEXT','IMAGE','VIDEO','AUDIO','FILE','MULTIPLE_CHOICE','YES_NO','CHECKBOX','DROPDOWN','SLIDER','NUMBER','EMAIL','CONTACT_INFO','ADDRESS','PHONE','WEBSITE','RATING','DATE']) 
export const formField = pgTable("forms_fields",{
     id:uuid("id").primaryKey().defaultRandom(),

     description:text('description'),
     
     formId:uuid('form_id').references(()=>formsTable.formId,{onDelete:'cascade'}),
     
     label:varchar('label',{length:100}),

     parentId: uuid('parent_id'),
     
     placeholder:text("placeholder"),
     
     isRequired:boolean('is_required').default(false).notNull(),
     
     index:real('index').notNull(), //can store 1.2,1.3,...
     
     labelKey:varchar('label_key',{length:100}).notNull(),
     
     fieldType:filedTypeEnum('type').notNull(),
     
     createdAt: timestamp("created_at").defaultNow(),
     
     updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
},(table)=>{
     return { 
          uniqueFormIdAndIndex: unique().on(table.formId,table.index),

          parentReference: foreignKey({
               columns: [table.parentId],
               foreignColumns: [table.id],
               name: "forms_fields_parent_id_fkey"
          }).onDelete('cascade')
     }
})