import { trpc } from "~/trpc/client"
export const useUser = () => {
    const {
        data:user,
        isFetched,
        isFetching,
        status,
        error,
        isLoading
    } = trpc.auth.getUserInfoFromToken.useQuery(undefined, {
        retry: false
    })
    return {
        user,
        error,
        isFetched,
        isFetching,
        isLoading,
        status
    }
}