import { trpc } from "~/trpc/client";

export const useDeleteFormField = () => {
  const utils = trpc.useUtils();
  const {
    mutateAsync: deleteFormFieldAsync,
    mutate: deleteFormField,
    error,
    isPending,
    isSuccess,
  } = trpc.forms.deleteFormField.useMutation({
    onSuccess: async (_, variables) => {
      await utils.forms.getFormFields.invalidate({ formId: variables.formId });
    },
  });

  return {
    deleteFormField,
    deleteFormFieldAsync,
    error,
    isPending,
    isSuccess,
  };
};
