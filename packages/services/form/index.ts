import {
  type CreateFormInput,
  createFormInput,
} from "./model";
import { db } from "@repo/database";
import { formsTable } from "@repo/database/models/form";

class formService {
  public async createForm(payload: CreateFormInput) {
    const { title, description, createdBy } =
      await createFormInput.parseAsync(payload);

    const insertedForm = await db
      .insert(formsTable)
      .values({
        title,
        description,
        createdBy,
      })
      .returning({ id: formsTable.id });

    if (!insertedForm || insertedForm.length === 0 || !insertedForm[0]?.id) {
      throw new Error("Something went wrong while creating form");
    }

    return {
      id: insertedForm[0].id,
    };
  }
}

export default formService;
