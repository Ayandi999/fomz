import { trpc } from "~/trpc/client";

export const useDeleteForm = () => {
  const {
    mutateAsync: deleteFormAsync,
    mutate: deleteForm,
    error,
    isPending,
    isError,
    isSuccess,
  } = trpc.forms.deleteForm.useMutation();

  return {
    deleteForm,
    deleteFormAsync,
    error,
    isPending,
    isError,
    isSuccess,
  };
};
