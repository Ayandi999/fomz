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

