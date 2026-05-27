import { trpc } from "~/trpc/client";

export const useGetPublicForm = (slug: string, enteredPassword?: string) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.forms.getPublicFormBySlug.useQuery({ slug, enteredPassword }, {
    enabled: !!slug,
    retry: false,
  });

  return {
    formId: data?.formId,
    fields: data?.fields,
    themeId: data?.themeId,
    themeCode: data?.themeCode,
    isLoading,
    isError,
    error,
    refetch,
  };
};
