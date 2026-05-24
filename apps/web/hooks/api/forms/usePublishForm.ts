import { trpc } from "~/trpc/client";

export const usePublishForm = () => {
  const utils = trpc.useUtils();
  const {
    mutateAsync: publishFormAsync,
    mutate: publishForm,
    error,
    isPending,
    isSuccess,
  } = trpc.forms.publishForm.useMutation({
    onSuccess: async () => {
      await utils.forms.getUserForms.invalidate();
    },
  });

  return {
    publishForm,
    publishFormAsync,
    error,
    isPending,
    isSuccess,
  };
};
