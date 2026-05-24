import {
  type CreateFormInput,
  createFormInput,
  type DeleteFormInput,
  deleteFormInput,
} from "./model";
import { db, and, eq, desc } from "@repo/database";
import { formsTable } from "@repo/database/models/form";

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
}

export default formService;


