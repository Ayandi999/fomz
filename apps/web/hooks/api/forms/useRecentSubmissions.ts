import { trpc } from "~/trpc/client";

export const useRecentSubmissions = () => {
  const {
    data: recentSubmissions,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  } = trpc.forms.getRecentSubmissions.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  return {
    recentSubmissions,
    isLoading,
    isError,
    error,
    refetch,
    isFetched,
  };
};
