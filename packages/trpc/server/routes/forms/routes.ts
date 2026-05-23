import {
  createFormInputModel,
  createFormOutputModel,
} from "./model";
import { publicProcedure, router } from "../../trpc";
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
});
