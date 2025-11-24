import React, { useContext } from 'react'
import { useTranslations } from 'next-intl';

import { DurationContext } from '../RouteBaseElements/ChallengePage'
import { ChallengeTimer } from './ChallengeTimer'

const OngoingChallenge = ({
  challengeStart,
  refreshDisplay,
} : {
  challengeStart : bigint,
  refreshDisplay : () => Promise<void>,
}) => {

  const duration = useContext(DurationContext)
  const t = useTranslations('Challenge.OngoingChallenge');
  
  
/***************** 
 * Functions for interaction with the blokchain 
 * **************/


  const startTimestampDisplay = (() => {
    // Convert seconds to milliseconds and create a Date
    const ms = Number(challengeStart) * 1000
    const date = new Date(ms)

    // Format using the browser locale
    const formatted = date.toLocaleString()

    return (
      <div>
        <strong>{t('start_label')}</strong>{' '}
        <time dateTime={date.toISOString()}>
          {formatted}
        </time>
      </div>
    )
  })()



  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-[#1F243A] to-[#151A2A] border border-white/10 rounded-2xl shadow-xl">
      {/* Header */}
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
        <span>🎮</span> {t('title')}
      </h1>

      {/* Content */}
      <div className="p-8 bg-[#0B1126] border border-cyan-500/20 rounded-lg space-y-4">
        {/* Start time */}
        <div className="text-white/80 text-sm">
          {startTimestampDisplay}
        </div>

        {challengeStart && (
          <ChallengeTimer
            startingTime={challengeStart}
            duration={duration}
            refreshDisplay={refreshDisplay}
          />
        )}

      </div>
    </div>
  )
}

export default OngoingChallenge