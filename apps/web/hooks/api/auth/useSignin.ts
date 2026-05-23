import { trpc } from "~/trpc/client";

export const useSignin = () => {
  const utils = trpc.useUtils();
  const {
    mutateAsync: siginInUserWithEmailAndPasswordAsync,
    mutate: siginInUserWithEmailAndPassword,
    error,
    failureCount,
    isError,
    isIdle,
    isSuccess,
    status,
  } = trpc.auth.siginInUserWithEmailAndPassword.useMutation({
    onSuccess:async()=>{
        await utils.auth.getUserInfoFromToken.invalidate();
    }
});

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
