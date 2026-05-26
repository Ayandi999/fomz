import { trpc } from "~/trpc/client";

export const useGetExploreForms = () => {
  const {
    data: forms,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  } = trpc.forms.getExploreForms.useQuery();

  return {
    forms,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  };
};
