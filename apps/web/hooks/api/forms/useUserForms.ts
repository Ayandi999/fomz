import { trpc } from "~/trpc/client";

export const useUserForms = () => {
  const {
    data: forms,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  } = trpc.forms.getUserForms.useQuery();

  return {
    forms,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  };
};
