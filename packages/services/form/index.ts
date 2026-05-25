import {
  type CreateFormInput,
  createFormInput,
  type DeleteFormInput,
  deleteFormInput,
  type CreateFormFieldsInput,
  type PutFormFieldsInput,
  type DeleteFormFieldInput,
  type PublishFormInput,
  type GetPublicFormBySlugInput,
  type SubmitFormResponseInput,
} from "./model";
import { db, and, eq, desc, inArray } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formField } from "@repo/database/models/formFields";
import { submissionsTable } from "@repo/database/models/submissions";
import { answersTable } from "@repo/database/models/answers";

class formService {
  public async createForm(payload: CreateFormInput) {
    const { title, description, createdBy } =
      await createFormInput.parseAsync(payload);

    // Generate a clean, unique URL slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .concat("-", Math.random().toString(36).substring(2, 8));

    const insertedForm = await db
      .insert(formsTable)
      .values({
        title,
        description,
        createdBy,
        slug,
      })
      .returning({ id: formsTable.formId });

    if (!insertedForm || insertedForm.length === 0 || !insertedForm[0]?.id) {
      throw new Error("Something went wrong while creating form");
    }

    return {
      id: insertedForm[0].id,
    };
  }

  public async deleteForm(payload: DeleteFormInput) {
    const { formId, createdBy } = await deleteFormInput.parseAsync(payload);

    const deleted = await db
      .delete(formsTable)
      .where(
        and(
          eq(formsTable.formId, formId),
          eq(formsTable.createdBy, createdBy)
        )
      )
      .returning({ id: formsTable.formId });

    if (!deleted || deleted.length === 0) {
      throw new Error("Form not found or you do not have permission to delete it");
    }

    return {
      success: true,
    };
  }

  public async getUserForms(createdBy: string) {
    const forms = await db
      .select({
        id: formsTable.formId,
        title: formsTable.title,
        description: formsTable.description,
        slug: formsTable.slug,
        isPublished: formsTable.isPublished,
        visibility: formsTable.visibility,
        validTill: formsTable.validTill,
        createdAt: formsTable.createdAt,
        updatedAt: formsTable.updatedAt,
      })
      .from(formsTable)
      .where(eq(formsTable.createdBy, createdBy))
      .orderBy(desc(formsTable.createdAt));

    return forms;
  }

  public async getFormFields(formId: string) {
    // 1. Verify that the form exists in the database
    const formExists = await db
      .select({ id: formsTable.formId })
      .from(formsTable)
      .where(eq(formsTable.formId, formId));

    if (!formExists || formExists.length === 0) {
      throw new Error("Form not found");
    }

    // 2. Query fields
    const fields = await db
      .select({
        id: formField.id,
        description: formField.description,
        formId: formField.formId,
        label: formField.label,
        parentId: formField.parentId,
        placeholder: formField.placeholder,
        isRequired: formField.isRequired,
        index: formField.index,
        labelKey: formField.labelKey,
        fieldType: formField.fieldType,
        createdAt: formField.createdAt,
        updatedAt: formField.updatedAt,
      })
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(formField.index);

    // 3. Ensure we have a proper, non-empty list of fields
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error("This form has no questions configured yet");
    }

