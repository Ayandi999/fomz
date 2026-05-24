import { trpc } from "~/trpc/client";

export const useGetFormFields = (formId: string) => {
  const {
    data: fields,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.forms.getFormFields.useQuery({ formId }, {
    enabled: !!formId,
    retry: false, // Don't infinite retry if no fields exist yet
  });

  return {
    fields,
    isLoading,
    isError,
    error,
    refetch,
  };
};
