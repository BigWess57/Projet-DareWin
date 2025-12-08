import React from 'react'
import { useTranslations } from 'next-intl';
import { Challenge } from '../RouteBaseElements/ChallengeList'



const ChallengePreview = ({challenge} : {challenge : Challenge}) => {
  const t = useTranslations('MyChallenges.ChallengePreview');
  return (
    <div
      className="
        p-8 bg-gradient-to-br from-[#09365f] to-[#0e1122]
        border border-white/10 rounded-2xl 
        shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl
        grid grid-cols-1 md:grid-cols-2 gap-8
      "
    >
      {/* Full‑width header */}
      <div className="col-span-full">
        <h2 className="text-2xl font-extrabold text-white truncate max-w-full">
          Challenge : {challenge.description}
        </h2>
      </div>

      {/* Creator */}
      <div className="flex flex-col text-md">
        <span className="text-white/60">{t('creator')}</span>
        <span className="font-medium text-white truncate max-w-full">
          {challenge.creator}
        </span>
      </div>

      {/* Bid */}
      <div className="flex flex-col text-md">
        <span className="text-white/60">{t('bid')}</span>
        <span className="font-medium text-cyan-400">
          {challenge.bid} DARE
        </span>
      </div>

      {/* Duration */}
      <div className="flex flex-col text-md">
        <span className="text-white/60">{t('duration')}</span>
        <span className="font-medium text-white">
          {(() => {
            const total = Number(challenge.duration)
            const h = Math.floor(total / 3600)
            const m = Math.floor((total % 3600) / 60)
            const s = total % 60
            return `${h}h ${m}m ${s}s`
          })()}
        </span>
      </div>

      {/* Time of Creation */}
      <div className="flex flex-col text-md">
        <span className="text-white/60">{t('created_at')}</span>
        <span className="font-medium text-white">
          {new Date(Number(challenge.timestampOfCreation) * 1000).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default ChallengePreview