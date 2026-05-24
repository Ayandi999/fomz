import { trpc } from "~/trpc/client";

export const useCreateFormFields = () => {
  const utils = trpc.useUtils();
  const {
    mutateAsync: createFormFieldsAsync,
    mutate: createFormFields,
    error,
    isPending,
    isSuccess,
  } = trpc.forms.createFormFields.useMutation({
    onSuccess: async (_, variables) => {
      await utils.forms.getFormFields.invalidate({ formId: variables.formId });
    },
  });

  return {
    createFormFields,
    createFormFieldsAsync,
    error,
    isPending,
    isSuccess,
  };
};
