import { trpc } from "~/trpc/client";

export const useUpdateFormFields = () => {
  const utils = trpc.useUtils();
  const {
    mutateAsync: updateFormFieldsAsync,
    mutate: updateFormFields,
    error,
    isPending,
    isSuccess,
  } = trpc.forms.putFormFields.useMutation({
    onSuccess: async (_, variables: { formId: string }) => {
      await utils.forms.getFormFields.invalidate({ formId: variables.formId });
    },
  });

  return {
    updateFormFields,
    updateFormFieldsAsync,
    error,
    isPending,
    isSuccess,
  };
};
