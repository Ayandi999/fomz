import { z } from "zod";

export const createFormInputModel = z.object({
  title: z.string().max(55).describe("Title of the form"),
  description: z.string().max(500).optional().describe("Description of the form"),
});

export const createFormOutputModel = z.object({
  id: z.string().describe("Id of the created form"),
});

export const deleteFormInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form to delete"),
});

export const deleteFormOutputModel = z.object({
  success: z.boolean().describe("Whether form was deleted successfully"),
});

export const getUserFormsInputModel = z.undefined();

export const getUserFormsOutputModel = z.array(
  z.object({
    id: z.string().uuid().describe("Id of the form"),
    title: z.string().describe("Title of the form"),
    description: z.string().nullable().optional().describe("Description of the form"),
    slug: z.string().describe("Unique slug of the form"),
    isPublished: z.boolean().describe("Whether the form is published"),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).nullable().describe("Visibility level"),
    validTill: z.coerce.date().nullable().optional().describe("Expiration date"),
    createdAt: z.coerce.date().nullable().optional().describe("Form creation date"),
    updatedAt: z.coerce.date().nullable().optional().describe("Form update date"),
    allowedDomains: z.array(z.string()).nullable().optional().describe("Allowed email domains for private forms"),
    notificationEmails: z.array(z.string()).nullable().optional().describe("Digest notification emails"),
    responses: z.coerce.number().describe("Number of responses"),
  })
);

// New Schemas for Form Fields (Questions) and Publishing

export const getFormFieldsInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form to fetch fields for"),
});

export const getFormFieldsOutputModel = z.array(
  z.object({
    id: z.string().uuid().describe("Id of the field"),
    description: z.string().nullable().optional().describe("Description of the field"),
    formId: z.string().uuid().nullable().describe("Id of the form"),
    label: z.string().nullable().describe("Label / question title of the field"),
    parentId: z.string().uuid().nullable().optional().describe("Id of the parent field"),
    placeholder: z.string().nullable().describe("Placeholder of the field"),
    isRequired: z.boolean().describe("Whether the field is required"),
    index: z.number().describe("Ordering index"),
    labelKey: z.string().describe("Identifier key of the field"),
    fieldType: z.enum([
      'LONG_TEXT','SHORT_TEXT','IMAGE','VIDEO','AUDIO','FILE',
      'MULTIPLE_CHOICE','YES_NO','CHECKBOX','DROPDOWN','SLIDER',
      'NUMBER','EMAIL','CONTACT_INFO','ADDRESS','PHONE','WEBSITE',
      'RATING','DATE','WELCOME','THANK_YOU','INFO'
    ]).describe("Type of the field"),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
  })
);

export const createFormFieldsInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form to create fields for"),
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

export const createFormFieldsOutputModel = z.object({
  success: z.boolean().describe("Whether form fields were created successfully"),
});

export const putFormFieldsInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form to put fields for"),
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

export const putFormFieldsOutputModel = z.object({
  success: z.boolean().describe("Whether form fields were updated successfully"),
});

export const deleteFormFieldInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form"),
  fieldId: z.string().uuid().describe("Id of the field to delete"),
});

export const deleteFormFieldOutputModel = z.object({
  success: z.boolean().describe("Whether the field was deleted successfully"),
});

export const publishFormInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form"),
  isPublished: z.boolean().describe("Publish state"),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional().describe("Visibility level"),
  validTill: z.coerce.date().nullable().optional().describe("Expiration date"),
  notificationEmails: z.array(z.string()).optional().describe("Additional recipient emails"),
  allowedDomains: z.array(z.string()).optional().describe("Allowed email domains for private forms"),
});

export const publishFormOutputModel = z.object({
  success: z.boolean().describe("Whether form publish state was updated successfully"),
});

export const getFormAnalyticsInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form"),
});

export const getFormAnalyticsOutputModel = z.any().describe("Comprehensive aggregated form responses metrics and analytics payload");

// Public endpoint schemas — only what is needed to render UI and store a response
const publicFieldModel = z.object({
  id: z.string().uuid().describe("Id of the field (needed to save answer)"),
  formId: z.string().uuid().nullable().describe("Id of the form (needed to save answer)"),
  label: z.string().nullable().describe("Question label"),
  placeholder: z.string().nullable().describe("Input placeholder or options payload"),
  fieldType: z.enum([
    'LONG_TEXT','SHORT_TEXT','IMAGE','VIDEO','AUDIO','FILE',
    'MULTIPLE_CHOICE','YES_NO','CHECKBOX','DROPDOWN','SLIDER',
    'NUMBER','EMAIL','CONTACT_INFO','ADDRESS','PHONE','WEBSITE',
    'RATING','DATE','WELCOME','THANK_YOU','INFO'
  ]).describe("Field type — used to render the correct input component"),
  isRequired: z.boolean().describe("Whether the field is required"),
  parentId: z.string().uuid().nullable().optional().describe("Id of parent field — used to group children"),
  index: z.number().describe("Ordering index"),
});

export const getPublicFormBySlugInputModel = z.object({
  slug: z.string().describe("Unique form URL slug"),
});

export const getPublicFormBySlugOutputModel = z.object({
  formId: z.string().uuid().describe("Id of the form"),
  fields: z.array(publicFieldModel),
});

export const submitFormResponseInputModel = z.object({
  formId: z.string().uuid().describe("Id of the form being answered"),
  answers: z.array(
    z.object({
      fieldId: z.string().uuid().describe("Id of the field being answered"),
      value: z.string().nullable().optional().describe("Response value"),
    })
  ),
});

export const submitFormResponseOutputModel = z.object({
  success: z.boolean().describe("Whether the response was submitted successfully"),
});

export const getRecentSubmissionsInputModel = z.undefined();
export const getRecentSubmissionsOutputModel = z.array(
  z.object({
    submissionId: z.string().uuid(),
    formId: z.string().uuid(),
    formTitle: z.string(),
    createdAt: z.coerce.date(),
  })
);
