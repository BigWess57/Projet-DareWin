'use client'

import ChallengeList from "@/components/shared/RouteBaseElements/ChallengeList"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import {useRouter} from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { isAddress } from "viem";

export default function myChallenges() {

  const router = useRouter()

  const [challengeAddress, setChallengeAddress] = useState("")

  const navigate = () => {    
    if (!isAddress(challengeAddress)) {
      toast.error("Error : Incorrect address", {
          duration: 3000,
      });
      return
    }

    router.push(`/mychallenges/${challengeAddress}`)
  }

  return (
    <>
      <div className='text-3xl font-bold flex justify-center'>Mes challenges :</div>
      <div className="mt-5 ml-10">
        <div className="text-white font-medium mb-3">
          Rejoindre un challenge par adresse :
        </div>
        <div className="flex">
          <Input
            id="challenge-link"
            type="text"
            placeholder="Entrez l'adresse du challenge"
            value={challengeAddress}
            onChange={(e) => setChallengeAddress(e.target.value)}
            className="
              p-3 w-full max-w-md bg-[#0B1126] border border-white/20 rounded-xl
              text-white placeholder:text-white/50
              focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400
              transition
            "
          />
          <Button
            onClick={navigate}
            className="
              p-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-r-lg
              text-white flex items-center justify-center
              hover:brightness-110 transition
            "
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <ChallengeList/>
    </>
  );
}