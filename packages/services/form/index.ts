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
import argon2 from 'argon2'
import UserService from "../user/index";
const userService = new UserService();
import { db, and, eq, desc, inArray, lt, isNotNull, sql, or, isNull, gt } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formField } from "@repo/database/models/formFields";
import { submissionsTable } from "@repo/database/models/submissions";
import { answersTable } from "@repo/database/models/answers";
import { usersTable } from "@repo/database/models/user";
import { themesTable } from "@repo/database/models/theme";
import { sendEmail } from "../clients/mail";
import { cloudinary } from "../clients/cloudinary";

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

    // 1. Verify the form exists and belongs to the user
    const form = await db
      .select({ formId: formsTable.formId })
      .from(formsTable)
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)));

    if (!form || form.length === 0) {
      throw new Error("Form not found or you do not have permission to delete it");
    }

    // 2. Fetch all submissions associated with the form
    const submissions = await db
      .select({ id: submissionsTable.id })
      .from(submissionsTable)
      .where(eq(submissionsTable.formId, formId));

    if (submissions.length > 0) {
      const submissionIds = submissions.map(s => s.id);

      // 3. Fetch all answer entries
      const answers = await db
        .select({ value: answersTable.value })
        .from(answersTable)
        .where(inArray(answersTable.submissionId, submissionIds));

      // 4. Extract secure Cloudinary URL resources from answers
      const cloudinaryUrls = answers
        .map(a => a.value)
        .filter((val): val is string => 
          typeof val === "string" && 
          val.includes("res.cloudinary.com")
        );

      if (cloudinaryUrls.length > 0) {
        // Extract publicIds from Cloudinary URLs:
        // Format: https://res.cloudinary.com/cloud_name/[image|video]/upload/v123456/folder/public_id.ext
        const publicIds = cloudinaryUrls.map(url => {
          try {
            const parts = url.split("/upload/");
            if (parts.length < 2) return null;
            const pathParts = parts[1]!.split("/");
            // Remove version tag if present (starts with 'v' followed by numbers)
            if (pathParts[0]?.startsWith("v") && !isNaN(Number(pathParts[0].substring(1)))) {
              pathParts.shift();
            }
            const pathWithExtension = pathParts.join("/");
            // Remove file extension at the end
            const lastDotIndex = pathWithExtension.lastIndexOf(".");
            return lastDotIndex !== -1 ? pathWithExtension.substring(0, lastDotIndex) : pathWithExtension;
          } catch (e) {
            return null;
          }
        }).filter((id): id is string => typeof id === "string");

        // 5. Delete Cloudinary resources in batches (Images, Videos, Audios, PDFs)
        for (const publicId of publicIds) {
          try {
            // Check if resource is a video or audio to use appropriate resource_type
            const isVideoOrAudio = publicId.includes("video") || publicId.includes("audio");
            await cloudinary.uploader.destroy(publicId, {
              resource_type: isVideoOrAudio ? "video" : "image"
            });
          } catch (err) {
            console.error(`Failed to delete Cloudinary resource: ${publicId}`, err);
          }
        }
      }
    }

    // 6. Delete the form from database (Cascade will automatically delete formFields, submissions, and answers)
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
        allowedDomains: formsTable.allowedDomains,
        notificationEmails: formsTable.notificationEmails,
        isPasswordProtected: formsTable.isPasswordProtected,
        password: formsTable.password,
        responses: sql<number>`cast(count(${submissionsTable.id}) as integer)`,
        themeId: formsTable.themeId,
        themeCode: themesTable.code,
      })
      .from(formsTable)
      .leftJoin(submissionsTable, eq(formsTable.formId, submissionsTable.formId))
      .leftJoin(themesTable, eq(formsTable.themeId, themesTable.id))
      .where(eq(formsTable.createdBy, createdBy))
      .groupBy(formsTable.formId, themesTable.id)
      .orderBy(desc(formsTable.createdAt));

    return forms;
  }

  public async getExploreForms() {
    const forms = await db
      .select({
        id: formsTable.formId,
        title: formsTable.title,
        description: formsTable.description,
        slug: formsTable.slug,
        isPublished: formsTable.isPublished,
        visibility: formsTable.visibility,
        createdAt: formsTable.createdAt,
        creatorFirstName: usersTable.firstName,
        creatorLastName: usersTable.lastName,
        responses: sql<number>`cast(count(${submissionsTable.id}) as integer)`,
      })
      .from(formsTable)
      .leftJoin(submissionsTable, eq(formsTable.formId, submissionsTable.formId))
      .leftJoin(usersTable, eq(formsTable.createdBy, usersTable.id))
      .where(
        and(
          eq(formsTable.isPublished, true), 
          eq(formsTable.visibility, "PUBLIC"),
          or(isNull(formsTable.validTill), gt(formsTable.validTill, new Date()))
        )
      )
      .groupBy(formsTable.formId, usersTable.firstName, usersTable.lastName)
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
    const { formId, createdBy, isPublished, visibility, validTill, notificationEmails, allowedDomains, isPasswordProtected, password } = payload;
    let hash: string | undefined = undefined;
    if (isPasswordProtected && password) hash = await argon2.hash(password);
    const updated = await db
      .update(formsTable)
      .set({ 
        isPublished,
        ...(visibility !== undefined && { visibility }),
        ...(validTill !== undefined && { validTill }),
        ...(notificationEmails !== undefined && { notificationEmails }),
        ...(allowedDomains !== undefined && { allowedDomains }),
        ...(isPasswordProtected !== undefined && { isPasswordProtected }),
        ...(password !== undefined && isPasswordProtected && { password: hash }),
        ...(!isPasswordProtected && { password: "" }),
        updatedAt: new Date(),
      })
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)))
      .returning({ formId: formsTable.formId });

    if (!updated || updated.length === 0) {
      throw new Error("Form not found or you do not have permission to publish it");
    }

    return { success: true };
  }

  public async getPublicFormBySlug(payload: GetPublicFormBySlugInput & { token?: string }) {
    const { slug, token, enteredPassword } = payload;

    // 1. Look up the published form by slug
    const forms = await db
      .select({
        formId: formsTable.formId,
        isPublished: formsTable.isPublished,
        visibility: formsTable.visibility,
        validTill: formsTable.validTill,
        allowedDomains: formsTable.allowedDomains,
        isPasswordProtected: formsTable.isPasswordProtected,
        password: formsTable.password,
        themeId: formsTable.themeId,
        themeCode: themesTable.code,
      })
      .from(formsTable)
      .leftJoin(themesTable, eq(formsTable.themeId, themesTable.id))
      .where(eq(formsTable.slug, slug));

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

    // Password check for non-PRIVATE forms (PUBLIC / UNLISTED)
    if (form.visibility !== "PRIVATE" && form.isPasswordProtected) {
      if (!enteredPassword) {
        throw new Error("PASSWORD_REQUIRED");
      }
      if(form.password && enteredPassword) {
        const isCorrectPassword = await argon2.verify(form.password, enteredPassword);
        if (!isCorrectPassword) {
          throw new Error("INCORRECT_PASSWORD");
        }
      } else {
        throw new Error("INCORRECT_PASSWORD");
      }
    }

    if (form.visibility === "PRIVATE") {
      if (!token) {
        throw new Error("LOGIN_REQUIRED");
      }

      let user;
      try {
        user = await userService.verifyUserToken(token);
      } catch (e) {
        throw new Error("LOGIN_REQUIRED");
      }

      if (!user || !user.email) {
        throw new Error("LOGIN_REQUIRED");
      }

      const visitorDomain = user.email.split("@")[1]?.toLowerCase();
      const allowed = (form.allowedDomains || []).map(d => d.trim().toLowerCase());

      if (!visitorDomain || allowed.length === 0 || !allowed.includes(visitorDomain)) {
        throw new Error("UNAUTHORIZED_DOMAIN_RESTRICTED");
      }
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
      themeId: form.themeId,
      themeCode: form.themeCode,
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
        visibility:formsTable.visibility
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

  public async getFormAnalytics(payload: { formId: string; createdBy: string }) {
    const { formId, createdBy } = payload;

    // 1. Verify the form exists and belongs to the user
    const forms = await db
      .select({ formId: formsTable.formId })
      .from(formsTable)
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)));

    if (!forms || forms.length === 0) {
      throw new Error("Form not found or you do not have permission to view its analytics");
    }

    // 2. Fetch all submissions
    const submissions = await db
      .select({
        id: submissionsTable.id,
        createdAt: submissionsTable.createdAt,
      })
      .from(submissionsTable)
      .where(eq(submissionsTable.formId, formId))
      .orderBy(desc(submissionsTable.createdAt));

    // 3. Fetch all questions
    const fields = await db
      .select({
        id: formField.id,
        label: formField.label,
        labelKey: formField.labelKey,
        fieldType: formField.fieldType,
        placeholder: formField.placeholder,
        parentId: formField.parentId,
      })
      .from(formField)
      .where(eq(formField.formId, formId))
      .orderBy(formField.index);

    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        completionRate: 0,
        submissionsOverTime: [],
        aggregations: {},
        submissionsList: [],
      };
    }

    const submissionIds = submissions.map(s => s.id);

    // 4. Fetch all answers for these submissions
    const answers = await db
      .select({
        id: answersTable.id,
        submissionId: answersTable.submissionId,
        fieldId: answersTable.fieldId,
        value: answersTable.value,
      })
      .from(answersTable)
      .where(inArray(answersTable.submissionId, submissionIds));

    // Group answers by fieldId
    const answersByField: Record<string, typeof answers> = {};
    for (const ans of answers) {
      if (!answersByField[ans.fieldId]) {
        answersByField[ans.fieldId] = [];
      }
      const groupArr = answersByField[ans.fieldId];
      if (groupArr) {
        groupArr.push(ans);
      }
    }

    // Calculate submissions over time
    const trendMap: Record<string, number> = {};
    for (const sub of submissions) {
      if (sub.createdAt) {
        const dateStr = new Date(sub.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
      }
    }
    const submissionsOverTime = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .reverse();

    // Calculate aggregations for each question
    const aggregations: Record<string, any> = {};
    for (const field of fields) {
      const fieldAnswers = answersByField[field.id] || [];
      const values = fieldAnswers.map(a => (a.value || "").trim()).filter(Boolean);

      if (["MULTIPLE_CHOICE", "DROPDOWN", "YES_NO", "CHECKBOX"].includes(field.fieldType)) {
        const distribution: Record<string, number> = {};
        for (const val of values) {
          if (field.fieldType === "CHECKBOX") {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  distribution[item] = (distribution[item] || 0) + 1;
                }
                continue;
              }
            } catch {}
          }
          distribution[val] = (distribution[val] || 0) + 1;
        }

        const totalVotes = Object.values(distribution).reduce((a, b) => a + b, 0);
        aggregations[field.id] = {
          fieldType: field.fieldType,
          label: field.label,
          totalResponses: values.length,
          distribution: Object.entries(distribution).map(([choice, count]) => ({
            choice,
            count,
            percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
          })),
        };
      } else if (["SLIDER", "RATING"].includes(field.fieldType)) {
        const nums = values.map(Number).filter(n => !isNaN(n));
        const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
        const min = nums.length > 0 ? Math.min(...nums) : 0;
        const max = nums.length > 0 ? Math.max(...nums) : 0;

        const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (field.fieldType === "RATING") {
          for (const n of nums) {
            if (n >= 1 && n <= 5) {
              ratingDist[n] = (ratingDist[n] || 0) + 1;
            }
          }
        }

        aggregations[field.id] = {
          fieldType: field.fieldType,
          label: field.label,
          totalResponses: nums.length,
          average: Math.round(avg * 10) / 10,
          min,
          max,
          distribution: Object.entries(ratingDist).map(([rating, count]) => ({
            rating: Number(rating),
            count,
          })),
        };
      } else {
        aggregations[field.id] = {
          fieldType: field.fieldType,
          label: field.label,
          totalResponses: values.length,
          recentAnswers: values.slice(0, 15),
        };
      }
    }

    // Format individual responses table ("who responded with what")
    const submissionsList = submissions.map(sub => {
      const subAnswers: Record<string, string> = {};
      for (const field of fields) {
        const matched = answers.find(a => a.submissionId === sub.id && a.fieldId === field.id);
        subAnswers[field.labelKey] = matched?.value || "";
      }
      return {
        id: sub.id,
        createdAt: sub.createdAt,
        answers: subAnswers,
      };
    });

    return {
      totalSubmissions: submissions.length,
      completionRate: 100, // standard complete responses in conversational deck layouts
      submissionsOverTime,
      aggregations,
      submissionsList,
    };
  }

  public async getRecentSubmissions(createdBy: string) {
    const recentSubmissions = await db
      .select({
        submissionId: submissionsTable.id,
        formId: formsTable.formId,
        formTitle: formsTable.title,
        createdAt: submissionsTable.createdAt,
      })
      .from(submissionsTable)
      .innerJoin(formsTable, eq(submissionsTable.formId, formsTable.formId))
      .where(eq(formsTable.createdBy, createdBy))
      .orderBy(desc(submissionsTable.createdAt))
      .limit(5);
      if(!recentSubmissions || recentSubmissions.length === 0) throw new Error('No new submissions found');
    return recentSubmissions;
  }

  public async checkAndSendExpiredFormDigests() {
    try {
      // 1. Fetch expired, published forms that haven't sent a digest yet
      const expiredForms = await db
        .select({
          formId: formsTable.formId,
          title: formsTable.title,
          createdBy: formsTable.createdBy,
          notificationEmails: formsTable.notificationEmails,
        })
        .from(formsTable)
        .where(
          and(
            eq(formsTable.isPublished, true),
            eq(formsTable.digestSent, false),
            isNotNull(formsTable.validTill),
            lt(formsTable.validTill, new Date())
          )
        );

      if (expiredForms.length === 0) return;

      console.log(`Found ${expiredForms.length} expired forms requiring email digests.`);

      for (const form of expiredForms) {
        if (!form.createdBy) continue;
        // Fetch creator's email address
        const creators = await db
          .select({ email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, form.createdBy));

        if (creators.length === 0) {
          console.warn(`Creator not found for form ${form.formId}`);
          continue;
        }

        const creatorEmail = creators[0]!.email;

        // Fetch aggregate response statistics for this form
        const analytics = await this.getFormAnalytics({
          formId: form.formId,
          createdBy: form.createdBy,
        });

        // Unique dynamic link to analysis dashboard tab
        const analysisUrl = `http://localhost:3000/dashboard/edit/${form.formId}?tab=analytics`;

        // Format HTML Email Digest with standard inline retro-aesthetic layout
        const extraRecipients = form.notificationEmails || [];
        const recipientsList = [creatorEmail, ...extraRecipients];

        // Let's build a clean visual summary of MCQs, Ratings, etc.
        let summaryHtml = "";
        const aggregations = Object.values(analytics.aggregations);
        if (aggregations.length > 0) {
          summaryHtml = `
            <h3 style="color: #171717; font-size: 15px; text-transform: uppercase; font-weight: bold; margin-top: 25px; border-bottom: 2px solid #e5e5e5; padding-bottom: 5px;">Key Response Summaries</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
          `;
          for (const agg of aggregations as any[]) {
            summaryHtml += `
              <tr style="border-bottom: 1px solid #f0f0f0;">
                <td style="padding: 10px 0; font-weight: bold; color: #171717;">${agg.label}</td>
                <td style="padding: 10px 0; text-align: right; color: #404040;">
            `;
            if (["MULTIPLE_CHOICE", "DROPDOWN", "YES_NO", "CHECKBOX"].includes(agg.fieldType)) {
              summaryHtml += (agg.distribution || []).map((d: any) => `${d.choice}: <strong>${d.count} (${d.percentage}%)</strong>`).join("<br />");
            } else if (["SLIDER", "RATING"].includes(agg.fieldType)) {
              summaryHtml += `Avg: <strong>${agg.average}</strong> (Min: ${agg.min}, Max: ${agg.max})`;
            } else {
              summaryHtml += `<strong>${agg.totalResponses} responses</strong>`;
            }
            summaryHtml += `
                </td>
              </tr>
            `;
          }
          summaryHtml += `</table>`;
        }

        const emailHtml = `
          <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: auto; border: 2px solid #171717; background-color: #ffffff; color: #171717;">
            <h2 style="text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px solid #171717; padding-bottom: 15px; margin-top: 0; font-size: 22px; font-weight: 800;">
              Form Finished & Expiry Report
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #404040;">
              Your conversational form <strong>"${form.title}"</strong> has finished accepting responses according to its scheduled expiration.
            </p>

            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #171717;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #737373;">Total Responses:</td>
                  <td style="padding: 4px 0; font-weight: bold; text-align: right;">${analytics.totalSubmissions}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #737373;">Completion Rate:</td>
                  <td style="padding: 4px 0; font-weight: bold; text-align: right;">${analytics.completionRate}%</td>
                </tr>
              </table>
            </div>

            ${summaryHtml}

            <div style="margin: 35px 0; text-align: center;">
              <a href="${analysisUrl}" style="display: inline-block; padding: 12px 30px; background-color: #171717; color: #ffffff; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; font-size: 13px; border: 2px solid #171717;">
                View Complete Analytics & Submissions
              </a>
            </div>

            <p style="font-size: 11px; color: #737373; margin-top: 30px; border-top: 1px solid #e5e5e5; padding-top: 15px;">
              This summary is sent automatically upon form expiration. Extra recipients notified: ${extraRecipients.length > 0 ? extraRecipients.join(", ") : "none"}.
            </p>
          </div>
        `;

        // Dispatch Email using Ethereal/Resend sender
        await sendEmail({
          to: recipientsList,
          subject: `Form Completed Digest: "${form.title}"`,
          html: emailHtml,
        });

        // Update form status in DB
        await db
          .update(formsTable)
          .set({ digestSent: true })
          .where(eq(formsTable.formId, form.formId));

        console.log(`Expired digest sent successfully for form ${form.formId}`);
      }
    } catch (error) {
      console.error("Error checking or sending expired form digests:", error);
    }
  }

  public async getThemes() {
    const themes = await db
      .select({
        id: themesTable.id,
        name: themesTable.name,
      })
      .from(themesTable);
    return themes;
  }

  public async getTheme(themeId: string) {
    const themes = await db
      .select({
        id: themesTable.id,
        name: themesTable.name,
        code: themesTable.code,
      })
      .from(themesTable)
      .where(eq(themesTable.id, themeId));

    if (!themes || themes.length === 0) {
      throw new Error("Theme not found");
    }
    return themes[0]!;
  }

  public async updateFormTheme(payload: { formId: string; createdBy: string; themeId: string | null }) {
    const { formId, createdBy, themeId } = payload;

    // Verify form belongs to creator
    const form = await db
      .select({ id: formsTable.formId })
      .from(formsTable)
      .where(and(eq(formsTable.formId, formId), eq(formsTable.createdBy, createdBy)));

    if (!form || form.length === 0) {
      throw new Error("Form not found or you do not have permission to modify it");
    }

    await db
      .update(formsTable)
      .set({ themeId })
      .where(eq(formsTable.formId, formId));

    return { success: true };
  }
}

export default formService;


