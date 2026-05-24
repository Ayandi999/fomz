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
    validTill: z.date().nullable().optional().describe("Expiration date"),
    createdAt: z.date().nullable().optional().describe("Form creation date"),
    updatedAt: z.date().nullable().optional().describe("Form update date"),
  })
);


