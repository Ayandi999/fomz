import { trpc } from "~/trpc/client";

export const useGetPublicForm = (slug: string) => {
  const {
    data,
    isLoading,
    isError,
    error,
  } = trpc.forms.getPublicFormBySlug.useQuery({ slug }, {
    enabled: !!slug,
    retry: false,
  });

  return {
    formId: data?.formId,
    fields: data?.fields,
    isLoading,
    isError,
    error,
  };
};
