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

