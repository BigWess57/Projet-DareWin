'use client'

import ChallengePage from "@/components/shared/ChallengePage";
import { NotConnected } from "@/components/shared/NotConnected";

import { useAccount } from "wagmi";


export default function Home() {

  const {isConnected} = useAccount();

  return (
    <div>
      {isConnected ? (
        <ChallengePage/>
      ) : (
        <NotConnected/>
      )}
    </div>
  );
}
