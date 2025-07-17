import React from 'react'
import { Challenge } from './ChallengeList'



const ChallengePreview = ({challenge} : {challenge : Challenge}) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      
      {/* Full‑width header */}
      <div className="col-span-full">
        <h2 className="text-2xl font-extrabold">
          Challenge: {challenge.description}
        </h2>
      </div>

      {/* Creator */}
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Creator</span>
        <span className="font-medium truncate max-w-full">{challenge.creator}</span>
      </div>

      {/* Bid */}
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Bid</span>
        <span className="font-medium">{challenge.bid} DARE</span>
      </div>

      {/* Duration */}
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Duration</span>
        <span className="font-medium">{challenge.duration}s</span>
      </div>

      {/* Max Players */}
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">Max Players</span>
        <span className="font-medium">{challenge.maxPlayers}</span>
      </div>

    </div>
  )
}

export default ChallengePreview