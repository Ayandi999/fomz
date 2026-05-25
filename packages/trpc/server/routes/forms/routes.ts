import {
  createFormInputModel,
  createFormOutputModel,
  deleteFormInputModel,
  deleteFormOutputModel,
  getUserFormsInputModel,
  getUserFormsOutputModel,
  getFormFieldsInputModel,
  getFormFieldsOutputModel,
  createFormFieldsInputModel,
  createFormFieldsOutputModel,
  putFormFieldsInputModel,
  putFormFieldsOutputModel,
  deleteFormFieldInputModel,
  deleteFormFieldOutputModel,
  publishFormInputModel,
  publishFormOutputModel,
  getPublicFormBySlugInputModel,
  getPublicFormBySlugOutputModel,
  submitFormResponseInputModel,
  submitFormResponseOutputModel,
} from "./model";
import { autheticatedProcedure, publicProcedure, router } from "../../trpc";
import { formService, userService } from "../../services";
import { getAuthenticationCookie } from "../../utils/cookie";

const TAGS = ["Forms"];

export const formsRouter = router({
  createForm: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/createForm",
        tags: TAGS,
      },
    })
    .input(createFormInputModel)
    .output(createFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      const token = getAuthenticationCookie(ctx);
      if (!token) throw new Error("User is not logged in");

      const { id: createdBy } = await userService.verifyUserToken(token);
      const { title, description } = input;

      const { id } = await formService.createForm({
        title,
        description,
        createdBy,
      });

      return { id };
    }),

  deleteForm: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/deleteForm",
        tags: TAGS,
      },
    })
    .input(deleteFormInputModel)
    .output(deleteFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      const token = getAuthenticationCookie(ctx);
      if (!token) throw new Error("User is not logged in");

      const { id: createdBy } = await userService.verifyUserToken(token);
      const { formId } = input;

      const { success } = await formService.deleteForm({
        formId,
        createdBy,
      });

      return { success };
    }),

  getUserForms: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/getUserForms",
        tags: TAGS,
      },
    })
    .input(getUserFormsInputModel)
    .output(getUserFormsOutputModel)
    .query(async ({ ctx }) => {
      const token = getAuthenticationCookie(ctx);
      if (!token) throw new Error("User is not logged in");

      const { id: createdBy } = await userService.verifyUserToken(token);

      const forms = await formService.getUserForms(createdBy);
      return forms;
    }),

  getFormFields: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/getFormFields",
        tags: TAGS,
      },
    })
    .input(getFormFieldsInputModel)
    .output(getFormFieldsOutputModel)
    .query(async ({ input }) => {
      const { formId } = input;
      const fields = await formService.getFormFields(formId);
      return fields;
    }),

  createFormFields: autheticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/createFormFields",
        tags: TAGS,
      },
    })
    .input(createFormFieldsInputModel)
    .output(createFormFieldsOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { id: createdBy } = await userService.verifyUserToken(ctx.user.token);
      const { formId, fields } = input;

      const { success } = await formService.createFormFields({
        formId,
        createdBy,
        fields,
      });

      return { success };
    }),

  putFormFields: autheticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/putFormFields",
        tags: TAGS,
      },
    })
    .input(putFormFieldsInputModel)
    .output(putFormFieldsOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { id: createdBy } = await userService.verifyUserToken(ctx.user.token);
      const { formId, fields } = input;

      const { success } = await formService.putFormFields({
        formId,
        createdBy,
        fields,
      });

      return { success };
    }),

  deleteFormField: autheticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/deleteFormField",
        tags: TAGS,
      },
    })
    .input(deleteFormFieldInputModel)
    .output(deleteFormFieldOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { id: createdBy } = await userService.verifyUserToken(ctx.user.token);
      const { formId, fieldId } = input;

      const { success } = await formService.deleteFormField({
        formId,
        createdBy,
        fieldId,
      });

      return { success };
    }),

  publishForm: autheticatedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/publishForm",
        tags: TAGS,
      },
    })
    .input(publishFormInputModel)
    .output(publishFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { id: createdBy } = await userService.verifyUserToken(ctx.user.token);
      const { formId, isPublished, visibility, validTill } = input;

      const { success } = await formService.publishForm({
        formId,
        createdBy,
        isPublished,
        visibility,
        validTill,
      });

      return { success };
    }),

  getPublicFormBySlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/getPublicFormBySlug",
        tags: TAGS,
      },
    })
    .input(getPublicFormBySlugInputModel)
    .output(getPublicFormBySlugOutputModel)
    .query(async ({ input }) => {
      const { slug } = input;
      return await formService.getPublicFormBySlug({ slug });
    }),

  submitFormResponse: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/submitFormResponse",
        tags: TAGS,
      },
    })
    .input(submitFormResponseInputModel)
    .output(submitFormResponseOutputModel)
    .mutation(async ({ input }) => {
      const { formId, answers } = input;
      const { success } = await formService.submitFormResponse({ formId, answers });
      return { success };
    }),
});
