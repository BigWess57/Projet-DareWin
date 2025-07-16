'use client'

import { NotConnected } from "@/components/shared/Miscellaneous/NotConnected";

import { useAccount } from "wagmi";


export default function Home() {

  const {isConnected} = useAccount();

  return (
    <div>
      {isConnected ? (
        <div>HOME</div>
      ) : (
        <NotConnected/>
      )}
    </div>
  );
}
