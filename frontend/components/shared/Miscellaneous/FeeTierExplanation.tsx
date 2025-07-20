'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { TierBronzeFee, TierGoldFee, TierPlatinumFee, TierSilverFee } from '@/constants/TokenInfo'
import { CircleQuestionMark } from 'lucide-react'

export function FeeTierExplanation({ displayFeeTier }: { displayFeeTier: string | React.JSX.Element | null }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='ml-2'>
            <CircleQuestionMark className='h-4 w-4' />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-[#1F243A] text-sm text-white border border-white/20 rounded-lg shadow-lg">
          <div className="max-w-xs">
            <p className='mb-2'>Les frais sont structurés par paliers : plus vous possédez de tokens DARE, plus le pourcentage de frais diminue :  </p>
            <p>➤ 0–10000  DARE = <span className='text-[#CE8946] font-bold'>BRONZE - {TierBronzeFee} de frais</span></p>
            <p>➤ 10000–40000  DARE = <span className='text-slate-400 font-bold'>SILVER - {TierSilverFee} de frais</span></p>
            <p>➤ 40000–100000  DARE = <span className='text-yellow-400 font-bold'>GOLD - {TierGoldFee} de frais</span></p>
            <p>➤ {'>'} 100000  DARE = <span className='text-cyan-400 font-bold'>PLATINUM - {TierPlatinumFee} de frais</span></p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}