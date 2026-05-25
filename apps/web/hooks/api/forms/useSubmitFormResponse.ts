import { trpc } from "~/trpc/client";

export const useSubmitFormResponse = () => {
  const {
    mutateAsync: submitResponseAsync,
    mutate: submitResponse,
    isPending,
    isError,
    error,
    isSuccess,
  } = trpc.forms.submitFormResponse.useMutation();

  return {
    submitResponse,
    submitResponseAsync,
    isPending,
    isError,
    error,
    isSuccess,
  };
};
