import { trpc } from "~/trpc/client";

export const usePutFormFields = () => {
  const utils = trpc.useUtils();
  const {
    mutateAsync: putFormFieldsAsync,
    mutate: putFormFields,
    error,
    isPending,
    isSuccess,
  } = trpc.forms.putFormFields.useMutation({
    onSuccess: async (_, variables) => {
      await utils.forms.getFormFields.invalidate({ formId: variables.formId });
    },
  });

  return {
    putFormFields,
    putFormFieldsAsync,
    error,
    isPending,
    isSuccess,
  };
};
