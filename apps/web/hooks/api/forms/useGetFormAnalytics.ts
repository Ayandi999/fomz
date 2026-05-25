import { trpc } from "~/trpc/client";

export const useGetFormAnalytics = (formId: string) => {
  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.forms.getFormAnalytics.useQuery({ formId }, {
    enabled: !!formId,
    retry: false,
  });

  return {
    analytics,
    isLoading,
    isError,
    error,
    refetch,
  };
};
