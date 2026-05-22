import { api } from "~/trpc/server";
import {trpc} from '~/trpc/client'

export default async function Home() {
  //const {data} = trpc.ayandipRoute.useQuery({email:'ayandip12111113@gmail.com'}) //Using hooks we can do this aas well hooks are gebnerated internally
  //const {message} = await api.ayandipRoute.query({email:'ayandip123@gmail.com'})
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1>Hello World</h1>
      </div>
    </main>
  );
}
