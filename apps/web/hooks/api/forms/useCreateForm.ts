import { trpc } from "~/trpc/client";

export const useCreateForm = () => {
  const {
    mutateAsync: createFormAsync,
    mutate: createForm,
    error,
    failureCount,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  } = trpc.forms.createForm.useMutation();

  return {
    createForm,
    createFormAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isPending,
    isSuccess,
    status,
  };
};