    return fields;
  }

  public async createFormFields(payload: CreateFormFieldsInput) {
    const { formId, createdBy, fields } = payload;

    // 1. Verify that the form exists and belongs to this user
    const form = await db
      .select({ id: formsTable.formId })
      .from(formsTable)
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)));

    if (!form || form.length === 0) {
      throw new Error("Form not found or you do not have permission to modify it");
    }

    // 2. Perform the database batch insertion inside a transaction
    await db.transaction(async (tx) => {
      // Sort fields by index to guarantee parents are created before their children
      const sortedIncomingFields = [...fields].sort((a, b) => a.index - b.index);

      // Keep a mapping of clientTempId -> database UUID for newly created fields
      const tempIdMap = new Map<string, string>();

      // Process fields in order
      for (const field of sortedIncomingFields) {
        // Resolve parent ID from temp mapping if nested
        let resolvedParentId: string | null = null;
        if (field.parentId && tempIdMap.has(field.parentId)) {
          resolvedParentId = tempIdMap.get(field.parentId) || null;
        }

        // Insert new field
        const inserted = await tx
          .insert(formField)
          .values({
            formId,
            label: field.label || null,
            placeholder: field.placeholder || null,
            description: field.description || null,
            isRequired: field.isRequired,
            index: field.index,
            labelKey: field.labelKey,
            fieldType: field.fieldType,
            parentId: resolvedParentId,
          })
          .returning({ id: formField.id });

        if (inserted && inserted.length > 0 && inserted[0]?.id) {
          tempIdMap.set(field.clientTempId, inserted[0].id);
        }
      }
    });

    return { success: true };
  }

  public async putFormFields(payload: PutFormFieldsInput) {
    const { formId, createdBy, fields } = payload;

    // 1. Verify that the form exists and belongs to this user
    const form = await db
      .select({ id: formsTable.formId })
      .from(formsTable)
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)));

    if (!form || form.length === 0) {
      throw new Error("Form not found or you do not have permission to modify it");
    }

    // 2. Perform the database sync in a single transaction
    await db.transaction(async (tx) => {
      // Fetch all existing fields in database for this form to validate patch IDs
      const existingDbFields = await tx
        .select({ id: formField.id })
        .from(formField)
        .where(eq(formField.formId, formId));

      const existingDbIds = existingDbFields.map((f) => f.id);

      // Validate that all field IDs in the payload belong to this form
      for (const field of fields) {
        if (!existingDbIds.includes(field.id)) {
          throw new Error(`Field ${field.id} not found in this form`);
        }
      }

      // Step 1: Set temporary negative indices to avoid uniqueness constraint collisions during sorting/updating
      for (const field of fields) {
        await tx
          .update(formField)
          .set({ index: -1000 - field.index })
          .where(eq(formField.id, field.id));
      }

      // Step 2: Process fields in order, updating with final indices and replacing values completely
      for (const field of fields) {
        await tx
          .update(formField)
          .set({
            label: field.label || null,
            placeholder: field.placeholder || null,
            description: field.description || null,
            isRequired: field.isRequired,
            index: field.index,
            labelKey: field.labelKey,
            fieldType: field.fieldType,
            parentId: field.parentId || null,
            updatedAt: new Date(),
          })
          .where(eq(formField.id, field.id));
      }
    });

    return { success: true };
  }

  public async deleteFormField(payload: DeleteFormFieldInput) {
    const { formId, createdBy, fieldId } = payload;

    // 1. Verify that the form exists and belongs to this user
    const form = await db
      .select({ id: formsTable.formId })
      .from(formsTable)
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)));

    if (!form || form.length === 0) {
      throw new Error("Form not found or you do not have permission to modify it");
    }

    // 2. Delete the specified question
    const deleted = await db
      .delete(formField)
      .where(and(eq(formField.id, fieldId), eq(formField.formId, formId)))
      .returning({ id: formField.id });

    if (!deleted || deleted.length === 0) {
      throw new Error("Question not found in this form");
    }

    return { success: true };
  }

  public async publishForm(payload: PublishFormInput) {
    const { formId, createdBy, isPublished, visibility, validTill } = payload;
    const updated = await db
      .update(formsTable)
      .set({ 
        isPublished,
        ...(visibility !== undefined && { visibility }),
        ...(validTill !== undefined && { validTill }),
        updatedAt: new Date(),
      })
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)))
      .returning({ formId: formsTable.formId });

    if (!updated || updated.length === 0) {
      throw new Error("Form not found or you do not have permission to publish it");
    }

    return { success: true };
  }

  public async getPublicFormBySlug(payload: GetPublicFormBySlugInput) {
    const { slug } = payload;

    // 1. Look up the published form by slug
    const forms = await db
      .select({
        formId: formsTable.formId,
        isPublished: formsTable.isPublished,
        visibility: formsTable.visibility,
        validTill: formsTable.validTill,
      })
      .from(formsTable)
      .where(eq(formsTable.slug, slug));

    if (!forms || forms.length === 0) {
      throw new Error("Form not found");
    }

    const form = forms[0]!;

    if (!form.isPublished) {
      throw new Error("This form is not published");
    }

    if (form.visibility === "PRIVATE") {
      throw new Error("This form is private");
    }

    if (form.validTill && new Date() > new Date(form.validTill)) {
      throw new Error("This form has expired");
    }

    // 2. Fetch only the fields needed to render the UI — no internal metadata
    const fields = await db
      .select({
        id: formField.id,
        formId: formField.formId,
        label: formField.label,
        placeholder: formField.placeholder,
        fieldType: formField.fieldType,
        isRequired: formField.isRequired,
        parentId: formField.parentId,
        index: formField.index,
      })
      .from(formField)
      .where(eq(formField.formId, form.formId))
      .orderBy(formField.index);

    if (!fields || fields.length === 0) {
      throw new Error("This form has no questions configured yet");
    }

    return {
      formId: form.formId,
      fields,
    };
  }

  public async submitFormResponse(payload: SubmitFormResponseInput) {
    const { formId, answers } = payload;

    // 1. Verify form exists and is active/published
    const forms = await db
      .select({
        formId: formsTable.formId,
        isPublished: formsTable.isPublished,
        validTill: formsTable.validTill,
      })
      .from(formsTable)
      .where(eq(formsTable.formId, formId));

    if (!forms || forms.length === 0) {
      throw new Error("Form not found");
    }

    const form = forms[0]!;

    if (!form.isPublished) {
      throw new Error("This form is not accepting responses");
    }

    if (form.validTill && new Date() > new Date(form.validTill)) {
      throw new Error("This form has expired and is no longer accepting responses");
    }

    // 2. Insert submission and answers in a transaction
    await db.transaction(async (tx) => {
      // Create the parent submission record
      const inserted = await tx
        .insert(submissionsTable)
        .values({ formId })
        .returning({ id: submissionsTable.id });

      if (!inserted || inserted.length === 0 || !inserted[0]?.id) {
        throw new Error("Failed to create submission");
      }

      const submissionId = inserted[0].id;

      // Insert each individual answer
      for (const answer of answers) {
        if (!answer.fieldId) continue;
        await tx.insert(answersTable).values({
          submissionId,
          fieldId: answer.fieldId,
          value: answer.value ?? null,
        });
      }
    });

    return { success: true };
  }
}

export default formService;


