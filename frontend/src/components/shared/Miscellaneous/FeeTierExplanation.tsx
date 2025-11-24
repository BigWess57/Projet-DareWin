'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { TierBronzeFee, TierGoldFee, TierPlatinumFee, TierSilverFee } from '@/constants/TokenInfo'
import { CircleQuestionMark } from 'lucide-react'
import { useTranslations } from 'next-intl';

export function FeeTierExplanation() {

  const t = useTranslations('Header');
  
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
            <p className='mb-2'>{t('fee_explanation')}</p>
            <p>➤ 0–10000  DARE = <span className='text-[#CE8946] font-bold'>{t('tier_bronze', { fee: TierBronzeFee })}</span></p>
            <p>➤ 10000–40000  DARE = <span className='text-slate-400 font-bold'>{t('tier_silver', { fee: TierSilverFee })}</span></p>
            <p>➤ 40000–100000  DARE = <span className='text-yellow-400 font-bold'>{t('tier_gold', { fee: TierGoldFee })}</span></p>
            <p>➤ {'>'} 100000  DARE = <span className='text-cyan-400 font-bold'>{t('tier_platinum', { fee: TierPlatinumFee })}</span></p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}