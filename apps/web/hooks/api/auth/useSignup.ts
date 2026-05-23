import { trpc } from "~/trpc/client"
export const useSignup = () => {
    //this line is to make sure if we have user come in for the first time the getuserinfo thing doesn't get called
    const utils = trpc.useUtils();
    const {
        mutateAsync: createUserWithEmailAndPasswordAsync,
        mutate: createUserWithEmailAndPassword,
        error,
        failureCount,
        isError,
        isIdle,
        isSuccess,
        status
    } = trpc.auth.createUserWithEmailAndPassword.useMutation({
        onSuccess:async()=>{
            //Wherever useUser hook is used that component will refresh with new data/cookies
            await utils.auth.getUserInfoFromToken.invalidate();
        }
    });
    return {
        createUserWithEmailAndPassword,
        createUserWithEmailAndPasswordAsync,
        error,
        failureCount,
        isError,
        isIdle,
        isSuccess,
        status
    }
}