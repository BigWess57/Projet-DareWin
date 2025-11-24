'use client'

import ChallengeList from "@/src/components/shared/RouteBaseElements/ChallengeList"
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { ArrowRight } from "lucide-react";
import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import {useRouter} from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
import { isAddress } from "viem";

export default function myChallenges() {

  const t = useTranslations('MyChallenges');
  
    
  const router = useRouter()

  const [challengeAddress, setChallengeAddress] = useState("")

  const navigate = () => {    
    if (!isAddress(challengeAddress)) {
      toast.error(t('invalid_address'), {
          duration: 3000,
      });
      setChallengeAddress("")
      return
    }

    router.push(`/mychallenges/${challengeAddress}`)
  }

  return (
    <>
      <div className='text-3xl font-bold flex justify-center'>{t('title')}</div>
      <div className="mt-5 ml-10">
        <div className="text-white font-medium mb-3">
          {t('join_label')}
        </div>
        <div className="flex">
          <Input
            id="challenge-link"
            type="text"
            placeholder={t('placeholder')}
            value={challengeAddress}
            onChange={(e) => setChallengeAddress(e.target.value)}
            className="
              p-3 w-full max-w-md bg-[#0B1126] border border-white/20 rounded-xl
              text-white placeholder:text-white/50
              focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400
              transition selection:bg-[#324b96]
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