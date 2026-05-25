import { z } from "zod";

export const createFormInput = z.object({
  title: z.string().max(55).describe("Title of the form"),
  description: z.string().max(500).optional().describe("Description of the form"),
  createdBy: z.string().uuid().describe("Id of the user creating the form"),
});

export type CreateFormInput = z.infer<typeof createFormInput>;

export const deleteFormInput = z.object({
  formId: z.string().uuid().describe("Id of the form to delete"),
  createdBy: z.string().uuid().describe("Id of the user requesting deletion"),
});

export type DeleteFormInput = z.infer<typeof deleteFormInput>;

export const createFormFieldsInput = z.object({
  formId: z.string().uuid().describe("Id of the form to create fields for"),
  createdBy: z.string().uuid().describe("Id of the user requesting creation"),
  fields: z.array(
    z.object({
      clientTempId: z.string().describe("Temporary ID from the client"),
      description: z.string().max(500).nullable().optional().describe("Description of the field"),
      label: z.string().max(100).nullable().optional().describe("Label of the field"),
      placeholder: z.string().max(200).nullable().optional().describe("Placeholder of the field"),
      isRequired: z.boolean().default(false).describe("Whether the field is required"),
      index: z.number().describe("Ordering index"),
      labelKey: z.string().max(100).describe("Identifier key"),
      fieldType: z.enum([
        'LONG_TEXT','SHORT_TEXT','IMAGE','VIDEO','AUDIO','FILE',
        'MULTIPLE_CHOICE','YES_NO','CHECKBOX','DROPDOWN','SLIDER',
        'NUMBER','EMAIL','CONTACT_INFO','ADDRESS','PHONE','WEBSITE',
        'RATING','DATE','WELCOME','THANK_YOU','INFO'
      ]).describe("Field type"),
      parentId: z.string().nullable().optional().describe("clientTempId of the parent field"),
    })
  ),
});

export type CreateFormFieldsInput = z.infer<typeof createFormFieldsInput>;

export const putFormFieldsInput = z.object({
  formId: z.string().uuid().describe("Id of the form to put fields for"),
  createdBy: z.string().uuid().describe("Id of the user requesting update"),
  fields: z.array(
    z.object({
      id: z.string().uuid().describe("UUID of the field"),
      description: z.string().max(500).nullable().optional().describe("Description of the field"),
      label: z.string().max(100).nullable().optional().describe("Label of the field"),
      placeholder: z.string().max(200).nullable().optional().describe("Placeholder of the field"),
      isRequired: z.boolean().default(false).describe("Whether the field is required"),
      index: z.number().describe("Ordering index"),
      labelKey: z.string().max(100).describe("Identifier key"),
      fieldType: z.enum([
        'LONG_TEXT','SHORT_TEXT','IMAGE','VIDEO','AUDIO','FILE',
        'MULTIPLE_CHOICE','YES_NO','CHECKBOX','DROPDOWN','SLIDER',
        'NUMBER','EMAIL','CONTACT_INFO','ADDRESS','PHONE','WEBSITE',
        'RATING','DATE','WELCOME','THANK_YOU','INFO'
      ]).describe("Field type"),
      parentId: z.string().nullable().optional().describe("UUID of the parent field"),
    })
  ),
});

export type PutFormFieldsInput = z.infer<typeof putFormFieldsInput>;

export const deleteFormFieldInput = z.object({
  formId: z.string().uuid().describe("Id of the form"),
  createdBy: z.string().uuid().describe("Id of the user"),
  fieldId: z.string().uuid().describe("Id of the field to delete"),
});

export type DeleteFormFieldInput = z.infer<typeof deleteFormFieldInput>;

export const publishFormInput = z.object({
  formId: z.string().uuid().describe("Id of the form"),
  createdBy: z.string().uuid().describe("Id of the user"),
  isPublished: z.boolean().describe("Publish state"),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional().describe("Visibility level"),
  validTill: z.coerce.date().nullable().optional().describe("Expiration date"),
  notificationEmails: z.array(z.string()).optional().describe("Additional recipient emails for post-expiry digest"),
});

export type PublishFormInput = z.infer<typeof publishFormInput>;

export const getPublicFormBySlugInput = z.object({
  slug: z.string().describe("Form URL slug"),
});

export type GetPublicFormBySlugInput = z.infer<typeof getPublicFormBySlugInput>;

export const submitFormResponseInput = z.object({
  formId: z.string().uuid().describe("Id of the form"),
  answers: z.array(
    z.object({
      fieldId: z.string().uuid().describe("Id of the question/field"),
      value: z.string().nullable().optional().describe("Textual response value"),
    })
  ).describe("Respondent answers"),
});

export type SubmitFormResponseInput = z.infer<typeof submitFormResponseInput>;
