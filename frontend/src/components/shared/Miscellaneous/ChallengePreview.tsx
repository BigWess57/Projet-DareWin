import React from 'react'
import { Challenge } from '../RouteBaseElements/ChallengeList'



const ChallengePreview = ({challenge} : {challenge : Challenge}) => {
  return (
    <div
      className="
        p-6 bg-gradient-to-br from-[#1F243A] to-[#0F1221]
        border border-white/10 rounded-2xl 
        shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-2xl
        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
      "
    >
      {/* Full‑width header */}
      <div className="col-span-full">
        <h2 className="text-2xl font-extrabold text-white truncate max-w-full">
          Challenge : {challenge.description}
        </h2>
      </div>

      {/* Creator */}
      <div className="flex flex-col">
        <span className="text-sm text-white/60">Créateur</span>
        <span className="font-medium text-white truncate max-w-full">
          {challenge.creator}
        </span>
      </div>

      {/* Bid */}
      <div className="flex flex-col">
        <span className="text-sm text-white/60">Mise</span>
        <span className="font-medium text-cyan-400">
          {challenge.bid} DARE
        </span>
      </div>

      {/* Duration */}
      <div className="flex flex-col">
        <span className="text-sm text-white/60">Durée</span>
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

      {/* Max Players */}
      <div className="flex flex-col">
        <span className="text-sm text-white/60">Max Joueurs</span>
        <span className="font-medium text-white">
          {challenge.maxPlayers}
        </span>
      </div>

      {/* Time of Creation */}
      <div className="flex flex-col">
        <span className="text-sm text-white/60">Créé le</span>
        <span className="font-medium text-white">
          {new Date(Number(challenge.timestampOfCreation) * 1000).toLocaleString()}
        </span>
      </div>

      {/* Mode */}
      <div className="flex flex-col">
        <span className="text-sm text-white/60">Mode</span>
        <span className="font-medium text-white">
          {challenge.groupMode ? 'Groupe privé' : 'Public'}
        </span>
      </div>
    </div>
  )
}

export default ChallengePreview