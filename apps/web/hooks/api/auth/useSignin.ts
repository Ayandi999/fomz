import { trpc } from "~/trpc/client";

export const useSignin = () => {
  const {
    mutateAsync: siginInUserWithEmailAndPasswordAsync,
    mutate: siginInUserWithEmailAndPassword,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.siginInUserWithEmailAndPassword.useMutation();

  return {
    siginInUserWithEmailAndPassword,
    siginInUserWithEmailAndPasswordAsync,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  };
};
