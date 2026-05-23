"use client";

import { useEffect } from 'react';
import {useUser} from '../hooks/api/auth/useUser'
import { useRouter } from 'next/navigation';

export default function Home() {

  const {user} = useUser();
  const router = useRouter();

  useEffect(()=>{
    if(user && user.id){
      router.replace('/dashboard'); //we shall make this later
    }else{
      router.replace('/sign-in')
    }
  },[user])
  return (
    <main className="min-h-screen min-w-screen flex justify-center items-center">
      <div>
        <h1>{JSON.stringify(user,null,2)}</h1>
      </div>
    </main>
  );
}
