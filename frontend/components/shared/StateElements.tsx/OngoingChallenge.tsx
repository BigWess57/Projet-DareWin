import React, { useContext } from 'react'

import { useAccount } from 'wagmi'

import { DurationContext } from '../Challenge'
import { ChallengeTimer } from './ChallengeTimer'

const OngoingChallenge = ({
  challengeStart,
  refreshDisplay,
} : {
  challengeStart : bigint,
  refreshDisplay : () => Promise<void>,
}) => {

  const duration = useContext(DurationContext)

  const {address} = useAccount()
  
  
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
        <strong>Started at:</strong>{' '}
        <time dateTime={date.toISOString()}>
          {formatted}
        </time>
      </div>
    )
  })()

  //********Use effects ********* */


  // useEffect(() => {
  //   getChallengeStartEvents();
  // }, [address])



  return (
    <div>
        <h1 className='text-2xl'>🏁 Challenge is currently in progress!</h1>
        <div className='p-10'>
          {startTimestampDisplay}
          <div className='mt-4'>Temps restant : 
            <ChallengeTimer
              startingTime={challengeStart}
              duration={duration}
              refreshDisplay={refreshDisplay}
            />
          </div>
        </div>
    </div>
  )
}

export default OngoingChallenge